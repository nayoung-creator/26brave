import { getCurrentUser, jsonError, toAdminUser } from "@/lib/auth";
import { readDb, updateDb } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);
  if (user.role !== "admin") return jsonError("관리자만 접근할 수 있습니다.", 403);

  const db = await readDb();
  const users = await Promise.all(db.users.map((u) => toAdminUser(u)));
  users.sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));

  return Response.json({ users });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return jsonError("로그인이 필요합니다.", 401);
  if (admin.role !== "admin") return jsonError("관리자만 접근할 수 있습니다.", 403);

  const body = await req.json();
  const userId = String(body.userId ?? "");
  if (!userId) return jsonError("삭제할 계정을 선택해 주세요.");
  if (userId === admin.id) {
    return jsonError("지금 로그인한 관리자 계정은 삭제할 수 없습니다.");
  }

  try {
    const { result } = await updateDb((db) => {
      const target = db.users.find((u) => u.id === userId);
      if (!target) throw new Error("USER_NOT_FOUND");
      db.users = db.users.filter((u) => u.id !== userId);
      db.sessions = db.sessions.filter((s) => s.userId !== userId);
      db.laps = db.laps.filter((l) => l.userId !== userId);
      return { displayName: target.displayName, username: target.username };
    });
    return Response.json({ ok: true, ...result });
  } catch {
    return jsonError("사용자를 찾을 수 없습니다.", 404);
  }
}
