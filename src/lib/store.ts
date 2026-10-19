import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  Database,
  LapRecord,
  Session,
  User,
} from "./types";
import { defaultEquipped, starterItemsForGender } from "./catalog";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");

function emptyDb(): Database {
  return { users: [], sessions: [], laps: [] };
}

async function ensureDb(): Promise<Database> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    const db = emptyDb();
    const admin: User = {
      id: randomUUID(),
      username: "admin",
      displayName: "관리자",
      passwordPlain: "admin123",
      role: "admin",
      grade: "교직원",
      gender: "boy",
      mileage: 0,
      spentMileage: 0,
      ownedItemIds: starterItemsForGender("boy").map((i) => i.id),
      equipped: defaultEquipped("boy"),
      createdAt: new Date().toISOString(),
    };
    db.users.push(admin);
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
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
  gender: User["gender"];
  role?: User["role"];
}): Promise<User> {
  const { result } = await updateDb((db) => {
    if (db.users.some((u) => u.username === input.username)) {
      throw new Error("USERNAME_TAKEN");
    }
    const gender = input.gender;
    const user: User = {
      id: randomUUID(),
      username: input.username,
      displayName: input.displayName,
      passwordPlain: input.password,
      role: input.role ?? "participant",
      grade: input.grade,
      gender,
      mileage: 0,
      spentMileage: 0,
      ownedItemIds: starterItemsForGender(gender).map((i) => i.id),
      equipped: defaultEquipped(gender),
      createdAt: new Date().toISOString(),
    };
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
