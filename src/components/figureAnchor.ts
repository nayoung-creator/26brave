"use client";

import { useEffect, useState } from "react";

export interface FigureAnchor {
  headCx: number;
  headTop: number;
  eyeY: number;
  neckY: number;
  left: number;
  right: number;
  bottom: number;
}

const FALLBACK: FigureAnchor = {
  headCx: 50,
  headTop: 14,
  eyeY: 40,
  neckY: 52,
  left: 16,
  right: 84,
  bottom: 92,
};

const CACHE_VERSION = "neck-63";
const cache = new Map<string, FigureAnchor>();

function measure(src: string): Promise<FigureAnchor> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const size = 80;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(FALLBACK);
        return;
      }
      ctx.drawImage(image, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      const opaque: boolean[] = new Array(size * size);
      for (let i = 0; i < size * size; i += 1) {
        opaque[i] = data[i * 4 + 3] > 40;
      }
      const seen = new Uint8Array(size * size);
      let best: number[] = [];
      const queue: number[] = [];
      for (let i = 0; i < opaque.length; i += 1) {
        if (!opaque[i] || seen[i]) continue;
        queue.push(i);
        seen[i] = 1;
        const comp: number[] = [];
        while (queue.length) {
          const cur = queue.pop() as number;
          comp.push(cur);
          const x = cur % size;
          const next = [cur - 1, cur + 1, cur - size, cur + size];
          if (x === 0) next[0] = -1;
          if (x === size - 1) next[1] = -1;
          for (const n of next) {
            if (n < 0 || n >= opaque.length || !opaque[n] || seen[n]) continue;
            seen[n] = 1;
            queue.push(n);
          }
        }
        if (comp.length > best.length) best = comp;
      }
      if (best.length < 20) {
        resolve(FALLBACK);
        return;
      }
      let minX = size;
      let minY = size;
      let maxX = 0;
      let maxY = 0;
      const rows: number[][] = Array.from({ length: size }, () => []);
      for (const idx of best) {
        const x = idx % size;
        const y = (idx / size) | 0;
        rows[y].push(x);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const height = Math.max(1, maxY - minY);
      const rowAt = (t: number) =>
        Math.min(size - 1, Math.max(0, Math.round(minY + height * t)));
      const headEnd = rowAt(0.38);
      let mass = 0;
      let massX = 0;
      for (let y = minY; y <= headEnd; y += 1) {
        for (const x of rows[y]) {
          mass += 1;
          massX += x;
        }
      }
      const pct = (value: number) => (value / size) * 100;
      resolve({
        headCx: mass ? pct(massX / mass) : pct((minX + maxX) / 2),
        headTop: pct(minY),
        eyeY: pct(rowAt(0.34)),
        neckY: pct(rowAt(0.63)),
        left: pct(minX),
        right: pct(maxX),
        bottom: pct(maxY),
      });
    };
    image.onerror = () => resolve(FALLBACK);
    image.src = src;
  });
}

export function useFigureAnchor(src: string) {
  const cacheKey = `${CACHE_VERSION}:${src}`;
  const [anchor, setAnchor] = useState<FigureAnchor>(() => cache.get(cacheKey) ?? FALLBACK);

  useEffect(() => {
    const saved = cache.get(cacheKey);
    if (saved) {
      setAnchor(saved);
      return;
    }
    let alive = true;
    void measure(src).then((next) => {
      cache.set(cacheKey, next);
      if (alive) setAnchor(next);
    });
    return () => {
      alive = false;
    };
  }, [cacheKey, src]);

  return anchor;
}
