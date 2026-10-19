import { SESSION_COOKIE } from "@/lib/auth";
import { deleteSession } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
