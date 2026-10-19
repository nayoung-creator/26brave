"use client";

import type { AnimalId, EvolutionStage } from "@/lib/types";
import { getAnimal } from "@/lib/catalog";

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
  const palette = getAnimal(animal).colors;
  const scale = stage === 1 ? 0.78 : stage === 2 ? 0.9 : 1.02;
  const eye = stage === 1 ? 5.4 : stage === 3 ? 5.1 : 4.5;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        role="img"
        aria-label={label ?? getAnimal(animal).name}
      >
        <ellipse cx="80" cy="146" rx="36" ry="7" fill="rgba(30,50,30,0.16)" />
        <g transform={`translate(80 86) scale(${scale}) translate(-80 -86)`}>
          {stage === 3 ? <Fluff color={palette.accent} /> : null}
          <Species animal={animal} palette={palette} eye={eye} stage={stage} />
          {clothesId ? <Clothes id={clothesId} /> : null}
          {stage === 3 ? <Sparkles /> : null}
        </g>
      </svg>
      {label ? (
        <span className="max-w-[7.5rem] truncate text-center text-xs font-medium text-[var(--ink)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function Eye({
  cx,
  cy,
  r,
  dark,
}: {
  cx: number;
  cy: number;
  r: number;
  dark: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" />
      <circle cx={cx + 0.6} cy={cy + 0.4} r={r * 0.55} fill={dark} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.28} r={r * 0.22} fill="#fff" />
    </g>
  );
}

function Blush({ cx, cy }: { cx: number; cy: number }) {
  return <ellipse cx={cx} cy={cy} rx="6" ry="3.2" fill="#F4A6B8" opacity="0.75" />;
}

function Species({
  animal,
  palette,
  eye,
  stage,
}: {
  animal: AnimalId;
  palette: { body: string; belly: string; accent: string; dark: string };
  eye: number;
  stage: EvolutionStage;
}) {
  const { body, belly, accent, dark } = palette;
  if (animal === "cat") {
    return (
      <g>
        <path d="M112 112c18 6 24 2 28-8" stroke={accent} strokeWidth="7" fill="none" strokeLinecap="round" />
        <ellipse cx="80" cy="112" rx="34" ry="26" fill={body} />
        <ellipse cx="80" cy="118" rx="18" ry="14" fill={belly} />
        <circle cx="80" cy="74" r="30" fill={body} />
        <path d="M52 62 L46 34 L70 54 Z" fill={body} />
        <path d="M108 62 L114 34 L90 54 Z" fill={body} />
        <path d="M54 58 L50 40 L66 54 Z" fill={accent} />
        <path d="M106 58 L110 40 L94 54 Z" fill={accent} />
        <Eye cx={68} cy={74} r={eye} dark={dark} />
        <Eye cx={92} cy={74} r={eye} dark={dark} />
        <path d="M74 84 h12" stroke={dark} strokeWidth="2" />
        <path d="M80 84 v6" stroke={dark} strokeWidth="2" />
        <path d="M58 82 h12 M90 82 h12" stroke={dark} strokeWidth="1.4" />
        <Blush cx={58} cy={86} />
        <Blush cx={102} cy={86} />
        {stage === 3 ? <Star x={80} y={52} /> : null}
      </g>
    );
  }
  if (animal === "rabbit") {
    return (
      <g>
        <ellipse cx="58" cy="42" rx="10" ry="28" fill={body} />
        <ellipse cx="102" cy="42" rx="10" ry="28" fill={body} />
        <ellipse cx="58" cy="46" rx="5" ry="16" fill={accent} />
        <ellipse cx="102" cy="46" rx="5" ry="16" fill={accent} />
        <ellipse cx="80" cy="114" rx="34" ry="26" fill={body} />
        <circle cx="108" cy="122" r="8" fill={belly} />
        <circle cx="80" cy="78" r="28" fill={body} />
        <ellipse cx="80" cy="88" rx="12" ry="8" fill={belly} />
        <Eye cx={70} cy={76} r={eye} dark={dark} />
        <Eye cx={90} cy={76} r={eye} dark={dark} />
        <path d="M76 88 q4 4 8 0" stroke={dark} strokeWidth="1.6" fill="none" />
        <Blush cx={60} cy={86} />
        <Blush cx={100} cy={86} />
        {stage === 3 ? <Star x={80} y={58} /> : null}
      </g>
    );
  }
  if (animal === "hamster") {
    return (
      <g>
        <ellipse cx="80" cy="108" rx="40" ry="30" fill={body} />
        <ellipse cx="80" cy="114" rx="22" ry="16" fill={belly} />
        <circle cx="80" cy="74" r="32" fill={body} />
        <circle cx="54" cy="58" r="8" fill={accent} />
        <circle cx="106" cy="58" r="8" fill={accent} />
        <ellipse cx="62" cy="86" rx="10" ry="8" fill="#F6B4A2" opacity="0.85" />
        <ellipse cx="98" cy="86" rx="10" ry="8" fill="#F6B4A2" opacity="0.85" />
        <Eye cx={68} cy={74} r={eye} dark={dark} />
        <Eye cx={92} cy={74} r={eye} dark={dark} />
        <ellipse cx="80" cy="84" rx="6" ry="4" fill={accent} />
        <Blush cx={56} cy={82} />
        <Blush cx={104} cy={82} />
        {stage === 3 ? <Star x={80} y={48} /> : null}
      </g>
    );
  }
  if (animal === "hedgehog") {
    return (
      <g>
        {[-28, -14, 0, 14, 28].map((dx) => (
          <path
            key={dx}
            d={`M${80 + dx} 78 L${80 + dx - 6} 48 L${80 + dx + 8} 76 Z`}
            fill={accent}
          />
        ))}
        <ellipse cx="82" cy="112" rx="36" ry="26" fill={body} />
        <ellipse cx="90" cy="116" rx="18" ry="14" fill={belly} />
        <circle cx="70" cy="82" r="24" fill={body} />
        <ellipse cx="56" cy="86" rx="8" ry="6" fill={belly} />
        <Eye cx={62} cy={78} r={eye} dark={dark} />
        <Eye cx={80} cy={78} r={eye * 0.92} dark={dark} />
        <path d="M52 88 q6 4 12 0" stroke={dark} strokeWidth="1.5" fill="none" />
        <Blush cx={52} cy={90} />
        {stage === 3 ? <circle cx="96" cy="70" r="5" fill="#F28B82" /> : null}
      </g>
    );
  }
  if (animal === "lizard") {
    return (
      <g>
        <path d="M118 118 C150 108 154 86 140 78" stroke={body} strokeWidth="10" fill="none" strokeLinecap="round" />
        <ellipse cx="78" cy="108" rx="42" ry="22" fill={body} />
        <ellipse cx="78" cy="112" rx="24" ry="12" fill={belly} />
        <circle cx="48" cy="90" r="20" fill={body} />
        <circle cx="36" cy="78" r="6" fill={accent} />
        <Eye cx={42} cy={86} r={eye} dark={dark} />
        <Eye cx={58} cy={86} r={eye * 0.9} dark={dark} />
        <path d="M34 94 q8 5 14 0" stroke={dark} strokeWidth="1.5" fill="none" />
        {stage >= 2 ? (
          <g fill={stage === 3 ? "#F2C14E" : accent} opacity="0.85">
            <circle cx="70" cy="102" r="3" />
            <circle cx="84" cy="98" r="3" />
            <circle cx="98" cy="104" r="3" />
          </g>
        ) : null}
        {stage === 3 ? <Star x={48} y={66} /> : null}
      </g>
    );
  }
  if (animal === "capybara") {
    return (
      <g>
        <rect x="42" y="92" width="78" height="36" rx="18" fill={body} />
        <ellipse cx="80" cy="112" rx="22" ry="12" fill={belly} />
        <rect x="46" y="64" width="58" height="40" rx="18" fill={body} />
        <ellipse cx="52" cy="58" rx="7" ry="6" fill={accent} />
        <ellipse cx="96" cy="58" rx="7" ry="6" fill={accent} />
        <ellipse cx="78" cy="86" rx="16" ry="10" fill={belly} />
        <Eye cx={64} cy={76} r={eye * 0.85} dark={dark} />
        <Eye cx={90} cy={76} r={eye * 0.85} dark={dark} />
        <ellipse cx="78" cy="86" rx="5" ry="3.5" fill={accent} />
        <Blush cx={54} cy={86} />
        <Blush cx={102} cy={86} />
        {stage === 3 ? <Star x={74} y={54} /> : null}
      </g>
    );
  }
  if (animal === "panda") {
    return (
      <g>
        <ellipse cx="80" cy="114" rx="36" ry="26" fill={body} />
        <ellipse cx="80" cy="118" rx="18" ry="14" fill={belly} />
        <circle cx="48" cy="124" r="8" fill={accent} />
        <circle cx="112" cy="124" r="8" fill={accent} />
        <circle cx="80" cy="74" r="30" fill={body} />
        <circle cx="54" cy="52" r="10" fill={accent} />
        <circle cx="106" cy="52" r="10" fill={accent} />
        <ellipse cx="66" cy="76" rx="10" ry="12" fill={accent} />
        <ellipse cx="94" cy="76" rx="10" ry="12" fill={accent} />
        <Eye cx={66} cy={76} r={eye * 0.7} dark="#1A1A1A" />
        <Eye cx={94} cy={76} r={eye * 0.7} dark="#1A1A1A" />
        <ellipse cx="80" cy="88" rx="6" ry="4" fill={accent} />
        <Blush cx={54} cy={90} />
        <Blush cx={106} cy={90} />
        {stage === 3 ? <Star x={80} y={48} /> : null}
      </g>
    );
  }
  if (animal === "fox") {
    return (
      <g>
        <path d="M112 120 C140 112 148 90 132 84 C124 108 118 118 112 120Z" fill={body} />
        <path d="M124 112 C138 104 140 94 130 92 C128 104 124 110 124 112Z" fill={belly} />
        <ellipse cx="78" cy="114" rx="34" ry="26" fill={body} />
        <ellipse cx="78" cy="120" rx="16" ry="12" fill={belly} />
        <circle cx="74" cy="74" r="28" fill={body} />
        <path d="M50 64 L40 30 L68 54 Z" fill={body} />
        <path d="M98 64 L112 28 L84 54 Z" fill={body} />
        <path d="M52 60 L46 38 L64 54 Z" fill={belly} />
        <path d="M96 60 L104 36 L86 54 Z" fill={belly} />
        <ellipse cx="74" cy="84" rx="12" ry="8" fill={belly} />
        <Eye cx={64} cy={72} r={eye} dark={dark} />
        <Eye cx={86} cy={72} r={eye} dark={dark} />
        <path d="M70 84 q4 4 8 0" stroke={dark} strokeWidth="1.6" fill="none" />
        <Blush cx={54} cy={84} />
        <Blush cx={96} cy={84} />
        {stage === 3 ? <Star x={74} y={50} /> : null}
      </g>
    );
  }
  if (animal === "penguin") {
    return (
      <g>
        <ellipse cx="48" cy="108" rx="10" ry="18" fill={body} transform="rotate(-18 48 108)" />
        <ellipse cx="112" cy="108" rx="10" ry="18" fill={body} transform="rotate(18 112 108)" />
        <ellipse cx="80" cy="104" rx="32" ry="38" fill={body} />
        <ellipse cx="80" cy="112" rx="18" ry="26" fill={belly} />
        <ellipse cx="64" cy="140" rx="10" ry="5" fill={accent} />
        <ellipse cx="96" cy="140" rx="10" ry="5" fill={accent} />
        <ellipse cx="80" cy="78" rx="8" ry="5" fill={accent} />
        <Eye cx={68} cy={70} r={eye} dark={dark} />
        <Eye cx={92} cy={70} r={eye} dark={dark} />
        <Blush cx={58} cy={82} />
        <Blush cx={102} cy={82} />
        {stage === 3 ? <Star x={80} y={42} /> : null}
      </g>
    );
  }

  return (
    <g>
      <path d="M112 118c16 2 26-8 24-18" stroke={accent} strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="80" cy="114" rx="36" ry="26" fill={body} />
      <ellipse cx="80" cy="120" rx="18" ry="13" fill={belly} />
      <circle cx="80" cy="74" r="30" fill={body} />
      <ellipse cx="52" cy="78" rx="12" ry="20" fill={accent} transform="rotate(-24 52 78)" />
      <ellipse cx="108" cy="78" rx="12" ry="20" fill={accent} transform="rotate(24 108 78)" />
      <ellipse cx="80" cy="86" rx="14" ry="10" fill={belly} />
      <ellipse cx="80" cy="84" rx="5" ry="3.5" fill={dark} />
      <Eye cx={68} cy={70} r={eye} dark={dark} />
      <Eye cx={92} cy={70} r={eye} dark={dark} />
      <path d="M72 90 q8 6 16 0" stroke={dark} strokeWidth="1.7" fill="none" />
      <Blush cx={58} cy={84} />
      <Blush cx={102} cy={84} />
      {stage === 3 ? <Star x={80} y={46} /> : null}
    </g>
  );
}

function Star({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 7} l1.6 4.2 h4.4 l-3.5 2.7 1.3 4.3 L${x} ${y + 5.2} l-3.8 2.9 1.3-4.3 -3.5-2.7 h4.4z`}
      fill="#F2C14E"
    />
  );
}

function Fluff({ color }: { color: string }) {
  return (
    <g opacity="0.35" fill={color}>
      <circle cx="46" cy="108" r="10" />
      <circle cx="114" cy="108" r="10" />
      <circle cx="80" cy="128" r="8" />
    </g>
  );
}

function Sparkles() {
  return (
    <g fill="#FFF6C8">
      <circle cx="28" cy="48" r="2.2" />
      <circle cx="132" cy="42" r="2.4" />
      <circle cx="136" cy="78" r="1.6" />
      <circle cx="24" cy="90" r="1.5" />
    </g>
  );
}

function Clothes({ id }: { id: string }) {
  if (id === "cloth-scarf-yellow") {
    return (
      <g>
        <path d="M58 96 q22 16 44 0" stroke="#F4C95D" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M96 98 l8 16" stroke="#E09F3E" strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  }
  if (id === "cloth-ribbon-red") {
    return (
      <g fill="#E85D75">
        <circle cx="108" cy="52" r="5" />
        <path d="M108 52 l-12 -6 l4 8 z" />
        <path d="M108 52 l12 -4 l-2 9 z" />
      </g>
    );
  }
  if (id === "cloth-hood-blue") {
    return (
      <path
        d="M48 78 Q48 36 80 34 Q112 36 112 78 Q100 64 80 66 Q60 64 48 78Z"
        fill="#4C78D0"
        opacity="0.92"
      />
    );
  }
  if (id === "cloth-cape-star") {
    return (
      <g>
        <path d="M58 96 Q40 130 70 128 Q80 108 90 128 Q122 130 104 96Z" fill="#5C4DDB" opacity="0.9" />
        <circle cx="70" cy="112" r="2" fill="#F4E27A" />
        <circle cx="90" cy="116" r="1.6" fill="#F4E27A" />
      </g>
    );
  }
  if (id === "cloth-vest-flower") {
    return (
      <g>
        <path d="M62 100 h36 v22 a8 8 0 0 1 -8 8 h-20 a8 8 0 0 1 -8 -8z" fill="#F4A7C5" />
        <circle cx="74" cy="112" r="3" fill="#F28B82" />
        <circle cx="86" cy="116" r="2.4" fill="#7BC67E" />
      </g>
    );
  }
  if (id === "cloth-scarf-rainbow") {
    return (
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M56 98 q24 14 48 0" stroke="#F25F5C" />
        <path d="M56 102 q24 14 48 0" stroke="#F2C14E" />
        <path d="M56 106 q24 14 48 0" stroke="#70C1B3" />
      </g>
    );
  }
  if (id === "cloth-crown") {
    return (
      <path d="M62 50 l6 -14 12 10 8 -16 8 16 12 -10 6 14z" fill="#F2C14E" stroke="#E07A3D" strokeWidth="1.4" />
    );
  }
  if (id === "cloth-sunglasses") {
    return (
      <g>
        <rect x="58" y="66" width="16" height="10" rx="3" fill="#222" />
        <rect x="86" y="66" width="16" height="10" rx="3" fill="#222" />
        <path d="M74 71 h12" stroke="#222" strokeWidth="2" />
      </g>
    );
  }
  if (id === "cloth-hat-flower") {
    return (
      <g>
        <ellipse cx="80" cy="48" rx="22" ry="6" fill="#F7E7B4" />
        <path d="M64 48 q16 -22 32 0" fill="#F7E7B4" />
        <circle cx="98" cy="42" r="5" fill="#F28B82" />
        <circle cx="98" cy="42" r="2" fill="#F2C14E" />
      </g>
    );
  }
  if (id === "cloth-vest-check") {
    return (
      <g>
        <path d="M62 100 h36 v22 a8 8 0 0 1 -8 8 h-20 a8 8 0 0 1 -8 -8z" fill="#2F9E8F" />
        <path d="M74 100 v30 M86 100 v30 M62 112 h36" stroke="#F4F7F2" strokeWidth="1.4" />
      </g>
    );
  }
  return null;
}
