import { useEffect, useState, type CSSProperties } from "react";
import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { INGEST_CAPTIONS, World } from "./KnowledgeJourney";
import {
  CORE,
  INGEST_DURATION,
  cubic,
  globalCameraAt,
  mix,
  phase,
  progress,
} from "./journey-motion";
import {
  ENDING_DURATION,
  EVIDENCE_COLORS,
  EVIDENCE_DOCKS,
  EVIDENCE_STARTS,
  EVIDENCE_WAITS,
  FILM_DURATION,
  GRAPH_NODES,
  QUERY,
  evidencePose,
  graphNodeAt,
  questionPose,
  retrievalCameraAt,
  retrievalSourceAt,
} from "./retrieval-continuum-motion";
import "./retrieval-continuum.css";

const ROUTES = [
  {
    title: "混合检索",
    tool: "hybrid_search",
    detail: "关键词 + 语义 · 找到原文",
    x: 380,
    y: 185,
    start: 3.25,
    end: 6.5,
  },
  {
    title: "图谱检索",
    tool: "graph_search",
    detail: "沿实体关系 · 找到关联切片",
    x: 1760,
    y: 245,
    start: 7.0,
    end: 10.5,
  },
  {
    title: "百科检索",
    tool: "wiki_search",
    detail: "从生成百科 · 找到知识摘要",
    x: 2820,
    y: 130,
    start: 10.8,
    end: 14.0,
  },
] as const;

const ENDING_CAPTIONS: Caption[] = [
  {
    text: "让刚才的知识，回答一个问题。",
    startMs: 48300,
    endMs: 50600,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "关键词与语义，共同找到原文证据。",
    startMs: 51400,
    endMs: 54400,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "沿实体关系，带回关联切片。",
    startMs: 55100,
    endMs: 58400,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "从百科条目，取回有来源的知识摘要。",
    startMs: 59000,
    endMs: 61600,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "三路证据，汇入同一个回答。",
    startMs: 62000,
    endMs: 64300,
    timestampMs: null,
    confidence: null,
  },
];
const CAPTIONS: Caption[] = [
  ...INGEST_CAPTIONS.map(({ text, start, end }) => ({
    text,
    startMs: start * 1000,
    endMs: end * 1000,
    timestampMs: null,
    confidence: null,
  })),
  ...ENDING_CAPTIONS,
];

function QueryObject({ time }: { time: number }) {
  const pose = questionPose(time);
  return (
    <div
      data-retrieval-question
      className="rc-question"
      style={{
        left: pose.x - 495,
        top: pose.y - 89,
        opacity: pose.alpha,
        transform: `rotate(${pose.angle}deg) scale(${pose.scale})`,
      }}
    >
      <div className="rc-question-top">
        <span>一个问题</span>
        <i />
      </div>
      <p>{QUERY}</p>
      <div
        className="rc-question-rule"
        style={{ scale: `${phase(time, 0.9, 2.2)} 1` }}
      />
    </div>
  );
}

function MixedRetrieval({ time }: { time: number }) {
  return (
    <>
      {[0, 1].map((index) => {
        const pose = retrievalSourceAt(time, index);
        const start = 3.65 + index * 0.45;
        const scan = progress(time, start, start + 1.05);
        const visible =
          phase(time, start, start + 0.3) * (1 - phase(time, 6.25, 7.0));
        return (
          <div key={index}>
            <div
              className="rc-scan-frame"
              style={{
                left: pose.x - 293,
                top: pose.y - 168,
                opacity: visible,
                transform: `rotate(${pose.angle}deg)`,
              }}
            />
            <div
              className="rc-scan-sweep"
              style={{
                left: pose.x - 245,
                top: pose.y - 75 + scan * 165,
                opacity: Math.sin(Math.PI * scan),
                rotate: `${pose.angle}deg`,
              }}
            />
            <div
              className="rc-lexical-tag"
              style={{
                left: pose.x - 255,
                top: pose.y + 175,
                opacity: visible,
                translate: `0 ${mix(14, 0, phase(time, start, start + 0.7))}px`,
              }}
            >
              {index === 0 ? "关键词命中 · 服务接入" : "语义相关 · 失败恢复"}
            </div>
          </div>
        );
      })}
    </>
  );
}

function GraphRetrieval({ time }: { time: number }) {
  const reveal = phase(time, 7.1, 8.8);
  const collect = phase(time, 8.75, 9.85);
  const origin = { x: 1260, y: 1200 };
  const control1 = { x: 1500, y: 1290 };
  const control2 = { x: 1670, y: 990 };
  const end = { x: CORE.x - 100, y: CORE.y + 120 };
  const dot = cubic(origin, control1, control2, end, collect);
  return (
    <>
      <svg
        className="rc-graph-lines"
        width="4000"
        height="2500"
        viewBox="0 0 4000 2500"
        fill="none"
      >
        {GRAPH_NODES.map((node, index) => {
          const pose = graphNodeAt(time, index);
          const p = phase(time, 7.25 + index * 0.45, 8.45 + index * 0.45);
          const x = (node.x + CORE.x) / 2;
          const y = (node.y + CORE.y) / 2 - 30;
          return (
            <g key={node.label} opacity={pose.alpha}>
              <path
                d={`M${CORE.x} ${CORE.y} Q${node.x} ${CORE.y - 30} ${pose.x} ${pose.y}`}
                stroke="#b5db9b"
                strokeWidth="2"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - p}
              />
              <path
                d={`M${CORE.x} ${CORE.y} Q${node.x} ${CORE.y - 30} ${pose.x} ${pose.y}`}
                stroke="#b5db9b"
                strokeWidth="10"
                opacity="0.07"
              />
              <text x={x} y={y} textAnchor="middle" opacity={p}>
                {node.relation}
              </text>
            </g>
          );
        })}
        <path
          d={`M${origin.x} ${origin.y} C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`}
          stroke="#bce59f"
          strokeWidth="2"
          opacity={0.6 * reveal}
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - collect}
        />
        <circle
          cx={dot.x}
          cy={dot.y}
          r="7"
          fill="#d6f0b5"
          opacity={Math.sin(Math.PI * collect)}
        />
        <circle
          cx={CORE.x}
          cy={CORE.y}
          r={220 + 65 * phase(time, 7.1, 8.4)}
          stroke="#b9dfa0"
          strokeWidth="2"
          opacity={Math.sin(Math.PI * phase(time, 7.1, 8.4)) * 0.5}
        />
      </svg>
      {GRAPH_NODES.map((node, index) => {
        const pose = graphNodeAt(time, index);
        return (
          <div
            key={node.label}
            className="rc-graph-node"
            data-related-entity={node.label}
            style={{
              left: pose.x - 89,
              top: pose.y - 89,
              opacity: pose.alpha,
              scale: `${pose.scale}`,
            }}
          >
            <small>RELATED ENTITY</small>
            <strong>{node.label}</strong>
          </div>
        );
      })}
    </>
  );
}

function EvidenceCards({ time }: { time: number }) {
  return (
    <>
      {[0, 1, 2].map((index) => {
        const pose = evidencePose(time, index);
        return (
          <div
            key={index}
            data-retrieval-evidence={ROUTES[index].tool}
            className={`rc-evidence rc-evidence-${index}`}
            style={{
              left: pose.x - 232.5,
              top: pose.y - 140,
              opacity: pose.alpha,
              transform: `rotate(${pose.angle}deg) scale(${pose.scale})`,
            }}
          >
            <div
              className="rc-evidence-edge"
              style={{ background: EVIDENCE_COLORS[index] }}
            />
            <div className="rc-evidence-top">
              <b>0{index + 1}</b>
              <strong>{ROUTES[index].title}</strong>
              <span>{index === 2 ? "百科摘要" : "切片证据"}</span>
            </div>
            {index === 0 ? (
              <p>
                统一管理服务接入。<sup>[1]</sup>
                <br />
                失败后，执行有界重试。<sup>[2]</sup>
              </p>
            ) : index === 1 ? (
              <p>
                星舟网关连接
                <br />
                支付与结算服务。<sup>[3]</sup>
              </p>
            ) : (
              <p>
                服务接入、重试与恢复，
                <br />
                在同一条目中归纳。<sup>[4]</sup>
              </p>
            )}
            <div className="rc-evidence-bottom">
              <span>
                {index === 0 ? (
                  <>
                    网关设计说明 · 001
                    <br />
                    故障处理手册 · 014
                  </>
                ) : index === 1 ? (
                  <>
                    服务接入规范
                    <br />
                    来源切片 · 008
                  </>
                ) : (
                  <>
                    星舟网关 · Wiki
                    <br />
                    关联来源 · 001 / 014 / 008
                  </>
                )}
              </span>
              <span>
                {index === 0 ? "[1] [2]" : index === 1 ? "[3]" : "[4]"}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function EvidenceTrails({ time }: { time: number }) {
  return (
    <svg
      className="rc-return-lines"
      width="4000"
      height="2700"
      viewBox="0 0 4000 2700"
      fill="none"
    >
      {EVIDENCE_DOCKS.map((dock, index) => {
        const pose = evidencePose(time, index);
        const wait = EVIDENCE_WAITS[index];
        const alpha = phase(
          time,
          EVIDENCE_STARTS[index] + 0.5,
          EVIDENCE_STARTS[index] + 1.2,
        );
        const connecting = phase(
          time,
          16.15 + index * 0.08,
          16.8 + index * 0.08,
        );
        return (
          <g key={index}>
            <path
              d={`M${wait.x} ${wait.y} C${wait.x} ${wait.y + 380} ${pose.x} ${pose.y - 160} ${pose.x} ${pose.y}`}
              stroke={EVIDENCE_COLORS[index]}
              strokeWidth="1.5"
              opacity={
                alpha *
                0.28 *
                (1 - phase(time, 16.0, 16.6)) *
                phase(time, 13.8, 14.1)
              }
            />
            <path
              d={`M${dock.x} ${dock.y + 146} C${dock.x} 2050 ${2085 + (index - 1) * 240} 2025 ${2085 + (index - 1) * 240} 2070`}
              stroke={EVIDENCE_COLORS[index]}
              strokeWidth="2"
              opacity={connecting * 0.7}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - connecting}
            />
          </g>
        );
      })}
    </svg>
  );
}

function GroundedAnswer({ time }: { time: number }) {
  return (
    <div
      className="rc-answer"
      data-grounded-answer
      style={{ opacity: phase(time, 16.25, 16.85) }}
    >
      <div className="rc-answer-label">
        <span>基于检索证据的回答</span>
        <span>同一个问题 · 同一组引用</span>
      </div>
      <p
        style={{
          clipPath: `inset(0 ${100 * (1 - phase(time, 16.7, 17.6))}% 0 0)`,
        }}
      >
        星舟网关统一接入并转发请求，连接支付与结算服务。<sup>[1][3]</sup>
      </p>
      <p
        style={{
          clipPath: `inset(0 ${100 * (1 - phase(time, 17.35, 18.3))}% 0 0)`,
        }}
      >
        请求失败时，按配置执行有界重试；相关机制已归纳在百科条目中。
        <sup>[2][4]</sup>
      </p>
    </div>
  );
}

export const RetrievalContinuum = ({ startAt = 0 }: { startAt?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps + startAt;
  const tail = time - INGEST_DURATION;
  const [handle] = useState(() => delayRender("Load continuum fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const worldTime = Math.min(time, INGEST_DURATION);
  const camera = tail < 0 ? globalCameraAt(time) : retrievalCameraAt(tail);
  const focused = phase(tail, 0.35, 2.5);
  const graph = phase(tail, 6.2, 7.2) * (1 - phase(tail, 10.0, 11.0));
  const wiki = phase(tail, 10.3, 11.4) * (1 - phase(tail, 14.0, 15.0));
  const style = {
    "--retrieval-focus": focused,
    "--source-light": mix(1, 0.35, Math.max(graph, wiki)),
    "--core-light": mix(1, 0.4, wiki),
    "--wiki-light": mix(1, 0.35, graph),
    "--wiki-hit": phase(tail, 11.6, 12.6) * (1 - phase(tail, 14.0, 15.0)),
  } as CSSProperties;
  return (
    <AbsoluteFill
      className="journey continuum"
      data-continuum-time={time}
      style={style}
    >
      <Sequence
        from={-startAt * fps}
        durationInFrames={48 * fps}
        premountFor={fps}
        name="Knowledge soundtrack"
      >
        <Audio
          src={staticFile("motion-sound.wav")}
          premountFor={fps}
          volume={0.75}
        />
      </Sequence>
      <Sequence
        from={(48 - startAt) * fps}
        durationInFrames={ENDING_DURATION * fps}
        premountFor={fps}
        name="Retrieval soundtrack"
      >
        <Audio
          src={staticFile("retrieval-continuum-sound.wav")}
          premountFor={fps}
          volume={0.8}
        />
      </Sequence>
      <World
        time={worldTime}
        camera={camera}
        sourcePoses={
          tail < 0
            ? undefined
            : [0, 1, 2].map((i) => retrievalSourceAt(tail, i))
        }
      >
        <div
          className="rc-destination-glow"
          style={{ opacity: phase(tail, 13.5, 16.0) }}
        />
        <QueryObject time={tail} />
        <MixedRetrieval time={tail} />
        <GraphRetrieval time={tail} />
        <EvidenceTrails time={tail} />
        <EvidenceCards time={tail} />
        <GroundedAnswer time={tail} />
        {ROUTES.map((route, index) => (
          <div
            key={route.tool}
            className="rc-route-heading"
            data-retrieval-heading={route.tool}
            style={{
              left: route.x,
              top: route.y,
              color: EVIDENCE_COLORS[index],
              opacity:
                phase(tail, route.start, route.start + 0.45) *
                (1 - phase(tail, route.end - 0.3, route.end)),
              translate: `0 ${mix(14, 0, phase(tail, route.start, route.start + 0.6))}px`,
            }}
          >
            <small>{route.tool}</small>
            <strong>{route.title}</strong>
            <span>{route.detail}</span>
          </div>
        ))}
      </World>
      <div className="journey-vignette" />
      <div className="journey-hud">
        <span className="journey-brand">
          harness <i>/</i> RAG
        </span>
        <span className="journey-hud-right">
          {tail < 0
            ? "THE JOURNEY OF KNOWLEDGE"
            : "ONE QUESTION / THREE PERSPECTIVES"}
        </span>
      </div>
      <div className="journey-captions">
        {CAPTIONS.map((caption) => {
          const start = caption.startMs / 1000;
          const end = caption.endMs / 1000;
          return (
            <div
              key={start}
              style={{
                opacity:
                  phase(time, start, start + 0.3) *
                  (1 - phase(time, end - 0.25, end)),
                translate: `0 ${mix(7, 0, phase(time, start, start + 0.45))}px`,
              }}
            >
              {caption.text}
            </div>
          );
        })}
      </div>
      <div className="rc-closing" style={{ opacity: phase(tail, 18.4, 19.1) }}>
        三路检索，让回答有据可循。
      </div>
      <div className="journey-corner-note">机制演示 · 非实时耗时</div>
      <div className="journey-timeline">
        <span style={{ width: `${(time / FILM_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};
