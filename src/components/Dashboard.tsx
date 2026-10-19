"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CharacterAvatar } from "./CharacterAvatar";
import { PlaygroundTrack } from "./PlaygroundTrack";
import { SHOP_ITEMS, getItem } from "@/lib/catalog";
import type {
  AdminUserView,
  ItemCategory,
  LapRecord,
  PublicUser,
  ShopItem,
} from "@/lib/types";

type TabId =
  | "today"
  | "month"
  | "track"
  | "character"
  | "growth"
  | "profile"
  | "admin";

interface Props {
  user: PublicUser;
  onUserChange: (user: PublicUser | null) => void;
}

const TABS: { id: TabId; label: string; adminOnly?: boolean }[] = [
  { id: "today", label: "오늘의 기록" },
  { id: "month", label: "이번 달의 기록" },
  { id: "track", label: "참가자 현황" },
  { id: "character", label: "캐릭터 꾸미기" },
  { id: "growth", label: "성장 배지" },
  { id: "profile", label: "내 정보" },
  { id: "admin", label: "계정 관리", adminOnly: true },
];

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  face: "얼굴",
  hair: "머리",
  outfit: "의상",
  shoes: "신발",
};

export function Dashboard({ user, onUserChange }: Props) {
  const [tab, setTab] = useState<TabId>("today");
  const [lapsToday, setLapsToday] = useState<LapRecord[]>([]);
  const [lapsMonth, setLapsMonth] = useState<LapRecord[]>([]);
  const [participants, setParticipants] = useState<PublicUser[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserView[]>([]);
  const [lapInput, setLapInput] = useState(1);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [shopCategory, setShopCategory] = useState<ItemCategory>("outfit");
  const [revealId, setRevealId] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    const [todayRes, monthRes] = await Promise.all([
      fetch("/api/laps?range=today"),
      fetch("/api/laps?range=month"),
    ]);
    if (todayRes.ok) {
      const data = await todayRes.json();
      setLapsToday(data.laps);
      if (data.me) onUserChange(data.me);
    }
    if (monthRes.ok) {
      const data = await monthRes.json();
      setLapsMonth(data.laps);
    }
  }, [onUserChange]);

  const loadParticipants = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.users);
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (user.role !== "admin") return;
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setAdminUsers(data.users);
    }
  }, [user.role]);

  useEffect(() => {
    void loadRecords();
    void loadParticipants();
  }, [loadRecords, loadParticipants]);

  useEffect(() => {
    if (tab === "admin") void loadAdmin();
    if (tab === "track") void loadParticipants();
  }, [tab, loadAdmin, loadParticipants]);

  async function submitLaps(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/laps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ laps: lapInput, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "저장 실패");
      return;
    }
    setMessage(`${lapInput}바퀴 기록! 마일리지 +${lapInput}`);
    setNote("");
    setLapInput(1);
    if (data.user) onUserChange(data.user);
    await loadRecords();
    await loadParticipants();
  }

  async function buyItem(item: ShopItem) {
    setMessage("");
    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "buy", itemId: item.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "구매 실패");
      return;
    }
    onUserChange(data.user);
    setMessage(`${item.name}을(를) 구매했습니다!`);
  }

  async function equipItem(item: ShopItem) {
    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "equip",
        category: item.category,
        itemId: item.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "착용 실패");
      return;
    }
    onUserChange(data.user);
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: fd.get("currentPassword"),
        newPassword: fd.get("newPassword"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "변경 실패");
      return;
    }
    setMessage("비밀번호가 변경되었습니다.");
    e.currentTarget.reset();
  }

  async function resetPassword(userId: string) {
    const next = window.prompt("새 비밀번호를 입력하세요", "1234");
    if (!next) return;
    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "초기화 실패");
      return;
    }
    setMessage(`${data.user.displayName} 비밀번호를 초기화했습니다.`);
    await loadAdmin();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onUserChange(null);
  }

  const visibleTabs = TABS.filter((t) => !t.adminOnly || user.role === "admin");

  const shopItems = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (item) =>
          item.category === shopCategory &&
          (item.gender === "any" || item.gender === user.gender),
      ),
    [shopCategory, user.gender],
  );

  const badges = useMemo(() => {
    const total = user.totalLaps;
    return [
      { name: "첫 발걸음", need: 1, earned: total >= 1 },
      { name: "운동장 탐험가", need: 10, earned: total >= 10 },
      { name: "꾸준한 러너", need: 30, earned: total >= 30 },
      { name: "스타터 1km", need: 5, earned: total >= 5 },
      { name: "챌린저 2km", need: 10, earned: total >= 10 },
      { name: "마스터 3km", need: 15, earned: total >= 15 },
      { name: "마일리지 부자", need: 40, earned: user.mileage >= 40 },
    ];
  }, [user]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--canvas)]">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)]">
        <div className="border-b border-[var(--line)] px-6 py-7">
          <div className="font-display text-3xl leading-none text-[var(--brand)]">
            1·2·3 런
          </div>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            학교 운동장 마일리지 프로젝트
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMessage("");
                setTab(t.id);
              }}
              className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-[var(--brand)] text-white shadow-md"
                  : "text-[var(--ink)] hover:bg-[var(--panel-soft)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-[var(--line)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <CharacterAvatar
              gender={user.gender}
              equipped={user.equipped}
              size={52}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{user.displayName}</div>
              <div className="text-xs text-[var(--ink-muted)]">
                {user.grade} · {user.role === "admin" ? "관리자" : "참가자"}
              </div>
              <div className="text-xs font-semibold text-[var(--accent)]">
                보유 {user.availableMileage} 마일리지
              </div>
            </div>
          </div>
          <button type="button" className="btn-ghost w-full" onClick={logout}>
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-white/70 px-8 py-5 backdrop-blur">
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)]">
              {visibleTabs.find((t) => t.id === tab)?.label}
            </h2>
            <p className="text-sm text-[var(--ink-muted)]">
              오늘 {user.todayLaps}바퀴 · 이번 달 {user.monthLaps}바퀴 · 누적{" "}
              {user.totalLaps}바퀴
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Stat label="오늘" value={`${user.todayLaps}`} unit="바퀴" />
            <Stat label="마일리지" value={`${user.availableMileage}`} unit="점" />
          </div>
        </header>

        <div className="relative flex-1 overflow-auto p-8">
          {message ? (
            <div className="mb-4 rounded-xl bg-[#E7F6EE] px-4 py-3 text-sm text-[#1F6B4A]">
              {message}
            </div>
          ) : null}

          {tab === "today" && (
            <section className="grid h-full grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="panel flex flex-col">
                <h3 className="section-title">오늘 바퀴 기록하기</h3>
                <p className="mb-6 text-sm text-[var(--ink-muted)]">
                  학교 운동장을 한 바퀴 돌 때마다 1 마일리지가 쌓입니다.
                </p>
                <form onSubmit={submitLaps} className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">바퀴 수</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="btn-ghost px-4"
                        onClick={() => setLapInput((v) => Math.max(1, v - 1))}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="field text-center text-2xl font-bold"
                        value={lapInput}
                        onChange={(e) => setLapInput(Number(e.target.value))}
                      />
                      <button
                        type="button"
                        className="btn-ghost px-4"
                        onClick={() => setLapInput((v) => Math.min(50, v + 1))}
                      >
                        +
                      </button>
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      한 줄 메모 (선택)
                    </span>
                    <input
                      className="field"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="천천히, 친구와 함께, 기분 좋음..."
                    />
                  </label>
                  <button className="btn-primary" type="submit">
                    기록 저장하기
                  </button>
                </form>
              </div>
              <div className="panel overflow-auto">
                <h3 className="section-title">오늘의 내 기록</h3>
                {lapsToday.length === 0 ? (
                  <Empty text="아직 오늘 기록이 없습니다." />
                ) : (
                  <ul className="space-y-3">
                    {lapsToday.map((lap) => (
                      <li key={lap.id} className="record-row">
                        <div>
                          <div className="font-semibold">{lap.laps}바퀴</div>
                          <div className="text-xs text-[var(--ink-muted)]">
                            {formatTime(lap.recordedAt)}
                            {lap.note ? ` · ${lap.note}` : ""}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[var(--accent)]">
                          +{lap.mileage}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {tab === "month" && (
            <section className="panel h-full overflow-auto">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="section-title">이번 달 달리기 기록</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    누적 {user.monthLaps}바퀴 · 사용한 마일리지 {user.spentMileage}
                  </p>
                </div>
                <MonthBars laps={lapsMonth} />
              </div>
              {lapsMonth.length === 0 ? (
                <Empty text="이번 달 기록이 아직 없습니다." />
              ) : (
                <ul className="space-y-3">
                  {lapsMonth.map((lap) => (
                    <li key={lap.id} className="record-row">
                      <div>
                        <div className="font-semibold">{lap.laps}바퀴</div>
                        <div className="text-xs text-[var(--ink-muted)]">
                          {formatDateTime(lap.recordedAt)}
                          {lap.note ? ` · ${lap.note}` : ""}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[var(--accent)]">
                        +{lap.mileage}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "track" && (
            <section className="flex h-full flex-col gap-4">
              <div className="min-h-0 flex-1">
                <PlaygroundTrack users={participants} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {participants.slice(0, 8).map((p) => (
                  <div key={p.id} className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                    <div className="truncate text-sm font-bold">{p.displayName}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {p.grade} · 누적 {p.totalLaps}바퀴
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "character" && (
            <section className="grid h-full grid-cols-[0.9fr_1.1fr] gap-6">
              <div className="panel flex flex-col items-center justify-center">
                <h3 className="section-title mb-2">내 캐릭터</h3>
                <CharacterAvatar
                  gender={user.gender}
                  equipped={user.equipped}
                  size={220}
                />
                <p className="mt-4 text-sm text-[var(--ink-muted)]">
                  보유 마일리지{" "}
                  <strong className="text-[var(--accent)]">
                    {user.availableMileage}
                  </strong>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {(Object.keys(CATEGORY_LABEL) as ItemCategory[]).map((cat) => {
                    const item = getItem(user.equipped[cat]);
                    return (
                      <div key={cat} className="rounded-xl bg-[var(--panel-soft)] px-3 py-2">
                        <div className="text-[var(--ink-muted)]">
                          {CATEGORY_LABEL[cat]}
                        </div>
                        <div className="font-semibold">{item?.name ?? "-"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel overflow-auto">
                <div className="mb-4 flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABEL) as ItemCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        shopCategory === cat
                          ? "bg-[var(--brand)] text-white"
                          : "bg-[var(--panel-soft)] text-[var(--ink)]"
                      }`}
                      onClick={() => setShopCategory(cat)}
                    >
                      {CATEGORY_LABEL[cat]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {shopItems.map((item) => {
                    const owned = user.ownedItemIds.includes(item.id);
                    const equipped = user.equipped[item.category] === item.id;
                    return (
                      <div key={item.id} className="rounded-2xl border border-[var(--line)] p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <span
                            className="h-10 w-10 rounded-full border border-black/10"
                            style={{ background: item.colors.primary }}
                          />
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-[var(--ink-muted)]">
                              {item.price === 0 ? "기본 지급" : `${item.price} 마일리지`}
                            </div>
                          </div>
                        </div>
                        {owned ? (
                          <button
                            type="button"
                            className="btn-primary w-full"
                            disabled={equipped}
                            onClick={() => equipItem(item)}
                          >
                            {equipped ? "착용 중" : "착용하기"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-accent w-full"
                            onClick={() => buyItem(item)}
                          >
                            구매하기
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {tab === "growth" && (
            <section className="panel h-full overflow-auto">
              <h3 className="section-title">성장 배지</h3>
              <p className="mb-6 text-sm text-[var(--ink-muted)]">
                순위가 아니라 참여와 지속을 응원하는 배지입니다.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.name}
                    className={`rounded-2xl border p-5 ${
                      badge.earned
                        ? "border-[#2F9E8F] bg-[#E8F7F2]"
                        : "border-[var(--line)] bg-white opacity-70"
                    }`}
                  >
                    <div className="font-display text-2xl">{badge.name}</div>
                    <div className="mt-2 text-sm text-[var(--ink-muted)]">
                      목표 {badge.need}바퀴
                    </div>
                    <div className="mt-3 text-sm font-semibold">
                      {badge.earned ? "획득!" : "도전 중"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "profile" && (
            <section className="grid h-full grid-cols-2 gap-6">
              <div className="panel">
                <h3 className="section-title">내 계정</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <Row label="아이디" value={user.username} />
                  <Row label="이름" value={user.displayName} />
                  <Row label="학년/구분" value={user.grade} />
                  <Row label="역할" value={user.role === "admin" ? "관리자" : "참가자"} />
                  <Row label="누적 마일리지" value={`${user.mileage}`} />
                  <Row label="사용 마일리지" value={`${user.spentMileage}`} />
                </dl>
              </div>
              <div className="panel">
                <h3 className="section-title">비밀번호 변경</h3>
                <form onSubmit={changePassword} className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">현재 비밀번호</span>
                    <input className="field" name="currentPassword" type="password" required />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">새 비밀번호</span>
                    <input
                      className="field"
                      name="newPassword"
                      type="password"
                      minLength={4}
                      required
                    />
                  </label>
                  <button className="btn-primary" type="submit">
                    비밀번호 저장
                  </button>
                </form>
              </div>
            </section>
          )}

          {tab === "admin" && user.role === "admin" && (
            <section className="panel h-full overflow-auto">
              <h3 className="section-title">참가자·계정 관리</h3>
              <p className="mb-4 text-sm text-[var(--ink-muted)]">
                일반 계정의 마일리지와 비밀번호를 확인하고 초기화할 수 있습니다.
              </p>
              <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--panel-soft)] text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">아이디</th>
                      <th className="px-4 py-3 font-medium">학년</th>
                      <th className="px-4 py-3 font-medium">누적 바퀴</th>
                      <th className="px-4 py-3 font-medium">마일리지</th>
                      <th className="px-4 py-3 font-medium">비밀번호</th>
                      <th className="px-4 py-3 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-t border-[var(--line)]">
                        <td className="px-4 py-3 font-semibold">
                          {u.displayName}
                          {u.role === "admin" ? (
                            <span className="ml-2 text-xs text-[var(--accent)]">관리자</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{u.username}</td>
                        <td className="px-4 py-3">{u.grade}</td>
                        <td className="px-4 py-3">{u.totalLaps}</td>
                        <td className="px-4 py-3">
                          {u.availableMileage}
                          <span className="text-xs text-[var(--ink-muted)]">
                            {" "}
                            / 누적 {u.mileage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {revealId === u.id ? (
                            <code className="rounded bg-[#FFF4E5] px-2 py-1">
                              {u.passwordPlain}
                            </code>
                          ) : (
                            <button
                              type="button"
                              className="text-[var(--brand)] underline"
                              onClick={() => setRevealId(u.id)}
                            >
                              확인
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="btn-ghost px-3 py-1.5 text-xs"
                            onClick={() => resetPassword(u.id)}
                          >
                            초기화
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--panel-soft)] px-5 py-3 text-right">
      <div className="text-xs text-[var(--ink-muted)]">{label}</div>
      <div className="font-display text-2xl text-[var(--ink)]">
        {value}
        <span className="ml-1 text-sm font-sans font-medium text-[var(--ink-muted)]">
          {unit}
        </span>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl bg-[var(--panel-soft)] text-sm text-[var(--ink-muted)]">
      {text}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--line)] pb-2">
      <dt className="text-[var(--ink-muted)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function MonthBars({ laps }: { laps: LapRecord[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const total = laps
      .filter((l) => l.recordedAt.slice(0, 10) === key)
      .reduce((s, l) => s + l.laps, 0);
    return { key, label: `${d.getMonth() + 1}/${d.getDate()}`, total };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="flex h-20 items-end gap-2">
      {days.map((d) => (
        <div key={d.key} className="flex w-8 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-[var(--brand)] transition-all"
            style={{ height: `${(d.total / max) * 56 + 4}px` }}
            title={`${d.total}바퀴`}
          />
          <span className="text-[10px] text-[var(--ink-muted)]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
