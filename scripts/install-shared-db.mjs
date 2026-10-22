import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ownerFile = path.join(root, "data", "database.url");
const appFile = path.join(root, "data", "app-database.url");

function ownerUrl() {
  const raw = (process.env.DATABASE_URL || readFileSync(ownerFile, "utf8")).trim();
  const url = new URL(raw);
  url.hostname = url.hostname.replace("-pooler", "");
  url.searchParams.delete("channel_binding");
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  return url;
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function catalog() {
  const text = readFileSync(path.join(root, "src", "lib", "catalog.ts"), "utf8");
  const animals = {};
  const animalRe =
    /id: "([a-z]+)",\s*name: "([^"]+)",\s*stages: \["([^"]+)", "([^"]+)", "([^"]+)"\]/g;
  for (const match of text.matchAll(animalRe)) {
    animals[match[1]] = {
      name: match[2],
      stages: [match[3], match[4], match[5]],
    };
  }
  if (Object.keys(animals).length !== 10) {
    throw new Error(`expected 10 animals, found ${Object.keys(animals).length}`);
  }
  const shop = [];
  const shopRe =
    /id: "((?:cloth|food|snack)-[^"]+)",\s*category: "(clothes|food|snack)",[\s\S]*?price: (\d+),/g;
  for (const match of text.matchAll(shopRe)) {
    shop.push({ id: match[1], category: match[2], price: Number(match[3]) });
  }
  if (shop.length !== 29) {
    throw new Error(`expected 29 shop items, found ${shop.length}`);
  }
  const care = text.match(/CARE_GAIN = (\d+)/);
  const step = text.match(/EVOLUTION_STEP = (\d+)/);
  if (!care || !step) throw new Error("missing care or evolution constants");
  return {
    animals,
    shop,
    careGain: Number(care[1]),
    evolutionStep: Number(step[1]),
  };
}

function appConnection(owner, password) {
  const url = new URL(owner.toString());
  url.username = "school_run_app";
  url.password = password;
  url.search = "";
  url.searchParams.set("sslmode", "require");
  return url.toString();
}

async function httpApply(connection, payload) {
  const host = new URL(connection).hostname.replace("-pooler", "");
  const endpoint = `https://${host.replace(/^[^.]+\./, "api.")}/sql`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": connection,
    },
    body: JSON.stringify({
      query: "select school_run_apply($1::jsonb) as result",
      params: [payload],
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`http ${response.status} ${text.slice(0, 180)}`);
  }
  const body = JSON.parse(text);
  const raw = body.rows?.[0]?.result;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function check(connection) {
  const admin = await httpApply(connection, {
    action: "login",
    username: "admin",
    password: "admin123",
  });
  if (!admin.ok || admin.user?.role !== "admin" || admin.user.passwordPlain) {
    throw new Error("admin login shape failed");
  }
  const username = `sync${Date.now().toString().slice(-8)}`;
  const registered = await httpApply(connection, {
    action: "register",
    username,
    displayName: "연동확인",
    password: "sync1234",
    grade: "3학년",
    animal: "cat",
  });
  if (!registered.ok || registered.user?.animalLabel !== "고양이") {
    throw new Error(`register failed ${registered.error ?? ""}`);
  }
  if (registered.user.stageName !== "말랑한 아기고양이") {
    throw new Error(`stage name ${registered.user.stageName}`);
  }
  const lap = await httpApply(connection, {
    action: "addLap",
    token: registered.token,
    laps: 2,
    note: "연동",
  });
  if (!lap.ok || lap.user?.mileage !== 2 || lap.user?.todayLaps !== 2) {
    throw new Error(`lap failed ${JSON.stringify({ ok: lap.ok, mileage: lap.user?.mileage, today: lap.user?.todayLaps, error: lap.error })}`);
  }
  const seen = await httpApply(connection, {
    action: "participants",
    token: admin.token,
  });
  const found = (seen.users ?? []).find((user) => user.username === username);
  if (!found || found.totalLaps !== 2 || found.passwordPlain) {
    throw new Error("other session did not see the new laps");
  }
  const forbidden = await httpApply(connection, {
    action: "adminUsers",
    token: registered.token,
  });
  if (forbidden.ok || forbidden.status !== 403) {
    throw new Error("participant could read admin list");
  }
  const removed = await httpApply(connection, {
    action: "adminDelete",
    token: admin.token,
    userId: registered.user.id,
  });
  if (!removed.ok || removed.displayName !== "연동확인") {
    throw new Error(`delete failed ${removed.error ?? ""}`);
  }
  await httpApply(connection, { action: "logout", token: admin.token });
  console.log("shared database check passed");
}

async function main() {
  const owner = ownerUrl();
  const spec = catalog();
  const password = existsSync(appFile)
    ? new URL(readFileSync(appFile, "utf8").trim()).password
    : randomBytes(24).toString("base64url");
  const client = new pg.Client({
    connectionString: owner.toString(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const sql = readFileSync(path.join(root, "scripts", "school-run-apply.sql"), "utf8");
  const statements = sql
    .split(/\n(?=CREATE )/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.query(statement);
  }
  const role = await client.query(
    "SELECT 1 FROM pg_roles WHERE rolname = 'school_run_app'",
  );
  if (role.rowCount === 0) {
    await client.query(
      `CREATE ROLE school_run_app LOGIN PASSWORD ${quoteLiteral(password)}`,
    );
  } else {
    await client.query(
      `ALTER ROLE school_run_app WITH LOGIN PASSWORD ${quoteLiteral(password)}`,
    );
  }
  const grants = [
    "REVOKE ALL ON FUNCTION school_run_apply(jsonb) FROM PUBLIC",
    "REVOKE ALL ON FUNCTION school_run_shape(jsonb, boolean, integer, integer, integer) FROM PUBLIC",
    "REVOKE ALL ON FUNCTION school_run_counts(jsonb, text) FROM PUBLIC",
    "REVOKE ALL ON FUNCTION school_run_put_user(jsonb, jsonb) FROM PUBLIC",
    "REVOKE ALL ON FUNCTION school_run_err(text, integer) FROM PUBLIC",
    "REVOKE ALL ON TABLE school_run_catalog FROM PUBLIC",
    "REVOKE ALL ON TABLE school_run_state FROM PUBLIC",
    "REVOKE ALL ON TABLE school_run_catalog FROM school_run_app",
    "REVOKE ALL ON TABLE school_run_state FROM school_run_app",
    "GRANT USAGE ON SCHEMA public TO school_run_app",
    "GRANT EXECUTE ON FUNCTION school_run_apply(jsonb) TO school_run_app",
  ];
  for (const statement of grants) {
    await client.query(statement);
  }
  await client.query(
    `INSERT INTO school_run_catalog (id, animals, shop, care_gain, evolution_step)
     VALUES (1, $1::jsonb, $2::jsonb, $3, $4)
     ON CONFLICT (id) DO UPDATE
       SET animals = EXCLUDED.animals,
           shop = EXCLUDED.shop,
           care_gain = EXCLUDED.care_gain,
           evolution_step = EXCLUDED.evolution_step`,
    [JSON.stringify(spec.animals), JSON.stringify(spec.shop), spec.careGain, spec.evolutionStep],
  );
  const counts = await client.query(
    "SELECT jsonb_array_length(doc->'users') AS users FROM school_run_state WHERE id = 1",
  );
  await client.end();

  const connection = appConnection(owner, password);
  writeFileSync(appFile, connection, { mode: 0o600 });
  console.log(`shared database ready, users=${counts.rows[0].users}, shop=${spec.shop.length}`);

  const limited = new pg.Client({
    connectionString: connection,
    ssl: { rejectUnauthorized: false },
  });
  await limited.connect();
  let blocked = false;
  try {
    await limited.query("SELECT doc FROM school_run_state");
  } catch {
    blocked = true;
  }
  await limited.end();
  if (!blocked) throw new Error("app role can still read the document");

  if (process.argv.includes("--check")) {
    await check(connection);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "install failed");
  process.exit(1);
});
