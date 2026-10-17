import {
  clamp,
  cubic,
  mix,
  phase,
  smooth,
  track,
  type Camera,
  type Point,
} from "./journey-motion.ts";

export const SEARCH_DURATION = 14;

// Knowledge world: three regions of one landscape, to the right of the
// platform (user 3900 / harness field 4014-4586 in v2 world coordinates).
// Nothing may cross x < 5720: the seam frame (camera 4520 @ zoom 0.88) sees
// up to x 5611, and the regions must stay out of it for a clean hand-off.
export const SLICE_FIELD: Point = { x: 6350, y: 800 };
export const CONSTELLATION: Point = { x: 6950, y: 600 };
export const PAGE_TOWER: Point = { x: 7550, y: 700 };

// Probe launch points = world centers of the three settled shapes inside the
// harness field (field at 4014,187; shape center x = 4300, y = 260 + 106i).
export const PROBE_ORIGIN: Point[] = [
  { x: 4300, y: 260 },
  { x: 4300, y: 366 },
  { x: 4300, y: 472 },
];

export const PROBE_TARGET: Point[] = [
  { x: 6350, y: 742 },
  { x: 6950, y: 582 },
  { x: 7550, y: 600 },
];

const TRAIL_B: Point[] = [
  { x: 5120, y: 170 },
  { x: 5280, y: 240 },
  { x: 5420, y: 330 },
];
const TRAIL_C: Point[] = [
  { x: 5860, y: 520 },
  { x: 6380, y: 350 },
  { x: 6820, y: 470 },
];

export function trailPoint(index: number, p: number): Point {
  return cubic(
    PROBE_ORIGIN[index],
    TRAIL_B[index],
    TRAIL_C[index],
    PROBE_TARGET[index],
    clamp(p),
  );
}

// Seam: v2CameraAt(13) = x 4520, y 580, zoom 0.88, roll 0.
export function searchCameraAt(time: number): Camera {
  return {
    x: track(time, [
      [0, 4520],
      [1.6, 4980],
      [3.6, 6180],
      [5.2, 6380],
      [6.2, 6500],
      [7.2, 6900],
      [8.6, 7050],
      [9.6, 7440],
      [10.8, 7530],
      [11.5, 7020],
      [12.2, 6350],
      [12.9, 5500],
      [13.5, 4950],
      [14, 4520],
    ]),
    y: track(time, [
      [0, 580],
      [1.6, 520],
      [3.6, 730],
      [5.2, 790],
      [6.2, 800],
      [7.2, 640],
      [8.6, 600],
      [9.6, 640],
      [10.8, 700],
      [11.5, 672],
      [12.2, 640],
      [12.9, 612],
      [13.5, 592],
      [14, 580],
    ]),
    zoom: track(time, [
      [0, 0.88],
      [1.6, 0.55],
      [3.6, 0.72],
      [5.2, 0.88],
      [6.2, 0.9],
      [7.2, 0.84],
      [8.6, 0.86],
      [9.6, 0.8],
      [10.8, 0.82],
      [11.5, 0.75],
      [12.2, 0.7],
      [12.9, 0.72],
      [13.5, 0.8],
      [14, 0.88],
    ]),
    roll: track(time, [
      [0, 0],
      [1.6, -0.8],
      [3.6, -0.35],
      [5.2, 0.15],
      [6.2, 0.2],
      [7.2, 0.9],
      [8.6, 0.4],
      [9.6, -0.5],
      [10.8, -0.25],
      [11.5, 0.2],
      [12.2, 0.35],
      [12.9, 0.28],
      [13.5, 0.12],
      [14, 0],
    ]),
  };
}

export const FLIGHT_START = [1.2, 1.42, 1.64];
export const FLIGHT_END = [3.7, 3.95, 4.2];
export const ACTION_AT = [4.35, 6.65, 8.95];
export const RETURN_START = [11.3, 11.52, 11.74];
export const RETURN_END = [12.8, 13.0, 13.2];

export function probePose(time: number, index: number) {
  const out = smooth(phase(time, FLIGHT_START[index], FLIGHT_END[index]));
  const back = smooth(phase(time, RETURN_START[index], RETURN_END[index]));
  const p = out * (1 - back);
  const pos = trailPoint(index, p);
  const settle = phase(time, ACTION_AT[index], ACTION_AT[index] + 0.5);
  const sink = index === 2 ? phase(time, 9.1, 10.5) : 0;
  return {
    x: pos.x,
    y:
      pos.y +
      mix(-58, 0, settle) * (1 - back) +
      sink * 250 +
      Math.sin(time * 1.7 + index * 1.9) * 3.5 * (1 - settle * 0.5),
    scale: mix(1.28, 1, out),
    settle,
    alpha:
      phase(time, 0.42 + index * 0.12, 1.12 + index * 0.12) *
      (1 - phase(time, RETURN_END[index] + 0.05, RETURN_END[index] + 0.4)),
    trail: out,
  };
}

// Evidence dots lead the probe home along the same trail.
export function evidenceAt(time: number, index: number, slot: number) {
  const back = smooth(phase(time, RETURN_START[index], RETURN_END[index]));
  const p = clamp(1 - back - 0.1 - slot * 0.14);
  return {
    ...trailPoint(index, p),
    alpha:
      phase(time, RETURN_START[index], RETURN_START[index] + 0.25) *
      (1 - phase(time, RETURN_END[index] - 0.15, RETURN_END[index] + 0.25)),
  };
}

export const SHAPE_MORPH_START = [0.35, 0.47, 0.59];
export const SHAPE_MORPH_END = [1.25, 1.37, 1.49];

export function sliceChunkAt(k: number) {
  const angle = k * 2.39996;
  const radius = 130 + ((k * 97) % 420);
  return {
    x: SLICE_FIELD.x + Math.cos(angle) * radius * 1.15,
    y: SLICE_FIELD.y + Math.sin(angle) * radius * 0.5,
    w: 46 + ((k * 53) % 92),
    rot: ((k * 71) % 9) - 4,
    lit: [3, 8, 13, 18, 23].includes(k),
    litAt: 5.05 + [3, 8, 13, 18, 23].indexOf(k) * 0.16,
  };
}

export const GRAPH_NODES: { x: number; y: number; r: number }[] = [
  { x: 6950, y: 600, r: 30 },
  { x: 6760, y: 470, r: 15 },
  { x: 7162, y: 492, r: 17 },
  { x: 7208, y: 668, r: 14 },
  { x: 6816, y: 742, r: 16 },
  { x: 6660, y: 618, r: 13 },
];

export const GRAPH_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 2],
  [3, 4],
];

export function pageSlabAt(j: number) {
  return {
    x: PAGE_TOWER.x + (j % 2 ? 34 : -18),
    y: PAGE_TOWER.y - 200 + j * 205,
    rot: j % 2 ? 2.2 : -2.2,
    openAt: 9.35 + j * 0.32,
  };
}

export function answerRowAt(time: number, index: number) {
  return phase(time, 12.95 + index * 0.12, 13.45 + index * 0.12);
}
