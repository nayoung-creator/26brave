"use client";

import { useId } from "react";
import type { BadgeMotif } from "@/lib/badges";
import type { AnimalId, EvolutionStage } from "@/lib/types";
import { getAnimal } from "@/lib/catalog";

export function GrowthBadgeImage({
  src,
  name,
  earned,
  size,
  animal,
  animalStage,
  motif,
}: {
  src: string;
  name: string;
  earned: boolean;
  size: "header" | "card";
  animal?: AnimalId;
  animalStage?: EvolutionStage;
  motif?: BadgeMotif;
}) {
  const frame =
    size === "header"
      ? "h-9 w-9 md:h-12 md:w-12"
      : "mx-auto h-24 w-24 sm:h-28 sm:w-28";
  const animalName = animal ? getAnimal(animal).name : "";
  const label = animalStage && animalName ? `${name} · ${animalName}` : name;
  const className = `${frame} rounded-full object-cover shadow-sm ring-1 ring-[#ead7b8] ${
    earned ? "" : "grayscale"
  }`;

  if (motif && !(animal && animalStage)) {
    return (
      <span
        className={`relative inline-block overflow-hidden ${className}`}
        title={`${name}${earned ? "" : " · 도전 중"}`}
      >
        <MotifScene motif={motif} />
        <MedalRing />
      </span>
    );
  }

  if (animal && animalStage) {
    const scene =
      animalStage === 1 ? "runner" : animalStage === 2 ? "first-evolve" : "full-evolve";
    return (
      <span
        className={`relative inline-block overflow-hidden ${className}`}
        title={`${label}${earned ? "" : " · 도전 중"}`}
      >
        <BadgeScene kind={scene} />
        <img
          src={`/animals/${animal}-${animalStage}.png`}
          alt={size === "header" ? label : ""}
          width={size === "header" ? 48 : 112}
          height={size === "header" ? 48 : 112}
          draggable={false}
          className="absolute inset-[9%] h-[82%] w-[82%] object-contain"
        />
        <MedalRing />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={size === "header" ? name : ""}
      title={`${name}${earned ? "" : " · 도전 중"}`}
      width={size === "header" ? 48 : 112}
      height={size === "header" ? 48 : 112}
      draggable={false}
      className={className}
    />
  );
}

function MedalRing() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#C6A15B" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="49" fill="none" stroke="#FBF7EF" strokeWidth="3.2" />
    </svg>
  );
}

function Star({
  cx,
  cy,
  r,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}) {
  const arm = r * 0.28;
  const points = [
    [cx, cy - r],
    [cx + arm, cy - arm],
    [cx + r, cy],
    [cx + arm, cy + arm],
    [cx, cy + r],
    [cx - arm, cy + arm],
    [cx - r, cy],
    [cx - arm, cy - arm],
  ];
  return <polygon points={points.map((point) => point.join(",")).join(" ")} fill={fill} />;
}

function MotifScene({ motif }: { motif: BadgeMotif }) {
  const fill =
    motif === "mileage"
      ? "#F2C14E"
      : motif === "meal"
        ? "#E7B08A"
        : motif === "snack"
          ? "#F28B82"
          : motif === "care"
            ? "#F4A7C5"
            : motif === "full"
              ? "#8FCB86"
              : motif === "joy"
                ? "#7EB6F2"
                : "#F7E7C2";
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="50" fill="#FBF7EF" />
      <circle cx="50" cy="50" r="34" fill={fill} />
      {motif === "mileage" ? <circle cx="50" cy="50" r="16" fill="none" stroke="#FFF8E8" strokeWidth="4" /> : null}
      {motif === "meal" ? <ellipse cx="50" cy="56" rx="16" ry="8" fill="#FFF6EA" /> : null}
      {motif === "snack" ? <circle cx="50" cy="50" r="8" fill="#FFF6EA" /> : null}
      {motif === "care" ? <path d="M50 62c-12-8-18-16-18-24a8 8 0 0 1 14-5l4 5 4-5a8 8 0 0 1 14 5c0 8-6 16-18 24z" fill="#FFF6EA" /> : null}
      {motif === "full" ? <ellipse cx="50" cy="54" rx="14" ry="10" fill="#F4FFE8" /> : null}
      {motif === "joy" ? (
        <path d="M38 48h6M56 48h6M40 58c4 6 16 6 20 0" fill="none" stroke="#FFF8E8" strokeWidth="3" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

function BadgeScene({ kind }: { kind: "runner" | "first-evolve" | "full-evolve" }) {
  const rawId = useId().replace(/:/g, "");
  const glow = `glow-${rawId}`;
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      {kind === "runner" ? (
        <>
          <circle cx="50" cy="50" r="50" fill="#F7E7C2" />
          <path d="M8 58c12-12 26-16 42-16s30 4 42 16c-8 14-24 22-42 22S16 72 8 58z" fill="#8FCB86" />
          <ellipse cx="50" cy="70" rx="30" ry="12" fill="#C75B39" />
          <ellipse cx="50" cy="70" rx="17" ry="6.5" fill="#F3E2B8" />
          <ellipse cx="50" cy="70" rx="30" ry="12" fill="none" stroke="#F8F3EA" strokeWidth="1.3" />
        </>
      ) : null}
      {kind === "first-evolve" ? (
        <>
          <defs>
            <radialGradient id={glow} cx="50%" cy="46%" r="58%">
              <stop offset="0%" stopColor="#FFE08A" />
              <stop offset="58%" stopColor="#FFF4D2" />
              <stop offset="100%" stopColor="#FBF7EF" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill={`url(#${glow})`} />
          <Star cx={18} cy={24} r={4.2} fill="#E7B84A" />
          <Star cx={82} cy={28} r={3.4} fill="#F2D48A" />
          <Star cx={78} cy={74} r={3.6} fill="#E7B84A" />
          <Star cx={22} cy={76} r={2.8} fill="#F2D48A" />
        </>
      ) : null}
      {kind === "full-evolve" ? (
        <>
          <circle cx="50" cy="50" r="50" fill="#F8E7B0" />
          <Star cx={16} cy={22} r={4.4} fill="#F08A9A" />
          <Star cx={84} cy={20} r={3.6} fill="#7EB6F2" />
          <Star cx={86} cy={78} r={4} fill="#8ED38A" />
          <Star cx={14} cy={74} r={3.2} fill="#C9A0F0" />
          <Star cx={50} cy={12} r={2.6} fill="#E7B84A" />
          <Star cx={50} cy={88} r={2.4} fill="#E7B84A" />
        </>
      ) : null}
    </svg>
  );
}
