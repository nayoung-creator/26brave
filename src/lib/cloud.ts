import type { AdminUserView, LapRecord, PublicUser } from "./types";

const SESSION_KEY = "run_session";

export interface CloudData {
  ok?: boolean;
  error?: string;
  status?: number;
  token?: string;
  user?: PublicUser;
  users?: Array<PublicUser | AdminUserView>;
  laps?: LapRecord[];
  me?: PublicUser;
  record?: LapRecord;
  displayName?: string;
  username?: string;
}

export function readToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(SESSION_KEY, token);
  else window.localStorage.removeItem(SESSION_KEY);
}

function sqlEndpoint(connection: string) {
  const host = new URL(connection).hostname.replace("-pooler", "");
  return `https://${host.replace(/^[^.]+\./, "api.")}/sql`;
}

function offline(status: number, error: string) {
  return { ok: false, status, data: { ok: false, error } as CloudData };
}

export async function cloud(
  action: string,
  payload: Record<string, unknown> = {},
  token: string | null | undefined = undefined,
) {
  const connection = process.env.NEXT_PUBLIC_DATABASE_URL;
  if (!connection) {
    return offline(500, "공유 기록 저장소가 설정되지 않았습니다.");
  }
  const session = token === undefined ? readToken() : token;
  let response: Response;
  try {
    response = await fetch(sqlEndpoint(connection), {
      method: "POST",
      cache: "no-store",
      headers: {
        // Neon allows the connection header on browser preflight, but not Content-Type.
        // A string body is sent as text/plain, which does not need that permission.
        "Neon-Connection-String": connection,
      },
      body: JSON.stringify({
        query: "select school_run_apply($1::jsonb) as result",
        params: [{ ...payload, action, token: session }],
      }),
    });
  } catch {
    return offline(0, "공유 기록 저장소에 연결하지 못했습니다.");
  }
  if (!response.ok) {
    return offline(response.status, "공유 기록 저장소에 연결하지 못했습니다.");
  }
  const body = (await response.json()) as {
    rows?: Array<{ result?: unknown }>;
  };
  const raw = body.rows?.[0]?.result;
  const data: CloudData =
    typeof raw === "string"
      ? (JSON.parse(raw) as CloudData)
      : ((raw ?? {}) as CloudData);
  const status = data.ok === false ? Number(data.status ?? 400) : 200;
  return { ok: data.ok !== false, status, data };
}

export async function login(username: string, password: string) {
  const result = await cloud("login", { username, password }, null);
  if (result.ok && result.data.token) writeToken(result.data.token);
  return result;
}

export async function register(input: {
  username: string;
  displayName: string;
  password: string;
  grade: string;
  animal: string;
}) {
  const result = await cloud("register", input, null);
  if (result.ok && result.data.token) writeToken(result.data.token);
  return result;
}

export async function logout() {
  const result = await cloud("logout");
  writeToken(null);
  return result;
}

export async function participants() {
  const result = await cloud("participants");
  if (result.ok && result.data.users) {
    result.data.users = [...result.data.users].sort(
      (a, b) => b.totalLaps - a.totalLaps,
    );
  }
  return result;
}

export async function adminUsers() {
  const result = await cloud("adminUsers");
  if (result.ok && result.data.users) {
    result.data.users = [...result.data.users].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "ko"),
    );
  }
  return result;
}
