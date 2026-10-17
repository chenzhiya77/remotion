import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 48_000;
const DURATION = 20;
const CHANNELS = 2;
const BITS = 24;
const FRAMES = SAMPLE_RATE * DURATION;
const TARGET_PEAK = 0.54;
const PEAK_CEILING = 0.66;
const BYTES_PER_SAMPLE = BITS / 8;
const BLOCK_ALIGN = CHANNELS * BYTES_PER_SAMPLE;
const DATA_BYTES = FRAMES * BLOCK_ALIGN;
const FULL_SCALE = 2 ** (BITS - 1);
const FADE_START = 19 * SAMPLE_RATE;
const TAU = 2 * Math.PI;
const OUTPUT = new URL("../public/retrieval-continuum-sound.wav", import.meta.url);

assert.equal(process.argv.length, 2, "This generator takes no arguments.");
assert.ok(statSync(new URL("../public/", import.meta.url)).isDirectory());
assert.equal(FRAMES, 960_000);
assert.ok(TARGET_PEAK < PEAK_CEILING);

const left = new Float64Array(FRAMES);
const right = new Float64Array(FRAMES);
const sendLeft = new Float64Array(FRAMES);
const sendRight = new Float64Array(FRAMES);
const scenes = [];
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

const smooth = (x) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};
const lerp = (a, b, u) => a + (b - a) * u;
const coefficient = (hz) => 1 - Math.exp((-TAU * hz) / SAMPLE_RATE);
const envelope = (u, duration, attack, release) =>
  smooth((u * duration) / attack) * smooth(((1 - u) * duration) / release);

function scene(name, start, end, render) {
  assert.ok(start >= (scenes.at(-1)?.end ?? 0) && end > start && end <= 19);
  activeScene = { name, start, end };
  scenes.push(activeScene);
  render();
  activeScene = null;
}

function event(start, duration, render) {
  assert.ok(Number.isFinite(start) && Number.isFinite(duration) && duration > 0);
  assert.ok(activeScene, "Every cue must belong to a timeline scene.");
  assert.ok(start >= activeScene.start && start + duration <= activeScene.end + 1e-9,
    `Cue exceeds scene: ${activeScene.name}`);
  const first = Math.round(start * SAMPLE_RATE);
  const count = Math.round(duration * SAMPLE_RATE);
  assert.ok(first >= 0 && count > 1 && first + count <= FRAMES);
  for (let n = 0; n < count; n++) {
    render(first + n, n / SAMPLE_RATE, n / (count - 1));
  }
}

function pan(i, sample, position, room = 0.2) {
  const angle = ((Math.max(-1, Math.min(1, position)) + 1) * Math.PI) / 4;
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

function bed() {
  for (let i = 0; i < FRAMES; i++) {
    const t = i / SAMPLE_RATE;
    const resolution = smooth((t - 16.2) / 2.6);
    const breathing = 0.9 + 0.1 * Math.sin(TAU * 0.073 * t - 0.8);
    const dynamics = 0.53 * smooth(t / 1.4) * breathing * (0.8 + 0.13 * resolution);
    const center =
      0.043 * Math.sin(TAU * 98 * t + 0.09 * Math.sin(TAU * 0.11 * t)) +
      0.014 * Math.sin(TAU * 147 * t + 0.17 * Math.sin(TAU * 0.087 * t));
    const upper =
      0.015 * Math.sin(TAU * 196 * t + 0.22 * Math.sin(TAU * 0.13 * t)) +
      0.008 * Math.sin(TAU * 294 * t + 0.4);
    const companion =
      0.012 * Math.sin(TAU * 196.19 * t + 0.6) +
      0.006 * Math.sin(TAU * 392.11 * t + 0.15 * Math.sin(TAU * 0.091 * t));
    const width = 0.28 + 0.28 * resolution;
    pan(i, center * dynamics, 0, 0.1);
    pan(i, upper * dynamics, -width, 0.23);
    pan(i, companion * dynamics, width, 0.23);
  }
}

function glow(start, duration, frequency, gain, from, to, attack = 0.6) {
  event(start, duration, (i, t, u) => {
    const tone =
      Math.sin(TAU * frequency * t + 0.1 * Math.sin(TAU * 0.31 * t)) +
      0.19 * Math.sin(TAU * frequency * 2.001 * t + 0.2) +
      0.04 * Math.sin(TAU * frequency * 3.003 * t);
    pan(i, gain * envelope(u, duration, attack, duration * 0.44) * tone,
      lerp(from, to, smooth(u)), 0.38);
  });
}

function felt(start, duration, frequency, gain, position, decay = 0.18) {
  const contact = bandNoise(0xc011 + Math.round(start * SAMPLE_RATE), 380);
  const upper = coefficient(1_800);
  event(start, duration, (i, t, u) => {
    const tone =
      Math.sin(TAU * frequency * t + 0.08 * Math.exp(-t * 22)) +
      0.12 * Math.sin(TAU * frequency * 2.03 * t) * Math.exp(-t / 0.07) +
      0.06 * contact(upper) * Math.exp(-t / 0.025);
    const e = envelope(u, duration, 0.018, 0.16) * Math.exp(-t / decay);
    pan(i, gain * e * tone, position, 0.25);
  });
}

function paper(start, duration, gain, from, to, seed, folds = 2) {
  const noise = bandNoise(seed, 440);
  const upper = coefficient(2_400);
  event(start, duration, (i, t, u) => {
    const grain = 0.24 + 0.76 * (0.5 + 0.5 *
      Math.sin(TAU * (folds * u + 0.12 * Math.sin(TAU * u)))) ** 3;
    const body = 0.025 * Math.sin(TAU * 294 * t) * Math.sin(Math.PI * u);
    const e = envelope(u, duration, Math.min(0.11, duration * 0.2), duration * 0.36);
    pan(i, gain * e * (noise(upper) * grain + body), lerp(from, to, smooth(u)), 0.15);
  });
}

function flight(start, duration, gain, from, to, seed, pitch = 196) {
  const airLeft = bandNoise(seed, 220);
  const airRight = bandNoise(seed ^ 0x73a912, 220);
  let phase = 0;
  event(start, duration, (i, t, u) => {
    const arc = Math.sin(Math.PI * u) ** 2;
    const upper = coefficient(700 + 1_450 * arc);
    phase += (TAU * pitch * (0.98 + 0.045 * arc)) / SAMPLE_RATE;
    const body = 0.09 * Math.sin(phase) + 0.018 * Math.sin(2 * phase + 0.2);
    const e = gain * arc * envelope(u, duration, 0.16, 0.3);
    const position = lerp(from, to, smooth(u));
    const width = 0.05 + 0.15 * arc;
    pan(i, e * (0.65 * airLeft(upper) + body * 0.5), position - width, 0.36);
    pan(i, e * (0.65 * airRight(upper) + body * 0.5), position + width, 0.36);
  });
}

bed();

scene("question emerges in foreground", 0.3, 2.4, () => {
  glow(0.3, 2.1, 294, 0.024, -0.1, 0.08, 0.65);
  felt(0.58, 0.74, 196, 0.041, 0);
  paper(0.74, 1.12, 0.025, -0.12, 0.1, 0xc101, 1.5);
});

scene("camera dive", 2.4, 3.8, () => {
  flight(2.4, 1.4, 0.058, 0.04, -0.6, 0xc201, 147);
});

scene("mixed retrieval scan and two paper lifts", 3.8, 6.3, () => {
  paper(3.8, 2.5, 0.013, -0.62, -0.26, 0xc301, 6.1);
  paper(4.25, 0.8, 0.062, -0.62, -0.33, 0xc302, 1.8);
  felt(4.57, 0.52, 196, 0.029, -0.35);
  paper(5.25, 0.94, 0.056, -0.5, -0.05, 0xc303, 2.1);
  felt(5.6, 0.59, 245, 0.025, -0.14);
});

scene("camera travels to canonical entity", 6.3, 7.8, () => {
  flight(6.3, 1.5, 0.05, -0.6, 0.04, 0xc401, 196);
});

scene("graph expands and related slice lifts", 7.8, 10.2, () => {
  glow(7.8, 1.65, 196, 0.016, 0, -0.25, 0.38);
  glow(8.05, 1.57, 294, 0.012, 0.05, 0.48, 0.45);
  felt(7.89, 0.6, 147, 0.033, 0);
  felt(8.32, 0.51, 196, 0.027, -0.35);
  felt(8.77, 0.53, 294, 0.023, 0.42);
  paper(9.2, 1, 0.055, 0.25, 0.05, 0xc501, 2.2);
  flight(9.34, 0.86, 0.024, 0.32, 0.02, 0xc502, 196);
  felt(9.56, 0.56, 245, 0.03, 0.06);
});

scene("camera glides right", 10.2, 11.5, () => {
  flight(10.2, 1.3, 0.046, 0.04, 0.66, 0xc601, 147);
});

scene("wiki page highlights and excerpt lifts", 11.5, 13.6, () => {
  paper(11.5, 1.05, 0.032, 0.63, 0.45, 0xc701, 2.1);
  paper(11.82, 0.32, 0.028, 0.42, 0.65, 0xc702, 1.1);
  paper(12.26, 0.36, 0.026, 0.4, 0.64, 0xc703, 1.2);
  felt(11.88, 0.6, 196, 0.022, 0.53);
  felt(12.33, 0.53, 294, 0.018, 0.55);
  paper(12.72, 0.88, 0.06, 0.56, 0.17, 0xc704, 1.9);
  flight(12.8, 0.8, 0.023, 0.6, 0.18, 0xc705, 196);
});

scene("three evidence cards converge on question", 13.8, 16.1, () => {
  flight(13.8, 2.3, 0.039, -0.68, -0.035, 0xc801, 147);
  flight(13.92, 2.18, 0.036, 0.04, 0, 0xc802, 196);
  flight(14.06, 2.04, 0.037, 0.68, 0.035, 0xc803, 294);
  paper(13.8, 0.38, 0.035, -0.68, -0.54, 0xc804, 1.3);
  paper(13.92, 0.38, 0.029, 0.04, 0, 0xc805, 1.2);
  paper(14.06, 0.38, 0.033, 0.68, 0.54, 0xc806, 1.4);
  felt(15.45, 0.62, 196, 0.02, -0.03);
  felt(15.5, 0.58, 147, 0.017, 0.03);
  felt(15.55, 0.55, 294, 0.016, 0);
});

scene("answer resolves", 16.2, 18.8, () => {
  glow(16.2, 2.6, 196, 0.026, -0.04, -0.3, 0.6);
  glow(16.24, 2.56, 294, 0.018, 0.04, 0.3, 0.68);
  felt(16.28, 0.85, 98, 0.052, 0, 0.25);
  paper(16.48, 1.5, 0.017, -0.12, 0.17, 0xc901, 4);
  felt(17.13, 0.62, 196, 0.014, -0.1);
  felt(17.84, 0.6, 294, 0.012, 0.12);
  glow(17.62, 1.18, 392, 0.008, -0.05, 0.2, 0.38);
});

function room(input, opposite, offset) {
  const result = new Float64Array(FRAMES);
  const damping = coefficient(2_400);
  for (const seconds of [0.0437, 0.0613, 0.0793, 0.1031]) {
    const delay = Math.round((seconds + offset) * SAMPLE_RATE);
    const ring = new Float64Array(delay);
    const feedback = Math.pow(0.001, delay / SAMPLE_RATE / 1.3);
    let cursor = 0;
    let filtered = 0;
    for (let i = 0; i < FRAMES; i++) {
      const delayed = ring[cursor];
      filtered += damping * (delayed - filtered);
      ring[cursor] = input[i] * 0.84 + opposite[i] * 0.16 + filtered * feedback;
      result[i] += delayed / 4;
      cursor = (cursor + 1) % delay;
    }
  }
  for (const seconds of [0.0053, 0.0127]) {
    const ring = new Float64Array(Math.round((seconds + offset * 0.19) * SAMPLE_RATE));
    let cursor = 0;
    for (let i = 0; i < FRAMES; i++) {
      const x = result[i];
      const y = ring[cursor] - 0.5 * x;
      ring[cursor] = x + 0.5 * y;
      result[i] = y;
      cursor = (cursor + 1) % ring.length;
    }
  }
  return result;
}

const fadeAt = (i) => smooth(i / (SAMPLE_RATE * 0.04)) *
  (1 - smooth((i - FADE_START) / (FRAMES - 1 - FADE_START)));
assert.equal(fadeAt(0), 0);
assert.equal(fadeAt(FADE_START), 1);
assert.equal(fadeAt(FRAMES - 1), 0);
for (let i = FADE_START + 1; i < FRAMES; i++) {
  assert.ok(fadeAt(i) <= fadeAt(i - 1), "Final-second fade must be monotonic.");
}

const wetLeft = room(sendLeft, sendRight, 0);
const wetRight = room(sendRight, sendLeft, 0.0031);
const lowPass = coefficient(4_800);
const dcPole = Math.exp((-TAU * 18) / SAMPLE_RATE);
let rawPeak = 0;
for (const [dry, wet] of [[left, wetLeft], [right, wetRight]]) {
  assert.equal(dry.length, FRAMES);
  assert.equal(wet.length, FRAMES);
  let previousInput = 0;
  let previousHighPass = 0;
  let filtered1 = 0;
  let filtered2 = 0;
  for (let i = 0; i < FRAMES; i++) {
    const x = dry[i] + 0.4 * wet[i];
    const highPass = x - previousInput + dcPole * previousHighPass;
    previousInput = x;
    previousHighPass = highPass;
    filtered1 += lowPass * (highPass - filtered1);
    filtered2 += lowPass * (filtered1 - filtered2);
    // Fade after the room so reverberation cannot refill the silent endpoint.
    dry[i] = filtered2 * fadeAt(i);
    assert.ok(Number.isFinite(dry[i]), `Non-finite synthesis at frame ${i}`);
    rawPeak = Math.max(rawPeak, Math.abs(dry[i]));
  }
}
assert.ok(rawPeak > 1e-6 && Number.isFinite(rawPeak));
const gain = TARGET_PEAK / rawPeak;
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

const dither = random(0xc0a71a24);
for (let i = 0; i < FRAMES; i++) {
  for (let channel = 0; channel < CHANNELS; channel++) {
    const value = (channel === 0 ? left[i] : right[i]) * gain;
    assert.ok(Number.isFinite(value) && Math.abs(value) <= PEAK_CEILING);
    const quantized = Math.round(value * (FULL_SCALE - 1) +
      (dither() - dither()) * fadeAt(i));
    assert.ok(Number.isSafeInteger(quantized) && Math.abs(quantized) < FULL_SCALE);
    wav.writeIntLE(quantized, 44 + i * BLOCK_ALIGN + channel * BYTES_PER_SAMPLE,
      BYTES_PER_SAMPLE);
  }
}

function verify(buffer) {
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.length, 5_760_044);
  assert.equal(buffer.length, 44 + DATA_BYTES);
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.readUInt32LE(4), buffer.length - 8);
  assert.equal(buffer.toString("ascii", 8, 12), "WAVE");
  assert.equal(buffer.toString("ascii", 12, 16), "fmt ");
  assert.equal(buffer.readUInt32LE(16), 16);
  assert.equal(buffer.readUInt16LE(20), 1);
  assert.equal(buffer.readUInt16LE(22), CHANNELS);
  assert.equal(buffer.readUInt32LE(24), SAMPLE_RATE);
  assert.equal(buffer.readUInt32LE(28), SAMPLE_RATE * BLOCK_ALIGN);
  assert.equal(buffer.readUInt16LE(32), BLOCK_ALIGN);
  assert.equal(buffer.readUInt16LE(34), BITS);
  assert.equal(buffer.toString("ascii", 36, 40), "data");
  assert.equal(buffer.readUInt32LE(40), DATA_BYTES);
  assert.equal(buffer.readUInt32LE(40) % BLOCK_ALIGN, 0);
  assert.equal(buffer.readUInt32LE(40) / buffer.readUInt32LE(28), DURATION);
  assert.equal(buffer.readUInt32LE(40) / BLOCK_ALIGN, FRAMES);
  let peak = 0;
  let energy = 0;
  let sideEnergy = 0;
  let tailEnergy = 0;
  const quarterEnergies = [0, 0, 0, 0];
  const windowEnergies = new Float64Array(DURATION * 10);
  for (let i = 0; i < FRAMES; i++) {
    const offset = 44 + i * BLOCK_ALIGN;
    const l = buffer.readIntLE(offset, BYTES_PER_SAMPLE) / FULL_SCALE;
    const r = buffer.readIntLE(offset + BYTES_PER_SAMPLE, BYTES_PER_SAMPLE) / FULL_SCALE;
    assert.ok(Number.isFinite(l) && Number.isFinite(r));
    const e = l * l + r * r;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    energy += e;
    sideEnergy += (l - r) ** 2;
    windowEnergies[Math.floor(i / (SAMPLE_RATE / 10))] += e;
    if (i >= FADE_START) quarterEnergies[Math.floor((i - FADE_START) / (SAMPLE_RATE / 4))] += e;
    if (i >= FRAMES - SAMPLE_RATE / 20) tailEnergy += e;
    if (i === 0 || i === FRAMES - 1) {
      assert.equal(l, 0, "Left endpoint must be exactly silent.");
      assert.equal(r, 0, "Right endpoint must be exactly silent.");
    }
  }
  assert.ok(peak > 0 && peak <= PEAK_CEILING, `Peak exceeds ceiling: ${peak}`);
  assert.ok(Math.abs(peak - TARGET_PEAK) < 2 / FULL_SCALE);
  assert.ok(sideEnergy > energy * 0.003, "Stereo channels must be distinct.");
  for (let i = 1; i < windowEnergies.length - 10; i++) {
    assert.ok(windowEnergies[i] > 1e-8, `Unintended silence in 100ms window ${i}`);
  }
  for (let i = 1; i < quarterEnergies.length; i++) {
    assert.ok(quarterEnergies[i] < quarterEnergies[i - 1], "Final-second energy must soften.");
  }
  const rms = Math.sqrt(energy / (FRAMES * CHANNELS));
  const tailRms = Math.sqrt(tailEnergy / ((SAMPLE_RATE / 20) * CHANNELS));
  assert.ok(tailRms < 0.001, "Final 50ms must be near silence.");
  return { peak, rms, tailRms };
}

verify(wav);
let created = false;
try {
  // Exclusive creation protects parallel work; identical reruns only verify.
  writeFileSync(OUTPUT, wav, { flag: "wx" });
  created = true;
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
const saved = readFileSync(OUTPUT);
assert.ok(saved.equals(wav), "Existing output differs; no existing file was overwritten.");
const stats = verify(saved);
console.log(`${created ? "Created" : "Verified unchanged"}: ${fileURLToPath(OUTPUT)}`);
console.log(`${DURATION}s | ${SAMPLE_RATE}Hz | stereo PCM${BITS} | ${FRAMES} frames | ${saved.length} bytes`);
console.log(`Peak ${stats.peak.toFixed(7)} | RMS ${(20 * Math.log10(stats.rms)).toFixed(2)} dBFS | final 50ms ${(20 * Math.log10(stats.tailRms)).toFixed(2)} dBFS`);
console.log(`Passed: ${scenes.length} timeline windows, finite samples, buffer/header/duration, peak <= ${PEAK_CEILING}, stereo, continuity, silent endpoints, final-second fade, byte-exact readback.`);
console.log(`SHA-256: ${createHash("sha256").update(saved).digest("hex")}`);
