import { getCurrentUser, jsonError, toAdminUser } from "@/lib/auth";
import { updateDb } from "@/lib/store";

export async function PUT(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return jsonError("로그인이 필요합니다.", 401);
  if (admin.role !== "admin") {
    return jsonError("관리자만 접근할 수 있습니다.", 403);
  }

  const body = await req.json();
  const userId = String(body.userId ?? "");
  const newPassword = String(body.newPassword ?? "1234");

  if (newPassword.length < 4) {
    return jsonError("비밀번호는 4자 이상이어야 합니다.");
  }

  try {
    const { result } = await updateDb((db) => {
      const target = db.users.find((u) => u.id === userId);
      if (!target) throw new Error("USER_NOT_FOUND");
      target.passwordPlain = newPassword;
      return target;
    });
    return Response.json({ user: await toAdminUser(result) });
  } catch {
    return jsonError("사용자를 찾을 수 없습니다.", 404);
  }
}
