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
import { INGEST_CAPTIONS, World } from "./KnowledgeJourney";
import { INGEST_DURATION, mix, phase, progress, smooth } from "./journey-motion";
import { HorseRig } from "./mascot/HorseCut";
import { DuckRig } from "./mascot/CowboyCutUser";
import { SEAT } from "./mascot/seat-config";
import { DUCK_ANCHOR } from "./mascot/seat-solver";
import {
  DUCK_SCREEN_X,
  FALL_START,
  GROUND_STAGE_Y,
  GROUND_Y,
  IMPACT,
  MOUNT_START,
  PEDESTAL_Y,
  RIG_DUCK_CENTER_X,
  RUN_START,
  STAGE_K,
  STAGE_OY,
  TOUCHDOWN,
  WALK_OUT,
  duckEyes,
  duckSpec,
  duckTargetScreenX,
  dustState,
  horseSpec,
  horseX,
  journeyTimeAt,
  manuscriptFieldState,
  openingWorldCamera,
  pedestalState,
  seatTransform,
  sheetEdgeX,
  sheetTranslate,
  stageTremor,
  streamState,
  type OpeningTheme,
} from "./opening-motion";
import "./visuals";
import "./journey.css";
import "./opening.css";

const BODY_ANCHOR = "949px 1012px";

const QUESTION_TOKENS = [
  { text: "什么是", start: 0.14, end: 0.62, accent: false },
  { text: " Harness RAG", start: 0.52, end: 1.38, accent: true },
  { text: " ？", start: 1.28, end: 1.82, accent: false },
] as const;

const ANSWER_TOKENS = [
  { text: "这是一场", start: 2.15, end: 2.82, highlight: false },
  { text: "关于", start: 2.72, end: 3.32, highlight: false },
  { text: "知识的旅程", start: 3.2, end: 4.22, highlight: true },
] as const;

const BOKEH_SEEDS = [
  { id: 0, x: 180, y: 160, size: 78, speedX: -28, speedY: -9, alpha: 0.24 },
  { id: 1, x: 520, y: 860, size: 115, speedX: -38, speedY: -14, alpha: 0.2 },
  { id: 2, x: 880, y: 140, size: 64, speedX: -22, speedY: 8, alpha: 0.22 },
  { id: 3, x: 1280, y: 780, size: 132, speedX: -44, speedY: -11, alpha: 0.18 },
  { id: 4, x: 1560, y: 240, size: 86, speedX: -31, speedY: 10, alpha: 0.25 },
  { id: 5, x: 1790, y: 680, size: 96, speedX: -36, speedY: -8, alpha: 0.21 },
  { id: 6, x: 740, y: 440, size: 52, speedX: -19, speedY: -6, alpha: 0.16 },
  { id: 7, x: 1420, y: 490, size: 58, speedX: -25, speedY: 7, alpha: 0.17 },
] as const;

const HOOF_TRAIL_TIMES = [0.35, 0.78, 1.22, 1.66, 2.1, 2.58, 3.08, 3.62, 4.18, 4.72] as const;

function JourneyUnderlay({ time }: { time: number }) {
  const jt = journeyTimeAt(time);
  const camera = openingWorldCamera(time);
  const hudReveal = phase(time, 5.4, 6.45);
  return (
    <AbsoluteFill className="journey op-underlay" data-journey-time={jt}>
      <World time={jt} camera={camera} />
      <div className="journey-vignette" />
      <div
        className="journey-hud"
        style={{
          opacity: hudReveal,
          transform: `translateY(${mix(-10, 0, hudReveal)}px)`,
        }}
      >
        <span className="journey-brand">
          harness <i>/</i> RAG
        </span>
        <span className="journey-hud-right">THE JOURNEY OF KNOWLEDGE</span>
      </div>
      <div className="journey-captions">
        {INGEST_CAPTIONS.slice(0, 2).map((caption) => (
          <div
            key={caption.start}
            style={{
              opacity:
                phase(jt, caption.start, caption.start + 0.3) *
                (1 - phase(jt, caption.end - 0.25, caption.end)),
              transform: `translateY(${mix(7, 0, phase(jt, caption.start, caption.start + 0.45))}px)`,
            }}
          >
            {caption.text}
          </div>
        ))}
      </div>
      <div className="journey-corner-note" style={{ opacity: hudReveal }}>
        机制演示 · 非实时耗时
      </div>
      <div className="journey-timeline" style={{ opacity: hudReveal }}>
        <span style={{ width: `${(jt / INGEST_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
}

function MistSheet({ time }: { time: number }) {
  const slide = sheetTranslate(time);
  const edge = sheetEdgeX(time);
  const stream = streamState(time);
  const pedestal = pedestalState(time);
  const manuscripts = manuscriptFieldState(time);
  const hemReveal = phase(time, WALK_OUT - 0.08, WALK_OUT + 0.25);
  const cordStart = horseX(WALK_OUT) + 340;
  const cordWidth = Math.max(0, horseX(time) + 320 - edge);
  const cordTension = phase(time, TOUCHDOWN + 0.65, WALK_OUT + 0.25) * (1 - phase(time, 8.6, 8.9));

  // 游标俯冲引路轨迹控制点（4.25s 字尾 -> 5.18s 马蹄前地面）
  const p0x = 1028;
  const p0y = 318;
  const p1x = 1320;
  const p1y = 410;
  const p2x = cordStart;
  const p2y = GROUND_Y - 2;
  const threadReveal = smooth(progress(time, TOUCHDOWN - 0.05, WALK_OUT));
  const threadFade = 1 - phase(time, WALK_OUT + 1.45, 7.25);

  return (
    <div
      className="op-sheet"
      style={{
        left: edge,
        boxShadow:
          hemReveal > 0.01
            ? `-36px 0 80px rgba(4, 10, 14, ${0.72 * hemReveal}), -8px 0 22px rgba(4, 10, 14, ${0.48 * hemReveal})`
            : "none",
      }}
    >
      {/* 1. 远景层：破晓/暮色体积光束 + 知识星轨弧线 */}
      <div
        className="op-sky-canopy"
        style={{
          transform: `translate3d(${-slide * 0.14}px, 0, 0)`,
        }}
      >
        <div
          className="op-godray op-godray-1"
          style={{
            opacity: 0.78 + 0.22 * Math.sin(time * 0.9),
            transform: `rotate(-26deg) translateX(${Math.sin(time * 0.45) * 28}px)`,
          }}
        />
        <div
          className="op-godray op-godray-2"
          style={{
            opacity: 0.65 + 0.25 * Math.cos(time * 0.75 + 1.1),
            transform: `rotate(-22deg) translateX(${Math.cos(time * 0.38) * 34}px)`,
          }}
        />
        <svg
          className="op-astral-arcs"
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          fill="none"
        >
          <path
            d="M -120 760 C 420 120, 1280 80, 2040 620"
            className="op-astral-arc-main"
            strokeDasharray="8 14"
            strokeDashoffset={-time * 24}
          />
          <path
            d="M 80 920 C 640 280, 1390 220, 1980 780"
            className="op-astral-arc-sub"
          />
          {[
            [420, 312],
            [860, 214],
            [1340, 256],
            [1690, 418],
          ].map(([cx, cy], idx) => (
            <g
              key={idx}
              transform={`translate(${cx + Math.sin(time * 0.8 + idx) * 10}, ${cy + Math.cos(time * 0.9 + idx) * 8})`}
            >
              <circle r={4.5} className="op-astral-node" />
              <circle
                r={14 + Math.sin(time * 1.6 + idx) * 3}
                className="op-astral-ring"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* 柔雾体积介质层 */}
      <div
        className="op-mist op-mist-a"
        style={{
          transform: `translate(${-slide * 0.12 + time * 14}px, ${Math.sin(time * 0.55) * 18}px)`,
        }}
      />
      <div
        className="op-mist op-mist-b"
        style={{
          transform: `translate(${-slide * 0.08 - time * 11}px, ${Math.cos(time * 0.48) * 22}px)`,
        }}
      />
      <div
        className="op-mist op-mist-c"
        style={{
          transform: `translate(${-slide * 0.05 + time * 9}px, ${Math.sin(time * 0.42 + 2) * 14}px)`,
        }}
      />

      {/* 2. 中景环境叙事层：漂浮知识手稿切片（受骏马掠过气流吹拂偏转） */}
      <div className="op-manuscript-field">
        {manuscripts.map((card) => (
          <div
            key={card.id}
            className="op-manuscript-card"
            style={{
              width: card.w,
              height: card.h,
              opacity: card.opacity,
              transform: `translate3d(${card.x}px, ${card.y}px, 0) rotate(${card.rot}deg) scale(${card.scale})`,
            }}
          >
            <div className="op-ms-header">
              <span className="op-ms-seal" />
              <span className="op-ms-bar-short" />
            </div>
            <div className="op-ms-diagram">
              <span className="op-ms-dot a" />
              <span className="op-ms-dot b" />
              <span className="op-ms-dot c" />
              <svg width="100%" height="36" viewBox="0 0 100 36" fill="none">
                <path
                  d="M18 24 C40 8, 62 8, 82 20"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeOpacity="0.45"
                />
              </svg>
            </div>
            <div className="op-ms-lines">
              <span style={{ width: "86%" }} />
              <span style={{ width: "72%" }} />
              <span style={{ width: "64%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. 高处同行带：左鸭流光托羽 + 右侧流式双行问答（D1:甲） */}
      <div
        className="op-glyph-perch"
        style={{
          left: DUCK_SCREEN_X,
          top: PEDESTAL_Y,
          opacity: pedestal.opacity,
          transform: `translate(calc(-50% + ${pedestal.shiftX}px), calc(-50% + ${pedestal.shiftY}px)) scaleX(${pedestal.scaleX})`,
        }}
      >
        <span className="op-perch-glow" />
        <span className="op-perch-feather" />
        <span className="op-perch-wing left" />
        <span className="op-perch-wing right" />
      </div>

      <div
        className="op-stream-copy"
        style={{
          left: 488,
          top: 174,
          opacity: stream.opacity,
          transform: `translateY(${stream.y}px)`,
        }}
      >
        <div className="op-stream-badge">
          <span className="op-badge-dot" />
          HARNESS <i>/</i> RAG
        </div>
        <div className="op-stream-line op-stream-question">
          {QUESTION_TOKENS.map((tok) => {
            const p = smooth(progress(time, tok.start, tok.end));
            const blur = (1 - p) * 8;
            return (
              <span
                key={tok.text}
                className={tok.accent ? "op-tok op-tok-accent" : "op-tok"}
                style={{
                  opacity: p,
                  filter: blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "none",
                  transform: `translateY(${mix(12, 0, p)}px)`,
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>
        <div className="op-stream-line op-stream-answer">
          {ANSWER_TOKENS.map((tok) => {
            const p = smooth(progress(time, tok.start, tok.end));
            const blur = (1 - p) * 7;
            return (
              <span
                key={tok.text}
                className={tok.highlight ? "op-tok op-tok-journey" : "op-tok"}
                style={{
                  opacity: p,
                  filter: blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "none",
                  transform: `translateY(${mix(10, 0, p)}px)`,
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* 4. 叙事连接件（D3）：流式游标俯冲化作地面引路丝线（Eye-Trace Thread） */}
      <svg
        className="op-guide-svg"
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        fill="none"
      >
        {threadReveal > 0.01 && threadFade > 0.01 ? (
          <path
            d={`M ${p0x} ${p0y} Q ${p1x} ${p1y} ${p2x} ${p2y}`}
            className="op-guide-thread-path"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - threadReveal}
            style={{ opacity: threadFade * 0.88 }}
          />
        ) : null}
        {stream.sparkOpacity > 0.01 ? (
          <g
            transform={`translate(${stream.sparkX}, ${stream.sparkY})`}
            style={{ opacity: stream.sparkOpacity }}
          >
            <circle r={16} className="op-spark-halo" />
            <circle r={4.5} className="op-spark-core" />
          </g>
        ) : null}
      </svg>

      {/* 5. 地面长卷刻度与引路光轨 */}
      <div className="op-ground" style={{ top: GROUND_Y - 1 }}>
        {[220, 520, 820, 1120, 1420, 1720].map((tx) => (
          <span
            key={tx}
            className="op-ground-tick"
            style={{ left: tx - (slide * 0.25) % 300 }}
          />
        ))}
      </div>
      <div
        className="op-draw-cord"
        style={{
          top: GROUND_Y - 2,
          width: cordWidth,
          opacity: cordTension,
        }}
      />
      {pedestal.ripple > 0.01 ? (
        <div
          className="op-stomp-wave"
          style={{
            left: DUCK_SCREEN_X,
            top: GROUND_Y,
            opacity: pedestal.ripple * 0.62,
            transform: `translate(-50%, -50%) scaleX(${mix(0.25, 2.1, 1 - pedestal.ripple * 0.3)})`,
          }}
        />
      ) : null}
      <div className="op-ground-floor" style={{ top: GROUND_Y + 2 }} />

      {/* 6. 近景散焦光尘（Bokeh） */}
      <div className="op-bokeh-layer">
        {BOKEH_SEEDS.map((b) => {
          const bx = (b.x + time * b.speedX - slide * 0.22 + 2200) % 2040 - 60;
          const by = b.y + Math.sin(time * 0.9 + b.id) * 16 + time * b.speedY;
          return (
            <span
              key={b.id}
              className="op-bokeh"
              style={{
                width: b.size,
                height: b.size,
                opacity: b.alpha,
                transform: `translate3d(${bx}px, ${by}px, 0)`,
              }}
            />
          );
        })}
      </div>

      <div className="op-hem" style={{ opacity: hemReveal }} />
      <div className="op-vignette" />
    </div>
  );
}

function WorldDustLayer({ time }: { time: number }) {
  const edge = sheetEdgeX(time);
  // 跑动追马期间（2.38..3.15s）鸭子脚下留在世界地面上的冲刺尘粒
  const runSteps = [2.42, 2.58, 2.74, 2.9, 3.06];
  return (
    <svg
      className="op-world-dust"
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
    >
      {/* 马从 0s 起奔跑在世界坐标地面留下的马蹄微尘 */}
      {HOOF_TRAIL_TIMES.map((t0, idx) => {
        const dt = time - t0;
        if (dt <= 0 || dt >= 0.75) return null;
        const u = dt / 0.75;
        const originX = horseX(t0) + (idx % 2 === 0 ? 220 : 380);
        if (originX < edge - 40) return null;
        const x = originX - u * 48;
        const y = GROUND_Y - 4 - smooth(u) * 26;
        const op = Math.sin(u * Math.PI) * 0.46;
        return (
          <g key={`hoof-${idx}`} transform={`translate(${x}, ${y})`} opacity={op}>
            <ellipse rx={18 + u * 22} ry={6 + u * 8} className="op-dust-puff" />
            <circle cx={-12 - u * 18} cy={-4 - u * 10} r={3.5 * (1 - u * 0.5)} className="op-dust-spark" />
          </g>
        );
      })}
      {/* 鸭子跑动追马时在世界地面留下的冲刺尘粒 */}
      {runSteps.map((t0, idx) => {
        const dt = time - t0;
        if (dt <= 0 || dt >= 0.55) return null;
        const u = dt / 0.55;
        const originX = duckTargetScreenX(t0);
        const x = originX - u * 36;
        const y = GROUND_Y - 3 - smooth(u) * 18;
        const op = Math.sin(u * Math.PI) * 0.58;
        return (
          <g key={`run-${idx}`} transform={`translate(${x}, ${y})`} opacity={op}>
            <ellipse rx={14 + u * 18} ry={5 + u * 7} className="op-dust-puff" />
          </g>
        );
      })}
    </svg>
  );
}

function HorseDuck({ time }: { time: number }) {
  const x = horseX(time);
  const tremor = stageTremor(time);
  const horse = horseSpec(time);
  const seat = seatTransform(time);
  const duck = duckSpec(time);
  const eyes = duckEyes(time);
  const dust = dustState(time);
  const seatStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transformOrigin: `${DUCK_ANCHOR.x}px ${DUCK_ANCHOR.y}px`,
    transform: `translate(${seat.tx}px, ${seat.ty}px) rotate(${SEAT.rot}deg) scale(${SEAT.sx * SEAT.s}, ${SEAT.s})`,
  };
  // 落入马鞍前（t < 4.25s）抵消马身摆动：鸭在高处、下落、地面跑动追马及腾空段独立于马身晃动；4.25s 落鞍后交还给马背。
  const counterTf =
    time < TOUCHDOWN && (horse.body.ty || horse.body.rot)
      ? `rotate(${-(horse.body.rot ?? 0)}deg) translate(0px, ${-(horse.body.ty ?? 0)}px)`
      : undefined;
  const duckLayer = (layer: "all" | "far" | "near") => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: BODY_ANCHOR,
        transform: counterTf,
      }}
    >
      <div style={seatStyle}>
        <DuckRig
          pose="rest"
          spec={duck}
          eyes={eyes}
          layer={layer}
          splitAt={layer === "all" ? undefined : 812}
        />
      </div>
    </div>
  );
  // 越过鞍桥最高点（t=3.95s）后切骑乘分层（远侧手脚收到马身后面）。
  const straddling = time >= 3.95;
  const shadow = 0.13 + 0.025 * Math.sin(time * 7);
  const duckGroundShadow =
    phase(time, FALL_START + 0.15, IMPACT) *
    (1 - phase(time, MOUNT_START + 0.05, MOUNT_START + 0.45));
  return (
    <div
      className="op-stage"
      data-duck-eyes={eyes}
      style={{
        transform: `translate(${x}px, ${STAGE_OY + tremor}px) scale(${STAGE_K})`,
      }}
    >
      <svg
        width="1856"
        height="1280"
        viewBox="0 0 1856 1280"
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <ellipse
          cx={890}
          cy={GROUND_STAGE_Y}
          rx={520}
          ry={17}
          fill="#1b2a32"
          opacity={shadow}
        />
        <ellipse
          cx={RIG_DUCK_CENTER_X + seat.tx}
          cy={GROUND_STAGE_Y}
          rx={118}
          ry={10}
          fill="#1b2a32"
          opacity={0.18 * duckGroundShadow}
        />
        {dust.opacity > 0.01 && time < RUN_START + 0.35 ? (
          <g
            transform={`translate(${RIG_DUCK_CENTER_X + seat.tx}, ${GROUND_STAGE_Y})`}
            opacity={dust.opacity}
          >
            <ellipse
              cx={-dust.spread / STAGE_K}
              cy={dust.lift / STAGE_K}
              rx={38 + dust.progress * 26}
              ry={14 + dust.progress * 10}
              className="op-stage-dust"
            />
            <ellipse
              cx={dust.spread / STAGE_K}
              cy={dust.lift / STAGE_K}
              rx={34 + dust.progress * 24}
              ry={12 + dust.progress * 9}
              className="op-stage-dust"
            />
          </g>
        ) : null}
      </svg>
      <HorseRig
        pose="rest"
        spec={horse}
        mountBack={straddling ? duckLayer("far") : undefined}
        mount={straddling ? duckLayer("near") : duckLayer("all")}
      />
    </div>
  );
}

export const Opening: React.FC<{ theme?: OpeningTheme }> = ({
  theme = "parchment",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load opening fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill
      className={`op op-theme-${theme}`}
      data-opening-time={time}
      data-opening-theme={theme}
      data-duck-mode={
        time < FALL_START
          ? "hover"
          : time < IMPACT
            ? "fall"
            : time < RUN_START
              ? "cushion"
              : time < MOUNT_START
                ? "run-up"
                : time < TOUCHDOWN
                  ? "mount"
                  : "ride"
      }
    >
      <Audio
        src={staticFile("opening-sound.wav")}
        premountFor={fps}
        volume={0.85}
      />
      <JourneyUnderlay time={time} />
      <MistSheet time={time} />
      <WorldDustLayer time={time} />
      <HorseDuck time={time} />
    </AbsoluteFill>
  );
};
