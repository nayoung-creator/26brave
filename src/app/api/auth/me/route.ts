import { getCurrentUser, jsonError, toPublicUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("로그인이 필요합니다.", 401);
  return Response.json({ user: await toPublicUser(user) });
}
