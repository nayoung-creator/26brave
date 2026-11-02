import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const animalsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "animals");
const dryRun = process.argv.includes("--dry-run");

function largestInteriorHole(png) {
  const { width: w, height: h, data } = png;
  const n = w * h;
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) solid[i] = data[i * 4 + 3] > 32 ? 1 : 0;
  const hole = new Uint8Array(n);
  const dirs = 20;
  const maxT = Math.round(Math.min(w, h) * 0.55);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      if (solid[i]) continue;
      let hits = 0;
      for (let d = 0; d < dirs; d += 1) {
        const ang = (d / dirs) * Math.PI * 2;
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        for (let t = 1; t <= maxT; t += 3) {
          const xx = (x + dx * t) | 0;
          const yy = (y + dy * t) | 0;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) break;
          if (solid[yy * w + xx]) {
            hits += 1;
            break;
          }
        }
      }
      if (hits >= 18) hole[i] = 1;
    }
  }

  const seen = new Uint8Array(n);
  let best = [];
  for (let start = 0; start < n; start += 1) {
    if (!hole[start] || seen[start]) continue;
    const comp = [];
    const queue = [start];
    seen[start] = 1;
    while (queue.length) {
      const cur = queue.pop();
      comp.push(cur);
      const x = cur % w;
      const next = [cur - 1, cur + 1, cur - w, cur + w];
      if (x === 0) next[0] = -1;
      if (x === w - 1) next[1] = -1;
      for (const nidx of next) {
        if (nidx < 0 || nidx >= n || !hole[nidx] || seen[nidx]) continue;
        seen[nidx] = 1;
        queue.push(nidx);
      }
    }
    if (comp.length > best.length) best = comp;
  }

  const mask = new Uint8Array(n);
  const minArea = Math.max(6000, Math.round(w * h * 0.025));
  if (best.length >= minArea) {
    for (const idx of best) mask[idx] = 1;
  }
  return { mask, area: best.length, minArea };
}

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function repair(png) {
  const found = largestInteriorHole(png);
  if (!found.mask.some((bit) => bit)) return { changed: false, area: found.area, minArea: found.minArea };
  const { width: w, height: h, data } = png;
  const mask = found.mask;
  let minY = h;
  let maxY = 0;
  const lights = [];
  const golden = (r, g, b) => {
    const yv = luma(r, g, b);
    return yv > 155 && yv < 240 && r > 200 && r - b > 55 && r - g > 22 && b < 190;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      if (mask[i]) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const neighbors = [i - 1, i + 1, i - w, i + w];
        if (x === 0) neighbors[0] = -1;
        if (x === w - 1) neighbors[1] = -1;
        for (const nidx of neighbors) {
          if (nidx < 0 || nidx >= w * h || mask[nidx] || data[nidx * 4 + 3] < 200) continue;
          const r = data[nidx * 4];
          const g = data[nidx * 4 + 1];
          const b = data[nidx * 4 + 2];
          if (golden(r, g, b)) lights.push([r, g, b]);
        }
      }
    }
  }
  // The missing face has the eyes and mouth sitting inside it. A gap beside a
  // tail does not, so that opening stays transparent.
  let featureTouch = 0;
  for (let i = 0; i < w * h; i += 1) {
    if (mask[i] || data[i * 4 + 3] < 200) continue;
    if (luma(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) > 90) continue;
    const x = i % w;
    const neighbors = [i - 1, i + 1, i - w, i + w];
    if (x === 0) neighbors[0] = -1;
    if (x === w - 1) neighbors[1] = -1;
    if (neighbors.some((nidx) => nidx >= 0 && nidx < w * h && mask[nidx])) featureTouch += 1;
  }
  if (lights.length < 20 || featureTouch < 8) {
    return { changed: false, area: found.area, minArea: found.minArea, skipped: "not-a-face" };
  }
  lights.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const fur = lights[Math.min(lights.length - 1, Math.floor(lights.length * 0.82))];
  const belly = [
    Math.round(fur[0] + (255 - fur[0]) * 0.16),
    Math.round(fur[1] + (255 - fur[1]) * 0.2),
    Math.round(fur[2] + (255 - fur[2]) * 0.12),
  ];
  const span = Math.max(1, maxY - minY);
  for (let i = 0; i < w * h; i += 1) {
    if (!mask[i]) continue;
    const y = Math.floor(i / w);
    const t = (y - minY) / span;
    data[i * 4] = Math.round(fur[0] * (1 - t) + belly[0] * t);
    data[i * 4 + 1] = Math.round(fur[1] * (1 - t) + belly[1] * t);
    data[i * 4 + 2] = Math.round(fur[2] * (1 - t) + belly[2] * t);
    data[i * 4 + 3] = 255;
  }
  return {
    changed: true,
    area: found.area,
    minArea: found.minArea,
    fur: fur.map((v) => Math.round(v)),
  };
}

const names = readdirSync(animalsDir).filter((name) => name.endsWith(".png")).sort();
let filled = 0;
for (const name of names) {
  const png = PNG.sync.read(readFileSync(join(animalsDir, name)));
  const result = repair(png);
  if (!result.changed) continue;
  filled += 1;
  console.log(`${name} filled ${result.area} pixels with ${result.fur.join(",")}`);
  if (!dryRun) writeFileSync(join(animalsDir, name), PNG.sync.write(png));
}
if (!filled) console.log(`animal faces already solid (${names.length} checked)`);
