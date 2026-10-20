"use client";

import type { AnimalId, EvolutionStage } from "@/lib/types";
import { SHOP_ITEMS, getAnimal } from "@/lib/catalog";

interface Props {
  animal: AnimalId;
  stage?: EvolutionStage;
  clothesId?: string | null;
  size?: number;
  label?: string;
  className?: string;
}

export function AnimalAvatar({
  animal,
  stage = 1,
  clothesId = null,
  size = 96,
  label,
  className = "",
}: Props) {
  const pet = getAnimal(animal);
  const stageLabel = pet.stages[stage - 1];
  const cloth = clothesId
    ? SHOP_ITEMS.find((item) => item.id === clothesId)
    : null;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src={`/animals/${animal}-${stage}.png`}
          alt={label ?? stageLabel}
          width={size}
          height={size}
          draggable={false}
          className="h-full w-full object-contain"
        />
        {cloth ? (
          <span
            title={cloth.name}
            className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border border-white bg-white/95 shadow-sm"
            style={{
              width: Math.max(18, Math.round(size * 0.28)),
              height: Math.max(18, Math.round(size * 0.28)),
              fontSize: Math.max(11, Math.round(size * 0.16)),
            }}
          >
            {cloth.emoji}
          </span>
        ) : null}
      </span>
      {label ? (
        <span className="max-w-[7.5rem] truncate text-center text-xs font-medium text-[var(--ink)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
