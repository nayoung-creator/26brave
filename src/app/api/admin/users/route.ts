import { getCurrentUser, jsonError, toAdminUser } from "@/lib/auth";
import { readDb } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);
  if (user.role !== "admin") return jsonError("관리자만 접근할 수 있습니다.", 403);

  const db = await readDb();
  const users = await Promise.all(db.users.map((u) => toAdminUser(u)));
  users.sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));

  return Response.json({ users });
}
