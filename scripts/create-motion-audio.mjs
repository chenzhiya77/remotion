#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MODE =
  process.argv[2] === "cinema"
    ? "cinema"
    : process.argv[2] === "query"
      ? "query"
      : process.argv[2] === "search"
        ? "search"
        : "ingest";
assert.ok(process.argv.length <= 3, "Usage: create-motion-audio.mjs [query]");
const SAMPLE_RATE = 48_000;
const FRONT = 20;
const DURATION =
  MODE === "cinema"
    ? 26
    : MODE === "query"
      ? 32
      : MODE === "search"
        ? 14
        : FRONT + 28;
const BED_RESOLVE =
  MODE === "cinema"
    ? 21
    : MODE === "query"
      ? 25
      : MODE === "search"
        ? 11
        : FRONT + 23;
let CUE_OFFSET = 0;
const CHANNELS = 2;
const BITS = 24;
const FRAMES = SAMPLE_RATE * DURATION;
const TARGET_PEAK = 0.66; // Headroom below the requested 0.7 ceiling.
const TAU = Math.PI * 2;
const OUTPUT = new URL(
  MODE === "cinema"
    ? "../public/cinema-sound.wav"
    : MODE === "query"
      ? "../public/query-sound.wav"
      : MODE === "search"
        ? "../public/search-sound.wav"
        : "../public/motion-sound.wav",
  import.meta.url,
);
const left = new Float64Array(FRAMES);
const right = new Float64Array(FRAMES);
const sendLeft = new Float64Array(FRAMES);
const sendRight = new Float64Array(FRAMES);

assert.ok(
  statSync(new URL("../public/", import.meta.url)).isDirectory(),
  "public/ must exist.",
);

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};
const lerp = (a, b, u) => a + (b - a) * u;
const lowPassCoefficient = (frequency) =>
  1 - Math.exp((-TAU * frequency) / SAMPLE_RATE);

// All events reach zero with zero slope at both boundaries.
function envelope(t, duration, attack, release) {
  if (t <= 0 || t >= duration) return 0;
  return smooth(t / attack) * smooth((duration - t) / release);
}

function event(start, duration, render) {
  start += CUE_OFFSET;
  assert.ok(start >= 0 && duration > 0 && start + duration <= DURATION + 1e-9);
  const first = Math.round(start * SAMPLE_RATE);
  const count = Math.round(duration * SAMPLE_RATE);
  for (let n = 0; n < count && first + n < FRAMES; n++) {
    render(first + n, n / SAMPLE_RATE, n / Math.max(1, count - 1));
  }
}

function pan(index, sample, position = 0, room = 0.25) {
  const angle = ((Math.max(-1, Math.min(1, position)) + 1) * Math.PI) / 4;
  const l = sample * Math.cos(angle);
  const r = sample * Math.sin(angle);
  left[index] += l;
  right[index] += r;
  sendLeft[index] += l * room;
  sendRight[index] += r * room;
}

// A continuous, slowly breathing open harmonic field, not a chord progression.
// The low foundation is centered; only the quiet upper partials drift sideways.
function bed() {
  for (let i = 0; i < FRAMES; i++) {
    const t = i / SAMPLE_RATE;
    const emergence = smooth(t / 2.2);
    const breathing = 0.9 + 0.1 * Math.sin(TAU * 0.073 * t - 0.8);
    const resolution = smooth((t - BED_RESOLVE) / 3);
    const dynamics = emergence * breathing * (0.8 + 0.13 * resolution);
    const center =
      0.043 * Math.sin(TAU * 98 * t + 0.09 * Math.sin(TAU * 0.11 * t)) +
      0.014 * Math.sin(TAU * 147 * t + 0.17 * Math.sin(TAU * 0.087 * t));
    pan(i, center * dynamics, 0, 0.12);
    const upper =
      0.015 * Math.sin(TAU * 196 * t + 0.22 * Math.sin(TAU * 0.13 * t)) +
      0.008 * Math.sin(TAU * 294 * t + 0.4);
    const companion =
      0.012 * Math.sin(TAU * 196.19 * t + 0.6) +
      0.006 * Math.sin(TAU * 392.11 * t + 0.15 * Math.sin(TAU * 0.091 * t));
    const width = 0.28 + 0.47 * resolution;
    pan(i, upper * dynamics, -width, 0.27);
    pan(i, companion * dynamics, width, 0.27);
  }
}

function glow(start, duration, frequency, gain, fromPan, toPan, attack = 0.6) {
  event(start, duration, (i, t, u) => {
    const drift = 0.11 * Math.sin(TAU * 0.31 * t);
    const tone =
      Math.sin(TAU * frequency * t + drift) +
      0.23 * Math.sin(TAU * frequency * 2.001 * t + 0.2) +
      0.065 * Math.sin(TAU * frequency * 3.003 * t);
    pan(
      i,
      gain * envelope(t, duration, attack, duration * 0.43) * tone,
      lerp(fromPan, toPan, smooth(u)),
      0.44,
    );
  });
}

function glint(
  start,
  frequency,
  gain,
  position,
  duration = 0.58,
  decay = 0.14,
) {
  event(start, duration, (i, t) => {
    const e =
      envelope(t, duration, 0.006, Math.min(0.18, duration / 2)) *
      Math.exp(-t / decay);
    // Soft felt/sine attack; the faint inharmonic overtone is not a metallic click.
    const tone =
      Math.sin(TAU * frequency * t + 0.13 * Math.exp(-t * 24)) +
      0.13 * Math.sin(TAU * frequency * 2.17 * t) * Math.exp(-t / 0.075);
    pan(i, gain * e * tone, position, 0.37);
  });
}

// Seeded noise always passes through a low-pass pair and a low-frequency
// subtraction before entering the mix. No raw white noise reaches the output.
function paper(start, duration, gain, fromPan, toPan, seed, folds = 3) {
  const rng = random(seed);
  const upper = lowPassCoefficient(2_600);
  const lower = lowPassCoefficient(470);
  let fast = 0;
  let fast2 = 0;
  let slow = 0;
  event(start, duration, (i, t, u) => {
    fast += upper * (rng() * 2 - 1 - fast);
    fast2 += upper * (fast - fast2);
    slow += lower * (fast2 - slow);
    const texture = (fast2 - slow) * 3.0;
    const foldsEnvelope =
      0.28 +
      0.72 *
        Math.pow(
          0.5 + 0.5 * Math.sin(TAU * (folds * u + 0.12 * Math.sin(TAU * u))),
          3,
        );
    const e = envelope(
      t,
      duration,
      Math.min(0.13, duration * 0.2),
      duration * 0.38,
    );
    const body = 0.05 * Math.sin(TAU * 330 * t) * Math.sin(Math.PI * u);
    pan(
      i,
      gain * e * (texture * foldsEnvelope + body),
      lerp(fromPan, toPan, smooth(u)),
      0.19,
    );
  });
}

function flight(start, duration, gain, fromPan, toPan, seed, pitch = 290) {
  const rng = random(seed);
  let lp1 = 0;
  let lp2 = 0;
  let bottom = 0;
  let phase = 0;
  const lower = lowPassCoefficient(240);
  event(start, duration, (i, t, u) => {
    const rise = smooth(u);
    const coefficient = lowPassCoefficient(lerp(650, 2_900, rise));
    lp1 += coefficient * (rng() * 2 - 1 - lp1);
    lp2 += coefficient * (lp1 - lp2);
    bottom += lower * (lp2 - bottom);
    phase += (TAU * pitch * (1 + 0.72 * rise)) / SAMPLE_RATE;
    const air = 2.8 * (lp2 - bottom);
    const e =
      Math.pow(Math.sin(Math.PI * u), 2) * envelope(t, duration, 0.18, 0.35);
    const harmonic = 0.24 * Math.sin(phase) + 0.06 * Math.sin(phase * 2 + 0.3);
    pan(
      i,
      gain * e * (0.76 * air + harmonic),
      lerp(fromPan, toPan, rise),
      0.45,
    );
  });
}

bed();

if (MODE === "ingest") {
  // 0.0-20.0 FRONT: three documents are opened, parsed, structured and sliced.
  glow(0.15, 2.35, 294, 0.012, -0.25, 0.18, 0.85);
  paper(0.65, 1.35, 0.038, -0.45, -0.2, 0x5101, 2.1);
  glint(2.95, 880, 0.024, -0.42, 0.55, 0.12);
  paper(2.85, 1.55, 0.033, -0.48, 0.16, 0x5102, 2.4);
  glint(5.15, 940, 0.023, 0.34, 0.55, 0.12);
  paper(5.05, 1.55, 0.031, 0.42, -0.1, 0x5103, 2.2);
  glint(7.45, 1010, 0.024, 0.08, 0.55, 0.12);
  paper(7.35, 1.55, 0.03, 0.1, 0.38, 0x5104, 2.3);
  glow(9.3, 3.1, 392, 0.013, -0.35, 0.3, 1.0);
  glow(10.4, 2.6, 588, 0.008, 0.3, -0.18, 0.9);
  flight(13.35, 2.15, 0.033, -0.62, 0.28, 0x5201, 262);
  flight(14.15, 2.15, 0.031, 0.56, -0.24, 0x5202, 294);
  flight(14.95, 2.15, 0.029, -0.18, 0.58, 0x5203, 330);
  glint(17.25, 1245, 0.022, 0.02, 0.85, 0.16);

  CUE_OFFSET = FRONT;

  // 0.0-2.2: warm, delicate emergence; the continuing bed bridges every cue.
  glow(0.08, 2.12, 392, 0.015, -0.2, 0.12, 0.8);
  glow(0.42, 1.78, 588, 0.0055, 0.33, -0.1, 0.65);

  // 2.2-5.0: overlapping paper layers peel away in opposite directions.
  paper(2.2, 1.22, 0.044, -0.12, -0.65, 0x1201, 2.2);
  paper(2.67, 1.35, 0.037, 0.1, 0.58, 0x1202, 2.7);
  paper(3.23, 1.23, 0.034, -0.3, 0.4, 0x1203, 2.1);
  paper(3.92, 1.08, 0.03, 0.4, -0.42, 0x1204, 1.7);

  // 5.6 / 6.4 / 7.2: extraction markers, isolated rather than a rhythmic motif.
  glint(5.6, 1_176, 0.036, -0.34, 0.43, 0.1);
  glint(6.4, 1_113, 0.032, 0.29, 0.45, 0.105);
  glint(7.2, 1_225, 0.034, 0.02, 0.48, 0.11);

  // 8.5-12.8: staggered rising entity flights across the stereo field.
  flight(8.5, 1.95, 0.047, -0.73, 0.48, 0x2301, 245);
  flight(9.35, 2.05, 0.041, 0.67, -0.53, 0x2302, 294);
  flight(10.26, 2.0, 0.039, -0.55, 0.7, 0x2303, 330);
  flight(11.0, 1.8, 0.034, 0.53, -0.24, 0x2304, 367.5);

  // 13.2-15.2: separate resonances converge into a soft central bloom.
  glow(13.2, 2.0, 196, 0.037, -0.65, 0, 0.7);
  glow(13.2, 2.0, 294, 0.024, 0.65, 0, 0.8);
  glow(13.32, 1.88, 490, 0.013, -0.25, 0.02, 0.68);
  event(14.3, 0.95, (i, t) => {
    // Rounded, restrained low impact with a gentle 70-to-49 Hz settling glide.
    const phase = TAU * (49 * t + 21 * 0.075 * (1 - Math.exp(-t / 0.075)));
    const e = envelope(t, 0.95, 0.02, 0.35) * Math.exp(-t / 0.27);
    pan(i, 0.072 * e * (Math.sin(phase) + 0.11 * Math.sin(phase * 2)), 0, 0.13);
  });

  // 16.4: one light qualification ping, not a musical phrase.
  glint(16.4, 1_568, 0.032, 0.13, 1.05, 0.24);

  // 18.0-21.5: a large sheet opens, then quiet text marks settle onto it.
  paper(18.0, 2.5, 0.042, -0.5, 0.47, 0x3401, 2.4);
  paper(18.65, 2.85, 0.024, 0.48, -0.36, 0x3402, 3.1);
  flight(18.1, 3.4, 0.018, -0.6, 0.6, 0x3403, 196);
  const textRng = random(0x451a);
  for (const at of [18.72, 19.06, 19.38, 19.83, 20.08, 20.45, 20.79, 21.13]) {
    glint(
      at,
      820 + textRng() * 290,
      0.008 + textRng() * 0.004,
      -0.37 + textRng() * 0.74,
      0.19,
      0.043,
    );
  }

  // 23.0-26.0: widening ambient resolution. Natural releases carry into 27s;
  // the master fade removes the entire dry/wet tail from 27.0 to 28.0.
  glow(23.0, 4.0, 196, 0.023, -0.2, -0.78, 1.2);
  glow(23.0, 4.0, 294, 0.021, 0.2, 0.78, 1.35);
  glow(23.4, 3.6, 490, 0.011, -0.05, -0.55, 1.25);
  glow(23.8, 3.2, 588, 0.008, 0.08, 0.65, 1.0);
} else if (MODE === "query") {
  // QUERY FILM (32s): user + pet, question rewritten into three, three-path
  // retrieval, insufficient-evidence repair, answer resolved.
  CUE_OFFSET = 0;
  glow(0.25, 2.4, 294, 0.013, -0.22, 0.18, 0.9);
  glint(1.05, 720, 0.017, -0.34, 0.62, 0.13);
  glint(3.35, 880, 0.015, -0.3, 0.55, 0.12);
  flight(4.15, 1.35, 0.027, 0.36, -0.22, 0x7101, 262);
  glow(6.2, 1.7, 392, 0.016, -0.18, 0.12, 0.5);
  glint(8.1, 980, 0.02, -0.3, 0.5, 0.11);
  glint(9.0, 1120, 0.02, 0.0, 0.5, 0.11);
  glint(9.9, 1268, 0.02, 0.3, 0.5, 0.11);
  glint(11.15, 1046, 0.02, -0.28, 0.55, 0.12);
  glint(11.7, 1244, 0.02, 0.02, 0.55, 0.12);
  glint(12.25, 1480, 0.02, 0.32, 0.55, 0.12);
  flight(13.85, 1.1, 0.026, -0.55, -0.18, 0x7201, 233);
  flight(14.15, 1.1, 0.026, 0.08, -0.02, 0x7202, 294);
  flight(14.45, 1.1, 0.025, 0.52, 0.14, 0x7203, 349);
  flight(14.7, 1.55, 0.032, -0.5, 0.28, 0x7204, 262);
  flight(15.05, 1.55, 0.031, 0.06, -0.12, 0x7205, 330);
  flight(15.4, 1.55, 0.03, 0.55, 0.16, 0x7206, 392);
  glow(16.25, 1.8, 587, 0.012, -0.12, 0.12, 0.55);
  for (const at of [16.85, 17.2, 17.55, 17.9]) {
    glint(at, 760 + at * 12, 0.0075, -0.25 + (at - 16.85) * 0.5, 0.18, 0.04);
  }
  glow(19.35, 1.4, 147, 0.019, 0.25, -0.15, 0.35);
  glint(20.55, 820, 0.016, 0.15, 0.55, 0.13);
  glint(21.6, 1245, 0.024, 0.05, 0.7, 0.14);
  flight(22.25, 1.15, 0.025, -0.4, 0.16, 0x7301, 294);
  flight(22.55, 1.15, 0.025, 0.34, -0.1, 0x7302, 349);
  flight(22.85, 1.45, 0.029, -0.12, 0.26, 0x7303, 330);
  flight(23.15, 1.45, 0.028, 0.42, 0.08, 0x7304, 415);
  glow(24.3, 1.9, 490, 0.013, -0.14, 0.18, 0.6);
  glow(28.0, 3.6, 246, 0.015, -0.2, -0.62, 1.15);
  glow(28.4, 3.2, 369, 0.01, 0.18, 0.58, 1.2);
} else if (MODE === "search") {
  // QUERY SEARCH (14s): probes morph out of the settled shapes, three flights
  // over the knowledge world, landings on slice field / graph / page tower,
  // evidence streaming home into the answer.
  CUE_OFFSET = 0;
  glow(0.25, 2.2, 294, 0.013, -0.18, 0.14, 0.85);
  glint(0.62, 720, 0.016, -0.28, 0.5, 0.11);
  glint(0.84, 810, 0.016, -0.1, 0.5, 0.11);
  glint(1.06, 905, 0.016, 0.12, 0.5, 0.11);
  flight(1.2, 2.5, 0.028, -0.28, 0.42, 0x8101, 262);
  flight(1.42, 2.55, 0.027, -0.12, 0.5, 0x8102, 311);
  flight(1.64, 2.6, 0.026, 0.05, 0.58, 0x8103, 370);
  glow(4.35, 1.9, 392, 0.017, -0.3, -0.05, 0.5);
  glint(5.05, 980, 0.014, -0.32, 0.12, 0.1);
  glint(5.21, 1080, 0.014, -0.22, 0.12, 0.1);
  glint(5.37, 1180, 0.014, -0.12, 0.12, 0.1);
  glint(5.53, 1280, 0.014, 0.0, 0.12, 0.1);
  glint(5.69, 1385, 0.014, 0.12, 0.12, 0.1);
  glow(6.65, 1.8, 490, 0.016, 0.32, 0.06, 0.5);
  for (const at of [6.75, 6.93, 7.11, 7.29, 7.47, 7.65, 7.83]) {
    glint(at, 820 + at * 22, 0.011, 0.3 - (at - 6.75) * 0.35, 0.16, 0.05);
  }
  glow(8.95, 1.9, 330, 0.017, -0.24, -0.02, 0.5);
  paper(9.35, 1.3, 0.026, -0.3, 0.3, 0x8201, 2.4);
  paper(9.67, 1.3, 0.025, -0.15, 0.35, 0x8202, 2.4);
  paper(9.99, 1.3, 0.024, 0.0, 0.4, 0x8203, 2.4);
  paper(10.31, 1.3, 0.023, 0.15, 0.45, 0x8204, 2.4);
  flight(11.3, 1.5, 0.026, 0.5, -0.24, 0x8301, 349);
  flight(11.52, 1.5, 0.025, 0.55, -0.1, 0x8302, 294);
  flight(11.74, 1.5, 0.024, 0.6, 0.05, 0x8303, 262);
  glow(12.6, 1.35, 490, 0.015, -0.1, -0.16, 0.4);
  glint(12.78, 720, 0.011, -0.1, 0.2, 0.06);
  glint(12.96, 830, 0.011, 0.0, 0.2, 0.06);
  glint(13.14, 940, 0.011, 0.1, 0.2, 0.06);
} else {
  // CINEMA (26s): workbench long take — typing, dispatch key, pulse transfer,
  // generated growth, three collapsing frames, crane out.
  CUE_OFFSET = 0;
  glow(0.25, 2.8, 246, 0.014, -0.18, 0.12, 0.9);
  glint(3.35, 820, 0.013, -0.32, 0.4, 0.09);
  glint(3.85, 910, 0.013, -0.1, 0.4, 0.09);
  glint(4.35, 1010, 0.013, 0.14, 0.4, 0.09);
  glint(5.08, 660, 0.025, -0.18, 0.62, 0.15);
  flight(5.35, 1.8, 0.03, -0.28, 0.34, 0x7101, 286);
  glow(7.4, 2.5, 294, 0.014, 0.34, -0.08, 0.85);
  glint(8.45, 1120, 0.016, 0.3, 0.55, 0.12);
  glow(10.2, 3.6, 392, 0.018, -0.12, 0.22, 1.25);
  paper(13.15, 1.45, 0.031, 0.28, -0.34, 0x7201, 2.2);
  glint(15.15, 720, 0.03, -0.28, 0.7, 0.17);
  glint(16.35, 610, 0.03, 0.02, 0.7, 0.17);
  glint(17.55, 510, 0.032, 0.32, 0.7, 0.17);
  glow(17.8, 1.7, 490, 0.015, 0.24, -0.12, 0.55);
  glow(19.8, 4.0, 246, 0.016, -0.26, 0.2, 1.35);
  glint(20.2, 1240, 0.012, 0.18, 0.45, 0.11);
  glint(20.55, 1360, 0.012, 0.3, 0.45, 0.11);
  glint(20.9, 1480, 0.012, 0.42, 0.45, 0.11);
  glow(24.0, 2.0, 369, 0.012, -0.14, 0.48, 1.05);
}

// Damped stereo room: six parallel delay tanks and two all-pass diffusers.
// Unequal L/R delays provide space without inverting the dry bass in mono.
function room(input, opposite, offset) {
  const result = new Float64Array(FRAMES);
  for (const seconds of [0.0437, 0.0531, 0.0677, 0.0793, 0.0971, 0.1139]) {
    const delay = Math.round((seconds + offset) * SAMPLE_RATE);
    const ring = new Float64Array(delay);
    const feedback = Math.pow(0.001, delay / SAMPLE_RATE / 1.65);
    const damping = lowPassCoefficient(2_700);
    let cursor = 0;
    let filtered = 0;
    for (let i = 0; i < FRAMES; i++) {
      const delayed = ring[cursor];
      filtered += damping * (delayed - filtered);
      ring[cursor] = input[i] * 0.8 + opposite[i] * 0.2 + filtered * feedback;
      result[i] += delayed / 6;
      cursor = (cursor + 1) % delay;
    }
  }
  for (const seconds of [0.0053, 0.0127]) {
    const ring = new Float64Array(
      Math.round((seconds + offset * 0.19) * SAMPLE_RATE),
    );
    let cursor = 0;
    for (let i = 0; i < FRAMES; i++) {
      const x = result[i];
      const delayed = ring[cursor];
      const y = delayed - 0.5 * x;
      ring[cursor] = x + 0.5 * y;
      result[i] = y;
      cursor = (cursor + 1) % ring.length;
    }
  }
  return result;
}

const wetLeft = room(sendLeft, sendRight, 0);
const wetRight = room(sendRight, sendLeft, 0.0031);
const lowPass = lowPassCoefficient(6_000);
const dcPole = Math.exp((-TAU * 18) / SAMPLE_RATE);
for (const [dry, wet] of [
  [left, wetLeft],
  [right, wetRight],
]) {
  let previousInput = 0;
  let previousHighPass = 0;
  let filtered1 = 0;
  let filtered2 = 0;
  for (let i = 0; i < FRAMES; i++) {
    const x = dry[i] + 0.52 * wet[i];
    const highPass = x - previousInput + dcPole * previousHighPass;
    previousInput = x;
    previousHighPass = highPass;
    filtered1 += lowPass * (highPass - filtered1);
    filtered2 += lowPass * (filtered1 - filtered2);
    const t = i / SAMPLE_RATE;
    const fade = smooth(t / 0.035) * smooth((FRAMES - 1 - i) / SAMPLE_RATE);
    dry[i] = filtered2 * fade;
    assert.ok(Number.isFinite(dry[i]), `Non-finite sample at frame ${i}`);
  }
}

// Linked stereo normalization preserves the designed panning and dynamics.
let rawPeak = 0;
for (let i = 0; i < FRAMES; i++) {
  rawPeak = Math.max(rawPeak, Math.abs(left[i]), Math.abs(right[i]));
}
assert.ok(rawPeak > 0, "The sketch must not be silent.");
const gain = TARGET_PEAK / rawPeak;
const bytesPerSample = BITS / 8;
const blockAlign = CHANNELS * bytesPerSample;
const dataBytes = FRAMES * blockAlign;
const wav = Buffer.alloc(44 + dataBytes);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataBytes, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); // Linear PCM, interleaved little-endian.
wav.writeUInt16LE(CHANNELS, 22);
wav.writeUInt32LE(SAMPLE_RATE, 24);
wav.writeUInt32LE(SAMPLE_RATE * blockAlign, 28);
wav.writeUInt16LE(blockAlign, 32);
wav.writeUInt16LE(BITS, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataBytes, 40);

const dither = random(0x57415645);
const fullScale = 2 ** (BITS - 1);
for (let i = 0; i < FRAMES; i++) {
  const fade =
    smooth(i / (SAMPLE_RATE * 0.035)) * smooth((FRAMES - 1 - i) / SAMPLE_RATE);
  for (let channel = 0; channel < CHANNELS; channel++) {
    const value = (channel === 0 ? left[i] : right[i]) * gain;
    // Seeded one-LSB TPDF dither; it fades too, leaving exact zero endpoints.
    const quantized = Math.round(
      value * (fullScale - 1) + (dither() - dither()) * fade,
    );
    assert.ok(Math.abs(quantized) < fullScale, "PCM overflow.");
    wav.writeIntLE(
      quantized,
      44 + i * blockAlign + channel * bytesPerSample,
      bytesPerSample,
    );
  }
}

function verify(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WAVE");
  assert.equal(buffer.readUInt16LE(20), 1);
  assert.equal(buffer.readUInt16LE(22), CHANNELS);
  assert.equal(buffer.readUInt32LE(24), SAMPLE_RATE);
  assert.equal(buffer.readUInt16LE(34), BITS);
  assert.equal(buffer.readUInt32LE(40), dataBytes);
  assert.equal(buffer.length, 44 + dataBytes);
  let peak = 0;
  let energy = 0;
  let sideEnergy = 0;
  let tailEnergy = 0;
  for (let i = 0; i < FRAMES; i++) {
    const l = buffer.readIntLE(44 + i * blockAlign, bytesPerSample) / fullScale;
    const r =
      buffer.readIntLE(44 + i * blockAlign + bytesPerSample, bytesPerSample) /
      fullScale;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    energy += l * l + r * r;
    sideEnergy += (l - r) ** 2;
    if (i >= FRAMES - SAMPLE_RATE / 20) tailEnergy += l * l + r * r;
    if (i === 0 || i === FRAMES - 1) {
      assert.equal(l, 0, "Left boundary must be silent.");
      assert.equal(r, 0, "Right boundary must be silent.");
    }
  }
  assert.ok(peak > 0 && peak <= 0.7, `Peak ${peak} exceeds ceiling.`);
  assert.ok(sideEnergy > energy * 0.001, "Stereo channels must be distinct.");
  const rms = Math.sqrt(energy / (FRAMES * CHANNELS));
  const tailRms = Math.sqrt(tailEnergy / ((SAMPLE_RATE / 20) * CHANNELS));
  assert.ok(tailRms < 0.001, "The final 50ms must fade to near silence.");
  return { peak, rms, tailRms };
}

// Validate in memory before touching the one allowed output. No temp/sidecar files.
verify(wav);
writeFileSync(OUTPUT, wav);
const saved = readFileSync(OUTPUT);
assert.ok(saved.equals(wav), "WAV readback differs from the rendered buffer.");
const stats = verify(saved);
console.log(`Wrote ${fileURLToPath(OUTPUT)}`);
console.log(
  `Duration: ${DURATION.toFixed(3)}s | ${SAMPLE_RATE}Hz | stereo | PCM ${BITS}-bit`,
);
console.log(
  `Samples: ${FRAMES.toLocaleString("en-US")} frames/channel; ${(FRAMES * CHANNELS).toLocaleString("en-US")} interleaved samples`,
);
console.log(
  `Peak: ${stats.peak.toFixed(7)} (${(20 * Math.log10(stats.peak)).toFixed(2)} dBFS) | RMS: ${(20 * Math.log10(stats.rms)).toFixed(2)} dBFS`,
);
console.log(
  `Tail RMS (last 50ms): ${(20 * Math.log10(stats.tailRms)).toFixed(2)} dBFS | zero endpoints | ${saved.length} bytes`,
);
console.log(`SHA-256: ${createHash("sha256").update(saved).digest("hex")}`);
console.log(
  "Verified header, duration, stereo separation, finite synthesis, fade, peak ceiling, and disk readback. Procedural audio sketch, not a mastered music track.",
);
