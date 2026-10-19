import { SESSION_COOKIE, jsonError, toPublicUser } from "@/lib/auth";
import { createSession, findUserByUsername } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    const user = await findUserByUsername(username);
    if (!user || user.passwordPlain !== password) {
      return jsonError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    const session = await createSession(user.id);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return Response.json({ user: await toPublicUser(user) });
  } catch {
    return jsonError("로그인에 실패했습니다.", 500);
  }
}
