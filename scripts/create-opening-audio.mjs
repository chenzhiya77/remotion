import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 48_000;
const DURATION = 9;
const CHANNELS = 2;
const BITS = 24;
const FRAMES = SAMPLE_RATE * DURATION;
const TARGET_PEAK = 0.48;
const PEAK_CEILING = 0.5;
const BYTES_PER_SAMPLE = BITS / 8;
const BLOCK_ALIGN = CHANNELS * BYTES_PER_SAMPLE;
const DATA_BYTES = FRAMES * BLOCK_ALIGN;
const FULL_SCALE = 2 ** (BITS - 1);
const FADE_SECONDS = 0.6;
const FADE_START = FRAMES - SAMPLE_RATE * FADE_SECONDS;
const TAU = Math.PI * 2;
const OUTPUT = new URL("../public/opening-sound.wav", import.meta.url);

assert.equal(process.argv.length, 2, "Run this generator without arguments.");
assert.ok(statSync(new URL("../public/", import.meta.url)).isDirectory());
assert.equal(FRAMES, 432_000);
assert.equal(FADE_START, 403_200);
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

const seedFor = (name) => createHash("sha256").update(`opening:${name}`).digest().readUInt32LE(0);
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

function sweep(name, start, duration, fromHz, toHz, gain, from, to) {
  let phase = 0;
  event(name, start, duration, (i, t, u) => {
    const frequency = lerp(fromHz, toHz, smooth(u));
    phase += (TAU * frequency) / SAMPLE_RATE;
    const shimmer = Math.sin(phase) + 0.22 * Math.sin(2.61 * phase + 0.5)
      + 0.08 * Math.sin(4.13 * phase);
    const e = envelope(t, duration - 1 / SAMPLE_RATE, 0.1, duration * 0.4);
    pan(i, gain * e * shimmer, lerp(from, to, smooth(u)), 0.34);
  });
}

function hoof(name, start, duration, gain, position) {
  const contact = bandNoise(seedFor(name), 260);
  const upper = coefficient(1_500);
  event(name, start, duration, (i, t, u) => {
    let sample = 0;
    // Two taps per cluster: the back hoof lands just after the front one.
    for (const [offset, weight] of [[0, 1], [0.088, 0.72]]) {
      const d = t - offset;
      if (d < 0) continue;
      const body = Math.sin(TAU * 150 * d) * Math.exp(-d / 0.048)
        + 0.45 * Math.sin(TAU * 233 * d + 0.3) * Math.exp(-d / 0.026);
      const brush = 0.55 * contact(upper) * Math.exp(-d / 0.022);
      sample += weight * (body + brush);
    }
    const e = smooth(t / 0.006) * smooth(((1 - u) * duration) / 0.18);
    pan(i, gain * e * sample, position, 0.32);
  });
}

function thud(name, start, duration, frequency, gain, position) {
  const contact = bandNoise(seedFor(name), 240);
  const upper = coefficient(900);
  event(name, start, duration, (i, t, u) => {
    const body = Math.sin(TAU * frequency * t) * Math.exp(-t / 0.16);
    const round = 0.3 * Math.sin(TAU * frequency * 1.47 * t + 0.4) * Math.exp(-t / 0.07);
    const touch = 0.22 * contact(upper) * Math.exp(-t / 0.035);
    const e = smooth(t / 0.012) * smooth(((1 - u) * duration) / 0.22);
    pan(i, gain * e * (body + round + touch), position, 0.3);
  });
}

function tap(name, start, duration, gain, position) {
  const contact = bandNoise(seedFor(name), 320);
  const upper = coefficient(1_800);
  event(name, start, duration, (i, t, u) => {
    const strike = (Math.sin(TAU * 320 * t) * Math.exp(-t / 0.035)
      + 0.55 * Math.sin(TAU * 480 * t + 0.3) * Math.exp(-t / 0.02)) * smooth(t / 0.003);
    const settle = t > 0.1
      ? 0.3 * Math.sin(TAU * 150 * (t - 0.1)) * Math.exp(-(t - 0.1) / 0.06) * smooth((t - 0.1) / 0.02)
      : 0;
    const cloth = 0.3 * contact(upper) * Math.exp(-t / 0.05);
    const e = smooth(t / 0.004) * smooth(((1 - u) * duration) / 0.12);
    pan(i, gain * e * (strike + settle + cloth), position, 0.28);
  });
}

function roomTone() {
  const frequencies = [98, 147, 196];
  const gains = [0.0042, 0.0019, 0.0011];
  for (let i = 0; i < FRAMES; i++) {
    const t = i / SAMPLE_RATE;
    const breath = 0.93 + 0.07 * Math.sin(TAU * 0.061 * t - 0.4);
    const level = smooth(t / 1.2) * breath;
    for (let voice = 0; voice < frequencies.length; voice++) {
      const position = voice === 0 ? 0 : (voice === 1 ? -0.14 : 0.14);
      const phase = TAU * frequencies[voice] * t + voice * 0.29;
      pan(i, gains[voice] * level * Math.sin(phase), position, 0.12);
    }
  }
}

roomTone();

// 马蹄落点 = walkPhase 相位回绕时刻（马每行进 255px 一个蹄簇），与画面腿摆严格同相。
const HOOFS = [
  [0, -0.88, 0.048], [0.583, -0.72, 0.058], [1.195, -0.56, 0.068],
  [1.884, -0.44, 0.076], [2.78, -0.28, 0.08], [3.768, -0.1, 0.082],
  [4.522, 0.05, 0.08], [5.256, 0.14, 0.078], [5.904, 0.22, 0.072],
  [6.584, 0.32, 0.066], [7.329, 0.44, 0.058], [8.163, 0.56, 0.05],
];

function hooves(indexes) {
  indexes.forEach((index) => {
    const [start, position, gain] = HOOFS[index];
    hoof(`hoof cluster ${index + 1}`, start, 0.22, gain, position);
  });
}

scene("the field breathes, the horse walks in from far left", 0, 1.8, () => {
  texture("dawn mist breath", 0, 1.8, {
    gain: 0.045, low: 168, highFrom: 620, highTo: 1_020, folds: 0.8,
    width: 0.55, attack: 0.55, release: 0.5, room: 0.55,
  });
  texture("question ink whispers across the sheet", 0.15, 1.6, {
    gain: 0.02, from: -0.32, to: 0.12, low: 480, highFrom: 1_500,
    highTo: 2_500, folds: 5.5, width: 0.1, attack: 0.25, release: 0.5, room: 0.4,
  });
  hooves([0, 1, 2]);
  texture("the duck crouches on the perch", 1.64, 0.16, {
    gain: 0.02, low: 220, highFrom: 720, highTo: 900, folds: 1.2,
    width: 0.2, attack: 0.05, release: 0.08, room: 0.3,
  });
});

scene("the duck drops through the mist", 1.8, 2.38, () => {
  texture("duck falls through the mist", 1.8, 0.32, {
    gain: 0.078, from: 0.12, to: -0.03, low: 142, highFrom: 2_300,
    highTo: 680, folds: 0.5, width: 0.22, attack: 0.05, release: 0.1, room: 0.45,
  });
  hooves([3]);
  thud("duck lands on the cloth", 2.12, 0.26, 104, 0.115, -0.05);
  texture("mist cushions the landing", 2.12, 0.26, {
    gain: 0.03, low: 150, highFrom: 900, highTo: 620, folds: 0.6,
    width: 0.4, attack: 0.08, release: 0.1, room: 0.5,
  });
});

scene("sprinting after the horse", 2.38, 3.15, () => {
  texture("sprint dust rises", 2.38, 0.74, {
    gain: 0.05, from: -0.06, to: 0.1, low: 180, highFrom: 900,
    highTo: 1_300, folds: 2.8, width: 0.3, attack: 0.1, release: 0.2, room: 0.4,
  });
  for (let index = 0; index < 5; index++) {
    tap(`boot tap ${index + 1}`, 2.4 + index * 0.154, 0.13, 0.062 - index * 0.002,
      -0.05 + index * 0.04);
  }
  hooves([4]);
});

scene("vault onto the running horse", 3.15, 4.25, () => {
  texture("vault whoosh rises", 3.15, 1, {
    gain: 0.088, from: -0.1, to: 0.1, low: 162, highFrom: 540,
    highTo: 2_150, folds: 0.9, width: 0.2, attack: 0.12, release: 0.22, room: 0.4,
  });
  glow("vault whoosh undertow", 3.15, 1, 225, 0.011, -0.1, 0.1, 0.2);
  hooves([5]);
  texture("coat flutter at the apex", 3.9, 0.3, {
    gain: 0.022, low: 260, highFrom: 1_200, highTo: 1_700, folds: 2.2,
    width: 0.18, attack: 0.08, release: 0.1, room: 0.35,
  });
});

scene("the saddle catches the rider, the cursor dives", 4.25, 5.2, () => {
  tap("saddle leather catches the duck", 4.25, 0.3, 0.085, 0.02);
  thud("horse body absorbs the landing", 4.25, 0.3, 92, 0.07, 0);
  sweep("cursor spirals down into the ground thread", 4.32, 0.82, 660, 182, 0.02, 0.3, 0.18);
  hooves([6]);
  glow("riding breath", 4.6, 0.55, 258, 0.009, 0.12, 0.26, 0.3);
});

scene("the cloth drags right and the film light wakes", 5.2, 9, () => {
  hooves([7, 8, 9, 10, 11]);
  texture("cloth drag across the ground", 5.2, 3.4, {
    gain: 0.08, from: -0.2, to: 0.85, low: 190, highFrom: 850,
    highTo: 1_250, folds: 2.4, width: 0.3, attack: 0.4, release: 1.1, room: 0.42,
  });
  glow("thread light spreads under the cloth", 5.2, 1.15, 335, 0.013, 0.12, 0.48, 0.25);
  glow("film light wakes beneath the sheet", 5.45, 2.1, 148, 0.008, -0.15, 0.5, 0.8);
});

assert.equal(scenes.at(-1).end, DURATION);
assert.equal(scenes.length, 6);
for (const [name, start] of [
  ["dawn mist breath", 0], ["hoof cluster 1", 0], ["hoof cluster 12", 8.163],
  ["duck falls through the mist", 1.8], ["duck lands on the cloth", 2.12],
  ["sprint dust rises", 2.38], ["boot tap 1", 2.4], ["boot tap 5", 3.016],
  ["vault whoosh rises", 3.15], ["saddle leather catches the duck", 4.25],
  ["cursor spirals down into the ground thread", 4.32],
  ["cloth drag across the ground", 5.2], ["thread light spreads under the cloth", 5.2],
]) {
  assert.equal(cues.find((cue) => cue.name === name)?.start, start, `Missing scene accent: ${name}`);
}
assert.equal(cues.length, 34);

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
  assert.ok(fadeAt(i) <= fadeAt(i - 1), "The final 0.6s fade must be monotonic.");
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

const dither = random(0x51a7c3d1);
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
  assert.equal(buffer.length, 2_592_044);
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
  assert.equal(buffer.readUInt32LE(40) / buffer.readUInt32LE(28), 9);
  assert.equal(buffer.readUInt32LE(40) / BLOCK_ALIGN, 432_000);
  let peak = 0;
  let energyL = 0;
  let energyR = 0;
  let sideEnergy = 0;
  let crossEnergy = 0;
  let tailEnergy = 0;
  let dcL = 0;
  let dcR = 0;
  const quarterWidth = (FRAMES - FADE_START) / 4;
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
    if (i >= FADE_START) quarterEnergies[Math.floor((i - FADE_START) / quarterWidth)] += energy;
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
console.log(`Passed: ${scenes.length} scene windows, ${cues.length} cues, finite samples, headers, exact duration, peak <= ${PEAK_CEILING}, stereo, continuity, silent endpoints, final 0.6s fade, byte-exact readback.`);
console.log(`SHA-256: ${createHash("sha256").update(saved).digest("hex")}`);
