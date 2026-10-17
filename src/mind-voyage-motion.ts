import { cubic, mix, phase, track, worldToScreen } from "./journey-motion.ts";

export const VOYAGE_DURATION = 40;
export const OCEAN_SURFACE = 3350;
export const QUESTION = "星舟网关如何连接服务、处理请求失败？";
export const PALETTE = ["#8de6ed", "#c0e89d", "#cbb3f2"] as const;

export function windowGrowth(time: number) {
  return phase(time, 5.8, 8.8) * (1 - phase(time, 33.1, 36.0));
}

export function portalAt(time: number) {
  const grow = windowGrowth(time);
  return {
    x: mix(1000, 545, grow),
    y: mix(250, 105, grow),
    w: mix(760, 1310, grow),
    h: mix(210, 750, grow),
    radius: mix(44, 28, grow),
  };
}

export function stageAt(time: number) {
  const grow = windowGrowth(time);
  return {
    userX: mix(640, 215, grow),
    agentX: mix(1280, 440, grow),
    floorY: mix(870, 936, grow),
    scale: mix(1.4, 0.9, grow),
  };
}

function descent(time: number) {
  const keys = [
    [8.8, 710],
    [11.5, 800],
    [14, 930],
    [17, 2180],
    [19.7, 2350],
    [22, 2490],
    [25, 3510],
    [28, 3870],
    [30, 4100],
    [33, 4430],
  ];
  return keys
    .slice(1)
    .reduce(
      (y, key, i) =>
        y + (key[1] - keys[i][1]) * phase(time, keys[i][0], key[0]),
      keys[0][1],
    );
}

export function mindCameraAt(time: number) {
  return {
    x: track(time, [
      [8.8, 1000],
      [11.5, 1010],
      [14, 1100],
      [17, 1050],
      [19.7, 1120],
      [22, 1170],
      [25, 1030],
      [28, 1080],
      [30, 1120],
      [33, 1100],
    ]),
    y: descent(time),
    zoom: track(time, [
      [8.8, 0.92],
      [11.5, 1.02],
      [14, 0.95],
      [17, 0.95],
      [19.7, 1.04],
      [22, 0.96],
      [25, 0.9],
      [28, 1.0],
      [30, 1.03],
      [33, 0.92],
    ]),
    roll: track(time, [
      [8.8, -3],
      [11.5, 1.5],
      [14, 3],
      [17, -2],
      [19.7, 1.5],
      [22, 3],
      [25, -2],
      [28, 2],
      [30, -1],
      [33, 0],
    ]),
  };
}

export function questionCoreAt(time: number) {
  const t = Math.max(8.8, Math.min(33, time));
  const camera = mindCameraAt(t);
  const orbit = (t - 8.8) * 0.64;
  return {
    x: camera.x + Math.sin(orbit) * 170,
    y: camera.y + 70 + Math.cos(orbit) * 70 - 270 * phase(t, 30.3, 33),
  };
}

export function questionScreenAt(time: number) {
  const portal = portalAt(time);
  const camera = mindCameraAt(time);
  const view = worldToScreen(questionCoreAt(time), camera);
  const projected = {
    x: portal.x + (view.x / 1920) * portal.w,
    y: portal.y + (view.y / 1080) * portal.h,
  };
  const enter = phase(time, 6.3, 8.8);
  const transfer = phase(time, 3.2, 4.45);
  const outside = cubic(
    { x: 620, y: 326 },
    { x: 820, y: 210 },
    { x: 1150, y: 460 },
    { x: 1320, y: 345 },
    transfer,
  );
  return {
    x: mix(outside.x, projected.x, enter),
    y: mix(outside.y, projected.y, enter),
    alpha: phase(time, 3.35, 3.85) * (1 - phase(time, 35.6, 36.2)),
  };
}

export function starAt(time: number, index: number) {
  const angle = index * 2.399963 + time * 0.065;
  const radius = 55 + Math.sqrt((index * 79) % 320) * 35;
  const depth = Math.sin(angle + 0.4);
  const perspective = 0.76 + (depth + 1) * 0.17;
  const x = Math.cos(angle) * radius * perspective;
  const y = Math.sin(angle) * radius * 0.4;
  return {
    x: 1010 + x,
    y: 790 + y + x * 0.17,
    radius: (1.4 + (index % 5) * 0.45) * perspective,
    alpha: 0.2 + (depth + 1) * 0.3,
    depth,
  };
}

export const STAR_HITS = [18, 63] as const;
export function nebulaHitAt(time: number, index: number) {
  const start = 11.1 + index * 1.25;
  const star = starAt(time, STAR_HITS[index]);
  const unfold = phase(time, start, start + 1.0);
  const target = index === 0 ? { x: 700, y: 680 } : { x: 1420, y: 1090 };
  return {
    x: mix(star.x, target.x, unfold),
    y: mix(star.y, target.y, unfold),
    alpha: phase(time, start, start + 0.4),
    unfold,
    starX: star.x,
    starY: star.y,
  };
}

export const FOREST = [
  { x: 980, y: 2300, label: "星舟网关", parent: -1, bloom: 18.25, r: 31 },
  { x: 590, y: 2110, label: "支付服务", parent: 0, bloom: 19.1, r: 25 },
  { x: 1430, y: 2090, label: "结算服务", parent: 0, bloom: 19.85, r: 26 },
  { x: 290, y: 1920, label: "鉴权", parent: 1, bloom: 30, r: 15 },
  { x: 710, y: 1780, label: "请求", parent: 1, bloom: 30, r: 17 },
  { x: 1290, y: 1800, label: "账单", parent: 2, bloom: 30, r: 16 },
  { x: 1710, y: 1810, label: "订单", parent: 2, bloom: 30, r: 17 },
  { x: 1760, y: 2410, label: "调用边界", parent: 2, bloom: 30, r: 18 },
] as const;

export function branchAt(time: number, index: number) {
  return phase(time, 17.3 + index * 0.29, 18.6 + index * 0.29);
}
export function bloomAt(time: number, index: number) {
  return phase(time, FOREST[index].bloom, FOREST[index].bloom + 0.85);
}

export const OCEAN_PAGES = [
  {
    x: 900,
    y: 3600,
    title: "星舟网关",
    subtitle: "连接服务的统一入口",
    text: "服务接入、请求转发与失败恢复。",
    hit: 25.8,
  },
  {
    x: 1350,
    y: 3920,
    title: "重试与恢复",
    subtitle: "从来源中归纳机制",
    text: "请求失败时，按配置执行有界重试。",
    hit: 27.0,
  },
  {
    x: 780,
    y: 4180,
    title: "服务依赖",
    subtitle: "让分散知识形成上下文",
    text: "网关连接支付与结算服务。",
    hit: 28.4,
  },
] as const;

export function oceanPageAt(time: number, index: number) {
  const page = OCEAN_PAGES[index];
  const turn = phase(time, page.hit - 0.45, page.hit + 0.9);
  return {
    x: page.x + Math.sin(time * 0.3 + index * 2) * 16,
    y: page.y + Math.sin(time * 0.6 + index) * 11,
    yaw: mix(index % 2 ? 34 : -34, index % 2 ? -7 : 7, turn),
    pitch: mix(36, 3, turn),
    hit: phase(time, page.hit, page.hit + 0.75),
  };
}

export function evidenceAt(time: number, index: number) {
  const starts = [14.0, 21.3, 29.55];
  const origin =
    index === 0
      ? { x: 1420, y: 1090 }
      : index === 1
        ? { x: 1260, y: 2550 }
        : { x: 920, y: 4370 };
  const core = questionCoreAt(time);
  const gather = phase(time, starts[index], starts[index] + 1.25);
  const angle = time * 0.5 + index * 2.094;
  const target = {
    x: core.x + Math.cos(angle) * 96,
    y: core.y + Math.sin(angle) * 64,
  };
  return {
    x: mix(origin.x, target.x, gather),
    y: mix(origin.y, target.y, gather),
    alpha: phase(time, starts[index], starts[index] + 0.4),
    scale: mix(0.6, 1, gather),
  };
}
