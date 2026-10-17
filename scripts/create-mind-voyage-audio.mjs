import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 48_000;
const DURATION = 40;
const CHANNELS = 2;
const BITS = 24;
const FRAMES = SAMPLE_RATE * DURATION;
const TARGET_PEAK = 0.52;
const PEAK_CEILING = 0.6;
const BYTES_PER_SAMPLE = BITS / 8;
const BLOCK_ALIGN = CHANNELS * BYTES_PER_SAMPLE;
const DATA_BYTES = FRAMES * BLOCK_ALIGN;
const FULL_SCALE = 2 ** (BITS - 1);
const FADE_START = 39 * SAMPLE_RATE;
const TAU = Math.PI * 2;
const OUTPUT = new URL("../public/mind-voyage-sound.wav", import.meta.url);

assert.equal(process.argv.length, 2, "Run this generator without arguments.");
assert.ok(statSync(new URL("../public/", import.meta.url)).isDirectory());
assert.equal(FRAMES, 1_920_000);
assert.ok(TARGET_PEAK < PEAK_CEILING);

const left = new Float64Array(FRAMES);
const right = new Float64Array(FRAMES);
const sendLeft = new Float64Array(FRAMES);
const sendRight = new Float64Array(FRAMES);
const scenes = [];
const cues = [];
let activeScene = null;

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

const seedFor = (name) => createHash("sha256").update(`mind-voyage:${name}`).digest().readUInt32LE(0);
const clamp = (x, low = 0, high = 1) => Math.max(low, Math.min(high, x));
const smooth = (x) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};
const lerp = (a, b, u) => a + (b - a) * u;
const coefficient = (hz) => 1 - Math.exp((-TAU * hz) / SAMPLE_RATE);
const envelope = (t, duration, attack, release) =>
  smooth(t / attack) * smooth((duration - t) / release);

function scene(name, start, end, render) {
  assert.equal(start, scenes.at(-1)?.end ?? 0, "Scenes must cover the timeline without gaps.");
  assert.ok(end > start && end <= DURATION);
  activeScene = { name, start, end };
  scenes.push(activeScene);
  render();
  activeScene = null;
}

function event(name, start, duration, render) {
  assert.ok(activeScene, "Each cue needs a scene.");
  assert.ok(Number.isFinite(start) && Number.isFinite(duration) && duration > 0);
  assert.ok(start >= activeScene.start && start + duration <= activeScene.end + 1e-9,
    `Cue outside its scene: ${name}`);
  assert.ok(!cues.some((cue) => cue.name === name), `Duplicate cue: ${name}`);
  const first = Math.round(start * SAMPLE_RATE);
  const count = Math.round(duration * SAMPLE_RATE);
  assert.ok(first >= 0 && count > 1 && first + count <= FRAMES);
  cues.push({ name, start, duration, scene: activeScene.name });
  for (let n = 0; n < count; n++) {
    render(first + n, n / SAMPLE_RATE, n / (count - 1));
  }
}

function pan(i, sample, position, room = 0.3) {
  const angle = ((clamp(position, -1, 1) + 1) * Math.PI) / 4;
  const l = sample * Math.cos(angle);
  const r = sample * Math.sin(angle);
  left[i] += l;
  right[i] += r;
  sendLeft[i] += l * room;
  sendRight[i] += r * room;
}

function bandNoise(seed, lowHz) {
  const rng = random(seed);
  const low = coefficient(lowHz);
  let fast = 0;
  let fast2 = 0;
  let slow = 0;
  return (upper) => {
    fast += upper * (rng() * 2 - 1 - fast);
    fast2 += upper * (fast - fast2);
    slow += low * (fast2 - slow);
    return 3 * (fast2 - slow);
  };
}

function harmonicField() {
  const frequencies = [98, 147, 196];
  const gains = [0.0052, 0.0026, 0.0021];
  for (let i = 0; i < FRAMES; i++) {
    const t = i / SAMPLE_RATE;
    const inward = smooth((t - 5.8) / 3) * (1 - smooth((t - 33) / 3));
    const breath = 0.93 + 0.07 * Math.sin(TAU * 0.057 * t - 0.7);
    const level = smooth(t / 1.2) * breath * (0.86 + 0.14 * inward);
    for (let voice = 0; voice < frequencies.length; voice++) {
      const position = voice === 0 ? 0 : (voice === 1 ? -1 : 1) * (0.16 + 0.2 * inward);
      const phase = TAU * frequencies[voice] * t + voice * 0.29;
      pan(i, gains[voice] * level * Math.sin(phase), position, 0.12);
    }
  }
}

function ceramic(name, start, duration, frequency, gain, position) {
  const contact = bandNoise(seedFor(name), 300);
  const upper = coefficient(1_650);
  event(name, start, duration, (i, t, u) => {
    const body = Math.sin(TAU * frequency * t) * Math.exp(-t / 0.24);
    const shell = 0.23 * Math.sin(TAU * frequency * 2.73 * t + 0.2) * Math.exp(-t / 0.068)
      + 0.07 * Math.sin(TAU * frequency * 4.19 * t) * Math.exp(-t / 0.031);
    const touch = 0.16 * contact(upper) * Math.exp(-t / 0.043);
    const e = smooth(t / 0.015) * smooth(((1 - u) * duration) / 0.2);
    pan(i, gain * e * (body + shell + touch), position, 0.25);
  });
}

function pluck(name, start, duration, frequency, gain, from, to = from) {
  const rng = random(seedFor(name));
  const delay = Math.round(SAMPLE_RATE / frequency - 0.5);
  let ring = Float64Array.from({ length: delay }, (_, i) =>
    0.55 * Math.sin(TAU * i / delay) + 0.45 * (rng() * 2 - 1));
  for (let pass = 0; pass < 7; pass++) {
    ring = ring.map((sample, i) =>
      0.5 * sample + 0.25 * (ring[(i + 1) % delay] + ring[(i + delay - 1) % delay]));
  }
  const mean = ring.reduce((sum, sample) => sum + sample, 0) / delay;
  const peak = ring.reduce((maximum, sample) => Math.max(maximum, Math.abs(sample - mean)), 0);
  assert.ok(peak > 0);
  ring = ring.map((sample) => (sample - mean) / peak);
  const feedback = Math.exp(-delay / SAMPLE_RATE / (duration * 0.27));
  let cursor = 0;
  event(name, start, duration, (i, t, u) => {
    const sample = ring[cursor];
    ring[cursor] = feedback * 0.5 * (sample + ring[(cursor + 1) % delay]);
    cursor = (cursor + 1) % delay;
    const e = smooth(t / 0.022) * smooth(((1 - u) * duration) / 0.28);
    pan(i, gain * e * sample, lerp(from, to, smooth(u)), 0.43);
  });
}

function glow(name, start, duration, frequency, gain, from, to, attack = 0.65) {
  const breath = bandNoise(seedFor(name), 180);
  const upper = coefficient(1_300);
  event(name, start, duration, (i, t, u) => {
    const phase = TAU * frequency * t + 0.07 * Math.sin(TAU * 0.29 * t);
    const body = Math.sin(phase) + 0.2 * Math.sin(2.001 * phase + 0.4)
      + 0.06 * Math.sin(3.997 * phase) + 0.16 * breath(upper);
    const e = envelope(t, duration - 1 / SAMPLE_RATE, attack, duration * 0.45);
    pan(i, gain * e * body, lerp(from, to, smooth(u)), 0.58);
  });
}

function texture(name, start, duration, options = {}) {
  const {
    gain = 0.045, from = 0, to = from, low = 330, highFrom = 2_200,
    highTo = highFrom, folds = 1.5, width = 0.13, orbit = 0,
    attack = Math.min(0.12, duration * 0.2), release = duration * 0.34,
    room = 0.27,
  } = options;
  const noiseL = bandNoise(seedFor(name), low);
  const noiseR = bandNoise(seedFor(`${name}:right`), low);
  event(name, start, duration, (i, t, u) => {
    const upper = coefficient(lerp(highFrom, highTo, smooth(u)));
    const grain = 0.27 + 0.73 * (0.5 + 0.5 *
      Math.sin(TAU * (folds * u + 0.08 * Math.sin(TAU * u)))) ** 2;
    const e = gain * grain * envelope(t, duration - 1 / SAMPLE_RATE, attack, release);
    const position = lerp(from, to, smooth(u)) + orbit * Math.sin(TAU * u);
    pan(i, noiseL(upper) * e, position - width, room);
    pan(i, noiseR(upper) * e, position + width, room);
  });
}

function flight(name, start, duration, gain, from, to, descending = true) {
  texture(name, start, duration, {
    gain, from, to, low: 130, highFrom: descending ? 2_400 : 520,
    highTo: descending ? 430 : 2_150, width: 0.3, folds: 0.55,
    attack: duration * 0.28, release: duration * 0.32, room: 0.52,
  });
  glow(`${name}:undertow`, start, duration, descending ? 147 : 196,
    gain * 0.085, from * 0.6, to * 0.6, duration * 0.35);
}

function glassWindow(name, start, duration, opening) {
  const airL = bandNoise(seedFor(`${name}:left`), 400);
  const airR = bandNoise(seedFor(`${name}:right`), 400);
  event(name, start, duration, (i, t, u) => {
    const size = opening ? smooth(u) : 1 - smooth(u);
    const width = 0.035 + 0.72 * size;
    const upper = coefficient(850 + 1_900 * size);
    const e = envelope(t, duration - 1 / SAMPLE_RATE, opening ? 0.8 : 0.3, opening ? 0.6 : 1.1);
    const gain = 0.014 * e * (0.6 + 0.4 * size);
    const bowedL = Math.sin(TAU * 294 * t + 0.09 * Math.sin(TAU * 0.24 * t))
      + 0.13 * Math.sin(TAU * 784 * t) + 0.04 * Math.sin(TAU * 1_183 * t);
    const bowedR = Math.sin(TAU * 196 * t + 0.13 * Math.sin(TAU * 0.21 * t))
      + 0.14 * Math.sin(TAU * 588 * t + 0.2) + 0.04 * Math.sin(TAU * 987 * t);
    pan(i, gain * (bowedL + 0.7 * airL(upper)), -width, 0.65);
    pan(i, gain * (bowedR + 0.7 * airR(upper)), width, 0.65);
  });
}

function bloom(name, start, duration, frequency, position) {
  texture(name, start, duration, {
    gain: 0.083, from: position * 0.5, to: position, folds: 1.2,
    highFrom: 1_250, highTo: 2_650, attack: 0.06, release: duration * 0.6,
  });
  pluck(`${name}:petal`, start, duration, frequency, 0.024, position * 0.7, position);
}

harmonicField();

scene("ceramic conversation and the user's question", 0, 3.2, () => {
  ceramic("user speaks", 0.3, 0.85, 245, 0.051, -0.55);
  ceramic("harness listens and responds", 1.15, 0.95, 196, 0.044, 0.5);
  ceramic("user finishes the question", 2.05, 0.85, 245, 0.037, -0.5);
  texture("question appears", 2.25, 0.95, { gain: 0.072, from: -0.5, to: -0.36, folds: 1.1 });
});

scene("question floats from user to harness", 3.2, 4.4, () => {
  flight("question crosses", 3.2, 1.2, 0.095, -0.5, 0.48, false);
  texture("question's paper edge", 3.2, 1.2, { gain: 0.038, from: -0.5, to: 0.48, folds: 1 });
});

scene("calm thought pulse", 4.4, 5.8, () => {
  glow("one unhurried thought", 4.4, 1.4, 147, 0.024, 0.34, 0.25, 0.42);
  texture("thought breath", 4.4, 1.4, {
    gain: 0.025, from: 0.3, low: 140, highFrom: 800, folds: 0.7, attack: 0.4,
  });
});

scene("glass mind-window grows", 5.8, 8.8, () => {
  glassWindow("window grows outward", 5.8, 3, true);
});

scene("nebula orbit and two star selections", 8.8, 14.5, () => {
  texture("nebula dust orbit", 8.8, 5.7, {
    gain: 0.045, low: 200, highFrom: 1_400, highTo: 2_200, orbit: 0.54,
    width: 0.25, folds: 1.2, attack: 0.8, release: 1.3, room: 0.62,
  });
  glow("nebula long arc", 8.8, 5.7, 294, 0.010, -0.5, 0.48, 1.3);
  glow("nebula distant light", 9.3, 4.8, 392, 0.005, 0.5, -0.35, 1.6);
  texture("star selection one", 11.2, 0.95, {
    gain: 0.13, from: -0.5, to: -0.14, folds: 1.7, attack: 0.025,
  });
  pluck("first star's soft contact", 11.2, 1.65, 392, 0.042, -0.48, -0.12);
  texture("star selection two", 12.5, 1.1, {
    gain: 0.12, from: 0.52, to: 0.14, folds: 1.9, attack: 0.025,
  });
  pluck("second star's soft contact", 12.5, 1.8, 294, 0.039, 0.48, 0.1);
});

scene("airy downward fall into the forest", 14.5, 17, () => {
  flight("fall through nebula", 14.5, 2.5, 0.16, 0.18, -0.28);
  texture("canopy approaches", 15.5, 1.5, {
    gain: 0.056, from: -0.2, to: 0.1, low: 260, highFrom: 900,
    highTo: 1_750, folds: 1.3, width: 0.48, attack: 0.6,
  });
});

scene("network branches propagate and flowers bloom", 17, 22, () => {
  texture("forest canopy", 17, 5, {
    gain: 0.032, low: 260, highFrom: 1_900, folds: 2.2, width: 0.64, attack: 0.6, release: 1,
  });
  texture("network branch left", 17.12, 2.25, { gain: 0.059, from: 0, to: -0.63, folds: 3.7 });
  texture("network branch right", 17.58, 2.7, { gain: 0.05, from: -0.03, to: 0.62, folds: 4.1 });
  texture("network branch forward", 18.15, 3.2, { gain: 0.034, from: 0.15, to: -0.1, folds: 5.3 });
  bloom("flower one", 18.6, 1.45, 196, -0.58);
  bloom("flower two", 20, 1.5, 294, 0.58);
  bloom("flower three", 21, 1, 245, -0.08);
});

scene("leap toward the ocean and a subtle water entry", 22, 25, () => {
  flight("leap down to ocean", 22, 2.7, 0.15, -0.2, 0.22);
  texture("water entry", 24, 1, {
    gain: 0.115, from: 0.16, to: 0, low: 65, highFrom: 1_050,
    highTo: 270, folds: 0.6, width: 0.5, attack: 0.035, release: 0.7, room: 0.35,
  });
  glow("water's muted body", 24, 1, 98, 0.014, 0, 0, 0.07);
});

scene("underwater wiki sheets and soft paper glows", 25, 30, () => {
  texture("submerged current", 25, 5, {
    gain: 0.09, low: 55, highFrom: 660, highTo: 460, folds: 1.4,
    width: 0.7, orbit: 0.12, attack: 0.7, release: 1.2, room: 0.58,
  });
  glow("underwater suspension", 25, 5, 147, 0.008, -0.35, 0.38, 1.1);
  for (const [index, start, position, frequency] of [
    [1, 26, -0.5, 196], [2, 27.2, 0.5, 245], [3, 28.5, -0.08, 294],
  ]) {
    const duration = index === 3 ? 1.5 : 1.7;
    texture(`wiki paper glow ${index}`, start, duration, {
      gain: 0.097, from: position, to: position * 0.35, low: 180,
      highFrom: 1_200, highTo: 580, folds: 1.4, attack: 0.1, release: 0.8,
    });
    glow(`wiki soft light ${index}`, start, duration, frequency, 0.009,
      position, position * 0.35, 0.38);
  }
});

scene("evidence gathers and rises", 30, 33, () => {
  flight("left evidence rises", 30, 3, 0.085, -0.6, -0.035, false);
  flight("middle evidence rises", 30.12, 2.88, 0.065, 0.08, 0, false);
  flight("right evidence rises", 30.25, 2.75, 0.085, 0.6, 0.035, false);
  texture("gathered paper surfaces", 30.3, 2.7, {
    gain: 0.06, from: -0.3, to: 0, highFrom: 620, highTo: 1_850,
    folds: 3.2, width: 0.26, attack: 0.4, release: 0.9,
  });
  glow("evidence finds coherence", 30.7, 2.3, 294, 0.015, 0.2, 0, 0.8);
});

scene("mind-window contracts smoothly", 33, 36, () => {
  glassWindow("window returns to the harness", 33, 3, false);
  texture("paper settles inside", 33.35, 2.65, {
    gain: 0.041, from: 0.46, to: 0.08, highFrom: 1_450,
    highTo: 580, folds: 1.3, attack: 0.4, release: 1.1,
  });
});

scene("answer appears and conversation resumes", 36, 39.5, () => {
  texture("answer appears", 36, 1.75, {
    gain: 0.09, from: 0.36, to: -0.25, folds: 2.2, attack: 0.09,
  });
  glow("answer's warm resolution", 36, 3.5, 196, 0.016, 0.15, -0.15, 0.6);
  glow("answer's open fifth", 36.1, 3.4, 294, 0.009, -0.15, 0.15, 0.75);
  ceramic("harness answers", 36.75, 0.95, 196, 0.034, 0.5);
  ceramic("user acknowledges", 37.6, 0.9, 245, 0.029, -0.5);
  ceramic("conversation continues", 38.35, 0.95, 196, 0.021, 0.45);
});

scene("remaining room tail", 39.5, 40, () => {});

assert.equal(scenes.at(-1).end, DURATION);
assert.equal(scenes.length, 13);
for (const [name, start] of [
  ["question crosses", 3.2], ["one unhurried thought", 4.4], ["window grows outward", 5.8],
  ["nebula dust orbit", 8.8], ["star selection one", 11.2], ["star selection two", 12.5],
  ["fall through nebula", 14.5], ["forest canopy", 17], ["flower one", 18.6],
  ["flower two", 20], ["flower three", 21], ["leap down to ocean", 22], ["water entry", 24],
  ["submerged current", 25], ["wiki paper glow 1", 26], ["wiki paper glow 2", 27.2],
  ["wiki paper glow 3", 28.5], ["left evidence rises", 30],
  ["window returns to the harness", 33], ["answer appears", 36],
]) {
  assert.equal(cues.find((cue) => cue.name === name)?.start, start, `Missing scene accent: ${name}`);
}

function room(input, opposite, offset) {
  const result = new Float64Array(FRAMES);
  const damping = coefficient(2_100);
  for (const seconds of [0.0473, 0.0671, 0.0893, 0.1139]) {
    const delay = Math.round((seconds + offset) * SAMPLE_RATE);
    const ring = new Float64Array(delay);
    const feedback = Math.pow(0.001, delay / SAMPLE_RATE / 1.9);
    let cursor = 0;
    let filtered = 0;
    for (let i = 0; i < FRAMES; i++) {
      const delayed = ring[cursor];
      filtered += damping * (delayed - filtered);
      ring[cursor] = 0.83 * input[i] + 0.17 * opposite[i] + feedback * filtered;
      result[i] += delayed * 0.25;
      cursor = (cursor + 1) % delay;
    }
  }
  for (const seconds of [0.0061, 0.0137, 0.0193]) {
    const ring = new Float64Array(Math.round((seconds + offset * 0.17) * SAMPLE_RATE));
    let cursor = 0;
    for (let i = 0; i < FRAMES; i++) {
      const x = result[i];
      const y = ring[cursor] - 0.53 * x;
      ring[cursor] = x + 0.53 * y;
      result[i] = y;
      cursor = (cursor + 1) % ring.length;
    }
  }
  return result;
}

const fadeAt = (i) => smooth(i / (SAMPLE_RATE * 0.06)) *
  (1 - smooth((i - FADE_START) / (FRAMES - 1 - FADE_START)));
assert.equal(fadeAt(0), 0);
assert.equal(fadeAt(FADE_START), 1);
assert.equal(fadeAt(FRAMES - 1), 0);
for (let i = FADE_START + 1; i < FRAMES; i++) {
  assert.ok(fadeAt(i) <= fadeAt(i - 1), "The 39-40s fade must be monotonic.");
}

const wetLeft = room(sendLeft, sendRight, 0);
const wetRight = room(sendRight, sendLeft, 0.0037);
const lowPass = coefficient(4_300);
const dcPole = Math.exp((-TAU * 16) / SAMPLE_RATE);
let rawPeak = 0;
for (const [dry, wet] of [[left, wetLeft], [right, wetRight]]) {
  assert.equal(dry.length, FRAMES);
  assert.equal(wet.length, FRAMES);
  let previousInput = 0;
  let previousHighPass = 0;
  let filtered1 = 0;
  let filtered2 = 0;
  for (let i = 0; i < FRAMES; i++) {
    const x = dry[i] + 0.42 * wet[i];
    const highPass = x - previousInput + dcPole * previousHighPass;
    previousInput = x;
    previousHighPass = highPass;
    filtered1 += lowPass * (highPass - filtered1);
    filtered2 += lowPass * (filtered1 - filtered2);
    dry[i] = filtered2 * fadeAt(i);
    assert.ok(Number.isFinite(dry[i]), `Non-finite synthesis at frame ${i}`);
    rawPeak = Math.max(rawPeak, Math.abs(dry[i]));
  }
}
assert.ok(Number.isFinite(rawPeak) && rawPeak > 1e-6);
const masterGain = TARGET_PEAK / rawPeak;
const wav = Buffer.alloc(44 + DATA_BYTES);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + DATA_BYTES, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(CHANNELS, 22);
wav.writeUInt32LE(SAMPLE_RATE, 24);
wav.writeUInt32LE(SAMPLE_RATE * BLOCK_ALIGN, 28);
wav.writeUInt16LE(BLOCK_ALIGN, 32);
wav.writeUInt16LE(BITS, 34);
wav.write("data", 36);
wav.writeUInt32LE(DATA_BYTES, 40);

const dither = random(0x40a24d98);
for (let i = 0; i < FRAMES; i++) {
  for (let channel = 0; channel < CHANNELS; channel++) {
    const sample = (channel === 0 ? left[i] : right[i]) * masterGain;
    assert.ok(Number.isFinite(sample) && Math.abs(sample) <= PEAK_CEILING);
    const quantized = Math.round(sample * (FULL_SCALE - 1) + (dither() - dither()) * fadeAt(i));
    assert.ok(Number.isSafeInteger(quantized) && Math.abs(quantized) < FULL_SCALE);
    wav.writeIntLE(quantized, 44 + i * BLOCK_ALIGN + channel * BYTES_PER_SAMPLE, BYTES_PER_SAMPLE);
  }
}

function verify(buffer) {
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.length, 11_520_044);
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.readUInt32LE(4), buffer.length - 8);
  assert.equal(buffer.toString("ascii", 8, 12), "WAVE");
  assert.equal(buffer.toString("ascii", 12, 16), "fmt ");
  assert.equal(buffer.readUInt32LE(16), 16);
  assert.equal(buffer.readUInt16LE(20), 1);
  assert.equal(buffer.readUInt16LE(22), 2);
  assert.equal(buffer.readUInt32LE(24), 48_000);
  assert.equal(buffer.readUInt32LE(28), 288_000);
  assert.equal(buffer.readUInt16LE(32), 6);
  assert.equal(buffer.readUInt16LE(34), 24);
  assert.equal(buffer.toString("ascii", 36, 40), "data");
  assert.equal(buffer.readUInt32LE(40), DATA_BYTES);
  assert.equal(buffer.length, 44 + buffer.readUInt32LE(40));
  assert.equal(buffer.readUInt32LE(40) % BLOCK_ALIGN, 0);
  assert.equal(buffer.readUInt32LE(40) / buffer.readUInt32LE(28), 40);
  assert.equal(buffer.readUInt32LE(40) / BLOCK_ALIGN, 1_920_000);
  let peak = 0;
  let energyL = 0;
  let energyR = 0;
  let sideEnergy = 0;
  let crossEnergy = 0;
  let tailEnergy = 0;
  let dcL = 0;
  let dcR = 0;
  const quarterEnergies = new Float64Array(4);
  const windowEnergies = new Float64Array(DURATION * 10);
  for (let i = 0; i < FRAMES; i++) {
    const offset = 44 + i * BLOCK_ALIGN;
    const l = buffer.readIntLE(offset, BYTES_PER_SAMPLE) / FULL_SCALE;
    const r = buffer.readIntLE(offset + BYTES_PER_SAMPLE, BYTES_PER_SAMPLE) / FULL_SCALE;
    assert.ok(Number.isFinite(l) && Number.isFinite(r));
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    energyL += l * l;
    energyR += r * r;
    sideEnergy += (l - r) ** 2;
    crossEnergy += l * r;
    dcL += l;
    dcR += r;
    const energy = l * l + r * r;
    windowEnergies[Math.floor(i / (SAMPLE_RATE / 10))] += energy;
    if (i >= FADE_START) quarterEnergies[Math.floor((i - FADE_START) / (SAMPLE_RATE / 4))] += energy;
    if (i >= FRAMES - SAMPLE_RATE / 20) tailEnergy += energy;
    if (i === 0 || i === FRAMES - 1) {
      assert.equal(l, 0, "Left endpoint must be exactly silent.");
      assert.equal(r, 0, "Right endpoint must be exactly silent.");
    }
  }
  const energy = energyL + energyR;
  const rms = Math.sqrt(energy / (FRAMES * CHANNELS));
  const tailRms = Math.sqrt(tailEnergy / ((SAMPLE_RATE / 20) * CHANNELS));
  const correlation = crossEnergy / Math.sqrt(energyL * energyR);
  const sideRatio = sideEnergy / energy;
  assert.ok(peak > 0 && peak <= PEAK_CEILING, `Peak exceeds ceiling: ${peak}`);
  assert.ok(Math.abs(peak - TARGET_PEAK) < 2 / FULL_SCALE);
  assert.ok(energyL > 1 && energyR > 1, "Both channels must carry sound.");
  assert.ok(sideRatio > 0.005 && sideRatio < 0.95, "Stereo must be distinct and mono-compatible.");
  assert.ok(correlation > 0 && correlation < 0.995, "Invalid stereo correlation.");
  assert.ok(Math.abs(dcL / FRAMES) < 0.0001 && Math.abs(dcR / FRAMES) < 0.0001);
  for (let i = 1; i < windowEnergies.length - 10; i++) {
    assert.ok(windowEnergies[i] > 1e-8, `Unintended silence in 100ms window ${i}`);
  }
  for (let i = 1; i < quarterEnergies.length; i++) {
    assert.ok(quarterEnergies[i] < quarterEnergies[i - 1], "Final-second energy must soften.");
  }
  assert.ok(tailRms < 0.001, "Final 50ms must be near silence.");
  return { peak, rms, tailRms, correlation, sideRatio };
}

verify(wav);
let created = false;
try {
  writeFileSync(OUTPUT, wav, { flag: "wx" });
  created = true;
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
const saved = readFileSync(OUTPUT);
assert.ok(saved.equals(wav), "Existing output differs; no existing file was overwritten.");
const stats = verify(saved);
const db = (rms) => (20 * Math.log10(rms)).toFixed(2);
console.log(`${created ? "Created" : "Verified unchanged"}: ${fileURLToPath(OUTPUT)}`);
console.log(`${DURATION}s | ${SAMPLE_RATE}Hz | stereo PCM${BITS} | ${FRAMES} frames | ${saved.length} bytes`);
console.log(`Peak ${stats.peak.toFixed(7)} | RMS ${db(stats.rms)} dBFS | final 50ms ${db(stats.tailRms)} dBFS`);
console.log(`Stereo correlation ${stats.correlation.toFixed(5)} | side-energy ratio ${stats.sideRatio.toFixed(5)}`);
console.log(`Passed: ${scenes.length} scene windows, ${cues.length} cues, finite samples, headers, exact duration, peak <= ${PEAK_CEILING}, stereo, continuity, silent endpoints, 39-40s fade, byte-exact readback.`);
console.log(`SHA-256: ${createHash("sha256").update(saved).digest("hex")}`);
