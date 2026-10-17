import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { mix, phase } from "./journey-motion";
import { PetSculpture, UserSculpture } from "./QueryOpeningV2";
import { V2_DURATION, v2CameraAt, v2Mote } from "./query-v2-motion";
import "./query-v2.css";
import "./query-v3.css";

export const FIELD_W = 572;
export const LAYER_H = 74;
export const FIVE_H = 358;
export const BOTTOM = 545;
export const USER_CX = 3870;
export const HARNESS_CX = 4300;

export const USER_TOKENS = [135, 91, 143];
export const ROW_TOKENS: number[][] = [
  [159, 107, 164],
  [143, 203],
  [120, 192],
  [166, 125],
  [135, 172],
];

export const SHAPE_L = 29;
export const SHAPE_W = 514;
export const SHAPE_H = 88;
export const SHAPE_TOP = 29;
export const SHAPE_STEP = 106;

export const SHAPES = [
  { word: "匹配", q: "我是谁？我在哪？" },
  { word: "关系", q: "我们现在是什么关系？" },
  { word: "深度", q: "你还要我怎样？" },
] as const;

function Tokens({
  widths,
  grow,
  caret,
}: {
  widths: number[];
  grow: number[];
  caret: number;
}) {
  return (
    <>
      {widths.map((width, index) => (
        <i
          key={index}
          style={{
            width: width * grow[index],
            marginRight: index === widths.length - 1 ? 0 : 29 * grow[index],
          }}
        />
      ))}
      <span className="v3-caret" style={{ opacity: caret }} />
    </>
  );
}

function SendButton({ dispatch }: { dispatch: number }) {
  return (
    <div className="v3-send">
      <div
        className="v3-send-face v3-send-light"
        style={{ opacity: 1 - dispatch }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 17V5M6 10l5-5 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="v3-send-face v3-send-dark" style={{ opacity: dispatch }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 17V5M6 10l5-5 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function UserInputField({ time }: { time: number }) {
  const appear = phase(time, 1.0, 1.6);
  const grow = [0, 1, 2].map((index) =>
    phase(time, 1.6 + index * 0.55, 2.2 + index * 0.55),
  );
  const caret = 1 - phase(time, 3.35, 3.6);
  const dispatch = phase(time, 3.45, 3.85);
  const flight = phase(time, 3.75, 4.45);
  return (
    <div
      className="v3-field"
      data-v3-field="user"
      style={{
        left: USER_CX - FIELD_W / 2 + flight * 330,
        top: BOTTOM - LAYER_H - flight * 60,
        width: FIELD_W,
        height: LAYER_H,
        opacity: appear * (1 - phase(time, 4.15, 4.45)),
        transform: `scale(${mix(1, 0.16, flight)})`,
      }}
    >
      <div className="v3-sheen" />
      <div className="v3-rows" style={{ alignItems: "flex-start" }}>
        <div className="v3-row">
          <Tokens widths={USER_TOKENS} grow={grow} caret={caret} />
        </div>
      </div>
      <SendButton dispatch={dispatch} />
    </div>
  );
}

function HarnessField({ time }: { time: number }) {
  const appear = phase(time, 4.4, 5.05);
  const grow = phase(time, 5.1, 8.1);
  const height = mix(LAYER_H, FIVE_H, grow);
  const rowsOut = 1 - 0.78 * phase(time, 8.2, 8.5);
  return (
    <div
      className="v3-field"
      data-v3-field="harness"
      style={{
        left: HARNESS_CX - FIELD_W / 2,
        top: BOTTOM - height,
        width: FIELD_W,
        height,
        opacity: appear,
      }}
    >
      <div className="v3-sheen" />
      <div className="v3-rows">
        {ROW_TOKENS.map((widths, index) => {
          const rowIn = phase(
            grow,
            0.06 + index * 0.185,
            0.2 + index * 0.185,
          );
          return (
            <div
              className="v3-row"
              key={index}
              style={{
                opacity: rowIn * rowsOut,
                transform: `translateY(${mix(7, 0, rowIn)}px)`,
              }}
            >
              <Tokens widths={widths} grow={widths.map(() => 1)} caret={0} />
            </div>
          );
        })}
      </div>
      {SHAPES.map((shape, index) => {
        const frame = phase(time, 8.5 + index * 1.0, 9.35 + index * 1.0);
        const formed = phase(time, 9.0 + index * 1.0, 9.65 + index * 1.0);
        return (
          <div key={shape.word}>
            <div
              className={`v3-shape v3-shape-${index}`}
              style={{
                left: SHAPE_L,
                top: SHAPE_TOP + index * SHAPE_STEP,
                width: SHAPE_W,
                height: SHAPE_H,
                opacity: formed,
                transform: `scale(${mix(0.92, 1, formed)})`,
              }}
            >
              <div className="v3-shape-sheen" />
              <strong>{shape.word}</strong>
              <p>{shape.q}</p>
            </div>
            <div
              className="v3-contract"
              style={{
                left: 2 * (1 - frame) + SHAPE_L * frame,
                top:
                  2 * (1 - frame) + (SHAPE_TOP + index * SHAPE_STEP) * frame,
                width: mix(568, SHAPE_W, frame),
                height: mix(354, SHAPE_H, frame),
                borderRadius: mix(23, 18, frame),
                opacity: Math.sin(Math.PI * Math.min(1, frame * 1.1)),
                borderColor: [
                  "rgba(126,213,228,0.95)",
                  "rgba(166,216,152,0.95)",
                  "rgba(192,164,235,0.95)",
                ][index],
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

const CAPTIONS = [
  { start: 0.6, end: 3.3, text: "用户正在输入问题。" },
  { start: 3.6, end: 4.8, text: "出发，交给 harness agent。" },
  { start: 5.1, end: 8.0, text: "改写、展开成任务。" },
  { start: 8.5, end: 12.2, text: "识别三类问题，调用对应的工具。" },
] as const;

export const QueryOpeningV3 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load v3 fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const camera = v2CameraAt(time);
  return (
    <AbsoluteFill className="v2" data-v3-time={time}>
      <Audio
        src={staticFile("query-sound.wav")}
        premountFor={fps}
        volume={0.75}
      />
      <div className="v2-atmosphere">
        {Array.from({ length: 14 }, (_, seed) => {
          const mote = v2Mote(seed + 1, time);
          return (
            <i
              key={seed}
              style={{
                left: mote.x,
                top: mote.y,
                width: mote.size,
                height: mote.size,
                opacity: mote.alpha,
              }}
            />
          );
        })}
      </div>
      <div
        className="v2-world"
        data-v3-camera-zoom={camera.zoom}
        style={{
          transform: `translate(960px,540px) rotate(${camera.roll}deg) scale(${camera.zoom}) translate(${-camera.x}px,${-camera.y}px)`,
        }}
      >
        <div className="v2-floor-glow" />
        <svg
          className="v2-grid"
          width="6400"
          height="1800"
          viewBox="0 0 6400 1800"
          fill="none"
        >
          <path
            d="M3300 1240 C3900 1420 4700 1180 5600 1320"
            stroke="#8fb3aa"
            strokeOpacity="0.09"
          />
          <path
            d="M3300 1258 C3900 1438 4700 1198 5600 1338"
            stroke="#8fb3aa"
            strokeOpacity="0.05"
          />
        </svg>
        <UserSculpture time={time} />
        <PetSculpture time={time} />
        <UserInputField time={time} />
        <HarnessField time={time} />
      </div>
      <div className="v2-vignette" />
      <div className="journey-hud">
        <span className="journey-brand">
          harness <i>/</i> RAG
        </span>
        <span className="journey-hud-right">ASK THE KNOWLEDGE</span>
      </div>
      <div className="journey-captions">
        {CAPTIONS.map((caption) => (
          <div
            key={caption.start}
            style={{
              opacity:
                phase(time, caption.start, caption.start + 0.3) *
                (1 - phase(time, caption.end - 0.25, caption.end)),
              transform: `translateY(${mix(7, 0, phase(time, caption.start, caption.start + 0.45))}px)`,
            }}
          >
            {caption.text}
          </div>
        ))}
      </div>
      <div className="journey-corner-note">机制演示 · 非实时耗时</div>
      <div className="journey-timeline">
        <span style={{ width: `${(time / V2_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};
