import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  AnimalId,
  Database,
  LapRecord,
  Session,
  User,
} from "./types";
import { isAnimalId } from "./catalog";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");

function emptyDb(): Database {
  return { users: [], sessions: [], laps: [] };
}

function freshUser(partial: Omit<User, "ownedClothesIds" | "equippedClothesId" | "fullness" | "happiness" | "mealsFed" | "snacksFed"> & Partial<User>): User {
  return {
    ownedClothesIds: [],
    equippedClothesId: null,
    fullness: 40,
    happiness: 40,
    mealsFed: 0,
    snacksFed: 0,
    ...partial,
  };
}

function normalizeUser(raw: Partial<User> & { animal?: unknown }): User {
  const animal: AnimalId = isAnimalId(raw.animal) ? raw.animal : "dog";
  const clothes = Array.isArray(raw.ownedClothesIds)
    ? raw.ownedClothesIds.filter((id) => typeof id === "string")
    : [];
  return {
    id: String(raw.id ?? randomUUID()),
    username: String(raw.username ?? "user"),
    displayName: String(raw.displayName ?? "참가자"),
    passwordPlain: String(raw.passwordPlain ?? "1234"),
    role: raw.role === "admin" ? "admin" : "participant",
    grade: raw.grade ?? "1학년",
    animal,
    mileage: Number(raw.mileage ?? 0),
    spentMileage: Number(raw.spentMileage ?? 0),
    ownedClothesIds: clothes,
    equippedClothesId:
      typeof raw.equippedClothesId === "string" ? raw.equippedClothesId : null,
    fullness: Math.max(0, Math.min(100, Number(raw.fullness ?? 40))),
    happiness: Math.max(0, Math.min(100, Number(raw.happiness ?? 40))),
    mealsFed: Number(raw.mealsFed ?? 0),
    snacksFed: Number(raw.snacksFed ?? 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

async function ensureDb(): Promise<Database> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Database;
    const users = (parsed.users ?? []).map((user) => normalizeUser(user));
    const changed = JSON.stringify(users) !== JSON.stringify(parsed.users);
    parsed.users = users;
    parsed.sessions = parsed.sessions ?? [];
    parsed.laps = parsed.laps ?? [];
    if (changed) await writeDb(parsed);
    return parsed;
  } catch {
    const db = emptyDb();
    db.users.push(
      freshUser({
        id: randomUUID(),
        username: "admin",
        displayName: "관리자",
        passwordPlain: "admin123",
        role: "admin",
        grade: "교직원",
        animal: "dog",
        mileage: 0,
        spentMileage: 0,
        createdAt: new Date().toISOString(),
      }),
    );
    await writeDb(db);
    return db;
  }
}

async function writeDb(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function readDb() {
  return ensureDb();
}

export async function updateDb<T>(
  mutator: (db: Database) => T,
): Promise<{ result: T; db: Database }> {
  const db = await ensureDb();
  const result = mutator(db);
  await writeDb(db);
  return { result, db };
}

export async function findUserByUsername(username: string) {
  const db = await ensureDb();
  return db.users.find((u) => u.username === username) ?? null;
}

export async function findUserById(id: string) {
  const db = await ensureDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  username: string;
  displayName: string;
  password: string;
  grade: User["grade"];
  animal: AnimalId;
  role?: User["role"];
}): Promise<User> {
  const { result } = await updateDb((db) => {
    if (db.users.some((u) => u.username === input.username)) {
      throw new Error("USERNAME_TAKEN");
    }
    const user = freshUser({
      id: randomUUID(),
      username: input.username,
      displayName: input.displayName,
      passwordPlain: input.password,
      role: input.role ?? "participant",
      grade: input.grade,
      animal: input.animal,
      mileage: 0,
      spentMileage: 0,
      createdAt: new Date().toISOString(),
    });
    db.users.push(user);
    return user;
  });
  return result;
}

export async function createSession(userId: string): Promise<Session> {
  const { result } = await updateDb((db) => {
    const session: Session = {
      token: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    };
    db.sessions.push(session);
    return session;
  });
  return result;
}

export async function deleteSession(token: string) {
  await updateDb((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

export async function getSessionUser(token: string | undefined | null) {
  if (!token) return null;
  const db = await ensureDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export async function addLapRecord(input: {
  userId: string;
  laps: number;
  note?: string;
}): Promise<LapRecord> {
  if (input.laps <= 0 || input.laps > 50) {
    throw new Error("INVALID_LAPS");
  }
  const { result } = await updateDb((db) => {
    const user = db.users.find((u) => u.id === input.userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const mileage = input.laps;
    const record: LapRecord = {
      id: randomUUID(),
      userId: input.userId,
      laps: input.laps,
      mileage,
      recordedAt: new Date().toISOString(),
      note: input.note,
    };
    db.laps.push(record);
    user.mileage += mileage;
    return record;
  });
  return result;
}

export function isSameDay(iso: string, date = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

export function isSameMonth(iso: string, date = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth()
  );
}
