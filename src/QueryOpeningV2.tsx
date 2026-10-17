import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  HARNESS_BOX,
  PET,
  QUESTIONS_TAGS,
  QUESTIONS_TEXT,
  REGIONS,
  USER,
  USER_BOX,
} from "./query-v2-const";
import { mix, phase } from "./journey-motion";
import {
  V2_DURATION,
  v2AgentCard,
  v2CameraAt,
  v2Contract,
  v2ContractRect,
  v2FigurePose,
  v2Mote,
  v2Streak,
  v2Tile,
  v2UserCard,
} from "./query-v2-motion";
import "./query-v2.css";

export function UserSculpture({
  time,
  x = USER.x,
  y = USER.y,
  tilt = 0,
  appear,
}: {
  time: number;
  x?: number;
  y?: number;
  tilt?: number;
  appear?: number;
}) {
  const pose = v2FigurePose(time);
  const rise = appear ?? phase(time, 0, 1.2);
  return (
    <div
      className="v2-user"
      style={{
        left: x - 86,
        top: y - 168,
        transformOrigin: "50% 100%",
        opacity: rise,
        transform: `translateY(${mix(30, 0, rise) + pose.userBob}px) rotateX(${tilt}deg)`,
      }}
    >
      <svg width="172" height="238" viewBox="0 0 172 238" fill="none">
        <defs>
          <linearGradient
            id="v2-user-body"
            x1="30"
            y1="30"
            x2="150"
            y2="220"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f7f4ec" />
            <stop offset="0.55" stopColor="#d5ded6" />
            <stop offset="1" stopColor="#8fa39c" />
          </linearGradient>
          <radialGradient id="v2-user-head" cx="0.32" cy="0.22" r="0.9">
            <stop stopColor="#fbf8f0" />
            <stop offset="0.62" stopColor="#d9e1d8" />
            <stop offset="1" stopColor="#93a69e" />
          </radialGradient>
          <linearGradient
            id="v2-user-rim"
            x1="140"
            y1="20"
            x2="168"
            y2="210"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#dff0e6" stopOpacity="0.85" />
            <stop offset="1" stopColor="#dff0e6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse
          cx="86"
          cy="224"
          rx="62"
          ry="12"
          fill="#03120f"
          opacity="0.5"
        />
        <ellipse
          cx="86"
          cy="221"
          rx="46"
          ry="7"
          fill="#78deec"
          opacity="0.08"
        />
        <path
          d="M86 74 C122 74 140 102 140 142 V216 H32 V142 C32 102 50 74 86 74 Z"
          fill="url(#v2-user-body)"
        />
        <path
          d="M86 74 C122 74 140 102 140 142 V216 H32 V142 C32 102 50 74 86 74 Z"
          fill="url(#v2-user-rim)"
          opacity="0.5"
        />
        <path
          d="M42 150 C42 116 60 92 86 92"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="86" cy="42" r="33" fill="url(#v2-user-head)" />
        <path
          d="M62 38 q7 7 15 1 M95 39 q7 6 15 -1"
          stroke="#667a72"
          strokeOpacity="0.8"
          stroke-width="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M77 55 q9 7 18 0"
          stroke="#667a72"
          strokeOpacity="0.55"
          stroke-width="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="72" cy="24" rx="12" ry="7" fill="#ffffff" opacity="0.32" />
      </svg>
    </div>
  );
}

export function PetSculpture({
  time,
  x = PET.x,
  y = PET.y,
  tilt = 0,
  appear,
}: {
  time: number;
  x?: number;
  y?: number;
  tilt?: number;
  appear?: number;
}) {
  const pose = v2FigurePose(time);
  const rise = appear ?? phase(time, 0.35, 1.5);
  return (
    <div
      className="v2-pet"
      style={{
        left: x - 104,
        top: y - 168,
        transformOrigin: "50% 100%",
        opacity: rise,
        transform: `translateY(${mix(30, 0, rise) + pose.petBob}px) rotate(${pose.petTilt}deg) rotateX(${tilt}deg)`,
      }}
    >
      <svg width="208" height="238" viewBox="0 0 208 238" fill="none">
        <defs>
          <radialGradient id="v2-pet-head" cx="0.32" cy="0.2" r="0.95">
            <stop stopColor="#f2f5dd" />
            <stop offset="0.55" stopColor="#cfe0b2" />
            <stop offset="1" stopColor="#87a877" />
          </radialGradient>
          <linearGradient
            id="v2-pet-body"
            x1="50"
            y1="90"
            x2="170"
            y2="225"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#e8efd2" />
            <stop offset="0.6" stopColor="#bad29b" />
            <stop offset="1" stopColor="#759565" />
          </linearGradient>
          <linearGradient
            id="v2-pet-antler"
            x1="40"
            y1="20"
            x2="90"
            y2="70"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#e9f2cf" />
            <stop offset="1" stopColor="#91b17c" />
          </linearGradient>
        </defs>
        <ellipse
          cx="104"
          cy="224"
          rx="70"
          ry="12"
          fill="#03120f"
          opacity="0.5"
        />
        <ellipse
          cx="104"
          cy="221"
          rx="52"
          ry="7"
          fill="#afe1a7"
          opacity="0.1"
        />
        <path d="M58 152 q-26 -8 -32 -32 q26 5 38 22 Z" fill="#9dbd84" />
        <path
          d="M104 88 C142 88 162 116 162 156 V216 H46 V156 C46 116 66 88 104 88 Z"
          fill="url(#v2-pet-body)"
        />
        <path
          d="M70 118 C70 100 86 88 104 88"
          stroke="#ffffff"
          strokeOpacity="0.2"
          stroke-width="8"
          strokeLinecap="round"
        />
        <path
          d="M62 42 q-17 -30 -6 -36 q11 9 15 25 M146 42 q17 -30 6 -36 q-11 9 -15 25"
          stroke="url(#v2-pet-antler)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M60 44 q-18 -12 -26 -3 q11 12 25 10 M148 44 q18 -12 26 -3 q-11 12 -25 10"
          fill="#a6c48b"
        />
        <ellipse cx="104" cy="62" rx="48" ry="41" fill="url(#v2-pet-head)" />
        <ellipse
          cx="104"
          cy="80"
          rx="23"
          ry="16"
          fill="#eef4da"
          opacity="0.8"
        />
        <circle cx="104" cy="72" r="5.5" fill="#4c6248" />
        <path
          d="M82 52 q7 8 15 1 M111 53 q8 7 15 -1"
          stroke="#4c6248"
          stroke-width="3.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M91 86 q13 9 26 0"
          stroke="#4c6248"
          strokeOpacity="0.75"
          stroke-width="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="74" cy="70" r="8" fill="#e4a89b" opacity="0.42" />
        <circle cx="134" cy="70" r="8" fill="#e4a89b" opacity="0.42" />
        <ellipse cx="84" cy="36" rx="15" ry="9" fill="#ffffff" opacity="0.3" />
      </svg>
    </div>
  );
}

function Streaks({
  time,
  count,
  fade = 1,
}: {
  time: number;
  count: number;
  fade?: number;
}) {
  return (
    <div className="v2-streaks">
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          style={{
            width: `${[72, 94, 60, 86, 66, 96][index]}%`,
            opacity: v2Streak(time, index) * fade,
          }}
        />
      ))}
    </div>
  );
}

function UserGlassCard({ time }: { time: number }) {
  const card = v2UserCard(time);
  return (
    <div
      className="v2-glass-card"
      data-v2-card="user"
      style={{
        left: card.x - USER_BOX.w / 2,
        top: card.y - USER_BOX.h / 2,
        width: USER_BOX.w,
        height: USER_BOX.h,
        opacity: card.in * card.opacity,
        transform: `scale(${card.scale})`,
        boxShadow: `0 30px 90px rgba(0,0,0,0.5), 0 0 ${60 * card.glow}px rgba(140,210,225,${0.28 * card.glow}), inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    >
      <div className="v2-glass-sheen" />
      <Streaks time={time} count={3} />
    </div>
  );
}

function AgentGlassCard({ time }: { time: number }) {
  const card = v2AgentCard(time);
  const height = 150 + card.grow * 280;
  return (
    <div
      className="v2-glass-card"
      data-v2-card="agent"
      style={{
        left: HARNESS_BOX.x - HARNESS_BOX.w / 2,
        top: 450 - height / 2,
        width: HARNESS_BOX.w,
        height,
        opacity: card.in,
        borderRadius: 75 - card.grow * 42,
      }}
    >
      <div className="v2-glass-sheen" />
      <Streaks time={time} count={6} fade={1 - card.streakOut} />
      <div className="v2-think-orb" style={{ opacity: 1 - card.streakOut }}>
        <i />
        <i />
        <i />
      </div>
      {REGIONS.map((region, index) => (
        <div
          key={region.key}
          className={`v2-tile v2-tile-${index}`}
          data-v2-tile={region.key}
          style={{
            left: region.left,
            top: region.top,
            width: region.w,
            height: region.h,
            opacity: v2Tile(time, index),
            transform: `scale(${mix(0.9, 1, v2Tile(time, index))})`,
          }}
        >
          <div className="v2-tile-sheen" />
          <div className="v2-tile-top">
            <i />
            <span>Q{index + 1}</span>
          </div>
          <strong>{QUESTIONS_TAGS[index]}</strong>
          <p>{QUESTIONS_TEXT[index]}</p>
        </div>
      ))}
      {[0, 1, 2].map((index) => {
        const frame = v2ContractRect(time, index);
        return (
          <div
            key={index}
            className="v2-contract-frame"
            style={{
              left: frame.left,
              top: frame.top,
              width: frame.w,
              height: frame.h,
              opacity: frame.alpha,
              borderRadius: mix(33, 30, v2Contract(time, index)),
              borderColor: [
                "rgba(126,213,228,0.95)",
                "rgba(166,216,152,0.95)",
                "rgba(192,164,235,0.95)",
              ][index],
            }}
          />
        );
      })}
    </div>
  );
}

const CAPTIONS = [
  { start: 0.6, end: 3.2, text: "用户提出问题。" },
  { start: 3.5, end: 5.4, text: "harness agent 接住它。" },
  { start: 6.2, end: 8.1, text: "把问题，改写成任务。" },
  { start: 8.4, end: 11.6, text: "识别三类问题，调用对应的工具。" },
] as const;

export const QueryOpeningV2 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load v2 fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const camera = v2CameraAt(time);
  return (
    <AbsoluteFill className="v2" data-v2-time={time}>
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
        data-v2-camera-zoom={camera.zoom}
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
          {[3520, 4020, 4520, 5020, 5520].map((x, i) => (
            <g key={x} stroke="#a3b8b2" opacity="0.2">
              <path
                d={`M${x - 6} ${300 + i * 42}h12 M${x} ${294 + i * 42}v12`}
              />
            </g>
          ))}
        </svg>
        <UserSculpture time={time} />
        <PetSculpture time={time} />
        <UserGlassCard time={time} />
        <AgentGlassCard time={time} />
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
