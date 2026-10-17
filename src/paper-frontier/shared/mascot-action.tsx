import { DuckRig, type DuckPoseSpec } from "../../mascot/CowboyCutUser";
import { HorseRig, type HorsePoseSpec } from "../../mascot/HorseCut";
import { PARTS_HORSE } from "../../mascot/horse-manifest";
import { HORSE_PART_OFFSET } from "../../mascot/horse-topline";
import { SEAT } from "../../mascot/seat-config";
import { solveSeatY } from "../../mascot/seat-solver";
import {
  DUCK_ANCHOR,
  DUCK_ANCHOR_TO_FOOT,
  DUCK_BASE_X,
  DUCK_SCALE,
  DUCK_STAND_ANCHOR_Y,
  GROUND_Y,
  HORSE_SADDLE_LOCAL_X,
  HORSE_SCALE,
  IMPACT_T,
  JUMP_T,
  MOUNT_T,
  RUN_START_T,
  STEP_OFF_T,
  duckAnchorY,
  duckBaseX,
  horseBaseX,
} from "./config";

type PartTf = {
  tx?: number;
  ty?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  org?: string;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

const blinkAt = (t: number, center: number) => {
  const distance = Math.abs(t - center);
  if (distance < 0.025) return 0.1;
  if (distance < 0.055) return 0.48;
  return 1;
};

export type DuckEyes = "normal" | "think" | "wuyu";

export const getDuckEyes = (t: number): DuckEyes => {
  if (t >= 2.1 && t < STEP_OFF_T) return "think";
  if (t >= IMPACT_T && t < RUN_START_T) return "wuyu";
  if (t >= RUN_START_T && t < MOUNT_T) return "think";
  return "normal";
};

const eyeTf = (t: number, tx: number, ty: number): PartTf => {
  const blink = Math.min(
    blinkAt(t, 1.35),
    blinkAt(t, 2.42),
    blinkAt(t, 4.68),
  );
  return { tx, ty, sy: blink };
};

const duckBoots = (
  left: number,
  right: number,
  planted: boolean,
): Pick<DuckPoseSpec, "local" | "planted"> => ({
  local: {
    boot_l: { rot: left, org: "50% 0%" },
    boot_r: { rot: right, org: "50% 0%" },
  },
  planted: planted ? ["boot_l", "boot_r"] : [],
});

export const getDuckPose = (t: number): DuckPoseSpec => {
  if (t < 2.1) {
    const gaze = 1.2 + 2.8 * smooth(t / 2.1);
    return {
      body: {
        rot: Math.sin(t * 2.1) * 0.65,
        sy: 1 + Math.sin(t * 3.2) * 0.004,
      },
      local: {
        eye_0: eyeTf(t, gaze, 0.6),
        eye_1: eyeTf(t, gaze, 0.6),
        hand_0: { rot: Math.sin(t * 2.3) * 1.8, org: "50% 0%" },
        hand_1: { rot: -Math.sin(t * 2.3) * 1.8, org: "50% 0%" },
        ...duckBoots(0, 0, true).local,
      },
      detached: {},
      planted: duckBoots(0, 0, true).planted,
    };
  }

  if (t < STEP_OFF_T) {
    const k = smooth((t - 2.1) / (STEP_OFF_T - 2.1));
    return {
      body: { rot: 6.5 * k, sy: 1 - 0.018 * k },
      local: {
        eye_0: eyeTf(t, 4, 2.4),
        eye_1: eyeTf(t, 4, 2.4),
        hand_0: { rot: 9 * k, org: "50% 0%" },
        hand_1: { rot: 6 * k, org: "50% 0%" },
        ...duckBoots(-2 * k, -1 * k, true).local,
      },
      detached: {},
      planted: duckBoots(0, 0, true).planted,
    };
  }

  if (t < IMPACT_T) {
    const u = clamp01((t - STEP_OFF_T) / (IMPACT_T - STEP_OFF_T));
    const flail = Math.sin(u * Math.PI * 2);
    return {
      body: {
        rot: 7 + u * 7 + flail * 4,
        sy: 1.07,
        sx: 1 / 1.07,
      },
      local: {
        eye_0: eyeTf(t, 2.5, 2.5),
        eye_1: eyeTf(t, 2.5, 2.5),
        hand_0: { rot: -60 - u * 15 + flail * 10, org: "50% 0%" },
        hand_1: { rot: -50 - u * 12 - flail * 8, org: "50% 0%" },
        ...duckBoots(16 + u * 8 + flail * 8, 12 + u * 6 - flail * 8, false).local,
      },
      detached: {},
      planted: [],
    };
  }

  if (t < RUN_START_T) {
    const u = clamp01((t - IMPACT_T) / (RUN_START_T - IMPACT_T));
    const squash =
      u < 0.14 ? 1.08 - 1.4 * u : u < 0.34 ? 0.88 + 1.7 * (u - 0.14) : 1.02 - 0.2 * (u - 0.34);
    return {
      body: { rot: 1.4 - 1.4 * u, sy: squash, sx: 1 / squash },
      local: {
        eye_0: eyeTf(t, 2, 1.2),
        eye_1: eyeTf(t, 2, 1.2),
        hand_0: { rot: 22 - 22 * u, org: "50% 0%" },
        hand_1: { rot: 18 - 18 * u, org: "50% 0%" },
        ...duckBoots(-6 + 6 * u, -4 + 4 * u, true).local,
      },
      detached: {},
      planted: duckBoots(0, 0, true).planted,
    };
  }

  if (t < JUMP_T) {
    const phase = ((t - RUN_START_T) / 0.2) * Math.PI * 2;
    const swing = Math.sin(phase);
    return {
      body: {
        rot: 9 + swing * 1.2,
        ty: -Math.abs(swing) * 5,
      },
      local: {
        eye_0: eyeTf(t, 4, -0.5),
        eye_1: eyeTf(t, 4, -0.5),
        hand_0: { rot: -swing * 22, org: "50% 0%" },
        hand_1: { rot: swing * 22, org: "50% 0%" },
        ...duckBoots(swing * 34, -swing * 34, false).local,
      },
      detached: {},
      planted: [],
    };
  }

  if (t < MOUNT_T) {
    const u = clamp01((t - JUMP_T) / (MOUNT_T - JUMP_T));
    const tuck = Math.sin(Math.min(1, u * 1.3) * Math.PI);
    return {
      body: {
        rot: 4.5 - 4.5 * smooth((u - 0.7) / 0.3),
        sy: 1.04 - 0.1 * smooth((u - 0.82) / 0.18),
        sx: 1,
      },
      local: {
        eye_0: eyeTf(t, 3, -1),
        eye_1: eyeTf(t, 3, -1),
        hand_0: { rot: -40 + 22 * smooth((u - 0.55) / 0.45), org: "50% 0%" },
        hand_1: { rot: -36 + 20 * smooth((u - 0.55) / 0.45), org: "50% 0%" },
        ...duckBoots(-22 * tuck + 10 * smooth((u - 0.8) / 0.2), -18 * tuck + 8 * smooth((u - 0.8) / 0.2), false).local,
      },
      detached: {},
      planted: [],
    };
  }

  return getRideDuckPose(t);
};

export const getRideDuckPose = (t: number): DuckPoseSpec => {
  const sway = Math.sin(t * 6.2) * 1.1;
  return {
    body: { rot: sway },
    local: {
      eye_0: eyeTf(t, 3.2, 0),
      eye_1: eyeTf(t, 3.2, 0),
      hand_0: { rot: -18 + sway * 0.5, org: "50% 0%" },
      hand_1: { rot: -24 + sway * 0.5, org: "50% 0%" },
      boot_l: { rot: 6 + sway, org: "50% 0%" },
      boot_r: { rot: -4 - sway, org: "50% 0%" },
    },
    detached: {},
    planted: [],
  };
};

export const getHorsePose = (t: number): HorsePoseSpec => {
  const phase = (t / 0.62) * Math.PI * 2;
  const swing = Math.sin(phase);
  return {
    body: {
      rot: Math.sin(phase) * 1.3 - 0.7,
    },
    local: {
      leg_0: { rot: Math.sin(phase - 0.85) * 32, org: "50% 0%" },
      leg_1: { rot: swing * 34, org: "50% 0%" },
      leg_2: { rot: Math.sin(phase + 2.1) * 27, org: "50% 0%" },
      leg_3: { rot: Math.sin(phase + 1.25) * 27, org: "50% 0%" },
    },
    detached: {},
    planted: [],
  };
};

const BODY_ANCHOR = { x: 949, y: 1012 };

export const horseLowestHoofLocalY = (t: number) => {
  const pose = getHorsePose(t);
  const bodyRad = ((pose.body.rot ?? 0) * Math.PI) / 180;
  const bodyCos = Math.cos(bodyRad);
  const bodySin = Math.sin(bodyRad);
  let lowest = -Infinity;
  for (const name of ["leg_0", "leg_1", "leg_2", "leg_3"]) {
    const part = PARTS_HORSE[name];
    const legRad = ((pose.local[name]?.rot ?? 0) * Math.PI) / 180;
    const pivotX = part.x + HORSE_PART_OFFSET.x + part.w / 2;
    const pivotY = part.y + HORSE_PART_OFFSET.y;
    const hoofX = pivotX - Math.sin(legRad) * part.h;
    const hoofY = pivotY + Math.cos(legRad) * part.h;
    const vx = hoofX - BODY_ANCHOR.x;
    const vy = hoofY - BODY_ANCHOR.y;
    const rotatedY = vx * bodySin + vy * bodyCos + BODY_ANCHOR.y;
    lowest = Math.max(lowest, rotatedY + (pose.body.ty ?? 0));
  }
  return lowest;
};

const RidingDuck = ({
  t,
  layer,
}: {
  readonly t: number;
  readonly layer: "near" | "far";
}) => {
  const pose = getRideDuckPose(t);
  const ty = solveSeatY(SEAT, pose.body);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "669px 1130px",
        transform: `translate(${SEAT.tx}px, ${ty}px) rotate(${SEAT.rot}deg) scale(${SEAT.sx * SEAT.s}, ${SEAT.s})`,
      }}
    >
      <DuckRig
        pose="rest"
        spec={pose}
        layer={layer}
        splitAt={812}
        eyes="normal"
      />
    </div>
  );
};

export const HorseStage = ({
  t,
  rider,
  paper = false,
  x: xProp,
  scale = HORSE_SCALE,
  groundY = GROUND_Y,
}: {
  readonly t: number;
  readonly rider: boolean;
  readonly paper?: boolean;
  readonly x?: number;
  readonly scale?: number;
  readonly groundY?: number;
}) => {
  const x = xProp ?? horseBaseX(t);
  const left = x - HORSE_SADDLE_LOCAL_X * scale;
  const stageTop = groundY - horseLowestHoofLocalY(t) * scale;
  const stageStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: 1856,
    height: 1280,
    transformOrigin: "0 0",
    transform: `translate(${left}px, ${stageTop}px) scale(${scale})`,
    filter: paper
      ? "drop-shadow(4px 7px 0 rgba(42, 27, 20, 0.55)) drop-shadow(0 18px 20px rgba(20, 12, 8, 0.3)) drop-shadow(0 0 14px rgba(255, 213, 148, 0.28)) saturate(1.04) contrast(1.02)"
      : undefined,
  };
  return (
    <div style={stageStyle}>
      <HorseRig
        pose="rest"
        spec={getHorsePose(t)}
        mountBack={rider ? <RidingDuck t={t} layer="far" /> : null}
        mount={rider ? <RidingDuck t={t} layer="near" /> : null}
      />
    </div>
  );
};

export const DuckStage = ({
  t,
  paper = false,
}: {
  readonly t: number;
  readonly paper?: boolean;
}) => {
  const x = duckBaseX(t);
  const y = duckAnchorY(t);
  const left = x - DUCK_ANCHOR.x * DUCK_SCALE;
  const top = y - DUCK_ANCHOR.y * DUCK_SCALE;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1856,
        height: 1280,
        transformOrigin: "0 0",
        transform: `translate(${left}px, ${top}px) scale(${DUCK_SCALE})`,
        filter: paper
          ? "drop-shadow(4px 7px 0 rgba(42, 27, 20, 0.52)) drop-shadow(0 16px 18px rgba(20, 12, 8, 0.26)) drop-shadow(0 0 14px rgba(255, 213, 148, 0.3)) saturate(1.05) contrast(1.02)"
          : undefined,
      }}
    >
      <DuckRig
        pose="rest"
        spec={getDuckPose(t)}
        eyes={getDuckEyes(t)}
      />
    </div>
  );
};

export const duckFootScreenY = (t: number) =>
  duckAnchorY(t) + DUCK_ANCHOR_TO_FOOT * DUCK_SCALE;

export const duckScreenX = (t: number) =>
  duckBaseX(t) + (DUCK_BASE_X - DUCK_BASE_X);

export const duckStandAnchorY = DUCK_STAND_ANCHOR_Y;
