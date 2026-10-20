import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--canvas)] px-6 py-10">
      <section className="w-full max-w-xl rounded-[28px] bg-white px-8 py-10 text-center shadow-lg">
        <p className="text-sm font-semibold tracking-[0.18em] text-[var(--brand)]">
          1·2·3 런 배포
        </p>
        <h1 className="font-display mt-3 text-4xl text-[var(--ink)]">
          학생·교직원 접속
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          이 QR이나 주소로 들어온 휴대폰과 컴퓨터는 모두 같은 계정,
          같은 마일리지, 같은 동물 기록을 사용합니다.
        </p>
        <img
          src="/api/qr"
          alt="학교 런 프로젝트 접속 QR 코드"
          className="mx-auto mt-6 h-64 w-64 rounded-2xl border border-[var(--line)] bg-white p-2"
        />
        <p className="mt-4 break-all text-lg font-semibold text-[var(--brand)]">
          {origin}
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          로그인 화면으로
        </Link>
      </section>
    </main>
  );
}
