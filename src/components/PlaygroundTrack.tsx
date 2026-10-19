"use client";

import { AnimalAvatar } from "./AnimalAvatar";
import type { PublicUser } from "@/lib/types";

interface Props {
  users: PublicUser[];
}

/** Place participants around an oval track based on total laps. */
export function PlaygroundTrack({ users }: Props) {
  const runners = users.slice(0, 40);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px]">
      <div className="absolute inset-0 track-sky" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 field-wash" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* outer field */}
        <ellipse cx="500" cy="330" rx="430" ry="250" fill="#3FA66A" />
        <ellipse cx="500" cy="330" rx="390" ry="220" fill="#4DB87A" />

        {/* track */}
        <ellipse
          cx="500"
          cy="330"
          rx="360"
          ry="200"
          fill="none"
          stroke="#C75B39"
          strokeWidth="54"
        />
        <ellipse
          cx="500"
          cy="330"
          rx="360"
          ry="200"
          fill="none"
          stroke="#E8D5A8"
          strokeWidth="3"
          strokeDasharray="18 14"
          opacity="0.7"
        />
        <ellipse
          cx="500"
          cy="330"
          rx="305"
          ry="160"
          fill="none"
          stroke="#B34E30"
          strokeWidth="2"
          opacity="0.55"
        />

        {/* inner grass */}
        <ellipse cx="500" cy="330" rx="290" ry="148" fill="#5FCF88" />
        <ellipse
          cx="500"
          cy="330"
          rx="180"
          ry="70"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
        />

        {/* start line */}
        <rect x="492" y="128" width="16" height="54" fill="#FFF8E7" opacity="0.9" />

        {/* school label */}
        <text
          x="500"
          y="325"
          textAnchor="middle"
          fill="#1F4D33"
          fontSize="28"
          fontFamily="var(--font-display)"
        >
          학교 운동장
        </text>
        <text
          x="500"
          y="358"
          textAnchor="middle"
          fill="#276344"
          fontSize="16"
          fontFamily="var(--font-body)"
        >
          1바퀴 = 1 마일리지
        </text>
      </svg>

      {runners.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white/80 px-5 py-2 text-sm text-[var(--ink-muted)] shadow-sm">
            아직 참가자가 없습니다. 가입하고 운동장을 달려 보세요!
          </p>
        </div>
      ) : (
        runners.map((user, index) => {
          const progress = (user.totalLaps % 8) / 8 + index * 0.07;
          const angle = progress * Math.PI * 2 - Math.PI / 2;
          const rx = 36;
          const ry = 31;
          const left = 50 + Math.cos(angle) * rx;
          const top = 52 + Math.sin(angle) * ry;

          return (
            <div
              key={user.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                zIndex: 10 + index,
                animation: `bob ${2.4 + (index % 5) * 0.2}s ease-in-out infinite`,
                animationDelay: `${index * 0.12}s`,
              }}
              title={`${user.displayName} · ${user.totalLaps}바퀴`}
            >
              <div className="flex flex-col items-center">
                <AnimalAvatar
                  animal={user.animal}
                  stage={user.stage}
                  clothesId={user.equippedClothesId}
                  size={64}
                />
                <span className="mt-[-4px] rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[var(--ink)] shadow-sm">
                  {user.displayName}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
