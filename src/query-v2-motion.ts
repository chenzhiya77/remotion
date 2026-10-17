import {
  HARNESS_BOX,
  REGIONS,
  USER,
  USER_BOX,
  clamp,
  mix,
  phase,
  progress,
  smooth,
  track,
  type Camera,
} from "./journey-motion.ts";

export const V2_DURATION = 13;

export function v2CameraAt(time: number): Camera {
  return {
    x: track(time, [
      [0, 4120],
      [2.6, 4150],
      [4.6, 4260],
      [6.2, 4320],
      [8.2, 4380],
      [11, 4460],
      [13, 4520],
    ]),
    y: track(time, [
      [0, 800],
      [2.6, 780],
      [4.6, 700],
      [6.2, 620],
      [8.2, 540],
      [11, 540],
      [13, 580],
    ]),
    zoom: track(time, [
      [0, 1.15],
      [2.6, 1.22],
      [4.6, 1.1],
      [6.2, 1.02],
      [8.2, 0.95],
      [11, 0.9],
      [13, 0.88],
    ]),
    roll: track(time, [
      [0, -2.2],
      [2.6, -1.4],
      [4.6, 0.6],
      [6.2, -1.2],
      [8.2, -2],
      [11, -1.2],
      [13, 0],
    ]),
  };
}

export function v2UserCard(time: number) {
  const breath = Math.sin(Math.PI * progress(time, 2.4, 3.1));
  const flight = phase(time, 3.2, 4.3);
  return {
    in: phase(time, 0.5, 1.3),
    flight,
    x: USER_BOX.x + flight * 320,
    y: USER_BOX.y - flight * 60,
    scale: mix(1 + breath * 0.03, 0.16, smooth(flight)),
    opacity: 1 - phase(time, 3.8, 4.3),
    glow: Math.sin(Math.PI * flight),
  };
}

export function v2AgentCard(time: number) {
  return {
    in: phase(time, 4.35, 5.15),
    grow: phase(time, 6.0, 7.6),
    streakOut: phase(time, 7.65, 8.0),
  };
}

export function v2Streak(time: number, index: number) {
  const base =
    index < 3
      ? 1
      : phase(time, 6.2 + (index - 3) * 0.4, 6.8 + (index - 3) * 0.4);
  const shimmer = 0.92 + 0.08 * Math.sin(time * 1.7 + index * 1.9);
  return base * shimmer;
}

export function v2Contract(time: number, index: number) {
  return phase(time, 8.0 + index * 0.95, 8.85 + index * 0.95);
}

export function v2Tile(time: number, index: number) {
  return phase(time, 8.5 + index * 0.95, 9.15 + index * 0.95);
}

export function v2ContractRect(time: number, index: number) {
  const inner = { left: 0, top: 0, w: HARNESS_BOX.w, h: 430 };
  const region = REGIONS[index];
  const p = v2Contract(time, index);
  return {
    left: mix(inner.left, region.left, p),
    top: mix(inner.top, region.top, p),
    w: mix(inner.w, region.w, p),
    h: mix(inner.h, region.h, p),
    alpha: Math.sin(Math.PI * clamp(p * 1.12)) * 0.95,
  };
}

export function v2FigurePose(time: number) {
  return {
    userBob: Math.sin(time * 1.05) * 3,
    petBob: Math.sin(time * 1.35 + 0.9) * 4,
    petTilt: Math.sin(time * 0.85 + 0.3) * 1.7,
  };
}

export function v2Mote(seed: number, time: number) {
  const drift = (time * (7 + (seed % 5) * 2) + seed * 137) % 240;
  return {
    x: USER.x - 320 + ((seed * 173) % 940),
    y: 320 + ((seed * 97) % 620) - drift * 0.45,
    alpha: 0.12 + 0.1 * Math.sin(time * 0.7 + seed),
    size: 2 + (seed % 3),
  };
}
