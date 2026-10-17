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
import {
  EntityCore,
  MinorChunk,
  OriginSheet,
  ProvenanceLines,
  SourceCard,
  WikiLeaf,
} from "./KnowledgeJourney";
import {
  ANSWER,
  HARNESS_BOX,
  INGEST_DURATION,
  PET,
  QUERY_DURATION,
  REGIONS,
  SOURCE_IDS,
  TOOL_CARDS,
  USER,
  USER_BOX,
  answerState,
  harnessBoxState,
  growBarAt,
  mix,
  phase,
  queryCameraAt,
  queryEvidencePacket,
  queryLaneRequest,
  queryPacketCount,
  regionCenter,
  regionState,
  contractAt,
  contractFrame,
  threadLine,
  toolCard,
  userBoxState,
} from "./journey-motion";
import "./journey.css";

const QUESTIONS = [
  { tag: "匹配", text: "我是谁？我在哪？" },
  { tag: "关系", text: "我们现在是什么关系？" },
  { tag: "深度", text: "你还要我怎样？" },
] as const;

function UserFigure({ time }: { time: number }) {
  const rise = phase(time, 0, 1.2);
  return (
    <div
      className="query-user"
      style={{
        left: USER.x - 78,
        top: USER.y - 150,
        opacity: rise,
        transform: `translateY(${mix(26, 0, rise)}px)`,
      }}
    >
      <svg width="156" height="212" viewBox="0 0 156 212" fill="none">
        <ellipse
          cx="78"
          cy="202"
          rx="56"
          ry="10"
          fill="#78deec"
          opacity="0.1"
        />
        <path
          d="M78 66 C110 66 124 92 124 126 V196 H32 V126 C32 92 46 66 78 66 Z"
          fill="url(#user-body)"
          stroke="#cfe3dd"
          strokeWidth="2"
        />
        <circle
          cx="78"
          cy="36"
          r="29"
          fill="url(#user-body)"
          stroke="#cfe3dd"
          strokeWidth="2"
        />
        <path
          d="M62 34 q6 6 12 0 M82 34 q6 6 12 0"
          stroke="#5b7d79"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M70 48 q8 6 16 0"
          stroke="#5b7d79"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="user-body"
            x1="30"
            y1="20"
            x2="128"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#eef2e9" />
            <stop offset="1" stopColor="#b9ccc5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function PetFigure({ time }: { time: number }) {
  const rise = phase(time, 0.35, 1.5);
  const nod = Math.sin(time * 1.9) * 2.4 * phase(time, 2.2, 3.2);
  return (
    <div
      className="query-pet"
      style={{
        left: PET.x - 96,
        top: PET.y - 150,
        opacity: rise,
        transform: `translateY(${mix(26, 0, rise)}px) rotate(${nod}deg)`,
      }}
    >
      <svg width="192" height="216" viewBox="0 0 192 216" fill="none">
        <ellipse
          cx="96"
          cy="204"
          rx="62"
          ry="11"
          fill="#afe1a7"
          opacity="0.12"
        />
        <path
          d="M96 84 C132 84 150 112 150 148 V198 H42 V148 C42 112 60 84 96 84 Z"
          fill="url(#pet-body)"
          stroke="#cfe3b8"
          strokeWidth="2"
        />
        <path
          d="M52 150 q-22 -8 -26 -30 q22 4 30 18"
          fill="#a9c78d"
          stroke="#cfe3b8"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M60 34 q-16 -26 -6 -32 q10 8 14 22 M132 34 q16 -26 6 -32 q-10 8 -14 22"
          stroke="#cfe3b8"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M56 30 q-20 -12 -24 -2 M136 30 q20 -12 24 -2"
          stroke="#cfe3b8"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse
          cx="96"
          cy="52"
          rx="44"
          ry="38"
          fill="url(#pet-body)"
          stroke="#cfe3b8"
          strokeWidth="2"
        />
        <path
          d="M58 22 q-16 -12 -22 -2 q10 12 22 10 M134 22 q16 -12 22 -2 q-10 12 -22 10"
          fill="#9dbb83"
          stroke="#cfe3b8"
          strokeWidth="2"
        />
        <ellipse
          cx="96"
          cy="66"
          rx="21"
          ry="15"
          fill="#e8f0dc"
          opacity="0.85"
        />
        <circle cx="96" cy="60" r="5" fill="#48604a" />
        <path
          d="M78 46 q6 7 13 1 M101 47 q7 6 13 -1"
          stroke="#48604a"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M84 74 q12 8 24 0"
          stroke="#48604a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="70" cy="58" r="6" fill="#e2b6a5" opacity="0.5" />
        <circle cx="122" cy="58" r="6" fill="#e2b6a5" opacity="0.5" />
        <defs>
          <linearGradient
            id="pet-body"
            x1="42"
            y1="10"
            x2="150"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#eaf1da" />
            <stop offset="1" stopColor="#a7c190" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function UserBox({ time }: { time: number }) {
  const state = userBoxState(time);
  return (
    <div
      className="query-userbox"
      data-user-box="question"
      style={{
        left: USER_BOX.x - USER_BOX.w / 2 + state.flight * 330,
        top: USER_BOX.y - USER_BOX.h / 2,
        width: USER_BOX.w,
        height: USER_BOX.h,
        opacity: state.in * state.opacity,
        transform: `scale(${state.scale})`,
      }}
    >
      <div className="query-box-tail" />
      <div className="query-blur query-blur-user">
        {[72, 92, 58].map((width, row) => (
          <i key={row} style={{ width: `${width}%` }} />
        ))}
      </div>
    </div>
  );
}

function HarnessBox({ time }: { time: number }) {
  const state = harnessBoxState(time);
  const height = 150 + state.grow * 280;
  return (
    <div
      className="query-harnessbox"
      data-harness-box="rewrite"
      style={{
        left: HARNESS_BOX.x - HARNESS_BOX.w / 2,
        top: 460 - height / 2,
        width: HARNESS_BOX.w,
        height,
        opacity: state.in,
        borderRadius: 75 - state.grow * 49,
      }}
    >
      <div className="query-box-tail query-box-tail-right" />
      <div className="query-think-badge" style={{ opacity: 1 - state.blurOut }}>
        <i />
        <i />
        <i />
      </div>
      <div className="query-blur-clip">
        <div
          className="query-blur query-blur-harness"
          style={{ opacity: 1 - state.blurOut }}
        >
          {[72, 92, 58, 86, 66, 96].map((width, row) => (
            <i
              key={row}
              style={{
                width: `${width}%`,
                opacity: row < 3 ? 1 : growBarAt(time, row - 3),
              }}
            />
          ))}
        </div>
      </div>
      {REGIONS.map((region, index) => (
        <div
          key={region.key}
          className={`query-region query-region-${index}`}
          data-region={region.key}
          style={{
            left: region.left,
            top: region.top,
            width: region.w,
            height: region.h,
            opacity: regionState(time, index),
            transform: `scale(${mix(0.88, 1, regionState(time, index))})`,
          }}
        >
          <div className="query-region-top">
            <i />
            <span>{region.tag}</span>
          </div>
          <span className="query-quote">“</span>
          <p>{QUESTIONS[index].text}</p>
          <span className="query-region-ornament">✦</span>
        </div>
      ))}
      {[0, 1, 2].map((index) => {
        const frame = contractFrame(time, index);
        return (
          <div
            key={index}
            className="query-contract-frame"
            style={{
              left: frame.left,
              top: frame.top,
              width: frame.w,
              height: frame.h,
              opacity: frame.alpha,
              borderColor: ["#96d5e2", "#add99b", "#c0a7e9"][index],
              borderRadius: mix(26, 30, contractAt(time, index)),
            }}
          />
        );
      })}
    </div>
  );
}

function ToolCards({ time }: { time: number }) {
  return (
    <>
      {TOOL_CARDS.map((card, index) => (
        <div
          key={card.key}
          className="query-tool"
          style={{
            left: card.x - 175,
            top: card.y - 46,
            opacity: toolCard(time, index),
            transform: `translateY(${mix(18, 0, toolCard(time, index))}px)`,
          }}
        >
          <span className={`query-tool-dot query-tag-${index}`} />
          <div>
            <strong>{card.cn}</strong>
            <code>{card.tool}</code>
          </div>
        </div>
      ))}
      <svg
        className="query-threads"
        width="6400"
        height="1800"
        viewBox="0 0 6400 1800"
        fill="none"
      >
        {TOOL_CARDS.map((card, index) => {
          const amount = threadLine(time, index);
          const start = regionCenter(index);
          const end = { x: card.x - 178, y: card.y };
          const d = `M${start.x} ${start.y} C${start.x + 180} ${start.y} ${end.x - 190} ${end.y} ${end.x} ${end.y}`;
          return (
            <path
              key={card.key}
              d={d}
              stroke={["#78deec", "#afe1a7", "#c0a8f2"][index]}
              strokeOpacity={0.7 * amount}
              strokeWidth="2"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - amount}
            />
          );
        })}
      </svg>
    </>
  );
}

function RetrievalLanes({ time }: { time: number }) {
  const draw = phase(time, 13.2, 14.3);
  return (
    <svg
      className="back-lanes"
      width="6400"
      height="1800"
      viewBox="0 0 6400 1800"
      fill="none"
    >
      {TOOL_CARDS.map((card, index) => {
        const d = `M${card.target.x} ${card.target.y} C${card.c2.x} ${card.c2.y} ${card.c1.x} ${card.c1.y} ${card.x - 175} ${card.y}`;
        return (
          <g key={card.key}>
            <path
              d={d}
              stroke={["#78deec", "#afe1a7", "#c0a8f2"][index]}
              strokeOpacity={0.5 * draw}
              strokeWidth="2.2"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - draw}
            />
            <path
              d={d}
              stroke="#cfe4dd"
              strokeOpacity={0.06 * draw}
              strokeWidth="11"
            />
          </g>
        );
      })}
      {[0, 1, 2].map((laneIndex) =>
        [0, 1, 2].map((round) => {
          const req = queryLaneRequest(time, laneIndex, round);
          return (
            <circle
              key={`r${round}-${laneIndex}`}
              cx={req.x}
              cy={req.y}
              r={round === 1 ? 5 : 7}
              fill="#dff2ea"
              opacity={req.alpha * (round === 1 ? 0.6 : 1)}
            />
          );
        }),
      )}
      {[0, 1, 2].map((laneIndex) =>
        [0, 1, 2].flatMap((round) =>
          Array.from(
            { length: queryPacketCount(laneIndex, round) },
            (_, packetIndex) => {
              const packet = queryEvidencePacket(
                time,
                laneIndex,
                packetIndex,
                round,
              );
              return (
                <circle
                  key={`p-${laneIndex}-${round}-${packetIndex}`}
                  cx={packet.x}
                  cy={packet.y}
                  r={6 * packet.dim}
                  fill={["#78deec", "#afe1a7", "#c0a8f2"][laneIndex]}
                  opacity={packet.alpha * (0.55 + 0.45 * packet.dim)}
                />
              );
            },
          ),
        ),
      )}
    </svg>
  );
}

function AnswerSheet({ time }: { time: number }) {
  const answer = answerState(time);
  return (
    <div
      className="back-answer"
      style={{ left: ANSWER.x - 320, top: ANSWER.y - 275, opacity: answer.in }}
    >
      <div className="back-answer-top">
        <span>回答</span>
        <span>统一引用编号 · run 内连续</span>
      </div>
      <p style={{ opacity: answer.text1 }}>
        网关统一管理服务接入，支付服务经由它访问结算服务。<sup>[1][3]</sup>
      </p>
      <p style={{ opacity: answer.text2 }}>
        请求失败时，按配置执行有界重试与退避。<sup>[2]</sup>
      </p>
      <div className="back-answer-sources" style={{ opacity: answer.sources }}>
        <span>参考来源</span>
        <div>
          <b>[1] 001</b>
          <b>[2] 014</b>
          <b>[3] 008</b>
        </div>
      </div>
      <div className="back-answer-warning" style={{ opacity: answer.warning }}>
        证据覆盖不足 · 结论暂缺
      </div>
    </div>
  );
}

function QueryWorld({ time }: { time: number }) {
  const camera = queryCameraAt(time);
  const rest = INGEST_DURATION;
  return (
    <div
      className="journey-world"
      data-camera-x={camera.x}
      data-camera-y={camera.y}
      data-camera-zoom={camera.zoom}
      style={{
        transform: `translate(960px,540px) rotate(${camera.roll}deg) scale(${camera.zoom}) translate(${-camera.x}px,${-camera.y}px)`,
      }}
    >
      <div className="journey-world-light source-light" />
      <div className="journey-world-light entity-light" />
      <div
        className="journey-world-light wiki-light"
        style={{ opacity: 0.55 }}
      />
      <svg
        className="journey-world-grid"
        width="6400"
        height="1800"
        viewBox="0 0 6400 1800"
        fill="none"
      >
        <path
          d="M110 1430 C1200 1720 2270 1190 3560 1420 M110 1445 C1200 1735 2270 1205 3560 1435 M110 1460 C1200 1750 2270 1220 3560 1450"
          stroke="#8fb3aa"
          strokeOpacity="0.1"
        />
      </svg>
      <ProvenanceLines time={rest - 20 + 28} />
      {[0, 1, 2].map((index) => (
        <OriginSheet key={index} time={rest} index={index} />
      ))}
      {[0, 1, 2].map((sheetIndex) =>
        [0, 1].map((chunkIndex) => (
          <MinorChunk
            key={`${sheetIndex}-${chunkIndex}`}
            time={rest}
            sheetIndex={sheetIndex}
            chunkIndex={chunkIndex}
          />
        )),
      )}
      {[2, 1, 0].map((index) => (
        <SourceCard key={SOURCE_IDS[index]} time={28} index={index} />
      ))}
      <EntityCore time={28} />
      <WikiLeaf time={28} />
      <RetrievalLanes time={time} />
      <UserFigure time={time} />
      <PetFigure time={time} />
      <UserBox time={time} />
      <HarnessBox time={time} />
      <ToolCards time={time} />
      <AnswerSheet time={time} />
    </div>
  );
}

const CAPTIONS = [
  { start: 0.6, end: 3.2, text: "用户提出问题。" },
  { start: 3.5, end: 5.4, text: "harness agent 接住它。" },
  { start: 6.2, end: 8.1, text: "把问题，改写成任务。" },
  { start: 8.4, end: 11.3, text: "识别三类问题，调用对应的工具。" },
  { start: 11.7, end: 13.6, text: "向量检索 / 图谱检索 / wiki 检索" },
  { start: 13.8, end: 17.2, text: "一条查询，三路并列命中。" },
  { start: 19.4, end: 22.2, text: "证据不足，就换路、换个问法。" },
  { start: 23.0, end: 26.4, text: "补检命中，结论才落地。" },
  { start: 28.0, end: 32.0, text: "查得深，也查得清。" },
] as const;

export const QueryJourney = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load query fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill className="journey" data-query-time={time}>
      <Audio
        src={staticFile("query-sound.wav")}
        premountFor={fps}
        volume={0.75}
      />
      <QueryWorld time={time} />
      <div className="journey-vignette" />
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
        <span style={{ width: `${(time / QUERY_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};
