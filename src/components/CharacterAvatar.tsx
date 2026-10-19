"use client";

import { getItem } from "@/lib/catalog";
import type { EquippedItems, Gender } from "@/lib/types";

interface Props {
  gender: Gender;
  equipped: EquippedItems;
  size?: number;
  label?: string;
  className?: string;
}

export function CharacterAvatar({
  gender,
  equipped,
  size = 96,
  label,
  className = "",
}: Props) {
  const face = getItem(equipped.face);
  const hair = getItem(equipped.hair);
  const outfit = getItem(equipped.outfit);
  const shoes = getItem(equipped.shoes);

  const skin = face?.colors.primary ?? "#F6C79B";
  const hairColor = hair?.colors.primary ?? "#3A2A1F";
  const top = outfit?.colors.primary ?? "#2F9E8F";
  const accent = outfit?.colors.secondary ?? "#FFFFFF";
  const shoeMain = shoes?.colors.primary ?? "#FFFFFF";
  const shoeAccent = shoes?.colors.secondary ?? "#2F9E8F";
  const eye = face?.colors.secondary ?? "#2B2B2B";

  const smileWide = equipped.face.includes("smile") || equipped.face.includes("cheer");
  const cool = equipped.face.includes("cool");
  const spiky = equipped.hair.includes("spiky");
  const curl = equipped.hair.includes("curl");
  const bob = equipped.hair.includes("bob");

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 140"
        role="img"
        aria-label={label ?? "캐릭터"}
      >
        {/* shadow */}
        <ellipse cx="60" cy="132" rx="28" ry="6" fill="rgba(20,40,30,0.18)" />

        {/* legs */}
        <rect x="42" y="95" width="12" height="22" rx="4" fill={top} />
        <rect x="66" y="95" width="12" height="22" rx="4" fill={top} />

        {/* shoes */}
        <path
          d="M36 118h22c4 0 6 3 6 6H34c0-3 1-6 2-6z"
          fill={shoeMain}
          stroke={shoeAccent}
          strokeWidth="2"
        />
        <path
          d="M62 118h22c1 0 2 3 2 6H60c0-3 2-6 2-6z"
          fill={shoeMain}
          stroke={shoeAccent}
          strokeWidth="2"
        />

        {/* body */}
        <path
          d={
            gender === "girl"
              ? "M38 58c0-2 4-6 22-6s22 4 22 6v40c0 6-8 10-22 10s-22-4-22-10V58z"
              : "M40 58c0-2 3-5 20-5s20 3 20 5v38c0 5-6 9-20 9s-20-4-20-9V58z"
          }
          fill={top}
        />
        <rect x="52" y="62" width="16" height="6" rx="2" fill={accent} opacity="0.9" />

        {/* arms */}
        <rect x="28" y="62" width="10" height="28" rx="5" fill={skin} />
        <rect x="82" y="62" width="10" height="28" rx="5" fill={skin} />

        {/* head */}
        <circle cx="60" cy="38" r="22" fill={skin} />

        {/* hair */}
        {spiky ? (
          <path
            d="M38 34 L42 12 L50 30 L58 8 L66 30 L74 10 L82 34 Q80 18 60 16 Q40 18 38 34z"
            fill={hairColor}
          />
        ) : curl ? (
          <>
            <ellipse cx="46" cy="24" rx="10" ry="12" fill={hairColor} />
            <ellipse cx="60" cy="18" rx="12" ry="10" fill={hairColor} />
            <ellipse cx="74" cy="24" rx="10" ry="12" fill={hairColor} />
            <path d="M38 36 Q40 20 60 18 Q80 20 82 36 L80 40 Q60 28 40 40z" fill={hairColor} />
          </>
        ) : bob || gender === "girl" ? (
          <path
            d="M36 38c0-16 10-26 24-26s24 10 24 26v18c-4-8-12-12-24-12s-20 4-24 12V38z"
            fill={hairColor}
          />
        ) : (
          <path
            d="M38 36c1-14 10-22 22-22s21 8 22 22c-6-8-14-10-22-10s-16 2-22 10z"
            fill={hairColor}
          />
        )}

        {/* face */}
        {cool ? (
          <>
            <rect x="46" y="36" width="10" height="3" rx="1" fill={eye} />
            <rect x="64" y="36" width="10" height="3" rx="1" fill={eye} />
            <path d="M52 48 Q60 52 68 48" stroke={eye} strokeWidth="2" fill="none" />
          </>
        ) : (
          <>
            <circle cx="51" cy="38" r="2.2" fill={eye} />
            <circle cx="69" cy="38" r="2.2" fill={eye} />
            <path
              d={smileWide ? "M48 46 Q60 56 72 46" : "M52 47 Q60 52 68 47"}
              stroke={eye}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {label ? (
        <span className="max-w-[7rem] truncate text-center text-xs font-medium text-[var(--ink)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
