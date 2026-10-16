export type Point = { x: number; y: number };
export type Camera = Point & { zoom: number; roll: number };
type Key = readonly [number, number];

export const DURATION = 28;
export const FRONT_DURATION = 20;
export const INGEST_DURATION = FRONT_DURATION + DURATION;
export const QUERY_DURATION = 32;
export const CORE: Point = { x: 1960, y: 790 };
export const WIKI: Point = { x: 2850, y: 760 };
export const SOURCE_IDS = ["001", "014", "008"] as const;

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const mix = (a: number, b: number, amount: number) =>
  a + (b - a) * amount;
export const progress = (time: number, start: number, end: number) =>
  clamp((time - start) / (end - start));
export const smooth = (p: number) => p * p * p * (p * (p * 6 - 15) + 10);
export const phase = (time: number, start: number, end: number) =>
  smooth(progress(time, start, end));

export function track(time: number, keys: readonly Key[]): number {
  if (time <= keys[0][0]) return keys[0][1];
  if (time >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
  const i = keys.findIndex(
    (key, index) =>
      index < keys.length - 1 && time >= key[0] && time < keys[index + 1][0],
  );
  const a = keys[i];
  const b = keys[i + 1];
  const before = keys[Math.max(0, i - 1)];
  const after = keys[Math.min(keys.length - 1, i + 2)];
  const duration = b[0] - a[0];
  const p = (time - a[0]) / duration;
  const va = i === 0 ? 0 : (b[1] - before[1]) / (b[0] - before[0]);
  const vb =
    i + 1 === keys.length - 1 ? 0 : (after[1] - a[1]) / (after[0] - a[0]);
  return (
    (2 * p ** 3 - 3 * p ** 2 + 1) * a[1] +
    (p ** 3 - 2 * p ** 2 + p) * duration * va +
    (-2 * p ** 3 + 3 * p ** 2) * b[1] +
    (p ** 3 - p ** 2) * duration * vb
  );
}

export function cameraAt(time: number): Camera {
  const camera = {
    x: track(time, [
      [0, 765],
      [2.2, 790],
      [5.2, 850],
      [7.6, 1040],
      [10.8, 1530],
      [13.4, 1940],
      [16.4, 2020],
      [18.3, 2260],
      [22.3, 2840],
      [24.1, 2780],
      [27.2, 1740],
      [28, 1720],
    ]),
    y: track(time, [
      [0, 710],
      [2.2, 700],
      [5.2, 790],
      [7.6, 520],
      [10.8, 640],
      [13.4, 790],
      [16.4, 780],
      [18.3, 760],
      [22.3, 750],
      [24.1, 760],
      [27.2, 825],
      [28, 825],
    ]),
    zoom: track(time, [
      [0, 1.95],
      [2.2, 1.75],
      [5.2, 0.96],
      [7.6, 1.24],
      [10.8, 1.4],
      [13.4, 1.85],
      [16.4, 1.43],
      [18.3, 1.16],
      [22.3, 1.02],
      [24.1, 1.04],
      [27.2, 0.57],
      [28, 0.57],
    ]),
    roll: track(time, [
      [0, -7],
      [2.2, -5],
      [5.2, 3],
      [7.6, 1],
      [10.8, -4],
      [13.4, -5],
      [16.4, 1.5],
      [18.3, 5],
      [22.3, -2.5],
      [24.1, -2],
      [27.2, 0],
      [28, 0],
    ]),
  };
  const follow = phase(time, 6.8, 8.5) * (1 - phase(time, 12.5, 13.5));
  const hero = tokenAt(time, 0);
  return {
    ...camera,
    x: mix(camera.x, hero.x + 70, follow),
    y: mix(camera.y, hero.y + 90, follow),
  };
}

const LANDINGS = [
  { x: 640, y: 460, angle: -9 },
  { x: 465, y: 975, angle: 7 },
  { x: 1260, y: 1200, angle: 3 },
] as const;

export function sourceAt(time: number, index: number) {
  const p = phase(time, 1.9 + index * 0.22, 5.25 + index * 0.22);
  const settle = Math.sin(Math.PI * p) * (index === 1 ? -42 : 32);
  return {
    x: mix(760 + index * 24, LANDINGS[index].x, p),
    y: mix(710 + index * 19, LANDINGS[index].y, p) + settle,
    angle: mix(-4 + index * 3, LANDINGS[index].angle, p),
    yaw: mix(-4, index === 1 ? 11 : -7, p),
    alpha: index === 0 ? 1 : mix(0.52, 1, phase(time, 1.4, 3.7)),
  };
}

export function cubic(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  p: number,
): Point {
  const q = 1 - p;
  return {
    x:
      q ** 3 * a.x + 3 * q ** 2 * p * b.x + 3 * q * p ** 2 * c.x + p ** 3 * d.x,
    y:
      q ** 3 * a.y + 3 * q ** 2 * p * b.y + 3 * q * p ** 2 * c.y + p ** 3 * d.y,
  };
}

export function tokenAt(time: number, index: number) {
  const source = sourceAt(time, index);
  const localX = [-190, -165, -125][index];
  const localY = -33;
  const radians = (source.angle * Math.PI) / 180;
  const start = {
    x: source.x + localX * Math.cos(radians) - localY * Math.sin(radians),
    y: source.y + localX * Math.sin(radians) + localY * Math.cos(radians),
  };
  const lift = phase(time, 5.5 + index * 0.7, 8.2 + index * 0.35);
  const flight = phase(time, 8.1 + index * 0.32, 13.45 + index * 0.38);
  const lifted = { x: start.x + 172 * lift, y: start.y - 116 * lift };
  const destination = { x: CORE.x, y: CORE.y + 18 };
  const point = cubic(
    lifted,
    { x: lifted.x + 455, y: lifted.y - 90 + index * 32 },
    { x: CORE.x - 210, y: CORE.y + (index - 1) * 215 },
    destination,
    flight,
  );
  const absorption =
    index === 0 ? 0 : phase(time, 13.05 + index * 0.34, 14.3 + index * 0.34);
  return {
    ...point,
    alpha: phase(time, 5.5 + index * 0.7, 6.0 + index * 0.7) * (1 - absorption),
    scale:
      index === 0
        ? mix(0.88, 1.22, phase(time, 13.35, 15.1))
        : mix(0.88, 0.08, absorption),
    angle:
      mix(source.angle, 0, lift) +
      Math.sin(flight * Math.PI * 2) * (index === 1 ? -9 : 6),
    flight,
    landed: phase(time, 13.3, 15.1),
  };
}

export function provenance(time: number, index: number) {
  const source = sourceAt(time, index);
  const token = tokenAt(time, index);
  const settled = phase(time, 13.4, 15.15);
  const start = { x: source.x + 260, y: source.y - 15 };
  const end = {
    x: mix(token.x, CORE.x, settled),
    y: mix(token.y, CORE.y, settled),
  };
  return {
    start,
    control1: {
      x: start.x + Math.max(70, (end.x - start.x) * 0.42),
      y: start.y,
    },
    control2: { x: end.x - 150, y: end.y + (index - 1) * 130 },
    end,
  };
}

export function worldToScreen(point: Point, camera: Camera): Point {
  const radians = (camera.roll * Math.PI) / 180;
  const x = (point.x - camera.x) * camera.zoom;
  const y = (point.y - camera.y) * camera.zoom;
  return {
    x: 960 + x * Math.cos(radians) - y * Math.sin(radians),
    y: 540 + x * Math.sin(radians) + y * Math.cos(radians),
  };
}

// ── Front segment: three source documents → structured markdown → chunks ──
// The front ends at exactly the journey's opening pose, so the seam is a
// frame-identical hand-off rather than a crossfade.

export const SHEETS = [
  { x: 500, y: 300, angle: -7 },
  { x: 320, y: 1010, angle: 5 },
  { x: 1150, y: 1180, angle: 2 },
] as const;

export function frontCameraAt(time: number): Camera {
  return {
    x: track(time, [
      [0, 750],
      [3, 500],
      [6.5, 330],
      [9.5, 1200],
      [12.5, 780],
      [16, 770],
      [18, 758],
      [20, 765],
    ]),
    y: track(time, [
      [0, 760],
      [3, 330],
      [6.5, 980],
      [9.5, 1260],
      [12.5, 840],
      [16, 820],
      [18, 760],
      [20, 710],
    ]),
    zoom: track(time, [
      [0, 0.6],
      [3, 1.05],
      [6.5, 1.0],
      [9.5, 1.0],
      [12.5, 0.8],
      [16, 0.86],
      [18, 1.35],
      [20, 1.95],
    ]),
    roll: track(time, [
      [0, 2],
      [3, -4],
      [6.5, 3],
      [9.5, 1],
      [12.5, -2],
      [16, -4],
      [18, -6],
      [20, -7],
    ]),
  };
}

export function sheetState(time: number, index: number) {
  return {
    ...SHEETS[index],
    scan: progress(time, 2.8 + index * 1.2, 6.4 + index * 1.2),
    morph: phase(time, 4.0 + index * 1.2, 9.8 + index * 1.2),
    slice: phase(time, 12.8 + index * 0.45, 16.4 + index * 0.45),
  };
}

export type ChunkPose = {
  x: number;
  y: number;
  angle: number;
  yaw: number;
  alpha: number;
};

export function frontChunkAt(time: number, index: number): ChunkPose {
  const sheet = SHEETS[index];
  const seam = sourceAt(0, index);
  const p = phase(time, 13.2 + index * 0.55, 19.65 + index * 0.1);
  const start = { x: sheet.x + 15, y: sheet.y + 25 };
  const dx = seam.x - start.x;
  const dy = seam.y - start.y;
  const bow = index === 1 ? -70 : 70;
  const point = cubic(
    start,
    { x: start.x + dx * 0.3, y: start.y + dy * 0.3 - bow },
    { x: start.x + dx * 0.72, y: start.y + dy * 0.72 + bow * 0.35 },
    seam,
    p,
  );
  return {
    x: point.x,
    y: point.y,
    angle: mix(sheet.angle + 2, seam.angle, p),
    yaw: mix(-9, seam.yaw, p),
    alpha: seam.alpha * phase(time, 12.9 + index * 0.55, 13.55 + index * 0.55),
  };
}

export function minorChunkAt(
  time: number,
  sheetIndex: number,
  chunkIndex: number,
) {
  const sheet = SHEETS[sheetIndex];
  const emerge = phase(
    time,
    13.7 + sheetIndex * 0.5 + chunkIndex * 0.38,
    16.2 + sheetIndex * 0.5 + chunkIndex * 0.38,
  );
  const side = chunkIndex === 0 ? -1 : 1;
  return {
    x: sheet.x + side * (150 + chunkIndex * 65) * emerge,
    y: sheet.y + (chunkIndex === 0 ? -150 : 175) * emerge + 20,
    angle: sheet.angle + side * (2 + chunkIndex * 2),
    alpha: 0.46 * emerge,
  };
}

// ── Query film: user + pet + rewritten question → three tools → retrieval ──
// Same world, continued to the right of the knowledge chain; the chain stays
// off-frame until the retrieval reveal.

export const USER: Point = { x: 3900, y: 900 };
export const PET: Point = { x: 4300, y: 930 };
export const USER_BOX = { x: 3870, y: 450, w: 520, h: 150 };
export const HARNESS_BOX = { x: 4300, y: 450, w: 520 };
export const ANSWER: Point = { x: 5450, y: 820 };

export const REGIONS = [
  { key: "match", tag: "匹配", left: 35, top: 35, w: 240, h: 150 },
  { key: "relation", tag: "关系", left: 35, top: 210, w: 240, h: 150 },
  { key: "depth", tag: "深度", left: 300, top: 35, w: 185, h: 325 },
] as const;

export function userBoxState(time: number) {
  const breath = Math.sin(Math.PI * progress(time, 2.45, 3.15));
  const flight = phase(time, 3.2, 4.3);
  return {
    in: phase(time, 0.5, 1.3),
    flight,
    scale: mix(1 + breath * 0.035, 0.22, flight),
    opacity: 1 - phase(time, 3.95, 4.3),
  };
}

export function harnessBoxState(time: number) {
  return {
    in: phase(time, 4.4, 5.2),
    grow: phase(time, 6.0, 7.6),
    blurOut: phase(time, 7.65, 8.0),
  };
}

export function growBarAt(time: number, index: number) {
  return phase(time, 6.2 + index * 0.4, 6.8 + index * 0.4);
}

export function contractAt(time: number, index: number) {
  return phase(time, 8.0 + index * 0.95, 8.85 + index * 0.95);
}

export function regionState(time: number, index: number) {
  return phase(time, 8.5 + index * 0.95, 9.15 + index * 0.95);
}

export function contractFrame(time: number, index: number) {
  const boxHeight = 430;
  const inner = { left: 18, top: 18, w: 484, h: boxHeight - 36 };
  const region = REGIONS[index];
  const p = contractAt(time, index);
  return {
    left: mix(inner.left, region.left, p),
    top: mix(inner.top, region.top, p),
    w: mix(inner.w, region.w, p),
    h: mix(inner.h, region.h, p),
    alpha: Math.sin(Math.PI * clamp(p * 1.12)) * 0.95,
  };
}

export function regionCenter(index: number): Point {
  const region = REGIONS[index];
  return {
    x: HARNESS_BOX.x - HARNESS_BOX.w / 2 + region.left + region.w,
    y: 460 - 215 + region.top + region.h / 2,
  };
}

export const TOOL_CARDS = [
  {
    key: "vector",
    cn: "向量检索",
    tool: "hybrid_search",
    x: 4870,
    y: 350,
    target: { x: 900, y: 880 },
    c1: { x: 3400, y: 1180 },
    c2: { x: 1850, y: 1160 },
  },
  {
    key: "graph",
    cn: "图谱检索",
    tool: "graph_search",
    x: 4870,
    y: 520,
    target: { x: 1960, y: 790 },
    c1: { x: 3650, y: 560 },
    c2: { x: 2650, y: 520 },
  },
  {
    key: "wiki",
    cn: "wiki 检索",
    tool: "wiki_search",
    x: 4870,
    y: 690,
    target: { x: 2850, y: 760 },
    c1: { x: 4050, y: 880 },
    c2: { x: 3300, y: 860 },
  },
] as const;

export function lanePoint(card: (typeof TOOL_CARDS)[number], p: number): Point {
  return cubic(
    card.target,
    card.c2,
    card.c1,
    { x: card.x - 175, y: card.y },
    p,
  );
}

export function threadLine(time: number, index: number) {
  return phase(time, 11.2 + index * 0.45, 12.6 + index * 0.45);
}

export function toolCard(time: number, index: number) {
  return phase(time, 11.6 + index * 0.5, 12.5 + index * 0.5);
}

const REQUEST_STARTS = [13.8, 19.4, 22.2];
const PACKET_STARTS = [14.6, 20.0, 22.8];
const QUERY_PACKET_PLAN = [
  [3, 3, 3],
  [1, 2, 2],
  [3, 3, 3],
] as const;

export function queryLaneRequest(
  time: number,
  laneIndex: number,
  round: number,
) {
  const card = TOOL_CARDS[laneIndex];
  const start = REQUEST_STARTS[round] + laneIndex * 0.16;
  const end = start + 0.9;
  const p = phase(time, start, end);
  return {
    ...lanePoint(card, 1 - p),
    alpha: Math.sin(Math.PI * progress(time, start - 0.12, end + 0.12)),
  };
}

export function queryEvidencePacket(
  time: number,
  laneIndex: number,
  packetIndex: number,
  round: number,
) {
  const card = TOOL_CARDS[laneIndex];
  const start = PACKET_STARTS[round] + laneIndex * 0.18 + packetIndex * 0.28;
  const end = start + 1.5;
  const p = phase(time, start, end);
  return {
    ...lanePoint(card, p),
    alpha: Math.sin(Math.PI * progress(time, start - 0.1, end + 0.1)),
    dim: round === 1 ? 0.42 : 1,
  };
}

export function queryPacketCount(laneIndex: number, round: number): number {
  return QUERY_PACKET_PLAN[round][laneIndex];
}

export function answerState(time: number) {
  return {
    in: phase(time, 16.0, 17.4),
    text1: phase(time, 16.6, 18.2),
    text2: phase(time, 17.2, 18.8),
    sources: phase(time, 18.0, 19.0),
    warning: phase(time, 20.6, 21.2) * (1 - phase(time, 23.6, 24.3)),
    complete: phase(time, 24.2, 25.4),
  };
}

export function queryCameraAt(time: number): Camera {
  return {
    x: track(time, [
      [0, 4120],
      [3, 4180],
      [5.5, 4150],
      [8, 4300],
      [11, 4450],
      [14, 3450],
      [17.5, 4100],
      [20, 4700],
      [24, 4600],
      [27, 4400],
      [32, 3130],
    ]),
    y: track(time, [
      [0, 830],
      [3, 800],
      [5.5, 720],
      [8, 620],
      [11, 620],
      [14, 780],
      [17.5, 780],
      [20, 720],
      [24, 760],
      [27, 800],
      [32, 800],
    ]),
    zoom: track(time, [
      [0, 1.15],
      [3, 1.25],
      [5.5, 1.15],
      [8, 1.0],
      [11, 0.85],
      [14, 0.55],
      [17.5, 0.62],
      [20, 0.9],
      [24, 0.85],
      [27, 0.72],
      [32, 0.35],
    ]),
    roll: track(time, [
      [0, -2],
      [3, -1],
      [5.5, 1],
      [8, -1.5],
      [11, -2],
      [14, 0],
      [17.5, -1],
      [20, -2],
      [24, -1],
      [27, 1],
      [32, 0],
    ]),
  };
}

export function globalCameraAt(time: number): Camera {
  return time < FRONT_DURATION
    ? frontCameraAt(time)
    : cameraAt(time - FRONT_DURATION);
}
