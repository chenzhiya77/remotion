import {
  CORE,
  INGEST_DURATION,
  cameraAt,
  cubic,
  mix,
  phase,
  sourceAt,
  track,
  type Camera,
  type ChunkPose,
  type Point,
} from "./journey-motion.ts";

export const ENDING_DURATION = 20;
export const FILM_DURATION = INGEST_DURATION + ENDING_DURATION;
export const QUERY = "星舟网关如何接入服务、处理请求失败？";
export const EVIDENCE_DOCKS = [
  { x: 1555, y: 1870 },
  { x: 2085, y: 1870 },
  { x: 2615, y: 1870 },
] as const;
export const EVIDENCE_WAITS = [
  { x: 1040, y: 560 },
  { x: 2350, y: 990 },
  { x: 3270, y: 870 },
] as const;
export const EVIDENCE_STARTS = [4.7, 8.85, 12.2] as const;
export const EVIDENCE_COLORS = ["#78deec", "#afe1a7", "#c0a8f2"] as const;
export const GRAPH_NODES = [
  { x: 1580, y: 455, label: "支付服务", relation: "接入" },
  { x: 2310, y: 445, label: "结算服务", relation: "转发" },
] as const;

export function retrievalCameraAt(time: number): Camera {
  if (time <= 0) return cameraAt(28);
  return {
    x: track(time, [
      [0, 1720],
      [2.1, 1590],
      [3.9, 720],
      [5.9, 780],
      [8.05, 1930],
      [10.1, 2020],
      [11.8, 2820],
      [13.5, 2980],
      [14.5, 2730],
      [16.2, 2085],
    ]),
    y: track(time, [
      [0, 825],
      [2.1, 620],
      [3.9, 740],
      [5.9, 750],
      [8.05, 760],
      [10.1, 780],
      [11.8, 790],
      [13.5, 880],
      [14.5, 1310],
      [16.2, 1950],
    ]),
    zoom: track(time, [
      [0, 0.57],
      [2.1, 0.87],
      [3.9, 1.08],
      [5.9, 1.1],
      [8.05, 1.1],
      [10.1, 1.05],
      [11.8, 1.04],
      [13.5, 0.94],
      [14.5, 0.78],
      [16.2, 0.96],
    ]),
    roll: track(time, [
      [0, 0],
      [2.1, -1],
      [3.9, -5],
      [5.9, -3],
      [8.05, 3],
      [10.1, 1],
      [11.8, -2.5],
      [13.5, -1.5],
      [14.5, 2],
      [16.2, 0],
    ]),
  };
}

export function questionPose(time: number) {
  const enter = phase(time, 0.25, 1.8);
  const dock = phase(time, 2.5, 4.0);
  return {
    x: mix(mix(1720, 1630, enter), 2085, dock),
    y: mix(mix(1230, 470, enter), 1580, dock),
    scale: mix(1.18, 1, enter),
    angle: mix(5, 0, enter),
    alpha: phase(time, 0.25, 0.9),
  };
}

export function retrievalSourceAt(time: number, index: number): ChunkPose {
  const source = sourceAt(28, index);
  const start = index < 2 ? 3.65 + index * 0.45 : 8.7;
  const lift = phase(time, start, start + 0.9);
  const rest = 1 - phase(time, 13.8, 16.2);
  return {
    ...source,
    y: source.y - lift * rest * (index === 1 ? 38 : 30),
    angle: mix(source.angle, source.angle * 0.3, lift * rest),
    yaw: mix(source.yaw, 0, lift * rest),
  };
}

export function evidencePose(time: number, index: number) {
  const origin: Point =
    index === 0
      ? { x: 640, y: 440 }
      : index === 1
        ? { x: 1260, y: 1200 }
        : { x: 2870, y: 905 };
  const start = EVIDENCE_STARTS[index];
  const wait = EVIDENCE_WAITS[index];
  const lift = phase(time, start, start + 1.2);
  const lifted = cubic(
    origin,
    { x: origin.x + 80, y: origin.y - 160 },
    { x: wait.x - 120, y: wait.y - 70 },
    wait,
    lift,
  );
  const travel = phase(time, 13.85 + index * 0.12, 16.0 + index * 0.1);
  const target = EVIDENCE_DOCKS[index];
  const position = cubic(
    lifted,
    { x: lifted.x + (index === 2 ? 100 : 250), y: lifted.y + 380 },
    { x: target.x + (index - 1) * 100, y: target.y - 220 },
    target,
    travel,
  );
  return {
    ...position,
    alpha: phase(time, start, start + 0.35),
    scale: mix(0.72, 1, lift),
    angle:
      mix(index === 1 ? 7 : -4, 0, lift) +
      Math.sin(travel * Math.PI) * (index - 1) * 8,
    travel,
  };
}

export function graphNodeAt(time: number, index: number) {
  const node = GRAPH_NODES[index];
  const grow = phase(time, 7.2 + index * 0.45, 8.4 + index * 0.45);
  return {
    x: mix(CORE.x, node.x, grow),
    y: mix(CORE.y, node.y, grow),
    alpha: phase(time, 7.25 + index * 0.45, 7.8 + index * 0.45),
    scale: mix(0.25, 1, grow),
  };
}
