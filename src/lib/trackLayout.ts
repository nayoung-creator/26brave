export interface TrackUser {
  id: string;
  totalLaps: number;
}

export interface TrackSlot {
  id: string;
  /** Fraction of a lap, measured as an angle around the oval. */
  progress: number;
  /** Horizontal radius in the playground's 1000×640 picture. */
  rx: number;
  /** Vertical radius in the playground's 1000×640 picture. */
  ry: number;
  size: number;
  showName: boolean;
}

const VB_W = 1000;
const VB_H = 640;
const CX = 500;
const CY = 330;
const TRACK_RX = 360;
const TRACK_RY = 200;
const LANE_COUNTS = [1, 2, 3];
const PHASES = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88];

function ellipseCircumference(a: number, b: number) {
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

export function trackFrame(width: number, height: number) {
  const scale = Math.min(width / VB_W, height / VB_H);
  return {
    scale,
    ox: (width - VB_W * scale) / 2,
    oy: (height - VB_H * scale) / 2,
  };
}

export function runnerPoint(
  slot: Pick<TrackSlot, "progress" | "rx" | "ry">,
  width: number,
  height: number,
  motion = 0,
) {
  const frame = trackFrame(width, height);
  const progress = (((slot.progress + motion) % 1) + 1) % 1;
  const angle = progress * Math.PI * 2 - Math.PI / 2;
  return {
    x: frame.ox + (CX + Math.cos(angle) * slot.rx) * frame.scale,
    y: frame.oy + (CY + Math.sin(angle) * slot.ry) * frame.scale,
  };
}

function separationNeeded(size: number, showName: boolean) {
  return showName ? size + 16 : size * 0.98;
}

function buildSlots(
  ordered: TrackUser[],
  shift: number,
  lanes: number,
  size: number,
  showName: boolean,
  spreadPx: number,
  scale: number,
): TrackSlot[] {
  const perLane = Math.ceil(ordered.length / lanes);
  const gap = 1 / perLane;
  const mid = (lanes - 1) / 2;
  const step = scale > 0 ? spreadPx / scale : 0;
  return ordered.map((user, index) => {
    const lane = index % lanes;
    const along = Math.floor(index / lanes);
    const stagger = lane % 2 === 0 ? 0 : gap * 0.5;
    const drx = (lane - mid) * step;
    const dry = drx * (TRACK_RY / TRACK_RX);
    return {
      id: user.id,
      progress: (shift + stagger + along * gap) % 1,
      rx: TRACK_RX + drx,
      ry: TRACK_RY + dry,
      size,
      showName,
    };
  });
}

export function minRunnerDistance(
  slots: TrackSlot[],
  width: number,
  height: number,
  motion = 0,
) {
  let min = Number.POSITIVE_INFINITY;
  const points = slots.map((slot) => runnerPoint(slot, width, height, motion));
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (dist < min) min = dist;
    }
  }
  return min;
}

function insideFrame(slots: TrackSlot[], width: number, height: number, motion: number) {
  const pad = 1;
  for (const slot of slots) {
    const point = runnerPoint(slot, width, height, motion);
    const nameH = slot.showName ? 16 : 0;
    const halfW = Math.max(slot.size, slot.showName ? 72 : slot.size) / 2;
    const halfH = (slot.size + nameH) / 2;
    if (point.x - halfW < pad || point.x + halfW > width - pad) return false;
    if (point.y - halfH < pad || point.y + halfH > height - pad) return false;
  }
  return true;
}

function layoutClears(slots: TrackSlot[], width: number, height: number, need: number) {
  return PHASES.every(
    (motion) =>
      minRunnerDistance(slots, width, height, motion) >= need &&
      insideFrame(slots, width, height, motion),
  );
}

function maxSpread(lanes: number, size: number, showName: boolean, width: number, height: number) {
  if (lanes <= 1) return 0;
  const frame = trackFrame(width, height);
  if (frame.scale <= 0) return 0;
  const outer = (lanes - 1) / 2;
  const nameH = showName ? 16 : 0;
  const halfW = Math.max(size, showName ? 72 : size) / 2 + 2;
  const halfH = (size + nameH) / 2 + 2;
  const rxCap = CX - (halfW - frame.ox) / frame.scale;
  const ryTopCap = CY - (halfH - frame.oy) / frame.scale;
  const ryBotCap = (height - halfH - frame.oy) / frame.scale - CY;
  const maxDrx = Math.max(0, Math.min(rxCap, 448) - TRACK_RX);
  const maxDry = Math.max(0, Math.min(ryTopCap, ryBotCap, 248) - TRACK_RY);
  const drx = Math.min(maxDrx, maxDry * (TRACK_RX / TRACK_RY));
  return (drx / outer) * frame.scale;
}

function fallbackSlots(
  ordered: TrackUser[],
  width: number,
  height: number,
  shift: number,
  scale: number,
): TrackSlot[] {
  const lanes = ordered.length < 3 ? 1 : 3;
  let spread = maxSpread(lanes, 18, false, width, height);
  let slots = buildSlots(ordered, shift, lanes, 18, false, spread, scale);
  for (let attempt = 0; attempt < 5 && !PHASES.every((motion) => insideFrame(slots, width, height, motion)); attempt += 1) {
    spread *= 0.72;
    slots = buildSlots(ordered, shift, lanes, 18, false, spread, scale);
  }
  const worst = Math.min(...PHASES.map((motion) => minRunnerDistance(slots, width, height, motion)));
  const size = Math.max(16, Math.min(18, Math.floor(worst / 0.98)));
  if (size !== 18) slots = buildSlots(ordered, shift, lanes, size, false, spread, scale);
  return slots;
}

/** Spread runners around the painted oval so their bodies do not sit on top of each other. */
export function placeRunners(
  users: TrackUser[],
  width: number,
  height: number,
  shift: number,
): TrackSlot[] {
  if (users.length === 0 || width < 40 || height < 40) return [];
  const ordered = [...users]
    .sort((a, b) => a.totalLaps - b.totalLaps || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, 48);
  const frame = trackFrame(width, height);
  const laneArc = ellipseCircumference(TRACK_RX, TRACK_RY) * frame.scale;

  for (let size = 64; size >= 28; size -= 2) {
    for (const showName of [true, false]) {
      const need = separationNeeded(size, showName);
      for (const lanes of LANE_COUNTS) {
        const perLane = Math.ceil(ordered.length / lanes);
        if (laneArc / perLane < need * 0.72) continue;
        const room = maxSpread(lanes, size, showName, width, height);
        const spreads = lanes === 1 ? [0] : [room * 0.45, room * 0.7, room, Math.max(room, need * 0.65)];
        const seen = new Set<number>();
        for (const spread of spreads) {
          const key = Math.round(spread);
          if (seen.has(key) || spread < 0) continue;
          seen.add(key);
          const slots = buildSlots(ordered, shift, lanes, size, showName, spread, frame.scale);
          if (layoutClears(slots, width, height, need)) return slots;
        }
      }
    }
  }

  return fallbackSlots(ordered, width, height, shift, frame.scale);
}
