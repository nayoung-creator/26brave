import { cookies } from "next/headers";
import {
  getSessionUser,
  isSameDay,
  isSameMonth,
  readDb,
} from "./store";
import type { AdminUserView, PublicUser, User } from "./types";

export const SESSION_COOKIE = "run_session";

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return getSessionUser(token);
}

export async function toPublicUser(user: User): Promise<PublicUser> {
  const db = await readDb();
  const mine = db.laps.filter((l) => l.userId === user.id);
  const todayLaps = mine
    .filter((l) => isSameDay(l.recordedAt))
    .reduce((sum, l) => sum + l.laps, 0);
  const monthLaps = mine
    .filter((l) => isSameMonth(l.recordedAt))
    .reduce((sum, l) => sum + l.laps, 0);
  const totalLaps = mine.reduce((sum, l) => sum + l.laps, 0);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    grade: user.grade,
    gender: user.gender,
    mileage: user.mileage,
    spentMileage: user.spentMileage,
    availableMileage: user.mileage - user.spentMileage,
    ownedItemIds: user.ownedItemIds,
    equipped: user.equipped,
    createdAt: user.createdAt,
    todayLaps,
    monthLaps,
    totalLaps,
  };
}

export async function toAdminUser(user: User): Promise<AdminUserView> {
  const pub = await toPublicUser(user);
  return { ...pub, passwordPlain: user.passwordPlain };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
