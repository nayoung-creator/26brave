import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { Pool, type PoolClient } from "pg";
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

let fileQueue: Promise<unknown> = Promise.resolve();

function enqueueFile<T>(task: () => Promise<T>): Promise<T> {
  const run = fileQueue.then(task, task);
  fileQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function storageMode(): "postgres" | "file" {
  return process.env.DATABASE_URL ? "postgres" : "file";
}

function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const url = new URL(raw);
  url.hostname = url.hostname.replace("-pooler", "");
  url.searchParams.delete("channel_binding");
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  return url.toString();
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      ssl: { rejectUnauthorized: false },
      max: 8,
      connectionTimeoutMillis: 15000,
    });
  }
  return pool;
}

async function ensureSchema(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS school_run_state (
      id INTEGER PRIMARY KEY,
      doc JSONB NOT NULL
    )
  `);
  const existing = await client.query(
    "SELECT id FROM school_run_state WHERE id = 1",
  );
  if (existing.rowCount === 0) {
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
    await client.query(
      "INSERT INTO school_run_state (id, doc) VALUES (1, $1::jsonb)",
      [JSON.stringify(db)],
    );
  }
}

function preparePg() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = await getPool().connect();
      try {
        await ensureSchema(client);
      } finally {
        client.release();
      }
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function normalizeDb(raw: Partial<Database> | null | undefined): Database {
  return {
    users: (raw?.users ?? []).map((user) => normalizeUser(user)),
    sessions: raw?.sessions ?? [],
    laps: raw?.laps ?? [],
  };
}

async function readPg(): Promise<Database> {
  await preparePg();
  const result = await getPool().query(
    "SELECT doc FROM school_run_state WHERE id = 1",
  );
  return normalizeDb(result.rows[0]?.doc as Database | undefined);
}

async function updatePg<T>(mutator: (db: Database) => T) {
  await preparePg();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT doc FROM school_run_state WHERE id = 1 FOR UPDATE",
    );
    const db = normalizeDb(result.rows[0]?.doc as Database | undefined);
    const value = mutator(db);
    await client.query(
      "UPDATE school_run_state SET doc = $1::jsonb WHERE id = 1",
      [JSON.stringify(db)],
    );
    await client.query("COMMIT");
    return { result: value, db };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

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

async function loadFile(): Promise<Database> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Database;
    const db = normalizeDb(parsed);
    if (JSON.stringify(db.users) !== JSON.stringify(parsed.users)) {
      await saveFile(db);
    }
    return db;
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
    await saveFile(db);
    return db;
  }
}

async function saveFile(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export async function readDb() {
  if (process.env.DATABASE_URL) return readPg();
  return enqueueFile(() => loadFile());
}

export async function updateDb<T>(
  mutator: (db: Database) => T,
): Promise<{ result: T; db: Database }> {
  if (process.env.DATABASE_URL) return updatePg(mutator);
  return enqueueFile(async () => {
    const db = await loadFile();
    const result = mutator(db);
    await saveFile(db);
    return { result, db };
  });
}

export async function findUserByUsername(username: string) {
  const db = await readDb();
  return db.users.find((u) => u.username === username) ?? null;
}

export async function findUserById(id: string) {
  const db = await readDb();
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
  const db = await readDb();
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
