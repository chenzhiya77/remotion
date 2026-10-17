import { Easing, interpolate } from "remotion";

import { SEAT } from "../../mascot/seat-config";
import { SEAT_ANCHOR_PT, solveSeatY } from "../../mascot/seat-solver";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 60;
export const GRAY_DURATION = 6;

export const GROUND_Y = 930;

export const HORSE_SCALE = 0.4;
export const HORSE_GROUND_LOCAL_Y = 1263;
export const HORSE_SADDLE_LOCAL_X = 719.6;
export const HORSE_STAGE_TOP = GROUND_Y - HORSE_GROUND_LOCAL_Y * HORSE_SCALE;

export const HORSE_BASE_X_AT_UNDER = 700;
export const HORSE_UNDER_T = 2.5;
export const HORSE_SPEED = 420;
export const HORSE_START_BASE_X =
  HORSE_BASE_X_AT_UNDER - HORSE_UNDER_T * HORSE_SPEED;

export const DUCK_BASE_X = 700;
export const DUCK_SCALE = SEAT.s * HORSE_SCALE;
export const DUCK_ANCHOR = { x: SEAT_ANCHOR_PT.x, y: SEAT_ANCHOR_PT.y };
export const DUCK_FOOT_LOCAL_Y = 1305;
export const DUCK_ANCHOR_TO_FOOT = DUCK_FOOT_LOCAL_Y - DUCK_ANCHOR.y;

export const LEDGE_TOP_Y = 520;
export const DUCK_STAND_ANCHOR_Y =
  LEDGE_TOP_Y - DUCK_ANCHOR_TO_FOOT * DUCK_SCALE;
export const DUCK_GROUND_ANCHOR_Y =
  GROUND_Y - DUCK_ANCHOR_TO_FOOT * DUCK_SCALE;

export const STEP_OFF_T = 2.5;
export const IMPACT_T = 3.4;
export const RUN_START_T = 3.7;
export const JUMP_T = 4.6;
export const MOUNT_T = 5.3;
export const DUCK_RUN_SPEED = 650;
export const JUMP_APEX = 220;

const SEAT_TY = solveSeatY(SEAT);
export const SEATED_ANCHOR_LOCAL = {
  x:
    669 +
    (DUCK_ANCHOR.x - 669) * SEAT.sx * SEAT.s +
    SEAT.tx,
  y: 1130 + (DUCK_ANCHOR.y - 1130) * SEAT.s + SEAT_TY,
};
export const MOUNT_ANCHOR_Y =
  HORSE_STAGE_TOP + SEATED_ANCHOR_LOCAL.y * HORSE_SCALE;

export const FIRST_LINE = {
  x: 900,
  baseline: 380,
  text: "什么是 Harness RAG",
};
export const SECOND_LINE = {
  x: 1800,
  baseline: 300,
  text: "这是一场关于知识的旅程",
};

export const FIRST_LINE_START = 0.6;
export const FIRST_LINE_END = 2.3;
export const QUESTION_T = 2.5;
export const SECOND_LINE_START = 4.2;
export const SECOND_LINE_END = 5.3;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

export const horseBaseX = (t: number) =>
  HORSE_START_BASE_X + HORSE_SPEED * t;

export const duckBaseX = (t: number) => {
  if (t < RUN_START_T) return DUCK_BASE_X;
  if (t < JUMP_T) {
    return DUCK_BASE_X + DUCK_RUN_SPEED * (t - RUN_START_T);
  }
  const jumpStartX =
    DUCK_BASE_X + DUCK_RUN_SPEED * (JUMP_T - RUN_START_T);
  const endX = horseBaseX(MOUNT_T);
  const u = smooth((t - JUMP_T) / (MOUNT_T - JUMP_T));
  return jumpStartX + (endX - jumpStartX) * u;
};

export const duckAnchorY = (t: number) => {
  if (t < STEP_OFF_T) return DUCK_STAND_ANCHOR_Y;
  if (t < IMPACT_T) {
    const u = clamp01((t - STEP_OFF_T) / (IMPACT_T - STEP_OFF_T));
    return (
      DUCK_STAND_ANCHOR_Y +
      (DUCK_GROUND_ANCHOR_Y - DUCK_STAND_ANCHOR_Y) * u * u
    );
  }
  if (t < JUMP_T) return DUCK_GROUND_ANCHOR_Y;
  if (t < MOUNT_T) {
    const u = clamp01((t - JUMP_T) / (MOUNT_T - JUMP_T));
    return (
      DUCK_GROUND_ANCHOR_Y +
      (MOUNT_ANCHOR_Y - DUCK_GROUND_ANCHOR_Y) * u -
      JUMP_APEX * 4 * u * (1 - u)
    );
  }
  return MOUNT_ANCHOR_Y;
};

export type CameraState = {
  x: number;
  y: number;
  zoom: number;
  shakeX: number;
  shakeY: number;
};

export const getCamera = (t: number): CameraState => {
  const x = interpolate(
    t,
    [0, 3.4, 3.8, 4.4, 5.0, MOUNT_T, 6],
    [0, 0, 120, 450, 760, 916, 1210],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const y = interpolate(
    t,
    [0, 2.5, IMPACT_T, 4.0, 4.6, MOUNT_T, 6],
    [0, 0, 130, 95, 80, -70, -70],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const zoom = interpolate(
    t,
    [0, 2.5, IMPACT_T, 4.6, MOUNT_T, 6],
    [1, 1.02, 1.06, 1.06, 1.12, 1.12],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const shakeAmp = interpolate(
    t,
    [2.44, QUESTION_T, 2.68, 3.34, IMPACT_T, 3.72, 5.24, MOUNT_T, 6],
    [0, 2.2, 0, 0, 8.5, 0, 0, 5, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  return {
    x,
    y,
    zoom,
    shakeX: Math.sin(t * 137) * shakeAmp,
    shakeY: Math.cos(t * 109) * shakeAmp * 0.7,
  };
};

export const firstLineProgress = (t: number) =>
  smooth((t - FIRST_LINE_START) / (FIRST_LINE_END - FIRST_LINE_START));

export const secondLineProgress = (t: number) =>
  smooth((t - SECOND_LINE_START) / (SECOND_LINE_END - SECOND_LINE_START));

export const questionProgress = (t: number) =>
  smooth((t - QUESTION_T) / 0.18);
