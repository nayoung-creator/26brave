"use client";

import { FormEvent, useState } from "react";
import { AnimalAvatar } from "./AnimalAvatar";
import { ANIMALS } from "@/lib/catalog";
import type { AnimalId, Grade, PublicUser } from "@/lib/types";

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

interface Props {
  onAuthed: (user: PublicUser) => void;
}

export function AuthPanel({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [animal, setAnimal] = useState<AnimalId>("dog");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: fd.get("username"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "로그인 실패");
      return;
    }
    onAuthed(data.user);
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: fd.get("username"),
        displayName: fd.get("displayName"),
        password: fd.get("password"),
        grade: fd.get("grade"),
        animal,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "가입 실패");
      return;
    }
    onAuthed(data.user);
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-auto">
      <div className="absolute inset-0 auth-hero" />
      <div className="absolute inset-0 auth-grain" />

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        <section className="flex w-full flex-col justify-end px-8 pb-10 pt-12 lg:w-[54%] lg:px-16 lg:pb-20 lg:pt-16">
          <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#F4F0E1]">
            SCHOOL RUN · 비경쟁 성장형 슬로깅
          </p>
          <h1 className="font-display text-6xl leading-[0.95] text-white drop-shadow-sm lg:text-[5.5rem]">
            1·2·3 런
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#F7F3E8]">
            학교 운동장을 한 바퀴 돌 때마다 마일리지가 쌓입니다.
            경쟁이 아니라 성장, 오늘도 내 속도로 한 바퀴.
          </p>
          <div className="mt-10 flex gap-8 text-[#F7F3E8]">
            <div>
              <div className="font-display text-3xl">스타터</div>
              <div className="text-sm opacity-80">1km 도전</div>
            </div>
            <div>
              <div className="font-display text-3xl">챌린저</div>
              <div className="text-sm opacity-80">2km 도전</div>
            </div>
            <div>
              <div className="font-display text-3xl">마스터</div>
              <div className="text-sm opacity-80">3km 도전</div>
            </div>
          </div>
          <a
            href="/join"
            className="mt-8 inline-flex w-fit items-center gap-4 rounded-3xl bg-white/90 px-4 py-3 text-[var(--ink)] shadow-lg"
          >
            <img
              src="/api/qr"
              alt="접속 QR 코드"
              className="h-24 w-24 rounded-xl bg-white"
            />
            <span>
              <span className="block text-sm font-bold">학생·교직원 배포 QR</span>
              <span className="mt-1 block max-w-[16rem] text-xs leading-relaxed text-[var(--ink-muted)]">
                휴대폰과 컴퓨터가 이 주소로 같은 기록을 공유합니다.
              </span>
            </span>
          </a>
        </section>

        <section className="flex w-full items-center justify-center overflow-y-auto bg-[rgba(250,248,242,0.92)] px-6 py-8 backdrop-blur-md lg:w-[46%] lg:px-10">
          <div className="w-full max-w-lg">
            <div className="mb-8 flex gap-2 rounded-2xl bg-[#E8EFE8] p-1">
              <button
                type="button"
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-[#1F6B4A] text-white shadow"
                    : "text-[#3A5A48]"
                }`}
                onClick={() => setMode("login")}
              >
                로그인
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  mode === "register"
                    ? "bg-[#1F6B4A] text-white shadow"
                    : "text-[#3A5A48]"
                }`}
                onClick={() => setMode("register")}
              >
                계정 만들기
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="아이디" name="username" required />
                <Field label="비밀번호" name="password" type="password" required />
                <button className="btn-primary w-full" disabled={loading}>
                  {loading ? "확인 중..." : "입장하기"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Field label="아이디" name="username" required />
                <Field label="이름" name="displayName" required />
                <Field
                  label="비밀번호"
                  name="password"
                  type="password"
                  required
                  minLength={4}
                />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                    학년 / 구분
                  </span>
                  <select name="grade" className="field" required defaultValue="1학년">
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-[var(--ink)]">
                    키울 동물
                  </legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {ANIMALS.map((pet) => {
                      const selected = animal === pet.id;
                      return (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => setAnimal(pet.id)}
                          className={`rounded-2xl border px-1 py-2 text-center transition ${
                            selected
                              ? "border-[var(--brand)] bg-[#E7F4EC] shadow-sm"
                              : "border-[var(--line)] bg-white hover:bg-[var(--panel-soft)]"
                          }`}
                        >
                          <AnimalAvatar animal={pet.id} stage={1} size={58} />
                          <span className="block text-[11px] font-semibold">{pet.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    선택한 동물은 50마일리지마다 더 화려하고 귀엽게 진화합니다.
                  </p>
                </fieldset>
                <button className="btn-primary w-full" disabled={loading}>
                  {loading ? "가입 중..." : "참여 시작"}
                </button>
              </form>
            )}

            {error ? (
              <p className="mt-4 rounded-xl bg-[#FDE8E4] px-3 py-2 text-sm text-[#9B3B2E]">
                {error}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
        {label}
      </span>
      <input
        className="field"
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={type === "password" ? "current-password" : "username"}
      />
    </label>
  );
}
