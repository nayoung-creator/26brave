import { getCurrentUser, jsonError, toPublicUser } from "@/lib/auth";
import { readDb } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);

  const db = await readDb();
  const participants = db.users.filter((u) => u.role === "participant");
  const users = await Promise.all(participants.map((u) => toPublicUser(u)));

  users.sort((a, b) => b.totalLaps - a.totalLaps);

  return Response.json({ users });
}
