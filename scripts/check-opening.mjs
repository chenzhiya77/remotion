// 开场（9s）运动守卫：五拍连续时间线、马从 0s 起全程不停步（walkPhase 零倒退）、高处左鸭同行钉屏、眨眼换眼态、坠落→回弹→跑动追马→动态跃乘相位连续、流式叙事与游标俯冲引路、中景手稿尾流与灰布揭幕交接。
// 跑法：node scripts/check-opening.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DUCK_SCREEN_X,
  FALL_START,
  FILM_START,
  GROUND_TY,
  GROUND_Y,
  HORSE_EXIT_X,
  HORSE_START_X,
  HOVER_TY,
  IMPACT,
  LAND_TY,
  MOUNT_START,
  OPENING_DURATION,
  PEDESTAL_Y,
  RIG_DUCK_CENTER_X,
  RUN_END_SCREEN_X,
  RUN_START,
  STAGE_K,
  STAGE_OY,
  TOUCHDOWN,
  WALK_OUT,
  duckEyes,
  duckSpec,
  duckTargetScreenX,
  dustState,
  horseSpec,
  horseX,
  journeyTimeAt,
  manuscriptFieldState,
  mountFrame,
  openingWorldCamera,
  pedestalState,
  seatTransform,
  sheetEdgeX,
  sheetTranslate,
  stageTremor,
  streamState,
} from "../src/opening-motion.ts";
import { globalCameraAt } from "../src/journey-motion.ts";
import { PARTS_USER } from "../src/mascot/parts-user-manifest.ts";
import { DUCK_ANCHOR, PART_OFFSET } from "../src/mascot/seat-solver.ts";
import { SEAT } from "../src/mascot/seat-config.ts";

const EPS = 1e-6;
const sampleTimes = (start, end, step) => {
  const out = [];
  for (let t = start; t <= end + EPS; t += step) out.push(Math.round(t * 1e6) / 1e6);
  if (Math.abs((out.at(-1) ?? start) - end) > 1e-5) out.push(end);
  return out;
};
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const deepFinite = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return finite(value);
  if (typeof value === "object") return Object.values(value).every(deepFinite);
  return true;
};

// ── 1. 马从 t=0s 起全程向右连续行进（零死等、walkPhase 零倒退）──
assert.equal(horseX(0), HORSE_START_X, "horse starts walking from t=0s at HORSE_START_X");
assert.equal(horseX(8.85), HORSE_EXIT_X, "pair exits past the right edge by 8.85s");
const horseSamples = sampleTimes(0, 8.85, 0.02);
for (let i = 1; i < horseSamples.length; i++) {
  const t0 = horseSamples[i - 1];
  const t1 = horseSamples[i];
  const dx = horseX(t1) - horseX(t0);
  const vel = dx / (t1 - t0);
  assert.ok(vel > 180, `horse must never stall (t=${t1}, vel=${vel.toFixed(1)} px/s)`);
}

// ── 2. 高处左鸭右流式问答同行（0..1.80s 鸭子钉在左侧 DUCK_SCREEN_X = 340）──
assert.equal(DUCK_SCREEN_X, 340, "duck positioned on the upper-left side of the title row");
for (const t of sampleTimes(0.1, FALL_START - 0.02, 0.08)) {
  const seat = seatTransform(t);
  const screenX = horseX(t) + STAGE_K * (RIG_DUCK_CENTER_X + seat.tx);
  assert.ok(Math.abs(screenX - DUCK_SCREEN_X) < 1e-3, `hover duck drifts at t=${t}: ${screenX}`);
  assert.ok(Math.abs(seat.ty - HOVER_TY) <= 5 + EPS, `hover height off at t=${t}`);
}
assert.equal(streamState(0.05).questionProgress, 0, "question starts streaming right after 0.12s");
assert.equal(streamState(1.9).questionProgress, 1, "first question line finished by 1.9s");
assert.equal(streamState(2.1).answerProgress, 0, "second line starts as duck lands/runs");
assert.equal(streamState(TOUCHDOWN).answerProgress, 1, "second line completes right at saddle touchdown");
assert.equal(streamState(WALK_OUT).diveProgress, 1, "leading spark dives to ground cord by WALK_OUT");

// ── 3. 五拍相位边界零跳变（hover -> fall -> cushion -> runUp -> mount -> ride）──
const seam = (t, label) => {
  const a = seatTransform(t - 1e-6);
  const b = seatTransform(t + 1e-6);
  assert.ok(Math.abs(a.tx - b.tx) < 0.02, `${label}: tx jumps ${a.tx} -> ${b.tx}`);
  assert.ok(Math.abs(a.ty - b.ty) < 0.02, `${label}: ty jumps ${a.ty} -> ${b.ty}`);
};
seam(FALL_START, "hover->fall");
seam(IMPACT, "fall->cushion");
seam(RUN_START, "cushion->runUp");
seam(MOUNT_START, "runUp->mount");
seam(TOUCHDOWN, "mount->ride");

// ── 4. 落下单调、跑动追马单调向前、动态跃乘落入移动马鞍 ──
const fall = sampleTimes(FALL_START, IMPACT, 1 / 120).map((t) => seatTransform(t).ty);
for (let i = 1; i < fall.length; i++) assert.ok(fall[i] >= fall[i - 1] - EPS, "fall must go down only");
assert.ok(Math.abs(fall[0] - HOVER_TY) < 1e-3, "fall starts at hover height");
assert.ok(Math.abs(fall.at(-1) - GROUND_TY) < 1e-3, "fall ends on the ground");

const runXs = sampleTimes(RUN_START, MOUNT_START, 1 / 120).map((t) => duckTargetScreenX(t));
for (let i = 1; i < runXs.length; i++) {
  assert.ok(runXs[i] >= runXs[i - 1] - EPS, "run-up must advance right toward the moving horse");
}
assert.ok(Math.abs(runXs[0] - DUCK_SCREEN_X) < 1e-3, "run-up starts at landing X");
assert.ok(Math.abs(runXs.at(-1) - RUN_END_SCREEN_X) < 1e-3, "run-up reaches take-off X");

for (const t of sampleTimes(TOUCHDOWN, OPENING_DURATION, 0.2)) {
  const seat = seatTransform(t);
  assert.ok(Math.abs(seat.tx - SEAT.tx) < 1e-3, `duck must stay seated after touchdown (t=${t})`);
  assert.ok(Math.abs(seat.ty - LAND_TY) < 1e-3, `seat height must match saddle solver (t=${t})`);
}
assert.ok(Math.abs(mountFrame(MOUNT_START)) < EPS, "mount clock starts at MOUNT_START");
assert.ok(Math.abs(mountFrame(TOUCHDOWN) - 33) < 1e-9, "mount touches down at frame 33");

// ── 5. 眨眼换眼态（normal -> think -> wuyu -> zhuangsha -> normal）+ 跑动步频 + 骑乘随动 ──
assert.equal(duckEyes(0.1), "normal");
assert.equal(duckEyes(0.8), "think");
assert.equal(duckEyes(1.9), "wuyu");
assert.equal(duckEyes(2.22), "zhuangsha");
assert.equal(duckEyes(2.8), "normal");
for (const swapT of [0.24, 1.72, 2.13, 2.36]) {
  assert.ok(duckSpec(swapT).local.eye_0.sy <= 0.05, `eye swap at t=${swapT} must be hidden inside a blink`);
}
const runSampleA = duckSpec(2.48);
const runSampleB = duckSpec(2.63);
assert.ok(
  (runSampleA.local.boot_l.rot ?? 0) * (runSampleB.local.boot_l.rot ?? 0) < 0,
  "duck boots must alternate strides during run-up",
);
const rideSample = duckSpec(5.4);
assert.ok(Math.abs(rideSample.body.rot ?? 0) > 0.1, "riding duck body must rock with horse gait");
assert.ok(Math.abs(rideSample.local.boot_l.rot ?? 0) > 0.1, "riding duck boots must swing with horse gait");

// ── 6. 灰布揭幕与正片镜头交接：先盖满、后走光、揭幕期鸭马始终在布上 ──
for (const t of sampleTimes(0, OPENING_DURATION, 0.05)) {
  const edge = sheetEdgeX(t);
  assert.ok(finite(edge) && edge >= 0 - EPS, `sheet edge must start at the left (t=${t})`);
  if (t <= WALK_OUT + EPS) assert.ok(edge <= 0 + EPS, `sheet must cover the screen until WALK_OUT (t=${t})`);
  assert.ok(edge + 3800 >= 1920, `sheet must stay wide enough to leave right (t=${t})`);
}
assert.ok(sheetEdgeX(8.9) >= 1920 - 1e-3, "sheet fully swept off-screen by 8.9s");
assert.equal(sheetTranslate(FILM_START), 0, "the 48s film starts behind an unmoved cloth");
for (const t of sampleTimes(WALK_OUT, 8.85, 0.05)) {
  assert.ok(horseX(t) >= sheetEdgeX(t) - EPS, `pair fell behind the cloth hem (t=${t})`);
}
assert.ok(horseX(8.85) > 1920, "pair is off-screen before the opening ends");
assert.ok(FILM_START < WALK_OUT, "film already running behind the cloth when the pull begins");
const camEnd = openingWorldCamera(8.95);
const camRef = globalCameraAt(journeyTimeAt(8.95));
assert.ok(Math.abs(camEnd.x - camRef.x) < 1e-6 && Math.abs(camEnd.zoom - camRef.zoom) < 1e-6, "camera locks to KnowledgeJourney");

// ── 7. 姿势、手稿场与舞台辅助数据全部有限 ──
for (const t of sampleTimes(0, OPENING_DURATION, 0.05)) {
  assert.ok(deepFinite(horseSpec(t)), `horseSpec not finite at t=${t}`);
  assert.ok(deepFinite(duckSpec(t)), `duckSpec not finite at t=${t}`);
  assert.ok(deepFinite(seatTransform(t)), `seatTransform not finite at t=${t}`);
  assert.ok(deepFinite(pedestalState(t)), `pedestalState not finite at t=${t}`);
  assert.ok(deepFinite(dustState(t)), `dustState not finite at t=${t}`);
  assert.ok(deepFinite(streamState(t)), `streamState not finite at t=${t}`);
  assert.ok(deepFinite(manuscriptFieldState(t)), `manuscriptFieldState not finite at t=${t}`);
  assert.ok(finite(stageTremor(t)), `stageTremor not finite at t=${t}`);
}

// ── 8. 音轨与画面同长（9s / 48kHz 立体声）──
const wav = readFileSync(new URL("../public/opening-sound.wav", import.meta.url));
assert.equal(wav.toString("ascii", 0, 4), "RIFF");
assert.equal(wav.toString("ascii", 8, 12), "WAVE");
assert.equal(wav.readUInt32LE(24), 48_000, "sample rate");
assert.equal(wav.readUInt16LE(22), 2, "stereo");
assert.equal(wav.readUInt16LE(34), 24, "24-bit");
const seconds = wav.readUInt32LE(40) / wav.readUInt32LE(28);
assert.ok(Math.abs(seconds - OPENING_DURATION) < 1e-9, `audio length ${seconds}s != opening ${OPENING_DURATION}s`);

// ── 9. 落地脚底正好踩在地面线上、高处脚底正好踩在托羽上 ──
const boot = PARTS_USER.boot_l;
const bootBottomStage =
  DUCK_ANCHOR.y + SEAT.s * (boot.y + boot.h + PART_OFFSET.y - DUCK_ANCHOR.y) + GROUND_TY;
const bootBottomScreen = STAGE_OY + STAGE_K * bootBottomStage;
assert.ok(
  Math.abs(bootBottomScreen - GROUND_Y) < 1,
  `duck feet ${bootBottomScreen.toFixed(2)} must land on the ground line ${GROUND_Y}`,
);
const hoverBottomScreen = STAGE_OY + STAGE_K * (bootBottomStage - GROUND_TY + HOVER_TY);
assert.ok(
  Math.abs(hoverBottomScreen - PEDESTAL_Y) < 1.5,
  `hover duck feet ${hoverBottomScreen.toFixed(2)} must rest on perch ${PEDESTAL_Y}`,
);

console.log(
  `PASS: continuous 5-beat opening, zero horse stall, run-up & dynamic mount, streaming copy + guide thread, manuscript wake field, ${OPENING_DURATION}s audio (${seconds}s wav).`,
);
console.log(
  `Numbers: DUCK_SCREEN_X ${DUCK_SCREEN_X} | RUN_END_SCREEN_X ${RUN_END_SCREEN_X} | LAND_TY ${LAND_TY.toFixed(1)} | PEDESTAL_Y ${PEDESTAL_Y} | sheet sweep ${sheetEdgeX(0)} -> ${sheetEdgeX(8.9).toFixed(1)}.`,
);
