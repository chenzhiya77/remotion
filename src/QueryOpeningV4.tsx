import { useEffect, useState } from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { mix, phase, progress, track } from "./journey-motion";
import { PetSculpture, UserSculpture } from "./QueryOpeningV2";
import "./query-v2.css";
import "./query-v4.css";

export const V4_DURATION = 26;

const USER_FIG = { x: 645, y: 315 };
const PET_FIG = { x: 1615, y: 285 };
const USER_PANEL = { x: 322, y: 745, w: 520, h: 86 };
const HARNESS_PANEL = { x: 1305, y: 815, w: 520, h: 86, grown: 430 };

const USER_TOKENS = [128, 86, 150];
const ROWS: number[][] = [
  [152, 104, 158],
  [138, 196],
  [116, 184],
  [160, 121],
  [131, 166],
];
const SHAPE_W = 218;
const SHAPE_H = 179;
const SHAPE_TALL_W = 226;
const SHAPES = [
  {
    left: 24,
    top: 24,
    w: SHAPE_W,
    h: SHAPE_H,
    tag: "Q1",
    word: "匹配",
    q: "我是谁？我在哪？",
  },
  {
    left: 24,
    top: 227,
    w: SHAPE_W,
    h: SHAPE_H,
    tag: "Q2",
    word: "关系",
    q: "我们现在是什么关系？",
  },
  {
    left: 266,
    top: 24,
    w: SHAPE_TALL_W,
    h: 382,
    tag: "Q3",
    word: "wiki",
    q: "你还要我怎样？",
  },
] as const;

const ease = (v: number) => v * v * (3 - 2 * v);

function cameraAt(time: number) {
  return {
    x: track(time, [
      [0, 0],
      [3, -60],
      [7, -360],
      [10, 150],
      [14, 330],
      [19, 330],
      [24, 10],
      [26, 0],
    ]),
    y: track(time, [
      [0, 40],
      [3, 6],
      [7, 18],
      [10, -6],
      [14, -20],
      [19, -20],
      [24, -70],
      [26, -85],
    ]),
    zoom: track(time, [
      [0, 0.72],
      [3, 0.88],
      [7, 1.38],
      [10, 1.25],
      [14, 1.12],
      [19, 1.42],
      [24, 0.66],
      [26, 0.6],
    ]),
    rotZ: track(time, [
      [0, -4.5],
      [3, -2.6],
      [7, 1.2],
      [10, 0.5],
      [14, -1],
      [19, -1.2],
      [24, -0.4],
      [26, 0],
    ]),
    rotY: track(time, [
      [0, -7],
      [3, -3.5],
      [7, 0],
      [10, 0],
      [14, 16],
      [19, 3],
      [24, -5],
      [26, -7],
    ]),
  };
}

function UserPanel({ time }: { time: number }) {
  const lit = phase(time, 2.8, 3.6);
  const grows = [0, 1, 2].map((index) =>
    ease(progress(time, 3.3 + index * 0.5, 3.85 + index * 0.5)),
  );
  const caret =
    (1 - phase(time, 4.95, 5.15)) * (0.72 + 0.28 * Math.sin(time * 7));
  const press = phase(time, 5.0, 5.22) * (1 - phase(time, 5.55, 5.82));
  return (
    <div
      className={press > 0.02 ? "v4-panel v4-panel-lit" : "v4-panel"}
      style={{
        left: USER_PANEL.x,
        top: USER_PANEL.y,
        width: USER_PANEL.w,
        height: USER_PANEL.h,
        opacity: 0.34 + lit * 0.66,
      }}
    >
      <div
        className="v4-lift"
        style={{ position: "absolute", left: 28, top: 26 }}
      >
        <div className="v4-tokens">
          {USER_TOKENS.map((width, index) => (
            <i
              key={index}
              style={{
                width: width * grows[index],
                marginRight: index === 2 ? 0 : 18 * grows[index],
              }}
            />
          ))}
          <span className="v4-caret" style={{ opacity: caret }} />
        </div>
      </div>
      <div
        className="v4-key"
        style={{ transform: `translateY(${press * 7}px)`, opacity: lit }}
      >
        <svg viewBox="0 0 22 22" fill="none">
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

function Pulse({ time }: { time: number }) {
  const p = ease(progress(time, 5.35, 7.15));
  const start = { x: 780, y: 770 };
  const end = { x: 1430, y: 800 };
  const q = 1 - p;
  const x = q * q * start.x + 2 * q * p * (start.x + 420) + p * p * end.x;
  const y = q * q * start.y + 2 * q * p * (start.y - 165) + p * p * end.y;
  const alpha =
    Math.sin(Math.PI * Math.min(1, p * 1.04)) * (1 - phase(time, 7.25, 7.55));
  return (
    <div className="v4-pulse" style={{ left: x, top: y, opacity: alpha }} />
  );
}

function HarnessPanel({ time }: { time: number }) {
  const appear = phase(time, 7.4, 8.6);
  const grow = ease(progress(time, 10.2, 13.8));
  const height = mix(HARNESS_PANEL.h, HARNESS_PANEL.grown, grow);
  const rowsIn = phase(time, 8.35, 9.6);
  const rowsOut = 1 - phase(time, 14.15, 14.65);
  const sweep = progress(time, 11.2, 13.6);
  return (
    <div
      className={appear > 0.4 ? "v4-panel v4-panel-lit" : "v4-panel"}
      style={{
        left: HARNESS_PANEL.x,
        top: HARNESS_PANEL.y + HARNESS_PANEL.h - height,
        width: HARNESS_PANEL.w,
        height,
        opacity: appear,
        clipPath:
          appear < 1 ? `inset(${(1 - appear) * 100}% 0 0 0)` : undefined,
      }}
    >
      <div
        className="v4-lift"
        style={{ position: "absolute", inset: "26px 30px" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          {ROWS.map((widths, index) => (
            <div
              key={index}
              className="v4-row"
              style={{
                opacity: (index === 0 ? 1 : rowsIn) * rowsOut,
                filter: `blur(${(1 - rowsIn) * 5}px)`,
              }}
            >
              {widths.map((width, tokenIndex) => (
                <i key={tokenIndex} style={{ width }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        className="v4-sweep"
        style={{
          top: mix(-40, height, sweep),
          opacity: Math.sin(Math.PI * sweep) * 0.8,
        }}
      />
      {SHAPES.map((shape, index) => {
        const formed = phase(time, 15.15 + index * 1.2, 15.8 + index * 1.2);
        const settle =
          1 + 0.055 * (1 - formed) * Math.cos(formed * Math.PI * 2.4);
        const gloss = progress(time, 15.6 + index * 1.2, 16.3 + index * 1.2);
        return (
          <div
            key={shape.tag}
            className={`v4-shape v4-shape-${index}`}
            style={{
              left: shape.left,
              top: shape.top,
              width: shape.w,
              height: shape.h,
              opacity: formed > 0 ? 1 : 0,
              transform: `scale(${settle})`,
              transformOrigin: "center",
            }}
          >
            <div className="v4-lift" style={{ position: "absolute", inset: 0 }}>
              <strong>{shape.word}</strong>
              <p>{shape.q}</p>
            </div>
            <div
              className="v4-gloss"
              style={{
                left: `${gloss * 150 - 34}%`,
                opacity: gloss > 0 && gloss < 1 ? 0.9 : 0,
              }}
            />
          </div>
        );
      })}
      {[0, 1, 2].map((index) => {
        const shape = SHAPES[index];
        const frame = phase(time, 14.7 + index * 1.2, 15.6 + index * 1.2);
        const lag = phase(time, 14.62 + index * 1.2, 15.52 + index * 1.2);
        return (
          <div key={`contract-${shape.tag}`}>
            {[0.55, 0.28].map((trailOpacity, trailIndex) => (
              <div
                key={trailIndex}
                className="v4-trail"
                style={{
                  left: mix(10, shape.left, lag),
                  top: mix(10, shape.top, lag),
                  width: mix(HARNESS_PANEL.w - 20, shape.w, lag),
                  height: mix(height - 20, shape.h, lag),
                  borderRadius: mix(18, 15, lag),
                  opacity:
                    trailOpacity * Math.sin(Math.PI * Math.min(1, lag * 1.08)),
                }}
              />
            ))}
            <div
              className="v4-contract"
              style={{
                left: mix(10, shape.left, frame),
                top: mix(10, shape.top, frame),
                width: mix(HARNESS_PANEL.w - 20, shape.w, frame),
                height: mix(height - 20, shape.h, frame),
                borderRadius: mix(18, 15, frame),
                opacity: Math.sin(Math.PI * Math.min(1, frame * 1.08)),
                borderColor: [
                  "rgba(126,213,228,0.95)",
                  "rgba(166,216,152,0.95)",
                  "rgba(192,164,235,0.95)",
                ][index],
                boxShadow: "0 0 18px 2px rgba(190,235,242,0.2)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function LightLines({ time }: { time: number }) {
  return (
    <>
      {SHAPES.map((shape, index) => {
        const draw = phase(time, 20 + index * 0.35, 21.3 + index * 0.35);
        return (
          <div
            key={shape.tag}
            className="v4-line"
            style={{
              left: HARNESS_PANEL.x + shape.left + shape.w + 10,
              top:
                HARNESS_PANEL.y +
                HARNESS_PANEL.h -
                HARNESS_PANEL.grown +
                shape.top +
                shape.h / 2,
              width: mix(0, 360 + index * 70, draw),
              opacity: draw * (1 - phase(time, 24.2, 25.4)),
            }}
          />
        );
      })}
    </>
  );
}

const CAPTIONS = [
  { start: 0.5, end: 3.1, text: "用户提出问题。" },
  { start: 3.4, end: 6.7, text: "写下的问题，交给 harness agent。" },
  { start: 7.2, end: 9.9, text: "harness 接手，开始生成。" },
  { start: 10.4, end: 14.1, text: "改写、展开成任务。" },
  { start: 14.8, end: 19.4, text: "识别三类问题，调用对应的工具。" },
  { start: 20.1, end: 24.2, text: "从一个问题，到三条检索路径。" },
] as const;

export const QueryOpeningV4 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load v4 fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const camera = cameraAt(time);
  const userLean = -1.6 * phase(time, 3, 4.6) + 1.2 * phase(time, 20, 23);
  const petLean = 5 * phase(time, 7.2, 9.4) - 3 * phase(time, 19.6, 22);
  const petHop = -14 * Math.sin(Math.PI * progress(time, 17.35, 17.85));
  return (
    <AbsoluteFill className="v4-stage" data-v4-time={time}>
      <Audio
        src={staticFile("cinema-sound.wav")}
        premountFor={fps}
        volume={0.8}
      />
      <div
        className="v4-bg"
        style={{
          transform: `translate(${-camera.x * 0.22}px, ${-camera.y * 0.16}px)`,
        }}
      >
        <svg viewBox="0 0 1920 1080" fill="none">
          {Array.from({ length: 9 }, (_, index) => (
            <g key={index} stroke="#9bc3bd" strokeOpacity="0.08">
              <path d={`M${120 + index * 210} 120v840`} />
            </g>
          ))}
          <path
            d="M120 840 C620 720 1320 870 1800 720"
            stroke="#9bc3bd"
            strokeOpacity="0.12"
          />
        </svg>
      </div>
      <div
        className="v4-camera"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom}) rotate(${camera.rotZ}deg) rotateY(${camera.rotY}deg)`,
          transformOrigin: "50% 52%",
        }}
      >
        <div className="v4-world">
          <div className="v4-bench-edge" />
          <div className="v4-bench">
            <div
              className="v4-character"
              style={{
                left: USER_FIG.x,
                top: USER_FIG.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <UserSculpture
                time={time}
                x={86}
                y={168}
                tilt={-66 + userLean}
                appear={1}
              />
            </div>
            <div
              className="v4-character"
              style={{
                left: PET_FIG.x,
                top: PET_FIG.y,
                transform: `translate(-50%, -100%) translateY(${petHop}px)`,
              }}
            >
              <PetSculpture
                time={time}
                x={104}
                y={168}
                tilt={-66 + petLean}
                appear={1}
              />
            </div>
            <UserPanel time={time} />
            <Pulse time={time} />
            <HarnessPanel time={time} />
            <LightLines time={time} />
          </div>
        </div>
      </div>
      <div
        className="v4-dust"
        style={{
          transform: `translate(${camera.x * 0.34}px, ${camera.y * 0.22}px)`,
        }}
      >
        {Array.from({ length: 18 }, (_, index) => {
          const mote = ((index * 97) % 170) + 40;
          return (
            <i
              key={index}
              style={{
                left: mote * 11,
                top: ((index * 149) % 880) + 90,
                width: 2 + (index % 3),
                height: 2 + (index % 3),
                opacity: 0.08 + 0.07 * Math.sin(time * 0.8 + index),
              }}
            />
          );
        })}
      </div>
      <div
        className="v4-foreground"
        style={{
          transform: `translate(${-camera.x * 0.55}px, ${-camera.y * 0.34}px)`,
        }}
      />
      <div
        className="v4-brighten"
        style={{ opacity: phase(time, 19.8, 23.8) * 0.9 }}
      />
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
        <span style={{ width: `${(time / V4_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};
