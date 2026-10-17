// 开场（9s）运动数学：高处左鸭右流式问答同行 + 马从 0s 左入全程不停步 + 鸭失衡落下 → 落地零停顿跑动追马 → 动态跃上行进中的马 → 游标俯冲化作引路光轨 → 骑乘右行拉幕揭开 48s 入库正片。
import type { EyeState } from "./mascot/eye-states-manifest.ts";
import { DUCK_ANCHOR, PART_OFFSET, solveSeatY } from "./mascot/seat-solver.ts";
import { SEAT } from "./mascot/seat-config.ts";
import { PARTS_USER } from "./mascot/parts-user-manifest.ts";
import {
  globalCameraAt,
  mix,
  phase,
  progress,
  smooth,
  type Camera,
} from "./journey-motion.ts";

export type OpeningTheme = "parchment" | "dusk";

export const OPENING_DURATION = 9;
export const FILM_START = 5.0;

// 舞台：马的地面（stage y 1272）落在屏 GROUND_Y = 980。
export const GROUND_Y = 980;
export const GROUND_STAGE_Y = 1272;
export const STAGE_K = 0.38;
export const STAGE_OY = GROUND_Y - GROUND_STAGE_Y * STAGE_K;

// 高处左鸭右文同行带：鸭子位于屏幕靠左 x = 340，高度带与流式叙事文字同行（脚底 y ≈ 342，中心 y ≈ 265）。
export const DUCK_SCREEN_X = 340;
export const HOVER_TY = -1615;

// 马全程向右连续行进关键路标（全程 dx/dt > 0，绝无驻停死等）。
export const HORSE_START_X = -580;
export const HORSE_PASS_X = 280; // t=1.80s 经过鸭子下方并进入鸭子右侧
export const HORSE_MOUNT_X = 920; // t=4.25s 鸭子动态跃入马鞍时的马位
export const HORSE_PULL_X = 1210; // t=5.20s 踏亮地面引路光轨开始拉幕
export const HORSE_EXIT_X = 2420; // t=8.85s 驶出右画框

// 鸭身视觉中心（切件平移 + 鞍座缩放后）
const body = PARTS_USER.body;
const bodyCenterX = body.x + body.w / 2 + PART_OFFSET.x;
export const RIG_DUCK_CENTER_X =
  DUCK_ANCHOR.x + SEAT.sx * SEAT.s * (bodyCenterX - DUCK_ANCHOR.x);

// 高处流光书卷托羽屏 y：恰好托在开场高处站位鸭靴底面。
export const PEDESTAL_Y = Math.round(GROUND_Y + STAGE_K * (HOVER_TY - 63));

export const GROUND_TY = 63;
export const LAND_TY = solveSeatY(SEAT, {});

// 五拍连续时间轴锚点（秒）
export const ANTICIPATE_TIME = 1.68;
export const FALL_START = 1.8;
export const IMPACT = 2.12;
export const RUN_START = 2.38;
export const MOUNT_START = 3.15;
export const TOUCHDOWN = 4.25;
export const WALK_OUT = 5.2;

// 跑动追马结束、起跳瞬间的鸭子屏幕横坐标
export const RUN_END_SCREEN_X = 630;
export const STAND_TX =
  (DUCK_SCREEN_X - HORSE_PASS_X) / STAGE_K - RIG_DUCK_CENTER_X;

const EYE_SWAPS: ReadonlyArray<readonly [number, EyeState]> = [
  [0, "normal"],
  [0.24, "think"],
  [1.72, "wuyu"],
  [2.13, "zhuangsha"],
  [2.36, "normal"],
];

// 马的水平轨迹：C¹ 连续单调递增曲线（全程速度 > 220 px/s，永不刹停）。
export function horseX(time: number) {
  const t = Math.max(0, Math.min(OPENING_DURATION, time));
  // 基础常速巡航 + 入画轻快冲刺 + 拉幕提速
  const baseLinear = mix(HORSE_START_X, HORSE_EXIT_X, t / 8.85);
  const earlyBoost = 130 * Math.sin(progress(t, 0, 4.0) * Math.PI);
  const mountEase = -32 * Math.sin(progress(t, 1.8, 4.6) * Math.PI);
  const exitSurge = 68 * Math.sin(progress(t, WALK_OUT, 8.85) * Math.PI);
  if (t >= 8.85) {
    return HORSE_EXIT_X + (t - 8.85) * 280;
  }
  return baseLinear + earlyBoost + mountEase + exitSurge;
}

// 速度积分驱动的步伐相位：与马的真实位移严格成正比，绝不倒退、绝不滑步。
export function walkPhase(time: number) {
  const dist = Math.max(0, horseX(time) - HORSE_START_X);
  return (dist / 255) % 1;
}

// 鸭跃上马鞍落定瞬间（t=4.25s），马身顺势下沉接住重量。
export function horseSaddleDip(time: number) {
  const u = progress(time, TOUCHDOWN - 0.03, TOUCHDOWN + 0.28);
  return Math.sin(u * Math.PI) * 11.5;
}

export function horseSpec(time: number) {
  const wp = walkPhase(time) * Math.PI * 2;
  const swing = Math.sin(wp);
  const dip = horseSaddleDip(time);
  return {
    body: {
      ty: -Math.abs(swing) * 7.5 + dip,
      rot: swing * 1.35 - dip * 0.08,
    },
    local: {
      leg_0: { rot: -swing * 23, org: "50% 0%" },
      leg_1: { rot: swing * 23, org: "50% 0%" },
      leg_2: { rot: swing * 23, org: "50% 0%" },
      leg_3: { rot: -swing * 23, org: "50% 0%" },
    },
    detached: {},
    planted: [],
  };
}

// 鸭落地（2.12s）与跃上马鞍（4.25s）两次接触微震。
export function stageTremor(time: number) {
  const impactU = progress(time, IMPACT, IMPACT + 0.22);
  const impact = Math.sin(impactU * Math.PI * 2) * (1 - impactU) * 3.0;
  const saddleU = progress(time, TOUCHDOWN, TOUCHDOWN + 0.22);
  const saddle = Math.sin(saddleU * Math.PI * 2) * (1 - saddleU) * 2.2;
  return impact + saddle;
}

// 高处流光书卷托羽：开场轻盈呼吸浮动，鸭子跃下（1.80s）时化作书页光尘向右散开。
export function pedestalState(time: number) {
  const inP = phase(time, 0.0, 0.45);
  const outP = phase(time, ANTICIPATE_TIME, FALL_START + 0.18);
  const breath = Math.sin(time * 2.2) * 4 * (1 - outP);
  return {
    scaleX: (0.2 + 0.8 * inP) * (1 - outP * 0.85),
    shiftX: outP * 110,
    shiftY: breath + outP * 18,
    opacity: inP * (1 - outP),
    ripple: Math.sin(progress(time, IMPACT, IMPACT + 0.48) * Math.PI),
  };
}

// 落地与跑动追马期间的世界坐标微尘状态。
export function dustState(time: number) {
  const impactU = progress(time, IMPACT, IMPACT + 0.52);
  const runU = progress(time, RUN_START, MOUNT_START + 0.25);
  const impactOpacity = Math.sin(impactU * Math.PI) * 0.68;
  const runOpacity = Math.sin(runU * Math.PI) * 0.52;
  return {
    progress: Math.max(impactU, runU),
    opacity: Math.max(impactOpacity, runOpacity),
    spread: mix(16, 96, smooth(Math.max(impactU, runU))),
    lift: mix(0, -26, smooth(Math.max(impactU, runU))),
  };
}

export function duckEyes(time: number): EyeState {
  let state: EyeState = EYE_SWAPS[0][1];
  for (const [swapTime, next] of EYE_SWAPS) {
    if (time >= swapTime) state = next;
  }
  return state;
}

function swapBlinkAt(time: number) {
  let blink = 1;
  for (const [swapTime] of EYE_SWAPS.slice(1)) {
    const d = Math.abs(time - swapTime);
    if (d < 0.022) blink = Math.min(blink, 0.02);
    else if (d < 0.05) blink = Math.min(blink, 0.35);
  }
  return blink;
}

type DuckTf = {
  body: { rot?: number; sy?: number; sx?: number };
  bootL: number;
  bootR: number;
  armL: number;
  armR: number;
  hand1Tx?: number;
  hand1Ty?: number;
  blink: number;
};

function fallSpec(time: number): DuckTf {
  const u = progress(time, FALL_START, IMPACT);
  const boot = 12 + 10 * u + Math.sin(time * 54) * 4;
  const arm = -42 - 16 * u + Math.sin(time * 54) * 5;
  return {
    body: {
      sy: 1 + 0.11 * u,
      sx: 1 / (1 + 0.11 * u),
      rot: Math.sin(u * Math.PI * 1.5) * 2.5,
    },
    bootL: boot,
    bootR: boot * 0.85,
    armL: arm,
    armR: arm * 0.9,
    blink: swapBlinkAt(time),
  };
}

type CushionKey = { t: number; sy: number; rot: number; arm: number; boot: number };

const CUSHION: CushionKey[] = [
  { t: IMPACT, sy: 1.11, rot: 0, arm: -55, boot: 18 },
  { t: 2.18, sy: 0.85, rot: 3.2, arm: 26, boot: -8 },
  { t: 2.26, sy: 0.94, rot: 5.5, arm: -14, boot: 6 },
  { t: RUN_START, sy: 1.0, rot: 8.0, arm: 22, boot: -18 },
];

function cushionSpec(time: number): DuckTf {
  let a = CUSHION[0];
  let b = CUSHION[CUSHION.length - 1];
  for (let i = 0; i < CUSHION.length - 1; i++) {
    if (time >= CUSHION[i].t && time <= CUSHION[i + 1].t) {
      a = CUSHION[i];
      b = CUSHION[i + 1];
      break;
    }
  }
  const e = smooth(progress(time, a.t, b.t));
  const sy = mix(a.sy, b.sy, e);
  const boot = mix(a.boot, b.boot, e);
  const arm = mix(a.arm, b.arm, e);
  return {
    body: { sy, sx: 1 / sy, rot: mix(a.rot, b.rot, e) },
    bootL: boot,
    bootR: -boot * 0.85,
    armL: arm,
    armR: -arm * 0.9,
    blink: swapBlinkAt(time),
  };
}

// Beat 3（2.38s..3.15s）：落地零停顿，迈步向右快跑追马。
function runUpSpec(time: number): DuckTf {
  const u = progress(time, RUN_START, MOUNT_START);
  const cycle = u * Math.PI * 2 * 2.5; // 2.5 个完整冲刺步周期
  const stride = Math.sin(cycle);
  const bounce = Math.abs(Math.cos(cycle));
  const sy = 0.96 + 0.06 * bounce;
  const lean = mix(8.0, 9.5, Math.sin(u * Math.PI));
  return {
    body: { sy, sx: 1 / sy, rot: lean + stride * 2.2 },
    bootL: -stride * 28,
    bootR: stride * 28,
    armL: stride * 30,
    armR: -stride * 30,
    blink: swapBlinkAt(time),
  };
}

type MountKey = { f: number; rot: number; boot: number; arm: number };

const MOUNT_POSE: MountKey[] = [
  { f: 0, rot: 8, boot: -16, arm: 18 },
  { f: 5, rot: -2, boot: -20, arm: 24 },
  { f: 12, rot: 5, boot: 24, arm: -30 },
  { f: 20, rot: 7, boot: -22, arm: -42 },
  { f: 28, rot: 4, boot: -12, arm: -28 },
  { f: 33, rot: 0, boot: 8, arm: -4 },
  { f: 42, rot: 0, boot: 0, arm: 0 },
];

function mountPose(f: number) {
  if (f >= MOUNT_POSE[MOUNT_POSE.length - 1].f) return MOUNT_POSE[MOUNT_POSE.length - 1];
  let a = MOUNT_POSE[0];
  let b = MOUNT_POSE[MOUNT_POSE.length - 1];
  for (let i = 0; i < MOUNT_POSE.length - 1; i++) {
    if (f >= MOUNT_POSE[i].f && f <= MOUNT_POSE[i + 1].f) {
      a = MOUNT_POSE[i];
      b = MOUNT_POSE[i + 1];
      break;
    }
  }
  const e = smooth(progress(f, a.f, b.f));
  return {
    rot: mix(a.rot, b.rot, e),
    boot: mix(a.boot, b.boot, e),
    arm: mix(a.arm, b.arm, e),
  };
}

// MountUp 的 30fps 帧号：t=3.15s 为 f=0，t=4.25s 落鞍为 f=33。
export function mountFrame(time: number) {
  return (time - MOUNT_START) * 30;
}

// 鸭子在屏幕空间的期望横坐标（0..4.25s），用于反解 stage 内部 tx，保证五拍边界零跳变。
export function duckTargetScreenX(time: number) {
  if (time <= RUN_START) return DUCK_SCREEN_X;
  if (time <= MOUNT_START) {
    const u = smooth(progress(time, RUN_START, MOUNT_START));
    return mix(DUCK_SCREEN_X, RUN_END_SCREEN_X, u);
  }
  const saddleScreenX = horseX(time) + STAGE_K * (RIG_DUCK_CENTER_X + SEAT.tx);
  if (time <= TOUCHDOWN) {
    const u = smooth(progress(time, MOUNT_START, TOUCHDOWN));
    return mix(RUN_END_SCREEN_X, saddleScreenX, u);
  }
  return saddleScreenX;
}

// 鸭的全部 tx/ty 由这里负责（五拍交接处严格 C⁰ 连续）。
export function seatTransform(time: number) {
  const txFromScreen = (screenX: number) =>
    (screenX - horseX(time)) / STAGE_K - RIG_DUCK_CENTER_X;

  const hoverWave =
    Math.sin(time * 2.2) * 5 * (1 - progress(time, ANTICIPATE_TIME, FALL_START));
  if (time < FALL_START) {
    return { tx: txFromScreen(DUCK_SCREEN_X), ty: HOVER_TY + hoverWave };
  }
  if (time < IMPACT) {
    const u = progress(time, FALL_START, IMPACT);
    return {
      tx: txFromScreen(DUCK_SCREEN_X),
      ty: mix(HOVER_TY, GROUND_TY, u * u),
    };
  }
  if (time < RUN_START) {
    return { tx: txFromScreen(DUCK_SCREEN_X), ty: GROUND_TY };
  }
  if (time < MOUNT_START) {
    const u = progress(time, RUN_START, MOUNT_START);
    const hop = Math.abs(Math.sin(u * Math.PI * 2 * 2.5)) * 18 * Math.sin(u * Math.PI);
    return {
      tx: txFromScreen(duckTargetScreenX(time)),
      ty: GROUND_TY - hop,
    };
  }
  if (time < TOUCHDOWN) {
    const u = progress(time, MOUNT_START, TOUCHDOWN);
    const apex = LAND_TY - 92;
    const ty =
      u < 0.72
        ? GROUND_TY + (apex - GROUND_TY) * (1 - (1 - u / 0.72) ** 2)
        : apex + (LAND_TY - apex) * ((u - 0.72) / 0.28) ** 2;
    return { tx: txFromScreen(duckTargetScreenX(time)), ty };
  }
  return { tx: SEAT.tx, ty: LAND_TY };
}

export function duckSpec(time: number) {
  const naturalBlink = (c: number) => (Math.abs(time - c) < 0.04 ? 0.14 : 1);
  if (time < FALL_START) {
    // 0..1.68s 高处思考呼吸，右手微抬指向右侧流式生长的问题；1.68..1.80s 察觉马经过、低头预备跃下。
    const calm = 1 - progress(time, ANTICIPATE_TIME, FALL_START);
    const wobbleRamp = progress(time, ANTICIPATE_TIME, FALL_START);
    const wobble = Math.sin(wobbleRamp * Math.PI * 2) * 3.5 * wobbleRamp;
    const gesture = phase(time, 0.25, 0.75) * calm;
    const blink = Math.min(naturalBlink(0.95), swapBlinkAt(time));
    return {
      body: { rot: Math.sin(time * 1.6) * 1.6 * calm + 2.2 * gesture + wobble },
      local: {
        eye_0: { sy: blink },
        eye_1: { sy: blink },
        boot_l: { rot: wobble * 1.4, org: "50% 0%" },
        boot_r: { rot: -wobble * 1.2, org: "50% 0%" },
        hand_0: { rot: Math.sin(time * 1.8) * 3 * calm - 12 * wobbleRamp, org: "50% 0%" },
        hand_1: {
          tx: -10 * gesture,
          ty: -48 * gesture,
          rot: -18 * gesture + Math.sin(time * 2.4) * 4 * calm,
          org: "50% 0%",
        },
      },
      detached: {},
      planted: [],
    };
  }
  const pose: DuckTf =
    time < IMPACT
      ? fallSpec(time)
      : time < RUN_START
        ? cushionSpec(time)
        : time < MOUNT_START
          ? runUpSpec(time)
          : ((): DuckTf => {
              const f = mountFrame(time);
              const p = mountPose(f);
              let sy = 1;
              if (f < 5) sy = 1 - 0.06 * smooth(f / 5);
              else if (f >= 30 && f <= 44) {
                sy = 1 - 0.025 * Math.sin(Math.PI * Math.min(1, Math.max(0, (f - 30) / 14)));
              }
              const rideBlend =
                phase(time, TOUCHDOWN, TOUCHDOWN + 0.35) * (1 - progress(time, 8.55, 8.85));
              const wp = walkPhase(time) * Math.PI * 2;
              const rideSwing = Math.sin(wp) * rideBlend;
              const footSwing = Math.sin(wp - 0.5) * 6.8 * rideBlend;
              const waveEnv = Math.sin(progress(time, 4.55, 6.15) * Math.PI);
              const waveWiggle = Math.sin((time - 4.55) * 14) * 8 * waveEnv;
              return {
                body: { rot: p.rot + rideSwing * 3.1, sy, sx: 1 / sy },
                bootL: p.boot + footSwing,
                bootR: p.boot * 0.85 - footSwing,
                armL: p.arm - rideSwing * 4.2,
                armR: p.arm * 0.9 - 22 * waveEnv + waveWiggle,
                hand1Tx: -18 * waveEnv,
                hand1Ty: -120 * waveEnv,
                blink: Math.min(naturalBlink(5.6), naturalBlink(7.1), swapBlinkAt(time)),
              };
            })();
  return {
    body: pose.body,
    local: {
      eye_0: { sy: pose.blink },
      eye_1: { sy: pose.blink },
      boot_l: { rot: pose.bootL, org: "50% 0%" },
      boot_r: { rot: pose.bootR, org: "50% 0%" },
      hand_0: { rot: pose.armL, org: "50% 0%" },
      hand_1: {
        tx: pose.hand1Tx,
        ty: pose.hand1Ty,
        rot: pose.armR,
        org: "50% 0%",
      },
    },
    detached: {},
    planted: time >= IMPACT && time < RUN_START ? ["boot_l", "boot_r"] : [],
  };
}

export function sheetTranslate(time: number) {
  return 1940 * phase(time, WALK_OUT, 8.9);
}

export function sheetEdgeX(time: number) {
  return sheetTranslate(time);
}

// 流式双行主叙事状态：第一句提问（0.12..1.85s）+ 第二句启程回答（2.15..4.25s）+ 游标俯冲引路丝线（4.25..5.20s）。
export function streamState(time: number) {
  const qProgress = smooth(progress(time, 0.12, 1.85));
  const aProgress = smooth(progress(time, 2.15, TOUCHDOWN));
  const outAmount = phase(time, WALK_OUT + 0.15, 6.85);
  const badgeIn = phase(time, 0.05, 0.55);

  // 引导游标位置（画卷内部坐标）：写第一句 -> 换行写第二句 -> 4.25..5.18s 沿贝塞尔弧线俯冲至马蹄前地面
  const diveU = smooth(progress(time, TOUCHDOWN, WALK_OUT - 0.02));
  let sparkX = mix(495, 1185, qProgress);
  let sparkY = 236;
  if (time >= 2.05 && time < TOUCHDOWN) {
    sparkX = mix(495, 1028, aProgress);
    sparkY = 318;
  } else if (time >= TOUCHDOWN) {
    const p0x = 1028;
    const p0y = 318;
    const p1x = 1320;
    const p1y = 410;
    const p2x = horseX(WALK_OUT) + 340;
    const p2y = GROUND_Y - 2;
    const omt = 1 - diveU;
    sparkX = omt * omt * p0x + 2 * omt * diveU * p1x + diveU * diveU * p2x;
    sparkY = omt * omt * p0y + 2 * omt * diveU * p1y + diveU * diveU * p2y;
  }

  return {
    opacity: badgeIn * (1 - outAmount),
    y: mix(16, 0, badgeIn) - 14 * outAmount,
    questionProgress: qProgress,
    answerProgress: aProgress,
    diveProgress: diveU,
    sparkX,
    sparkY,
    sparkOpacity:
      phase(time, 0.1, 0.28) * (1 - phase(time, WALK_OUT + 0.15, WALK_OUT + 0.55)),
  };
}

// 兼容旧导出名
export function titleState(time: number) {
  const s = streamState(time);
  return { opacity: s.opacity, y: s.y };
}

// 中景知识手稿残页状态：自身呼吸漂浮 + 骏马奔过时的气流尾流吹拂（Wake Impulse）。
export type ManuscriptCardState = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  scale: number;
  opacity: number;
};

const MANUSCRIPT_SEEDS = [
  { id: 0, baseX: 210, baseY: 540, w: 112, h: 146, baseRot: -11, depth: 0.78 },
  { id: 1, baseX: 560, baseY: 610, w: 128, h: 164, baseRot: 8, depth: 0.92 },
  { id: 2, baseX: 890, baseY: 515, w: 118, h: 152, baseRot: -6, depth: 0.84 },
  { id: 3, baseX: 1230, baseY: 590, w: 136, h: 174, baseRot: 12, depth: 0.96 },
  { id: 4, baseX: 1540, baseY: 485, w: 116, h: 148, baseRot: -9, depth: 0.8 },
  { id: 5, baseX: 1760, baseY: 635, w: 104, h: 134, baseRot: 15, depth: 0.74 },
] as const;

export function manuscriptFieldState(time: number): ManuscriptCardState[] {
  const horseFrontX = horseX(time) + 420;
  const slide = sheetTranslate(time);
  return MANUSCRIPT_SEEDS.map((m, idx) => {
    // 当马头掠过手稿横坐标时触发气流冲量
    const dist = horseFrontX - m.baseX;
    const wakeWindow = dist > -90 && dist < 520 ? Math.sin(progress(dist, -90, 520) * Math.PI) : 0;
    const duckDropGuest =
      idx === 0 ? Math.sin(progress(time, FALL_START, IMPACT + 0.35) * Math.PI) * 26 : 0;
    const floatX = Math.sin(time * 1.15 + idx * 1.3) * 14 * m.depth;
    const floatY = Math.cos(time * 1.45 + idx * 0.9) * 18 * m.depth;
    const wakeX = wakeWindow * 64 * m.depth;
    const wakeY = -wakeWindow * 48 * m.depth + duckDropGuest;
    const wakeRot = wakeWindow * (idx % 2 === 0 ? -18 : 22);
    return {
      id: m.id,
      x: m.baseX - slide * 0.35 + floatX + wakeX,
      y: m.baseY + floatY + wakeY,
      w: m.w,
      h: m.h,
      rot: m.baseRot + Math.sin(time * 0.9 + idx) * 4 + wakeRot,
      scale: m.depth + wakeWindow * 0.06,
      opacity: (0.42 + 0.22 * m.depth + wakeWindow * 0.18) * (1 - phase(time, 7.6, 8.7)),
    };
  });
}

// 底层正片时钟与镜头：5.0s 起预滚 KnowledgeJourney 首幕，镜头在 8.9s 帧级锁入正片轨迹。
export function journeyTimeAt(time: number) {
  return Math.max(0, (time - FILM_START) * 0.75);
}

export function openingWorldCamera(time: number): Camera {
  const jt = journeyTimeAt(time);
  const base = globalCameraAt(jt);
  const reveal = phase(time, WALK_OUT, 8.9);
  return {
    x: base.x + mix(-45, 0, reveal),
    y: base.y + mix(18, 0, reveal),
    zoom: base.zoom * mix(0.94, 1, reveal),
    roll: base.roll + mix(-1.2, 0, reveal),
  };
}
