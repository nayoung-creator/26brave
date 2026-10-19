import { createSession, createUser } from "@/lib/store";
import { SESSION_COOKIE, jsonError, toPublicUser } from "@/lib/auth";
import { isAnimalId } from "@/lib/catalog";
import type { AnimalId, Grade } from "@/lib/types";
import { cookies } from "next/headers";

const GRADES: Grade[] = [
  "유치원",
  "1학년",
  "2학년",
  "3학년",
  "4학년",
  "5학년",
  "6학년",
  "교직원",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const displayName = String(body.displayName ?? "").trim();
    const password = String(body.password ?? "");
    const grade = body.grade as Grade;
    const animal = body.animal as AnimalId;

    if (!username || username.length < 2) {
      return jsonError("아이디는 2자 이상이어야 합니다.");
    }
    if (!displayName) return jsonError("이름을 입력해 주세요.");
    if (!password || password.length < 4) {
      return jsonError("비밀번호는 4자 이상이어야 합니다.");
    }
    if (!GRADES.includes(grade)) return jsonError("학년을 선택해 주세요.");
    if (!isAnimalId(animal)) {
      return jsonError("키울 동물을 선택해 주세요.");
    }

    const user = await createUser({
      username,
      displayName,
      password,
      grade,
      animal,
      role: "participant",
    });
    const session = await createSession(user.id);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return Response.json({ user: await toPublicUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") {
      return jsonError("이미 사용 중인 아이디입니다.", 409);
    }
    return jsonError("가입에 실패했습니다.", 500);
  }
}
