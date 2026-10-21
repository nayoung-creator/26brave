"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimalAvatar } from "./AnimalAvatar";
import { PlaygroundTrack } from "./PlaygroundTrack";
import { EVOLUTION_STEP, SHOP_ITEMS, getAnimal, stageName } from "@/lib/catalog";
import {
  adminUsers as fetchAdminUsers,
  cloud,
  logout as cloudLogout,
  participants as fetchParticipants,
} from "@/lib/cloud";
import type {
  AdminUserView,
  EvolutionStage,
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
  { id: "character", label: "동물 키우기" },
  { id: "growth", label: "성장 배지" },
  { id: "profile", label: "내 정보" },
  { id: "admin", label: "계정 관리", adminOnly: true },
];

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  clothes: "옷",
  food: "먹이",
  snack: "간식",
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
  const [shopCategory, setShopCategory] = useState<ItemCategory>("clothes");
  const [revealId, setRevealId] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    const [todayRes, monthRes] = await Promise.all([
      cloud("laps", { range: "today" }),
      cloud("laps", { range: "month" }),
    ]);
    if (todayRes.ok && todayRes.data.laps) {
      setLapsToday(todayRes.data.laps);
      if (todayRes.data.me) onUserChange(todayRes.data.me);
    }
    if (monthRes.ok && monthRes.data.laps) {
      setLapsMonth(monthRes.data.laps);
    }
  }, [onUserChange]);

  const loadParticipants = useCallback(async () => {
    const res = await fetchParticipants();
    if (res.ok && res.data.users) {
      setParticipants(res.data.users);
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (user.role !== "admin") return;
    const res = await fetchAdminUsers();
    if (res.ok && res.data.users) {
      setAdminUsers(res.data.users as AdminUserView[]);
    }
  }, [user.role]);

  useEffect(() => {
    void loadRecords();
    void loadParticipants();
  }, [loadRecords, loadParticipants]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadRecords();
      void loadParticipants();
      if (user.role === "admin") void loadAdmin();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [loadRecords, loadParticipants, loadAdmin, user.role]);

  useEffect(() => {
    if (tab === "admin") void loadAdmin();
    if (tab === "track") void loadParticipants();
  }, [tab, loadAdmin, loadParticipants]);

  async function submitLaps(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await cloud("addLap", { laps: lapInput, note });
    if (!res.ok) {
      setMessage(res.data.error ?? "저장 실패");
      return;
    }
    const data = res.data;
    setMessage(`${lapInput}바퀴 기록! 마일리지 +${lapInput}`);
    setNote("");
    setLapInput(1);
    if (data.user) onUserChange(data.user);
    await loadRecords();
    await loadParticipants();
  }

  async function buyItem(item: ShopItem) {
    setMessage("");
    const action = item.category === "clothes" ? "buy" : "feed";
    const res = await cloud(action, { itemId: item.id });
    if (!res.ok || !res.data.user) {
      setMessage(res.data.error ?? "구매 실패");
      return;
    }
    if (res.data.user) onUserChange(res.data.user);
    if (item.category === "food") {
      setMessage(`${item.name}을(를) 먹였어요. 포만감이 올랐습니다.`);
    } else if (item.category === "snack") {
      setMessage(`${item.name}을(를) 줬어요. 행복이 올랐습니다.`);
    } else {
      setMessage(`${item.name}을(를) 사서 입혔어요.`);
    }
  }

  async function equipItem(item: ShopItem) {
    const res = await cloud("equip", { itemId: item.id });
    if (!res.ok || !res.data.user) {
      setMessage(res.data.error ?? "착용 실패");
      return;
    }
    if (res.data.user) onUserChange(res.data.user);
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await cloud("password", {
      currentPassword: fd.get("currentPassword"),
      newPassword: fd.get("newPassword"),
    });
    if (!res.ok) {
      setMessage(res.data.error ?? "변경 실패");
      return;
    }
    setMessage("비밀번호가 변경되었습니다.");
    e.currentTarget.reset();
  }

  async function resetPassword(userId: string) {
    const next = window.prompt("새 비밀번호를 입력하세요", "1234");
    if (!next) return;
    const res = await cloud("adminPassword", { userId, newPassword: next });
    if (!res.ok || !res.data.user) {
      setMessage(res.data.error ?? "초기화 실패");
      return;
    }
    setMessage(`${res.data.user.displayName} 비밀번호를 초기화했습니다.`);
    await loadAdmin();
  }

  async function deleteAccount(userId: string, displayName: string) {
    const ok = window.confirm(
      `${displayName} 계정을 삭제할까요? 마일리지와 운동장 기록도 함께 지워집니다.`,
    );
    if (!ok) return;
    const res = await cloud("adminDelete", { userId });
    if (!res.ok) {
      setMessage(res.data.error ?? "삭제 실패");
      return;
    }
    const data = res.data;
    setMessage(`${data.displayName} 계정을 삭제했습니다.`);
    setRevealId(null);
    await Promise.all([loadAdmin(), loadParticipants()]);
  }

  async function logout() {
    await cloudLogout();
    onUserChange(null);
  }

  const visibleTabs = TABS.filter((t) => !t.adminOnly || user.role === "admin");

  const shopItems = useMemo(
    () => SHOP_ITEMS.filter((item) => item.category === shopCategory),
    [shopCategory],
  );

  const badges = useMemo(() => {
    const total = user.totalLaps;
    return [
      { name: "첫 발걸음", detail: "누적 1바퀴", earned: total >= 1 },
      { name: "운동장 탐험가", detail: "누적 10바퀴", earned: total >= 10 },
      { name: "꾸준한 러너", detail: "누적 30바퀴", earned: total >= 30 },
      { name: "첫 진화", detail: "누적 50 마일리지", earned: user.mileage >= 50 },
      { name: "완전 진화", detail: "누적 100 마일리지", earned: user.mileage >= 100 },
      { name: "밥 잘 주는 친구", detail: "먹이 3회", earned: user.mealsFed >= 3 },
      { name: "간식 요정", detail: "간식 3회", earned: user.snacksFed >= 3 },
    ];
  }, [user]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--canvas)] md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-[var(--line)] bg-[var(--panel)] md:h-full md:w-[260px] md:border-b-0 md:border-r">
        <div className="border-b border-[var(--line)] px-6 py-7">
          <div className="font-display text-3xl leading-none text-[var(--brand)]">
            1·2·3 런
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
            다른 휴대폰·컴퓨터의 기록도 이 화면에 모입니다.
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMessage("");
                setTab(t.id);
              }}
              className={`whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold transition md:whitespace-normal ${
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
            <AnimalAvatar
              animal={user.animal}
              stage={user.stage}
              clothesId={user.equippedClothesId}
              size={52}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{user.displayName}</div>
              <div className="text-xs text-[var(--ink-muted)]">
                {user.stageName}
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
              {user.stageName}
              {user.nextEvolutionAt
                ? ` · 다음 진화까지 ${user.nextEvolutionAt - user.mileage} 마일리지`
                : " · 최고 단계"}
              {" · "}오늘 {user.todayLaps}바퀴
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
                      {p.stageName} · 누적 {p.totalLaps}바퀴
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "character" && (
            <section className="grid h-full grid-cols-[0.95fr_1.05fr] gap-6">
              <div className="panel flex flex-col overflow-auto">
                <h3 className="section-title">{user.stageName}</h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  지금 키우는 친구 {getAnimal(user.animal).name} · 누적 {user.mileage} 마일리지
                </p>
                <div className="my-3 flex justify-center">
                  <AnimalAvatar
                    animal={user.animal}
                    stage={user.stage}
                    clothesId={user.equippedClothesId}
                    size={210}
                  />
                </div>
                <EvolutionBar mileage={user.mileage} />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {([1, 2, 3] as EvolutionStage[]).map((stage) => {
                    const unlocked = user.mileage >= (stage - 1) * EVOLUTION_STEP;
                    const current = user.stage === stage;
                    return (
                      <div
                        key={stage}
                        className={`rounded-2xl border px-2 py-2 text-center ${
                          current
                            ? "border-[var(--brand)] bg-[#E7F4EC]"
                            : "border-[var(--line)] bg-white"
                        } ${unlocked ? "" : "opacity-45"}`}
                      >
                        <AnimalAvatar animal={user.animal} stage={stage} size={72} />
                        <div className="text-[11px] font-semibold leading-tight">
                          {stageName(user.animal, stage)}
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          {stage === 1 ? "시작" : `${(stage - 1) * EVOLUTION_STEP}점`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Meter label="포만감" value={user.fullness} hint={`먹이 ${user.mealsFed}회`} />
                  <Meter label="행복" value={user.happiness} hint={`간식 ${user.snacksFed}회`} />
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
                    const owned = user.ownedClothesIds.includes(item.id);
                    const equipped = user.equippedClothesId === item.id;
                    return (
                      <div key={item.id} className="rounded-2xl border border-[var(--line)] p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                            style={{ background: item.colors.primary }}
                          >
                            {item.emoji}
                          </span>
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-[var(--ink-muted)]">
                              {item.blurb} · {item.price} 마일리지
                            </div>
                          </div>
                        </div>
                        {item.category === "clothes" && owned ? (
                          <button
                            type="button"
                            className="btn-primary w-full"
                            onClick={() => equipItem(item)}
                          >
                            {equipped ? "벗기기" : "입히기"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-accent w-full"
                            onClick={() => buyItem(item)}
                          >
                            {item.category === "clothes"
                              ? "사서 입히기"
                              : item.category === "food"
                                ? "먹이 주기"
                                : "간식 주기"}
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
                      {badge.detail}
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
                  <Row label="키우는 동물" value={`${user.animalLabel} · ${user.stageName}`} />
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
                계정의 마일리지와 비밀번호를 확인하고, 다른 계정을 삭제할 수 있습니다.
              </p>
              <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--panel-soft)] text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">아이디</th>
                      <th className="px-4 py-3 font-medium">학년</th>
                      <th className="px-4 py-3 font-medium">동물</th>
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
                        <td className="px-4 py-3">{u.stageName}</td>
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
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => resetPassword(u.id)}
                            >
                              초기화
                            </button>
                            {u.id === user.id ? (
                              <span className="self-center text-xs text-[var(--ink-muted)]">
                                현재 계정
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="rounded-xl bg-[#FDECEC] px-3 py-1.5 text-xs font-semibold text-[#B42318]"
                                onClick={() => deleteAccount(u.id, u.displayName)}
                              >
                                삭제
                              </button>
                            )}
                          </div>
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

function EvolutionBar({ mileage }: { mileage: number }) {
  const cap = EVOLUTION_STEP * 2;
  const width = Math.min(100, (mileage / cap) * 100);
  const next = mileage >= cap ? null : mileage < EVOLUTION_STEP ? EVOLUTION_STEP : cap;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[var(--ink-muted)]">
        <span>진화</span>
        <span>
          {next ? `다음 단계 ${next} 마일리지` : "3단계 완료"}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--panel-soft)]">
        <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--panel-soft)] px-3 py-3">
      <div className="flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-[var(--ink-muted)]">{hint}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${value}%` }}
        />
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
