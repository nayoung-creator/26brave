import { getCurrentUser, jsonError, toPublicUser } from "@/lib/auth";
import {
  addLapRecord,
  isSameDay,
  isSameMonth,
  readDb,
} from "@/lib/store";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "mine";
  const range = searchParams.get("range") ?? "all";
  const db = await readDb();

  let laps = db.laps;
  if (scope === "mine" || user.role !== "admin") {
    laps = laps.filter((l) => l.userId === user.id);
  }
  if (range === "today") {
    laps = laps.filter((l) => isSameDay(l.recordedAt));
  } else if (range === "month") {
    laps = laps.filter((l) => isSameMonth(l.recordedAt));
  }

  laps = [...laps].sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  return Response.json({
    laps,
    me: await toPublicUser(user),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);

  try {
    const body = await req.json();
    const laps = Number(body.laps);
    const note = body.note ? String(body.note) : undefined;
    if (!Number.isFinite(laps) || laps <= 0) {
      return jsonError("바퀴 수를 입력해 주세요.");
    }
    const record = await addLapRecord({
      userId: user.id,
      laps: Math.floor(laps),
      note,
    });
    const refreshed = await getCurrentUser();
    return Response.json({
      record,
      user: refreshed ? await toPublicUser(refreshed) : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LAPS") {
      return jsonError("바퀴 수는 1~50 사이여야 합니다.");
    }
    return jsonError("기록 저장에 실패했습니다.", 500);
  }
}
