-- Shared school-run document.
-- school_run_app may execute school_run_apply() only.
-- Passwords stay inside school_run_state and are returned only to an admin session.

CREATE TABLE IF NOT EXISTS school_run_catalog (
  id INTEGER PRIMARY KEY,
  animals JSONB NOT NULL,
  shop JSONB NOT NULL,
  care_gain INTEGER NOT NULL,
  evolution_step INTEGER NOT NULL
);

CREATE OR REPLACE FUNCTION school_run_err(msg TEXT, code INTEGER)
RETURNS JSONB
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT jsonb_build_object('ok', false, 'error', msg, 'status', code);
$$;

CREATE OR REPLACE FUNCTION school_run_counts(doc JSONB, uid TEXT)
RETURNS TABLE(today_laps INTEGER, month_laps INTEGER, total_laps INTEGER)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM((l->>'laps')::int) FILTER (
      WHERE ((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul')::date
            = (timezone('Asia/Seoul', now()))::date
    ), 0)::int,
    COALESCE(SUM((l->>'laps')::int) FILTER (
      WHERE to_char((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul', 'YYYY-MM')
            = to_char(timezone('Asia/Seoul', now()), 'YYYY-MM')
    ), 0)::int,
    COALESCE(SUM((l->>'laps')::int), 0)::int
  FROM jsonb_array_elements(COALESCE(doc->'laps', '[]'::jsonb)) AS l
  WHERE l->>'userId' = uid;
$$;

CREATE OR REPLACE FUNCTION school_run_shape(
  u JSONB,
  with_password BOOLEAN,
  today_laps INTEGER,
  month_laps INTEGER,
  total_laps INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  animals JSONB;
  step INTEGER;
  mileage INTEGER := COALESCE((u->>'mileage')::int, 0);
  spent INTEGER := COALESCE((u->>'spentMileage')::int, 0);
  stage INTEGER;
  animal TEXT := COALESCE(u->>'animal', 'dog');
  info JSONB;
  result JSONB;
  equipped JSONB;
BEGIN
  SELECT c.animals, c.evolution_step INTO animals, step
  FROM school_run_catalog c
  WHERE c.id = 1;
  IF step IS NULL OR step <= 0 THEN
    step := 50;
  END IF;
  IF mileage >= step * 2 THEN
    stage := 3;
  ELSIF mileage >= step THEN
    stage := 2;
  ELSE
    stage := 1;
  END IF;
  info := animals -> animal;
  IF u ? 'equippedClothesId' AND jsonb_typeof(u->'equippedClothesId') <> 'null' THEN
    equipped := u->'equippedClothesId';
  ELSE
    equipped := 'null'::jsonb;
  END IF;
  result := jsonb_build_object(
    'id', u->>'id',
    'username', u->>'username',
    'displayName', u->>'displayName',
    'role', CASE WHEN u->>'role' = 'admin' THEN 'admin' ELSE 'participant' END,
    'grade', u->>'grade',
    'animal', animal,
    'animalLabel', COALESCE(info->>'name', '강아지'),
    'stage', stage,
    'stageName', COALESCE(info#>>ARRAY['stages', (stage - 1)::text], ''),
    'mileage', mileage,
    'spentMileage', spent,
    'availableMileage', mileage - spent,
    'ownedClothesIds', COALESCE(u->'ownedClothesIds', '[]'::jsonb),
    'equippedClothesId', equipped,
    'fullness', LEAST(100, GREATEST(0, COALESCE((u->>'fullness')::int, 40))),
    'happiness', LEAST(100, GREATEST(0, COALESCE((u->>'happiness')::int, 40))),
    'mealsFed', COALESCE((u->>'mealsFed')::int, 0),
    'snacksFed', COALESCE((u->>'snacksFed')::int, 0),
    'createdAt', u->>'createdAt',
    'todayLaps', COALESCE(today_laps, 0),
    'monthLaps', COALESCE(month_laps, 0),
    'totalLaps', COALESCE(total_laps, 0),
    'nextEvolutionAt', CASE WHEN stage >= 3 THEN 'null'::jsonb ELSE to_jsonb(stage * step) END
  );
  IF with_password THEN
    result := result || jsonb_build_object('passwordPlain', COALESCE(u->>'passwordPlain', ''));
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION school_run_put_user(doc JSONB, updated JSONB)
RETURNS JSONB
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT jsonb_set(
    doc,
    '{users}',
    (
      SELECT COALESCE(jsonb_agg(
        CASE WHEN elem->>'id' = updated->>'id' THEN updated ELSE elem END
        ORDER BY ord
      ), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(doc->'users', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
    )
  );
$$;

CREATE OR REPLACE FUNCTION school_run_apply(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  state JSONB;
  action TEXT;
  token TEXT;
  sess JSONB;
  actor JSONB;
  actor_counts RECORD;
  uname TEXT;
  dname TEXT;
  pw TEXT;
  grade TEXT;
  animal TEXT;
  animals JSONB;
  shop JSONB;
  care_gain INTEGER;
  new_user JSONB;
  new_token TEXT;
  now_iso TEXT;
  laps_n INTEGER;
  note TEXT;
  record JSONB;
  item JSONB;
  item_id TEXT;
  available INTEGER;
  target_id TEXT;
  target JSONB;
  target_counts RECORD;
  updated JSONB;
  owned JSONB;
  new_pw TEXT;
  cur_pw TEXT;
  range_name TEXT;
  users_out JSONB;
  lap_rows JSONB;
  sessions_next JSONB;
  price INTEGER;
  grades TEXT[] := ARRAY['유치원','1학년','2학년','3학년','4학년','5학년','6학년','교직원'];
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RETURN school_run_err('요청이 올바르지 않습니다.', 400);
  END IF;

  action := COALESCE(payload->>'action', '');
  token := NULLIF(payload->>'token', '');
  now_iso := to_char(timezone('UTC', clock_timestamp()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

  SELECT s.doc INTO state FROM school_run_state s WHERE s.id = 1 FOR UPDATE;
  IF state IS NULL THEN
    RETURN school_run_err('저장소를 찾을 수 없습니다.', 500);
  END IF;

  SELECT c.animals, c.shop, c.care_gain
    INTO animals, shop, care_gain
  FROM school_run_catalog c
  WHERE c.id = 1;
  IF animals IS NULL OR shop IS NULL THEN
    RETURN school_run_err('저장소 설정을 찾을 수 없습니다.', 500);
  END IF;
  IF care_gain IS NULL OR care_gain <= 0 THEN
    care_gain := 18;
  END IF;

  IF token IS NOT NULL THEN
    SELECT s INTO sess
    FROM jsonb_array_elements(COALESCE(state->'sessions', '[]'::jsonb)) AS s
    WHERE s->>'token' = token
    LIMIT 1;
    IF sess IS NOT NULL THEN
      SELECT u INTO actor
      FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
      WHERE u->>'id' = sess->>'userId'
      LIMIT 1;
    END IF;
  END IF;

  IF action = 'login' THEN
    uname := btrim(COALESCE(payload->>'username', ''));
    pw := COALESCE(payload->>'password', '');
    SELECT u INTO target
    FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
    WHERE u->>'username' = uname
    LIMIT 1;
    IF target IS NULL OR target->>'passwordPlain' IS DISTINCT FROM pw THEN
      RETURN school_run_err('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
    END IF;
    new_token := gen_random_uuid()::text;
    state := jsonb_set(
      state,
      '{sessions}',
      COALESCE(state->'sessions', '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object('token', new_token, 'userId', target->>'id', 'createdAt', now_iso)
      )
    );
    UPDATE school_run_state SET doc = state WHERE id = 1;
    SELECT * INTO actor_counts FROM school_run_counts(state, target->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'token', new_token,
      'user', school_run_shape(target, false, actor_counts.today_laps, actor_counts.month_laps, actor_counts.total_laps)
    );
  END IF;

  IF action = 'register' THEN
    uname := btrim(COALESCE(payload->>'username', ''));
    dname := btrim(COALESCE(payload->>'displayName', ''));
    pw := COALESCE(payload->>'password', '');
    grade := COALESCE(payload->>'grade', '');
    animal := COALESCE(payload->>'animal', '');
    IF char_length(uname) < 2 OR char_length(uname) > 40 THEN
      RETURN school_run_err('아이디는 2자 이상이어야 합니다.', 400);
    END IF;
    IF dname = '' OR char_length(dname) > 40 THEN
      RETURN school_run_err('이름을 입력해 주세요.', 400);
    END IF;
    IF char_length(pw) < 4 OR char_length(pw) > 100 THEN
      RETURN school_run_err('비밀번호는 4자 이상이어야 합니다.', 400);
    END IF;
    IF NOT (grade = ANY (grades)) THEN
      RETURN school_run_err('학년을 선택해 주세요.', 400);
    END IF;
    IF NOT (animals ? animal) THEN
      RETURN school_run_err('키울 동물을 선택해 주세요.', 400);
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
      WHERE u->>'username' = uname
    ) THEN
      RETURN school_run_err('이미 사용 중인 아이디입니다.', 409);
    END IF;
    new_user := jsonb_build_object(
      'id', gen_random_uuid()::text,
      'username', uname,
      'displayName', dname,
      'passwordPlain', pw,
      'role', 'participant',
      'grade', grade,
      'animal', animal,
      'mileage', 0,
      'spentMileage', 0,
      'ownedClothesIds', '[]'::jsonb,
      'equippedClothesId', 'null'::jsonb,
      'fullness', 40,
      'happiness', 40,
      'mealsFed', 0,
      'snacksFed', 0,
      'createdAt', now_iso
    );
    new_token := gen_random_uuid()::text;
    state := jsonb_set(state, '{users}', COALESCE(state->'users', '[]'::jsonb) || jsonb_build_array(new_user));
    state := jsonb_set(
      state,
      '{sessions}',
      COALESCE(state->'sessions', '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object('token', new_token, 'userId', new_user->>'id', 'createdAt', now_iso)
      )
    );
    UPDATE school_run_state SET doc = state WHERE id = 1;
    RETURN jsonb_build_object(
      'ok', true,
      'token', new_token,
      'user', school_run_shape(new_user, false, 0, 0, 0)
    );
  END IF;

  IF action = 'logout' THEN
    IF token IS NOT NULL THEN
      SELECT COALESCE(jsonb_agg(s ORDER BY ord), '[]'::jsonb)
        INTO sessions_next
      FROM jsonb_array_elements(COALESCE(state->'sessions', '[]'::jsonb)) WITH ORDINALITY AS t(s, ord)
      WHERE s->>'token' IS DISTINCT FROM token;
      state := jsonb_set(state, '{sessions}', sessions_next);
      UPDATE school_run_state SET doc = state WHERE id = 1;
    END IF;
    RETURN jsonb_build_object('ok', true);
  END IF;

  IF actor IS NULL THEN
    RETURN school_run_err('로그인이 필요합니다.', 401);
  END IF;

  IF action = 'me' THEN
    SELECT * INTO actor_counts FROM school_run_counts(state, actor->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'user', school_run_shape(actor, false, actor_counts.today_laps, actor_counts.month_laps, actor_counts.total_laps)
    );
  END IF;

  IF action = 'laps' THEN
    range_name := COALESCE(payload->>'range', 'all');
    SELECT COALESCE(jsonb_agg(l ORDER BY l->>'recordedAt' DESC), '[]'::jsonb)
      INTO lap_rows
    FROM jsonb_array_elements(COALESCE(state->'laps', '[]'::jsonb)) AS l
    WHERE l->>'userId' = actor->>'id'
      AND (
        range_name = 'all'
        OR (
          range_name = 'today'
          AND ((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul')::date
              = (timezone('Asia/Seoul', now()))::date
        )
        OR (
          range_name = 'month'
          AND to_char((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul', 'YYYY-MM')
              = to_char(timezone('Asia/Seoul', now()), 'YYYY-MM')
        )
      );
    SELECT * INTO actor_counts FROM school_run_counts(state, actor->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'laps', lap_rows,
      'me', school_run_shape(actor, false, actor_counts.today_laps, actor_counts.month_laps, actor_counts.total_laps)
    );
  END IF;

  IF action = 'addLap' THEN
    BEGIN
      laps_n := FLOOR(COALESCE((payload->>'laps')::numeric, 0));
    EXCEPTION WHEN others THEN
      RETURN school_run_err('바퀴 수를 입력해 주세요.', 400);
    END;
    IF laps_n IS NULL OR laps_n <= 0 THEN
      RETURN school_run_err('바퀴 수를 입력해 주세요.', 400);
    END IF;
    IF laps_n > 50 THEN
      RETURN school_run_err('바퀴 수는 1~50 사이여야 합니다.', 400);
    END IF;
    note := btrim(COALESCE(payload->>'note', ''));
    IF char_length(note) > 80 THEN
      note := left(note, 80);
    END IF;
    record := jsonb_build_object(
      'id', gen_random_uuid()::text,
      'userId', actor->>'id',
      'laps', laps_n,
      'mileage', laps_n,
      'recordedAt', now_iso
    );
    IF note <> '' THEN
      record := record || jsonb_build_object('note', note);
    END IF;
    updated := jsonb_set(
      actor,
      '{mileage}',
      to_jsonb(COALESCE((actor->>'mileage')::int, 0) + laps_n)
    );
    state := jsonb_set(state, '{laps}', COALESCE(state->'laps', '[]'::jsonb) || jsonb_build_array(record));
    state := school_run_put_user(state, updated);
    UPDATE school_run_state SET doc = state WHERE id = 1;
    SELECT * INTO actor_counts FROM school_run_counts(state, updated->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'record', record,
      'user', school_run_shape(updated, false, actor_counts.today_laps, actor_counts.month_laps, actor_counts.total_laps)
    );
  END IF;

  IF action = 'participants' THEN
    SELECT COALESCE(jsonb_agg(
      school_run_shape(
        u,
        false,
        COALESCE(a.tday, 0),
        COALESCE(a.mnth, 0),
        COALESCE(a.tot, 0)
      )
    ), '[]'::jsonb)
      INTO users_out
    FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
    LEFT JOIN (
      SELECT
        l->>'userId' AS uid,
        COALESCE(SUM((l->>'laps')::int) FILTER (
          WHERE ((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul')::date
                = (timezone('Asia/Seoul', now()))::date
        ), 0)::int AS tday,
        COALESCE(SUM((l->>'laps')::int) FILTER (
          WHERE to_char((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul', 'YYYY-MM')
                = to_char(timezone('Asia/Seoul', now()), 'YYYY-MM')
        ), 0)::int AS mnth,
        COALESCE(SUM((l->>'laps')::int), 0)::int AS tot
      FROM jsonb_array_elements(COALESCE(state->'laps', '[]'::jsonb)) AS l
      GROUP BY l->>'userId'
    ) AS a ON a.uid = u->>'id'
    WHERE u->>'role' = 'participant';
    RETURN jsonb_build_object('ok', true, 'users', users_out);
  END IF;

  IF action IN ('buy', 'equip', 'feed') THEN
    item_id := btrim(COALESCE(payload->>'itemId', ''));
    SELECT s INTO item
    FROM jsonb_array_elements(shop) AS s
    WHERE s->>'id' = item_id
    LIMIT 1;
    price := COALESCE((item->>'price')::int, 0);
    available := COALESCE((actor->>'mileage')::int, 0) - COALESCE((actor->>'spentMileage')::int, 0);

    IF action = 'buy' THEN
      IF item IS NULL OR item->>'category' <> 'clothes' THEN
        RETURN school_run_err('옷만 보관할 수 있습니다.', 400);
      END IF;
      IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(COALESCE(actor->'ownedClothesIds', '[]'::jsonb)) AS owned_id
        WHERE owned_id = item_id
      ) THEN
        RETURN school_run_err('이미 가지고 있는 옷입니다.', 400);
      END IF;
      IF available < price THEN
        RETURN school_run_err('마일리지가 부족합니다. 운동장을 더 달려 보세요!', 400);
      END IF;
      owned := COALESCE(actor->'ownedClothesIds', '[]'::jsonb) || to_jsonb(item_id);
      updated := jsonb_set(actor, '{spentMileage}', to_jsonb(COALESCE((actor->>'spentMileage')::int, 0) + price));
      updated := jsonb_set(updated, '{ownedClothesIds}', owned);
      updated := jsonb_set(updated, '{equippedClothesId}', to_jsonb(item_id));
    ELSIF action = 'equip' THEN
      IF item IS NULL OR item->>'category' <> 'clothes' THEN
        RETURN school_run_err('옷만 입힐 수 있습니다.', 400);
      END IF;
      IF NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(COALESCE(actor->'ownedClothesIds', '[]'::jsonb)) AS owned_id
        WHERE owned_id = item_id
      ) THEN
        RETURN school_run_err('아직 구매하지 않은 옷입니다.', 400);
      END IF;
      IF actor->>'equippedClothesId' = item_id THEN
        updated := jsonb_set(actor, '{equippedClothesId}', 'null'::jsonb);
      ELSE
        updated := jsonb_set(actor, '{equippedClothesId}', to_jsonb(item_id));
      END IF;
    ELSE
      IF item IS NULL OR item->>'category' NOT IN ('food', 'snack') THEN
        RETURN school_run_err('먹이 또는 간식만 줄 수 있습니다.', 400);
      END IF;
      IF available < price THEN
        RETURN school_run_err('마일리지가 부족합니다. 운동장을 더 달려 보세요!', 400);
      END IF;
      updated := jsonb_set(actor, '{spentMileage}', to_jsonb(COALESCE((actor->>'spentMileage')::int, 0) + price));
      IF item->>'category' = 'food' THEN
        updated := jsonb_set(updated, '{fullness}', to_jsonb(LEAST(100, COALESCE((actor->>'fullness')::int, 40) + care_gain)));
        updated := jsonb_set(updated, '{mealsFed}', to_jsonb(COALESCE((actor->>'mealsFed')::int, 0) + 1));
      ELSE
        updated := jsonb_set(updated, '{happiness}', to_jsonb(LEAST(100, COALESCE((actor->>'happiness')::int, 40) + care_gain)));
        updated := jsonb_set(updated, '{snacksFed}', to_jsonb(COALESCE((actor->>'snacksFed')::int, 0) + 1));
      END IF;
    END IF;

    state := school_run_put_user(state, updated);
    UPDATE school_run_state SET doc = state WHERE id = 1;
    SELECT * INTO actor_counts FROM school_run_counts(state, updated->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'user', school_run_shape(updated, false, actor_counts.today_laps, actor_counts.month_laps, actor_counts.total_laps)
    );
  END IF;

  IF action = 'password' THEN
    cur_pw := COALESCE(payload->>'currentPassword', '');
    new_pw := COALESCE(payload->>'newPassword', '');
    IF actor->>'passwordPlain' IS DISTINCT FROM cur_pw THEN
      RETURN school_run_err('현재 비밀번호가 올바르지 않습니다.', 403);
    END IF;
    IF char_length(new_pw) < 4 OR char_length(new_pw) > 100 THEN
      RETURN school_run_err('새 비밀번호는 4자 이상이어야 합니다.', 400);
    END IF;
    updated := jsonb_set(actor, '{passwordPlain}', to_jsonb(new_pw));
    state := school_run_put_user(state, updated);
    UPDATE school_run_state SET doc = state WHERE id = 1;
    SELECT * INTO actor_counts FROM school_run_counts(state, updated->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'user', school_run_shape(updated, false, actor_counts.today_laps, actor_counts.month_laps, actor_counts.total_laps)
    );
  END IF;

  IF actor->>'role' <> 'admin' THEN
    IF action IN ('adminUsers', 'adminPassword', 'adminDelete') THEN
      RETURN school_run_err('관리자만 접근할 수 있습니다.', 403);
    END IF;
    RETURN school_run_err('알 수 없는 요청입니다.', 400);
  END IF;

  IF action = 'adminUsers' THEN
    SELECT COALESCE(jsonb_agg(
      school_run_shape(
        u,
        true,
        COALESCE(a.tday, 0),
        COALESCE(a.mnth, 0),
        COALESCE(a.tot, 0)
      )
    ), '[]'::jsonb)
      INTO users_out
    FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
    LEFT JOIN (
      SELECT
        l->>'userId' AS uid,
        COALESCE(SUM((l->>'laps')::int) FILTER (
          WHERE ((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul')::date
                = (timezone('Asia/Seoul', now()))::date
        ), 0)::int AS tday,
        COALESCE(SUM((l->>'laps')::int) FILTER (
          WHERE to_char((l->>'recordedAt')::timestamptz AT TIME ZONE 'Asia/Seoul', 'YYYY-MM')
              = to_char(timezone('Asia/Seoul', now()), 'YYYY-MM')
        ), 0)::int AS mnth,
        COALESCE(SUM((l->>'laps')::int), 0)::int AS tot
      FROM jsonb_array_elements(COALESCE(state->'laps', '[]'::jsonb)) AS l
      GROUP BY l->>'userId'
    ) AS a ON a.uid = u->>'id';
    RETURN jsonb_build_object('ok', true, 'users', users_out);
  END IF;

  IF action = 'adminPassword' THEN
    target_id := btrim(COALESCE(payload->>'userId', ''));
    new_pw := COALESCE(payload->>'newPassword', '');
    IF char_length(new_pw) < 4 OR char_length(new_pw) > 100 THEN
      RETURN school_run_err('비밀번호는 4자 이상이어야 합니다.', 400);
    END IF;
    SELECT u INTO target
    FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
    WHERE u->>'id' = target_id
    LIMIT 1;
    IF target IS NULL THEN
      RETURN school_run_err('사용자를 찾을 수 없습니다.', 404);
    END IF;
    updated := jsonb_set(target, '{passwordPlain}', to_jsonb(new_pw));
    state := school_run_put_user(state, updated);
    UPDATE school_run_state SET doc = state WHERE id = 1;
    SELECT * INTO target_counts FROM school_run_counts(state, updated->>'id');
    RETURN jsonb_build_object(
      'ok', true,
      'user', school_run_shape(updated, true, target_counts.today_laps, target_counts.month_laps, target_counts.total_laps)
    );
  END IF;

  IF action = 'adminDelete' THEN
    target_id := btrim(COALESCE(payload->>'userId', ''));
    IF target_id = '' THEN
      RETURN school_run_err('삭제할 계정을 선택해 주세요.', 400);
    END IF;
    IF target_id = actor->>'id' THEN
      RETURN school_run_err('지금 로그인한 관리자 계정은 삭제할 수 없습니다.', 400);
    END IF;
    SELECT u INTO target
    FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) AS u
    WHERE u->>'id' = target_id
    LIMIT 1;
    IF target IS NULL THEN
      RETURN school_run_err('사용자를 찾을 수 없습니다.', 404);
    END IF;
    SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
      INTO users_out
    FROM jsonb_array_elements(state->'users') WITH ORDINALITY AS t(elem, ord)
    WHERE elem->>'id' <> target_id;
    SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
      INTO sessions_next
    FROM jsonb_array_elements(COALESCE(state->'sessions', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
    WHERE elem->>'userId' <> target_id;
    SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
      INTO lap_rows
    FROM jsonb_array_elements(COALESCE(state->'laps', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
    WHERE elem->>'userId' <> target_id;
    state := jsonb_set(state, '{users}', users_out);
    state := jsonb_set(state, '{sessions}', sessions_next);
    state := jsonb_set(state, '{laps}', lap_rows);
    UPDATE school_run_state SET doc = state WHERE id = 1;
    RETURN jsonb_build_object(
      'ok', true,
      'displayName', target->>'displayName',
      'username', target->>'username'
    );
  END IF;

  RETURN school_run_err('알 수 없는 요청입니다.', 400);
END;
$$;
