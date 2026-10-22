"use client";

import type { AnimalId, EvolutionStage } from "@/lib/types";
import { SHOP_ITEMS, getAnimal } from "@/lib/catalog";
import { useFigureAnchor } from "./figureAnchor";
import { WornOutfit } from "./WornOutfit";

interface TreatFx {
  emoji: string;
  token: number;
}

interface Props {
  animal: AnimalId;
  stage?: EvolutionStage;
  clothesId?: string | null;
  size?: number;
  label?: string;
  className?: string;
  treat?: TreatFx | null;
}

const SPARKS = [
  { dx: -20, dy: -2, glyph: "✦", color: "#e2a000", delay: "0.85s" },
  { dx: 18, dy: -4, glyph: "✦", color: "#e85d75", delay: "0.95s" },
  { dx: -24, dy: 12, glyph: "★", color: "#d99a00", delay: "1.05s" },
  { dx: 22, dy: 14, glyph: "★", color: "#e85d75", delay: "1.12s" },
  { dx: 0, dy: -12, glyph: "✧", color: "#e2a000", delay: "1.2s" },
  { dx: -12, dy: 18, glyph: "✦", color: "#c43b6e", delay: "1.28s" },
  { dx: 14, dy: 4, glyph: "✧", color: "#e2a000", delay: "1.34s" },
  { dx: -6, dy: -8, glyph: "★", color: "#f08a3e", delay: "1.02s" },
];

export function AnimalAvatar({
  animal,
  stage = 1,
  clothesId = null,
  size = 96,
  label,
  className = "",
  treat = null,
}: Props) {
  const pet = getAnimal(animal);
  const stageLabel = pet.stages[stage - 1];
  const src = `/animals/${animal}-${stage}.png`;
  const anchor = useFigureAnchor(src);
  const cloth = clothesId ? SHOP_ITEMS.find((item) => item.id === clothesId) : null;
  const mouthY = Math.min(anchor.eyeY + 7, 70);

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span
        className={`relative inline-flex items-center justify-center ${treat ? "feed-glow" : ""}`}
        style={{
          width: size,
          height: size,
          ["--animal-src" as string]: `url("${src}")`,
          ["--mouth-x" as string]: `${anchor.headCx}%`,
          ["--mouth-y" as string]: `${mouthY}%`,
        }}
      >
        {cloth ? <WornOutfit item={cloth} anchor={anchor} layer="back" /> : null}
        <img
          src={src}
          alt={label ?? stageLabel}
          width={size}
          height={size}
          draggable={false}
          loading={size > 120 ? "eager" : "lazy"}
          decoding="async"
          className={`relative z-[1] h-full w-full object-contain ${treat ? "chew" : ""}`}
        />
        {cloth ? <WornOutfit key={cloth.id} item={cloth} anchor={anchor} layer="front" /> : null}
        {treat ? (
          <span
            key={treat.token}
            className="feed-bite pointer-events-none absolute z-[3] leading-none"
            style={{ fontSize: Math.round(size * 0.32) }}
            aria-hidden
          >
            {treat.emoji}
          </span>
        ) : null}
        {treat
          ? SPARKS.map((spark) => (
              <span
                key={`${treat.token}-${spark.dx}-${spark.dy}`}
                className="spark pointer-events-none absolute z-[4] leading-none"
                style={{
                  left: `${clamp(anchor.headCx + spark.dx)}%`,
                  top: `${clamp(anchor.headTop + spark.dy)}%`,
                  color: spark.color,
                  animationDelay: spark.delay,
                  fontSize: Math.max(16, Math.round(size * 0.16)),
                }}
                aria-hidden
              >
                {spark.glyph}
              </span>
            ))
          : null}
      </span>
      {label ? (
        <span className="max-w-[7.5rem] truncate text-center text-xs font-medium text-[var(--ink)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function clamp(value: number) {
  return Math.min(94, Math.max(6, value));
}
