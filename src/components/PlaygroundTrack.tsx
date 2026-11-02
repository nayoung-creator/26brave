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
        <rect width="1000" height="640" fill="#D7EEF8" />
        <ellipse cx="180" cy="70" rx="90" ry="28" fill="#fff" opacity="0.8" />
        <ellipse cx="760" cy="54" rx="120" ry="26" fill="#fff" opacity="0.75" />

        <g>
          <rect x="36" y="78" width="168" height="78" rx="4" fill="#F7F1E6" />
          <path d="M24 84 L120 28 L216 84 Z" fill="#C4373A" />
          <rect x="24" y="78" width="192" height="8" fill="#E8D7B8" />
          <rect x="58" y="100" width="28" height="24" rx="2" fill="#F2C14E" />
          <rect x="104" y="100" width="28" height="24" rx="2" fill="#8FD0E8" />
          <rect x="150" y="100" width="28" height="24" rx="2" fill="#F2C14E" />
          <rect x="100" y="128" width="24" height="28" fill="#8D5A32" />
          <circle cx="120" cy="62" r="10" fill="#1B6B45" />
          <circle cx="120" cy="62" r="4" fill="#C4373A" />
          <g className="twinkle">
            <circle cx="48" cy="80" r="4" fill="#E24B4B" />
            <circle cx="78" cy="80" r="4" fill="#E2B043" />
            <circle cx="108" cy="80" r="4" fill="#2F9E6B" />
            <circle cx="138" cy="80" r="4" fill="#E24B4B" />
            <circle cx="168" cy="80" r="4" fill="#E2B043" />
          </g>
        </g>

        <Tree x={250} y={150} />
        <Tree x={860} y={120} />
        <Tree x={70} y={430} />
        <Tree x={930} y={470} />

        <ellipse cx="500" cy="340" rx="450" ry="255" fill="#7ED08A" />
        <ellipse cx="140" cy="470" rx="70" ry="22" fill="#5FBF72" />
        <ellipse cx="860" cy="250" rx="80" ry="24" fill="#5FBF72" />

        <ellipse cx="500" cy="330" rx="360" ry="200" fill="none" stroke="#C75B39" strokeWidth="54" />
        <ellipse
          cx="500"
          cy="330"
          rx="360"
          ry="200"
          fill="none"
          stroke="#F7F3EA"
          strokeWidth="4"
          strokeDasharray="18 14"
          opacity="0.85"
        />
        <ellipse cx="500" cy="330" rx="305" ry="160" fill="none" stroke="#B34E30" strokeWidth="2" opacity="0.55" />
        <ellipse cx="500" cy="338" rx="278" ry="140" fill="#69C87E" />
        <rect x="492" y="128" width="16" height="54" fill="#FFF8E7" opacity="0.9" />

        <g transform="translate(390 360)">
          <line x1="18" y1="18" x2="18" y2="78" stroke="#8D5A32" strokeWidth="4" />
          <line x1="70" y1="18" x2="70" y2="78" stroke="#8D5A32" strokeWidth="4" />
          <path d="M18 22 H70" stroke="#5C4030" strokeWidth="4" />
          <line x1="34" y1="22" x2="34" y2="58" stroke="#888" strokeWidth="1.4" />
          <line x1="54" y1="22" x2="54" y2="58" stroke="#888" strokeWidth="1.4" />
          <circle cx="34" cy="58" r="7" fill="#E24B4B" />
          <circle cx="54" cy="58" r="7" fill="#3D7EA6" />
        </g>
        <g transform="translate(560 390)">
          <path d="M10 70 H86" stroke="#E2B043" strokeWidth="8" strokeLinecap="round" />
          <path d="M18 70 C18 20 78 18 78 70" fill="#F08A3E" />
          <path d="M28 70 C30 36 68 34 70 70" fill="#F7F1E6" />
          <rect x="74" y="58" width="28" height="14" rx="4" fill="#3D7EA6" />
        </g>
        <g transform="translate(470 430)">
          <rect x="0" y="28" width="54" height="28" rx="6" fill="#F2C14E" />
          <rect x="8" y="18" width="38" height="14" rx="4" fill="#E07A3D" />
          <circle cx="12" cy="58" r="5" fill="#C4373A" />
          <circle cx="42" cy="58" r="5" fill="#1B6B45" />
        </g>

        <ellipse cx="250" cy="168" rx="28" ry="8" fill="#fff" opacity="0.85" />
        <ellipse cx="860" cy="138" rx="26" ry="8" fill="#fff" opacity="0.85" />
        <ellipse cx="70" cy="448" rx="24" ry="7" fill="#fff" opacity="0.8" />

        <text x="500" y="300" textAnchor="middle" fill="#1F4D33" fontSize="26" fontFamily="var(--font-display)">
          학교 운동장
        </text>
        <text x="500" y="328" textAnchor="middle" fill="#276344" fontSize="15" fontFamily="var(--font-body)">
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

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-6" y="28" width="12" height="28" rx="2" fill="#8D5A32" />
      <path d="M0 -8 L26 36 H-26 Z" fill="#1B6B45" />
      <path d="M0 6 L22 42 H-22 Z" fill="#228455" />
      <path d="M0 -8 L8 6 H-8 Z" fill="#fff" opacity="0.85" />
      <circle cx="-8" cy="10" r="3" fill="#E24B4B" />
      <circle cx="6" cy="18" r="3" fill="#E2B043" />
      <circle cx="-2" cy="26" r="2.4" fill="#F7F1E6" />
    </g>
  );
}
