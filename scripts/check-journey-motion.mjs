import assert from "node:assert/strict";
import {
  ANSWER,
  USER_BOX,
  HARNESS_BOX,
  CORE,
  FRONT_DURATION,
  INGEST_DURATION,
  PET,
  QUERY_DURATION,
  SHEETS,
  TOOL_CARDS,
  USER,
  WIKI,
  cameraAt,
  frontCameraAt,
  frontChunkAt,
  globalCameraAt,
  provenance,
  queryCameraAt,
  queryEvidencePacket,
  queryLaneRequest,
  sourceAt,
  tokenAt,
  worldToScreen,
} from "../src/journey-motion.ts";
import {
  ACTION_AT,
  FLIGHT_END,
  FLIGHT_START,
  PROBE_ORIGIN,
  PROBE_TARGET,
  RETURN_END,
  RETURN_START,
  SEARCH_DURATION,
  evidenceAt,
  probePose,
  searchCameraAt,
  trailPoint,
} from "../src/query-search-motion.ts";
import { v2CameraAt } from "../src/query-v2-motion.ts";

assert.equal(INGEST_DURATION, FRONT_DURATION + 28);
assert.equal(QUERY_DURATION, 32);

// Seam must be frame-identical: front hand-off equals the journey's opening pose.
assert.deepEqual(frontCameraAt(FRONT_DURATION), cameraAt(0));
for (let i = 0; i < 3; i++) {
  assert.deepEqual(frontChunkAt(FRONT_DURATION, i), sourceAt(0, i));
}

function sweepCamera(cameraFn, frames) {
  let maxStep = 0;
  let previous = cameraFn(0);
  for (let frame = 0; frame <= frames; frame++) {
    const camera = cameraFn(frame / 60);
    assert.ok(Object.values(camera).every(Number.isFinite));
    assert.ok(camera.zoom > 0.34 && camera.zoom <= 2, `zoom at ${frame / 60}`);
    maxStep = Math.max(
      maxStep,
      Math.hypot(camera.x - previous.x, camera.y - previous.y),
    );
    previous = camera;
  }
  return maxStep;
}

const ingestStep = sweepCamera(globalCameraAt, INGEST_DURATION * 60);
assert.ok(ingestStep < 12, `ingest camera jumps ${ingestStep}`);

let maxTokenStep = 0;
const previousTokens = [0, 1, 2].map((_, i) => frontChunkAt(0, i));
for (let frame = 0; frame <= INGEST_DURATION * 60; frame++) {
  const time = frame / 60;
  const camera = globalCameraAt(time);
  const jt = time - FRONT_DURATION;
  for (let i = 0; i < 3; i++) {
    const pose =
      time < FRONT_DURATION ? frontChunkAt(time, i) : sourceAt(jt, i);
    assert.ok(
      pose.alpha >= -1e-9 && pose.alpha <= 1 + 1e-9,
      `alpha ${pose.alpha} at ${time}`,
    );
    maxTokenStep = Math.max(
      maxTokenStep,
      Math.hypot(pose.x - previousTokens[i].x, pose.y - previousTokens[i].y),
    );
    previousTokens[i] = pose;
    if (jt >= 16) {
      assert.deepEqual(provenance(jt, i).end, CORE);
    }
    if (pose.alpha > 0.5 && time < FRONT_DURATION) {
      const hero = worldToScreen(pose, camera);
      assert.ok(
        hero.x > 150 && hero.x < 1770,
        `hero ${i} x=${hero.x} at ${time}`,
      );
      assert.ok(
        hero.y > 120 && hero.y < 900,
        `hero ${i} y=${hero.y} at ${time}`,
      );
    }
  }
}
assert.ok(maxTokenStep < 16, `token jumps ${maxTokenStep}`);

const opening = frontCameraAt(0);
for (let i = 0; i < SHEETS.length; i++) {
  const point = worldToScreen({ x: SHEETS[i].x, y: SHEETS[i].y }, opening);
  assert.ok(point.x > 200 && point.x < 1720, `sheet ${i} x=${point.x}`);
  assert.ok(point.y > 180 && point.y < 880, `sheet ${i} y=${point.y}`);
}
for (let time = 6; time <= 15; time += 0.25) {
  const hero = worldToScreen(tokenAt(time, 0), cameraAt(time));
  assert.ok(hero.x > 150 && hero.x < 1770 && hero.y > 110 && hero.y < 910);
}

// ── Query film ──
const queryStep = sweepCamera(queryCameraAt, QUERY_DURATION * 60);
assert.ok(queryStep < 12, `query camera jumps ${queryStep}`);

const inFrame = (point, camera, slack = 140) => {
  const p = worldToScreen(point, camera);
  return (
    p.x > -slack && p.x < 1920 + slack && p.y > -slack && p.y < 1080 + slack
  );
};
const notInFrame = (point, camera) => !inFrame(point, camera, 40);

// Opening: the duo and the bubble must be framed, the knowledge chain must not.
for (const at of [0, 3, 8]) {
  const camera = queryCameraAt(at);
  for (const point of [
    USER,
    PET,
    { x: USER_BOX.x, y: USER_BOX.y },
    { x: HARNESS_BOX.x, y: HARNESS_BOX.y },
  ]) {
    assert.ok(
      inFrame(point, camera),
      `duo ${point.x},${point.y} off frame at ${at}`,
    );
  }
  for (const point of [SHEETS[0], CORE, WIKI]) {
    assert.ok(
      notInFrame(point, camera),
      `chain ${point.x},${point.y} leaked into opening at ${at}`,
    );
  }
}
// Retrieval reveal and the closing pull-back show the chain again.
for (const [at, points] of [
  [14, [CORE, WIKI, TOOL_CARDS[0], TOOL_CARDS[2]]],
  [20, [ANSWER, TOOL_CARDS[1]]],
  [32, [SHEETS[0], SHEETS[2], CORE, WIKI, USER, ANSWER]],
]) {
  const camera = queryCameraAt(at);
  for (const point of points) {
    assert.ok(
      inFrame(point, camera),
      `point ${point.x},${point.y} off frame at ${at}`,
    );
  }
}
for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
  for (const round of [0, 2]) {
    const req = queryLaneRequest(
      13.8 + round * 8 + laneIndex * 0.2,
      laneIndex,
      round,
    );
    assert.ok(Object.values(req).every(Number.isFinite));
  }
  for (const round of [0, 1, 2]) {
    const packet = queryEvidencePacket(
      [15.2, 20.8, 23.6][round],
      laneIndex,
      0,
      round,
    );
    assert.ok(packet.alpha >= -1e-9 && packet.alpha <= 1 + 1e-9);
    assert.ok(Object.values(packet).every(Number.isFinite));
  }
}

// Search segment: seamless hand-off from the V3 opening end frame.
assert.deepEqual(searchCameraAt(0), v2CameraAt(13));
assert.deepEqual(trailPoint(0, 0), PROBE_ORIGIN[0]);
assert.deepEqual(trailPoint(2, 1), PROBE_TARGET[2]);
const searchStep = sweepCamera(searchCameraAt, SEARCH_DURATION * 60);
assert.ok(searchStep < 26, `search camera jumps ${searchStep}`);
for (let index = 0; index < 3; index++) {
  assert.ok(FLIGHT_END[index] < ACTION_AT[index], `probe ${index} arrives late`);
  assert.ok(RETURN_START[index] > ACTION_AT[index], `probe ${index} returns early`);
  assert.ok(RETURN_END[index] < SEARCH_DURATION, `probe ${index} return overflow`);
  for (let frame = 0; frame <= SEARCH_DURATION * 60; frame++) {
    const pose = probePose(frame / 60, index);
    assert.ok(
      pose.alpha >= -1e-9 && pose.alpha <= 1 + 1e-9,
      `probe ${index} alpha ${pose.alpha} at ${frame / 60}`,
    );
    assert.ok(Object.values(pose).every(Number.isFinite));
    const dot = evidenceAt(frame / 60, index, 0);
    assert.ok(
      dot.alpha >= -1e-9 && dot.alpha <= 1 + 1e-9,
      `evidence ${index} alpha ${dot.alpha} at ${frame / 60}`,
    );
  }
}

console.log(
  `PASS: ingest ${INGEST_DURATION * 60 + 1} frames (seam-identical hand-off, persistent sources, connected provenance); query ${QUERY_DURATION * 60 + 1} frames (opening hides the chain, reveal and pull-back framed); search ${SEARCH_DURATION * 60 + 1} frames (V3 seam, probes finite, evidence bounded).`,
);
console.log(
  `Maximum per-frame camera movement: ingest ${ingestStep.toFixed(2)} / query ${queryStep.toFixed(2)} / search ${searchStep.toFixed(2)} world px; token ${maxTokenStep.toFixed(2)} px.`,
);
