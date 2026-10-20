import { cookies } from "next/headers";
import {
  getSessionUser,
  isSameDay,
  isSameMonth,
  readDb,
} from "./store";
import { getAnimal, nextEvolutionAt, stageFromMileage, stageName } from "./catalog";
import type { AdminUserView, PublicUser, User } from "./types";

export const SESSION_COOKIE = "run_session";

export function sessionCookie(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

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
  const stage = stageFromMileage(user.mileage);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    grade: user.grade,
    animal: user.animal,
    animalLabel: getAnimal(user.animal).name,
    stage,
    stageName: stageName(user.animal, stage),
    mileage: user.mileage,
    spentMileage: user.spentMileage,
    availableMileage: user.mileage - user.spentMileage,
    ownedClothesIds: user.ownedClothesIds,
    equippedClothesId: user.equippedClothesId,
    fullness: user.fullness,
    happiness: user.happiness,
    mealsFed: user.mealsFed,
    snacksFed: user.snacksFed,
    createdAt: user.createdAt,
    todayLaps,
    monthLaps,
    totalLaps,
    nextEvolutionAt: nextEvolutionAt(user.mileage),
  };
}

export async function toAdminUser(user: User): Promise<AdminUserView> {
  const pub = await toPublicUser(user);
  return { ...pub, passwordPlain: user.passwordPlain };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
