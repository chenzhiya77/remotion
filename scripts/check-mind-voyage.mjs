import assert from "node:assert/strict";
import {
  VOYAGE_DURATION,
  portalAt,
  stageAt,
  mindCameraAt,
  questionCoreAt,
  starAt,
  evidenceAt,
  FOREST,
  bloomAt,
} from "../src/mind-voyage-motion.ts";
assert.equal(VOYAGE_DURATION, 40);
assert.deepEqual(portalAt(5), portalAt(37));
assert.deepEqual(stageAt(0), stageAt(40));
for (const t of [9, 15, 20, 27, 32]) {
  const p = portalAt(t);
  assert.ok(p.w > 1250 && p.h > 700);
  const stage = stageAt(t);
  assert.ok(stage.scale * 260 >= 180);
}
let previous = mindCameraAt(8);
let maxStep = 0;
let maxCoreStep = 0;
let previousCore = questionCoreAt(8);
for (let f = 0; f <= 2400; f++) {
  const t = f / 60;
  const portal = portalAt(t);
  assert.ok(Object.values(portal).every(Number.isFinite));
  assert.ok(portal.w > 0 && portal.h > 0);
  const camera = mindCameraAt(t);
  const core = questionCoreAt(t);
  assert.ok(Object.values(camera).every(Number.isFinite));
  assert.ok(Object.values(core).every(Number.isFinite));
  if (t >= 8 && t <= 33) {
    assert.ok(camera.y + 1e-6 >= previous.y, `camera backtracks at ${t}`);
    maxStep = Math.max(
      maxStep,
      Math.hypot(camera.x - previous.x, camera.y - previous.y),
    );
    maxCoreStep = Math.max(
      maxCoreStep,
      Math.hypot(core.x - previousCore.x, core.y - previousCore.y),
    );
    const sx = 960 + (core.x - camera.x) * camera.zoom;
    const sy = 540 + (core.y - camera.y) * camera.zoom;
    assert.ok(
      sx > 120 && sx < 1800 && sy > 80 && sy < 1000,
      `core out of frame ${sx},${sy} at ${t}`,
    );
    previous = camera;
    previousCore = core;
  }
  for (let i = 0; i < 3; i++) {
    const e = evidenceAt(t, i);
    assert.ok(Object.values(e).every(Number.isFinite));
    assert.ok(e.alpha >= -1e-9 && e.alpha <= 1 + 1e-9);
  }
}
assert.ok(maxStep < 16, `camera step ${maxStep}`);
assert.ok(maxCoreStep < 20, `core step ${maxCoreStep}`);
assert.equal(evidenceAt(10, 0).alpha, 0);
assert.equal(evidenceAt(17, 1).alpha, 0);
assert.equal(evidenceAt(25, 2).alpha, 0);
assert.equal(evidenceAt(32, 2).alpha, 1);
assert.equal(bloomAt(16, 1), 0);
assert.equal(bloomAt(22, 2), 1);
assert.ok(FOREST.every((n) => n.label.length > 0));
assert.deepEqual(starAt(12, 8), starAt(12, 8));
console.log(
  `PASS: 2401 frames, closed-loop window/stage, forward-only descent, core in frame, finite evidence; max camera/core step ${maxStep.toFixed(2)}/${maxCoreStep.toFixed(2)}.`,
);
