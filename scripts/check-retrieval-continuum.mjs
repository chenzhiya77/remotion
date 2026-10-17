import assert from "node:assert/strict";
import { cameraAt, sourceAt, worldToScreen } from "../src/journey-motion.ts";
import {
  ENDING_DURATION,
  FILM_DURATION,
  retrievalCameraAt,
  retrievalSourceAt,
  evidencePose,
  questionPose,
  EVIDENCE_DOCKS,
  graphNodeAt,
  QUERY,
} from "../src/retrieval-continuum-motion.ts";

assert.equal(ENDING_DURATION, 20);
assert.equal(FILM_DURATION, 68);
assert.deepEqual(retrievalCameraAt(0), cameraAt(28));
for (let i = 0; i < 3; i++)
  assert.deepEqual(retrievalSourceAt(0, i), sourceAt(28, i));
assert.equal(questionPose(0).alpha, 0);
assert.equal(QUERY.includes("失败"), true);
let maxCameraStep = 0;
let maxEvidenceStep = 0;
let previous = retrievalCameraAt(0);
let last = [0, 1, 2].map((i) => evidencePose(0, i));
for (let f = 0; f <= ENDING_DURATION * 60; f++) {
  const t = f / 60;
  const c = retrievalCameraAt(t);
  assert.ok(Object.values(c).every(Number.isFinite));
  assert.ok(c.zoom >= 0.55 && c.zoom <= 1.3, `zoom ${c.zoom} at ${t}`);
  maxCameraStep = Math.max(
    maxCameraStep,
    Math.hypot(c.x - previous.x, c.y - previous.y),
  );
  for (let i = 0; i < 3; i++) {
    const p = evidencePose(t, i);
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(p.alpha >= -1e-9 && p.alpha <= 1 + 1e-9);
    maxEvidenceStep = Math.max(
      maxEvidenceStep,
      Math.hypot(p.x - last[i].x, p.y - last[i].y),
    );
    if (t >= 16.5) {
      assert.equal(p.alpha, 1);
      assert.equal(p.x, EVIDENCE_DOCKS[i].x);
      assert.equal(p.y, EVIDENCE_DOCKS[i].y);
      for (const dx of [-232.5, 232.5])
        for (const dy of [-140, 140]) {
          const corner = worldToScreen({ x: p.x + dx, y: p.y + dy }, c);
          assert.ok(
            corner.x > 85 &&
              corner.x < 1835 &&
              corner.y > 300 &&
              corner.y < 700,
            `final evidence ${i} corner ${JSON.stringify(corner)} at ${t}`,
          );
        }
    }
    last[i] = p;
  }
  previous = c;
}
assert.ok(maxCameraStep < 23, `camera step ${maxCameraStep}`);
assert.ok(maxEvidenceStep < 32, `evidence step ${maxEvidenceStep}`);
for (let i = 0; i < 2; i++) {
  assert.equal(graphNodeAt(0, i).alpha, 0);
  assert.equal(graphNodeAt(10, i).alpha, 1);
}
console.log(
  `PASS: 1201 frames; exact camera/source seam; finite motion; three evidence docks within safe area; max camera step ${maxCameraStep.toFixed(2)}, evidence step ${maxEvidenceStep.toFixed(2)} world px.`,
);
