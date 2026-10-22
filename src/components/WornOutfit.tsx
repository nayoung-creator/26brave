"use client";

import { useId } from "react";
import type { ShopItem } from "@/lib/types";
import type { FigureAnchor } from "./figureAnchor";

interface Props {
  item: ShopItem;
  anchor: FigureAnchor;
  layer: "back" | "front";
}

export function WornOutfit({ item, anchor, layer }: Props) {
  const rawId = useId().replace(/:/g, "");
  const { headCx: x, headTop, eyeY, neckY, left, right, bottom } = anchor;
  const primary = item.colors.primary;
  const secondary = item.colors.secondary ?? "#fffaf2";
  const id = item.id;

  if (layer === "back") {
    if (id === "cloth-cape-star") {
      const capeLeft = Math.max(1, left - 5);
      const capeRight = Math.min(99, right + 5);
      const hem = Math.min(97, bottom + 1);
      return (
        <svg viewBox="0 0 100 100" className="outfit-on pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path
            d={`M ${x - 7} ${neckY - 1}
                C ${x - 18} ${neckY + 8}, ${capeLeft + 2} ${neckY + 18}, ${capeLeft} ${hem}
                L ${capeRight} ${hem}
                C ${capeRight - 2} ${neckY + 18}, ${x + 18} ${neckY + 8}, ${x + 7} ${neckY - 1} Z`}
            fill={primary}
          />
          <path
            d={`M ${x - 7} ${neckY - 1}
                C ${x - 18} ${neckY + 8}, ${capeLeft + 2} ${neckY + 18}, ${capeLeft} ${hem}
                L ${capeRight} ${hem}
                C ${capeRight - 2} ${neckY + 18}, ${x + 18} ${neckY + 8}, ${x + 7} ${neckY - 1}`}
            fill="none"
            stroke={secondary}
            strokeWidth="1.4"
          />
        </svg>
      );
    }
    if (id === "cloth-hood-blue") {
      const cy = (headTop + neckY) / 2 + 1;
      const ry = Math.max(12, (neckY - headTop) * 0.46 + 3);
      return (
        <svg viewBox="0 0 100 100" className="outfit-on pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx={x} cy={cy} rx="19" ry={ry} fill={primary} />
          <ellipse cx={x} cy={cy + 1} rx="14" ry={ry * 0.72} fill={secondary} opacity="0.35" />
        </svg>
      );
    }
    return null;
  }

  const showMasked =
    id === "cloth-scarf-yellow" ||
    id === "cloth-scarf-rainbow" ||
    id === "cloth-vest-flower" ||
    id === "cloth-vest-check" ||
    id === "cloth-sunglasses" ||
    id === "cloth-ribbon-red" ||
    id === "cloth-hood-blue";
  const showOpen =
    id === "cloth-crown" ||
    id === "cloth-hat-flower" ||
    id === "cloth-cape-star" ||
    id === "cloth-hood-blue";

  return (
    <>
      {showMasked ? (
        <svg
          viewBox="0 0 100 100"
          className="outfit-on worn-mask pointer-events-none absolute inset-0 z-[2] h-full w-full"
          aria-hidden
        >
          {id === "cloth-scarf-yellow" ? <Scarf x={x} y={neckY} color={primary} /> : null}
          {id === "cloth-scarf-rainbow" ? (
            <Scarf x={x} y={neckY} color={`url(#rainbow-${rawId})`} rainbowId={`rainbow-${rawId}`} />
          ) : null}
          {id === "cloth-vest-flower" ? (
            <Vest x={x} y={neckY} fill={primary} flowers secondary={secondary} />
          ) : null}
          {id === "cloth-vest-check" ? (
            <Vest
              x={x}
              y={neckY}
              fill={`url(#check-${rawId})`}
              patternId={`check-${rawId}`}
              primary={primary}
              secondary={secondary}
            />
          ) : null}
          {id === "cloth-sunglasses" ? (
            <Sunglasses x={x} y={eyeY + 1} color={primary} shine={secondary} />
          ) : null}
          {id === "cloth-ribbon-red" ? (
            <Ribbon x={x + 9} y={headTop + 12} color={primary} knot={secondary} />
          ) : null}
          {id === "cloth-hood-blue" ? <Hoodie x={x} y={neckY} color={primary} trim={secondary} /> : null}
        </svg>
      ) : null}
      {showOpen ? (
        <svg viewBox="0 0 100 100" className="outfit-on pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden>
          {id === "cloth-crown" ? (
            <Crown x={x} top={headTop} color={primary} trim={secondary} />
          ) : null}
          {id === "cloth-hat-flower" ? (
            <FlowerHat x={x} top={headTop} color={primary} brim={secondary} />
          ) : null}
          {id === "cloth-cape-star" ? <StarClasp x={x} y={neckY - 1} color={secondary} /> : null}
          {id === "cloth-hood-blue" ? (
            <HoodRim x={x} top={headTop} eyeY={eyeY} color={primary} />
          ) : null}
        </svg>
      ) : null}
    </>
  );
}

function Scarf({
  x,
  y,
  color,
  rainbowId,
}: {
  x: number;
  y: number;
  color: string;
  rainbowId?: string;
}) {
  const wrap = `
    M ${x - 16} ${y - 5}
    Q ${x} ${y - 1} ${x + 16} ${y - 4.2}
    Q ${x + 15} ${y + 2.2} ${x + 13} ${y + 3}
    Q ${x} ${y + 7} ${x - 13} ${y + 2.4}
    Q ${x - 15} ${y + 1} ${x - 16} ${y - 5}
    Z`;
  const leftTail = `M ${x - 7} ${y + 1} L ${x - 11} ${y + 16} L ${x - 5} ${y + 16} L ${x - 3} ${y + 2} Z`;
  const rightTail = `M ${x + 3} ${y + 1.5} L ${x + 4} ${y + 16} L ${x + 10} ${y + 15} L ${x + 7} ${y + 2} Z`;
  return (
    <g>
      {rainbowId ? (
        <defs>
          <linearGradient id={rainbowId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e85d75" />
            <stop offset="22%" stopColor="#f2a03a" />
            <stop offset="42%" stopColor="#f2d15a" />
            <stop offset="62%" stopColor="#7bc67e" />
            <stop offset="82%" stopColor="#4c78d0" />
            <stop offset="100%" stopColor="#9b6bdb" />
          </linearGradient>
        </defs>
      ) : null}
      <path d={wrap} fill={color} stroke="#fff" strokeWidth="0.7" />
      <path d={leftTail} fill={color} stroke="#fff" strokeWidth="0.5" />
      <path d={rightTail} fill={color} stroke="#fff" strokeWidth="0.5" />
    </g>
  );
}

function Vest({
  x,
  y,
  fill,
  flowers,
  patternId,
  primary,
  secondary,
}: {
  x: number;
  y: number;
  fill: string;
  flowers?: boolean;
  patternId?: string;
  primary?: string;
  secondary?: string;
}) {
  const top = y + 1.5;
  const bot = y + 18;
  const w = 13.5;
  const body = `
    M ${x - w} ${top + 2}
    L ${x - w + 1.2} ${bot}
    Q ${x} ${bot + 2.4} ${x + w - 1.2} ${bot}
    L ${x + w} ${top + 2}
    Q ${x} ${top + 8} ${x - w} ${top + 2}
    M ${x - 4.2} ${top + 2.4}
    Q ${x} ${top + 9.5} ${x + 4.2} ${top + 2.4}
    Q ${x} ${top + 4.2} ${x - 4.2} ${top + 2.4}
  `;
  return (
    <g>
      {patternId && primary && secondary ? (
        <defs>
          <pattern id={patternId} width="3.4" height="3.4" patternUnits="userSpaceOnUse">
            <rect width="3.4" height="3.4" fill={primary} />
            <rect width="1.7" height="1.7" fill={secondary} />
            <rect x="1.7" y="1.7" width="1.7" height="1.7" fill={secondary} />
          </pattern>
        </defs>
      ) : null}
      <path d={body} fill={fill} fillRule="evenodd" stroke="#fff" strokeWidth="0.6" />
      {flowers ? (
        <>
          <Flower cx={x - 6} cy={y + 10} />
          <Flower cx={x + 5.5} cy={y + 12} />
          <Flower cx={x - 1} cy={y + 15} />
        </>
      ) : null}
    </g>
  );
}

function Flower({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx - 1.1} cy={cy} r="1.15" fill="#fff6fb" />
      <circle cx={cx + 1.1} cy={cy} r="1.15" fill="#fff6fb" />
      <circle cx={cx} cy={cy - 1.1} r="1.15" fill="#fff6fb" />
      <circle cx={cx} cy={cy + 1.1} r="1.15" fill="#fff6fb" />
      <circle cx={cx} cy={cy} r="0.7" fill="#f2c14e" />
    </g>
  );
}

function Sunglasses({
  x,
  y,
  color,
  shine,
}: {
  x: number;
  y: number;
  color: string;
  shine: string;
}) {
  const r = 5.3;
  const dx = 7.4;
  return (
    <g>
      <path
        d={`M ${x - dx - r - 1} ${y} H ${x + dx + r + 1}`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={x - dx} cy={y} r={r} fill={color} />
      <circle cx={x + dx} cy={y} r={r} fill={color} />
      <circle cx={x - dx - 1.5} cy={y - 1.7} r="1.5" fill={shine} opacity="0.55" />
      <circle cx={x + dx - 1.5} cy={y - 1.7} r="1.5" fill={shine} opacity="0.55" />
    </g>
  );
}

function Ribbon({
  x,
  y,
  color,
  knot,
}: {
  x: number;
  y: number;
  color: string;
  knot: string;
}) {
  return (
    <g>
      <ellipse cx={x - 3.5} cy={y} rx="5" ry="3" fill={color} transform={`rotate(-26 ${x} ${y})`} />
      <ellipse cx={x + 3.4} cy={y + 0.3} rx="5" ry="3" fill={color} transform={`rotate(24 ${x} ${y})`} />
      <circle cx={x} cy={y + 0.5} r="1.8" fill={knot} />
      <path d={`M ${x - 0.4} ${y + 1.6} l -1.6 4.2 l 1.8 -0.4 Z`} fill={color} />
      <path d={`M ${x + 0.6} ${y + 1.6} l 2 3.8 l -1.8 0.2 Z`} fill={color} />
    </g>
  );
}

function Hoodie({
  x,
  y,
  color,
  trim,
}: {
  x: number;
  y: number;
  color: string;
  trim: string;
}) {
  const top = y + 0.5;
  const bot = y + 19;
  const w = 14;
  return (
    <g>
      <path
        d={`M ${x - w} ${top + 3}
            L ${x - w + 1} ${bot}
            Q ${x} ${bot + 2} ${x + w - 1} ${bot}
            L ${x + w} ${top + 3}
            Q ${x} ${top + 7} ${x - w} ${top + 3}
            M ${x - 5} ${top + 3}
            Q ${x} ${top + 10} ${x + 5} ${top + 3}
            Q ${x} ${top + 5} ${x - 5} ${top + 3}`}
        fill={color}
        fillRule="evenodd"
      />
      <path
        d={`M ${x - 5} ${top + 3} Q ${x} ${top + 10} ${x + 5} ${top + 3}`}
        fill="none"
        stroke={trim}
        strokeWidth="0.9"
      />
    </g>
  );
}

function HoodRim({
  x,
  top,
  eyeY,
  color,
}: {
  x: number;
  top: number;
  eyeY: number;
  color: string;
}) {
  return (
    <path
      d={`M ${x - 16} ${eyeY - 1}
          Q ${x - 19} ${top + 2} ${x} ${Math.max(1, top - 0.5)}
          Q ${x + 19} ${top + 2} ${x + 16} ${eyeY - 1}`}
      fill="none"
      stroke={color}
      strokeWidth="4.4"
      strokeLinecap="round"
    />
  );
}

function Crown({
  x,
  top,
  color,
  trim,
}: {
  x: number;
  top: number;
  color: string;
  trim: string;
}) {
  const base = top + 7;
  const tip = Math.max(0.8, top - 1.2);
  const w = 11;
  return (
    <g>
      <path
        d={`M ${x - w} ${base}
            L ${x - w} ${base - 3.4}
            L ${x - w * 0.58} ${tip + 2.4}
            L ${x - w * 0.22} ${base - 4.6}
            L ${x} ${tip}
            L ${x + w * 0.24} ${base - 4.4}
            L ${x + w * 0.6} ${tip + 1.6}
            L ${x + w} ${base - 3.2}
            L ${x + w} ${base} Z`}
        fill={color}
        stroke={trim}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <circle cx={x} cy={base - 1.6} r="1.25" fill="#e85d75" />
      <circle cx={x - 5.2} cy={base - 1.2} r="0.9" fill="#7ec8e3" />
      <circle cx={x + 5.2} cy={base - 1.2} r="0.9" fill="#7ec8e3" />
    </g>
  );
}

function FlowerHat({
  x,
  top,
  color,
  brim,
}: {
  x: number;
  top: number;
  color: string;
  brim: string;
}) {
  const brimY = top + 8;
  return (
    <g>
      <ellipse cx={x} cy={brimY} rx="15" ry="2.7" fill={brim} />
      <path
        d={`M ${x - 8.2} ${brimY}
            Q ${x - 9.4} ${top + 1.5} ${x} ${Math.max(0.6, top - 0.4)}
            Q ${x + 9.4} ${top + 1.5} ${x + 8.2} ${brimY} Z`}
        fill={color}
        stroke="#fff"
        strokeWidth="0.5"
      />
      <circle cx={x + 8} cy={brimY - 0.4} r="2.3" fill="#f28b82" />
      <circle cx={x + 8} cy={brimY - 0.4} r="0.9" fill="#f2d15a" />
    </g>
  );
}

function StarClasp({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <path
      d={starPath(x, y, 3.3)}
      fill={color}
      stroke="#fff"
      strokeWidth="0.45"
    />
  );
}

function starPath(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${cx + Math.cos(angle) * radius} ${cy + Math.sin(angle) * radius}`);
  }
  return `M ${points.join(" L ")} Z`;
}
