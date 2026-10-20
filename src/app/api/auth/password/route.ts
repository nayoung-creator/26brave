import { getCurrentUser, jsonError, toPublicUser } from "@/lib/auth";
import { updateDb } from "@/lib/store";

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);

  const body = await req.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (user.passwordPlain !== currentPassword) {
    return jsonError("현재 비밀번호가 올바르지 않습니다.", 403);
  }
  if (newPassword.length < 4) {
    return jsonError("새 비밀번호는 4자 이상이어야 합니다.");
  }

  const { result } = await updateDb((db) => {
    const target = db.users.find((u) => u.id === user.id);
    if (!target) throw new Error("USER_NOT_FOUND");
    target.passwordPlain = newPassword;
    return target;
  });

  return Response.json({ user: await toPublicUser(result) });
}
