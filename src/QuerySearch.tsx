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
import { v2Mote } from "./query-v2-motion";
import {
  BOTTOM,
  FIVE_H,
  FIELD_W,
  HARNESS_CX,
  ROW_TOKENS,
  SHAPE_H,
  SHAPE_L,
  SHAPE_STEP,
  SHAPE_TOP,
  SHAPE_W,
  SHAPES,
} from "./QueryOpeningV3";
import {
  ACTION_AT,
  CONSTELLATION,
  GRAPH_EDGES,
  GRAPH_NODES,
  PAGE_TOWER,
  PROBE_ORIGIN,
  PROBE_TARGET,
  RETURN_END,
  SEARCH_DURATION,
  SHAPE_MORPH_END,
  SHAPE_MORPH_START,
  SLICE_FIELD,
  answerRowAt,
  evidenceAt,
  pageSlabAt,
  probePose,
  searchCameraAt,
  sliceChunkAt,
  trailPoint,
} from "./query-search-motion";
import "./query-v2.css";
import "./query-v3.css";
import "./query-search.css";

const PROBE_COLORS = [
  "rgba(126,213,228,0.95)",
  "rgba(166,216,152,0.95)",
  "rgba(192,164,235,0.95)",
];

const HUD_LABELS = [
  "向量检索 · hybrid_search",
  "图谱检索 · graph_search",
  "wiki 检索 · wiki_search",
];

function SliceField({ time }: { time: number }) {
  const ring = phase(time, ACTION_AT[0], ACTION_AT[0] + 0.9);
  return (
    <>
      <div
        className="qs-region-glow"
        style={{
          left: SLICE_FIELD.x - 620,
          top: SLICE_FIELD.y - 320,
          width: 1240,
          height: 640,
          background:
            "radial-gradient(ellipse, rgba(120,200,210,0.1), rgba(120,200,210,0) 68%)",
        }}
      />
      {Array.from({ length: 26 }, (_, k) => {
        const chunk = sliceChunkAt(k);
        const lit = chunk.lit
          ? phase(time, chunk.litAt, chunk.litAt + 0.45)
          : 0;
        const gather = lit * 16;
        return (
          <i
            key={k}
            className={`qs-chunk${chunk.lit ? " qs-chunk-lit" : ""}`}
            style={{
              left: chunk.x - chunk.w / 2 + gather * 0.4,
              top: chunk.y - gather * 0.5,
              width: chunk.w,
              transform: `rotate(${chunk.rot}deg) scale(${mix(1, 1.18, lit)})`,
              opacity: 0.35 + 0.6 * lit,
            }}
          />
        );
      })}
      <div
        className="qs-ring"
        style={{
          left: PROBE_TARGET[0].x - 260,
          top: PROBE_TARGET[0].y - 260,
          width: 520,
          height: 520,
          opacity: Math.sin(Math.PI * ring) * 0.8,
          transform: `scale(${mix(0.12, 1, ring)})`,
        }}
      />
    </>
  );
}

function Constellation({ time }: { time: number }) {
  return (
    <>
      <div
        className="qs-region-glow"
        style={{
          left: CONSTELLATION.x - 560,
          top: CONSTELLATION.y - 420,
          width: 1120,
          height: 840,
          background:
            "radial-gradient(ellipse, rgba(150,210,130,0.09), rgba(150,210,130,0) 68%)",
        }}
      />
      <svg
        className="qs-trail"
        width="6400"
        height="1800"
        viewBox="0 0 6400 1800"
        style={{ left: 0, top: 0 }}
      >
        {GRAPH_EDGES.map(([a, b], index) => {
          const lit = phase(time, 6.75 + index * 0.18, 7.05 + index * 0.18);
          return (
            <line
              key={index}
              x1={GRAPH_NODES[a].x}
              y1={GRAPH_NODES[a].y}
              x2={GRAPH_NODES[b].x}
              y2={GRAPH_NODES[b].y}
              className={lit > 0.5 ? "qs-graph-edge-lit" : "qs-graph-edge"}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - lit}
            />
          );
        })}
      </svg>
      {GRAPH_NODES.map((node, index) => (
        <i
          key={index}
          className="qs-graph-node"
          style={{
            left: node.x - node.r,
            top: node.y - node.r,
            width: node.r * 2,
            height: node.r * 2,
            opacity:
              0.45 +
              0.55 * phase(time, 6.75 + (index % 5) * 0.18, 7.2 + (index % 5) * 0.18),
          }}
        />
      ))}
    </>
  );
}

function PageTower({ time }: { time: number }) {
  return (
    <>
      <div
        className="qs-region-glow"
        style={{
          left: PAGE_TOWER.x - 520,
          top: PAGE_TOWER.y - 420,
          width: 1040,
          height: 1080,
          background:
            "radial-gradient(ellipse, rgba(170,140,220,0.09), rgba(170,140,220,0) 68%)",
        }}
      />
      {[0, 1, 2, 3].map((j) => {
        const slab = pageSlabAt(j);
        const open = phase(time, slab.openAt, slab.openAt + 0.55);
        return (
          <div
            key={j}
            className="qs-page"
            style={{
              left: slab.x - 180,
              top: slab.y - 78,
              width: 360,
              height: 156,
              transform: `rotate(${slab.rot}deg) translateY(${-open * 12}px)`,
              opacity: 0.55 + 0.45 * open,
            }}
          >
            {[0, 1, 2, 3].map((line) => (
              <i
                key={line}
                className="qs-page-line"
                style={{
                  top: 26 + line * 30,
                  width: [220, 268, 196, 240][line],
                  opacity: open,
                  clipPath: `inset(0 ${100 * (1 - open)}% 0 0)`,
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

function Trails({ time }: { time: number }) {
  return (
    <svg
      className="qs-trail"
      width="6400"
      height="1800"
      viewBox="0 0 6400 1800"
      style={{ left: 0, top: 0 }}
    >
      {[0, 1, 2].map((index) => {
        const pose = probePose(time, index);
        const a = PROBE_ORIGIN[index];
        const b = trailPoint(index, 0.33);
        const c = trailPoint(index, 0.66);
        const d = PROBE_TARGET[index];
        return (
          <path
            key={index}
            d={`M ${a.x} ${a.y} C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`}
            fill="none"
            stroke={PROBE_COLORS[index]}
            strokeWidth={2.6}
            strokeOpacity={0.34 * Math.min(1, pose.trail * 2)}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - pose.trail}
          />
        );
      })}
    </svg>
  );
}

function Probes({ time }: { time: number }) {
  return (
    <>
      {[0, 1, 2].map((index) => {
        const pose = probePose(time, index);
        const morph = phase(
          time,
          SHAPE_MORPH_START[index],
          SHAPE_MORPH_END[index],
        );
        return (
          <div
            key={index}
            className="qs-probe"
            style={{
              left: pose.x - 17,
              top: pose.y - 17,
              width: 34,
              height: 34,
              opacity: pose.alpha,
              background: `linear-gradient(150deg, ${PROBE_COLORS[index]}, ${PROBE_COLORS[index].replace("0.95", "0.55")})`,
              boxShadow: `0 0 26px ${PROBE_COLORS[index]}, 0 0 60px ${PROBE_COLORS[index].replace("0.95", "0.35")}`,
              transform: `scale(${pose.scale * mix(1.5, 1, morph)})`,
            }}
          >
            <div
              className="qs-probe-glow"
              style={{
                background: `radial-gradient(circle, ${PROBE_COLORS[index].replace("0.95", "0.3")}, transparent 70%)`,
              }}
            />
          </div>
        );
      })}
      {[0, 1, 2].map((index) =>
        [0, 1].map((slot) => {
          const dot = evidenceAt(time, index, slot);
          return (
            <i
              key={`${index}-${slot}`}
              style={{
                position: "absolute",
                left: dot.x - 7,
                top: dot.y - 7,
                width: 14,
                height: 14,
                borderRadius: 7,
                background: PROBE_COLORS[index],
                boxShadow: `0 0 18px ${PROBE_COLORS[index]}`,
                opacity: dot.alpha,
              }}
            />
          );
        }),
      )}
    </>
  );
}

// Seam anchor: the harness field frozen at V3's t=13 state (rows at residual
// 0.22, three shapes settled), then shapes morph into probes and the answer
// rows brighten when evidence returns.
function HarnessAnchor({ time }: { time: number }) {
  const height = FIVE_H;
  return (
    <div
      className="v3-field"
      style={{
        left: HARNESS_CX - FIELD_W / 2,
        top: BOTTOM - height,
        width: FIELD_W,
        height,
        opacity: 1,
      }}
    >
      <div className="v3-sheen" />
      <div className="v3-rows">
        {ROW_TOKENS.map((widths, index) => (
          <div
            className="v3-row"
            key={index}
            style={{ opacity: 0.22 + 0.78 * answerRowAt(time, index) }}
          >
            {widths.map((width, token) => (
              <i
                key={token}
                style={{
                  width,
                  marginRight:
                    token === widths.length - 1 ? 0 : 29,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {SHAPES.map((shape, index) => {
        const morph = phase(
          time,
          SHAPE_MORPH_START[index],
          SHAPE_MORPH_END[index],
        );
        return (
          <div
            key={shape.word}
            className={`v3-shape v3-shape-${index}`}
            style={{
              left: SHAPE_L,
              top: SHAPE_TOP + index * SHAPE_STEP,
              width: SHAPE_W,
              height: SHAPE_H,
              opacity: 1 - morph,
              transform: `scale(${mix(1, 0.06, morph)})`,
            }}
          >
            <div className="v3-shape-sheen" />
            <strong>{shape.word}</strong>
            <p>{shape.q}</p>
          </div>
        );
      })}
    </div>
  );
}

const CAPTIONS = [
  { start: 1.3, end: 3.5, text: "三路探针，飞向对应的知识空间。" },
  { start: 4.2, end: 5.9, text: "匹配问题 → 向量检索，最近切片聚拢。" },
  { start: 6.5, end: 8.2, text: "关系问题 → 图谱检索，沿边点亮多跳邻域。" },
  { start: 8.8, end: 10.6, text: "深度问题 → wiki 检索，逐层翻开百科。" },
  { start: 11.4, end: 13.7, text: "证据沿光轨回流，合成答案。" },
] as const;

export const QuerySearch = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load search fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const camera = searchCameraAt(time);
  return (
    <AbsoluteFill className="qs" data-qs-time={time}>
      <Audio
        src={staticFile("search-sound.wav")}
        premountFor={fps}
        volume={0.75}
      />
      <div className="v2-atmosphere">
        {Array.from({ length: 14 }, (_, seed) => {
          const mote = v2Mote(seed + 1, time + 13);
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
        data-qs-camera-zoom={camera.zoom}
        style={{
          transform: `translate(960px,540px) rotate(${camera.roll}deg) scale(${camera.zoom}) translate(${-camera.x}px,${-camera.y}px)`,
        }}
      >
        <div className="v2-floor-glow" />
        <SliceField time={time} />
        <Constellation time={time} />
        <PageTower time={time} />
        <Trails time={time} />
        <Probes time={time} />
        <UserSculpture time={time + 13} />
        <PetSculpture time={time + 13} />
        <HarnessAnchor time={time} />
        {[0, 1, 2].map((index) => {
          const arrive =
            phase(time, ACTION_AT[index] - 0.4, ACTION_AT[index] + 0.1) *
            (1 - phase(time, RETURN_END[index] - 0.6, RETURN_END[index] - 0.1));
          return (
            <div
              key={index}
              className="qs-hud"
              style={{
                left: PROBE_TARGET[index].x - 190,
                top: PROBE_TARGET[index].y + 66,
                color: PROBE_COLORS[index],
                opacity: arrive,
                transform: `translateY(${mix(10, 0, arrive)}px)`,
              }}
            >
              {HUD_LABELS[index]}
            </div>
          );
        })}
      </div>
      <div className="v2-vignette" />
      <div className="journey-hud">
        <span className="journey-brand">
          harness <i>/</i> RAG
        </span>
        <span className="journey-hud-right">THREE-WAY RETRIEVAL</span>
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
        <span style={{ width: `${(time / SEARCH_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};
