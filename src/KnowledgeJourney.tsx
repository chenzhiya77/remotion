import { useEffect, useState, type CSSProperties } from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palette } from "./visuals";
import {
  CORE,
  FRONT_DURATION,
  INGEST_DURATION,
  SOURCE_IDS,
  WIKI,
  cubic,
  frontChunkAt,
  globalCameraAt,
  minorChunkAt,
  mix,
  phase,
  progress,
  provenance,
  sheetState,
  sourceAt,
  tokenAt,
  type Camera,
  type ChunkPose,
} from "./journey-motion";
import "./journey.css";

const SOURCES = [
  {
    name: "网关设计说明.pdf",
    section: "服务概览",
    entity: "星舟网关",
    before: "",
    after: "统一管理服务接入。",
    detail: "连接业务服务，转发请求，并保留清晰的调用边界。",
    keyword: "服务接入",
    code: "gateway / overview",
    size: 270,
  },
  {
    name: "故障处理手册.pdf",
    section: "重试与恢复",
    entity: "SS Gateway",
    before: "",
    after: "负责请求失败后的恢复。",
    detail: "按配置执行有界重试，避免无限重复调用。",
    keyword: "有界重试",
    code: "gateway / recovery",
    size: 315,
  },
  {
    name: "服务接入规范.pdf",
    section: "调用关系",
    entity: "Starship Gateway",
    before: "",
    after: "连接支付与结算服务。",
    detail: "请求通过统一入口转发，服务之间的依赖有据可查。",
    keyword: "依赖关系",
    code: "gateway / dependencies",
    size: 390,
  },
] as const;

export function SourceCard({
  time,
  index,
  pose,
}: {
  time: number;
  index: number;
  pose?: ChunkPose;
}) {
  const source = pose ?? sourceAt(time, index);
  const data = SOURCES[index];
  const extraction = phase(time, 5.1 + index * 0.7, 6.0 + index * 0.7);
  const scan = progress(time, 4.7 + index * 0.7, 6.4 + index * 0.7);
  return (
    <div
      data-source-id={SOURCE_IDS[index]}
      className="journey-source"
      style={{
        left: source.x - 285,
        top: source.y - 160,
        transform: `perspective(1500px) rotateY(${source.yaw}deg) rotateZ(${source.angle}deg)`,
        opacity: source.alpha,
        zIndex: 13 - index,
      }}
    >
      <div className="journey-source-edge" />
      <div className="journey-source-top">
        <span className="journey-id">{SOURCE_IDS[index]}</span>
        <span>{data.name}</span>
        <span className="journey-page-icon" />
      </div>
      <div className="journey-source-section">{data.section}</div>
      <p className="journey-source-main">
        <span
          className="journey-highlight"
          style={{
            backgroundColor: `rgba(83,181,184,${extraction * 0.2})`,
            boxShadow: `0 0 ${18 * extraction}px rgba(109,220,220,${extraction * 0.2})`,
          }}
        >
          {data.entity}
        </span>
        <br />
        {data.after}
      </p>
      <p className="journey-source-detail">{data.detail}</p>
      <div className="journey-source-bottom">
        <span>{data.code}</span>
        <span>{data.keyword}</span>
      </div>
      <div
        className="journey-scanner"
        style={{
          top: mix(32, 283, scan),
          opacity: Math.sin(scan * Math.PI) * 0.9,
        }}
      />
    </div>
  );
}

function EntityToken({ time, index }: { time: number; index: number }) {
  const token = tokenAt(time, index);
  const data = SOURCES[index];
  const landing = index === 0 ? token.landed : 0;
  return (
    <div
      data-entity-token={SOURCE_IDS[index]}
      className="journey-token"
      style={{
        left: token.x - data.size / 2,
        top: token.y - 33,
        width: data.size,
        transform: `rotate(${token.angle}deg) scale(${token.scale})`,
        opacity: token.alpha,
        borderColor: `rgba(146,221,201,${0.6 * (1 - landing)})`,
        background: `rgba(19,48,47,${0.94 * (1 - landing)})`,
        boxShadow: `0 14px 40px rgba(0,0,0,${0.25 * (1 - landing)}), 0 0 ${28 * (1 - landing)}px rgba(134,217,190,${0.12 * (1 - landing)})`,
        color: landing > 0.5 ? "#e5f1d6" : "#bbecd9",
        fontSize: mix(28, 39, landing),
        letterSpacing: landing * 2,
      }}
    >
      <span
        className="journey-token-dot"
        style={{
          width: 6 * (1 - landing),
          marginRight: 13 * (1 - landing),
          opacity: 1 - landing,
        }}
      />
      {data.entity}
    </div>
  );
}

export function ProvenanceLines({ time }: { time: number }) {
  const readiness = phase(time, 15.4, 16.8);
  const ink = time < 15.5 ? palette.cyan : palette.green;
  const growth = phase(time, 17.1, 19.4);
  const pageLeft = mix(CORE.x + 220, WIKI.x - 380, phase(time, 18.0, 21.8));
  return (
    <svg
      className="journey-lines"
      width="4000"
      height="1800"
      viewBox="0 0 4000 1800"
      fill="none"
    >
      {SOURCE_IDS.map((id, index) => {
        const line = provenance(time, index);
        const d = `M${line.start.x} ${line.start.y} C${line.control1.x} ${line.control1.y} ${line.control2.x} ${line.control2.y} ${line.end.x} ${line.end.y}`;
        const alpha = phase(time, 5.5 + index * 0.7, 7.4 + index * 0.7);
        const pulse = progress(time, 14.6 + index * 0.45, 16.3 + index * 0.45);
        const dot = cubic(
          line.start,
          line.control1,
          line.control2,
          line.end,
          pulse,
        );
        return (
          <g key={id} opacity={alpha}>
            <path d={d} stroke={ink} strokeOpacity={0.13} strokeWidth="5" />
            <path
              d={d}
              stroke={ink}
              strokeOpacity={mix(0.42, 0.7, readiness)}
              strokeWidth="1.3"
            />
            <circle cx={line.start.x} cy={line.start.y} r="4" fill="#9cdbd6" />
            <circle
              cx={dot.x}
              cy={dot.y}
              r="6"
              fill="#d9edb9"
              opacity={Math.sin(pulse * Math.PI)}
            />
          </g>
        );
      })}
      <path
        d={`M${CORE.x + 183} ${CORE.y} C${CORE.x + 328} ${CORE.y} ${pageLeft - 135} ${WIKI.y} ${pageLeft + 12} ${WIKI.y}`}
        stroke={palette.violet}
        strokeOpacity={0.66}
        strokeWidth="2"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - growth}
      />
      <path
        d={`M${CORE.x + 183} ${CORE.y} C${CORE.x + 328} ${CORE.y} ${pageLeft - 135} ${WIKI.y} ${pageLeft + 12} ${WIKI.y}`}
        stroke={palette.violet}
        strokeOpacity={0.1 * growth}
        strokeWidth="10"
      />
    </svg>
  );
}

export function EntityCore({ time }: { time: number }) {
  const birth = phase(time, 12.75, 14.8);
  const settle = Math.sin(progress(time, 13.2, 15.6) * Math.PI) * 0.07;
  const eligible = phase(time, 15.65, 17.1);
  const pulse = progress(time, 13.8, 16.0);
  const orbit = mix(-46, 16, phase(time, 11.8, 16.8));
  return (
    <div className="journey-core-anchor" style={{ left: CORE.x, top: CORE.y }}>
      <div
        className="journey-merge-wave"
        style={{
          opacity: Math.sin(pulse * Math.PI) * 0.55,
          transform: `translate(-50%,-50%) scale(${mix(0.3, 1.9, pulse)})`,
        }}
      />
      <div
        className="journey-orbit"
        style={{
          opacity: birth * 0.65,
          transform: `translate(-50%,-50%) rotate(${orbit}deg) scaleY(0.53) scale(${mix(0.1, 1, birth)})`,
        }}
      />
      <div
        data-canonical-entity="星舟网关"
        className="journey-core"
        style={{
          transform: `translate(-50%,-50%) scale(${birth + settle})`,
          opacity: birth,
        }}
      >
        <div className="journey-core-rim" />
        <div
          className="journey-core-reflection"
          style={{ rotate: `${mix(-36, -22, phase(time, 13, 26))}deg` }}
        />
        <svg
          className="journey-core-glyph"
          width="66"
          height="66"
          viewBox="0 0 64 64"
          fill="none"
          style={{
            transform: `perspective(400px) rotateY(${mix(-36, 19, phase(time, 13, 20))}deg)`,
          }}
        >
          <path
            d="M32 5 L55 18 V45 L32 58 L9 45 V18 Z M9 18 L32 32 L55 18 M32 32 V58"
            stroke="#d0eabd"
            strokeWidth="1.7"
          />
          <circle cx="32" cy="5" r="3" fill="#d0eabd" />
          <circle cx="9" cy="45" r="3" fill="#d0eabd" />
          <circle cx="55" cy="45" r="3" fill="#d0eabd" />
        </svg>
        <div
          className="journey-core-category"
          style={{ opacity: phase(time, 14.4, 15.5) }}
        >
          CANONICAL ENTITY
        </div>
        <div
          className="journey-core-proof"
          style={{ opacity: phase(time, 14.7, 16.0) }}
        >
          <span>3</span> 处切片来源
        </div>
        <div
          className="journey-core-qualification"
          style={{ opacity: eligible }}
        >
          <span>✓</span> 资格通过
        </div>
      </div>
      <svg
        className="journey-qualification-ring"
        width="422"
        height="422"
        viewBox="0 0 422 422"
        style={{ opacity: eligible }}
      >
        <circle
          cx="211"
          cy="211"
          r="204"
          fill="none"
          stroke="#c7e5a1"
          strokeWidth="1.5"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - eligible}
          transform="rotate(-90 211 211)"
        />
      </svg>
      <div
        className="journey-core-footnote"
        style={{ opacity: phase(time, 16, 17.1) }}
      >
        有效实体 · 跨切片支撑
      </div>
    </div>
  );
}

function Ink({
  time,
  start,
  children,
  style,
}: {
  time: number;
  start: number;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  const p = phase(time, start, start + 0.85);
  return (
    <div
      style={{
        ...style,
        opacity: Math.min(1, p * 4),
        clipPath: `inset(0 ${100 * (1 - p)}% 0 0)`,
      }}
    >
      {children}
    </div>
  );
}

export function WikiLeaf({ time }: { time: number }) {
  const open = phase(time, 18.0, 21.8);
  const left = mix(CORE.x + 220, WIKI.x - 380, open);
  const content = phase(time, 19.5, 22.9);
  return (
    <div
      data-generated-wiki="星舟网关"
      className="journey-wiki-anchor"
      style={{
        left,
        top: WIKI.y - 455,
        opacity: phase(time, 17.9, 18.5),
        transform: `perspective(1900px) rotateY(${mix(-78, -4, open)}deg) rotateZ(${mix(13, 2, open)}deg) scaleX(${mix(0.06, 1, open)})`,
        transformOrigin: "left center",
      }}
    >
      <div
        className="journey-wiki-back"
        style={{
          transform: `translate(${10 * open}px,${11 * open}px) rotate(${1.2 * open}deg)`,
        }}
      />
      <div className="journey-wiki-page">
        <div className="journey-wiki-edge" />
        <div className="journey-wiki-header">
          <span className="journey-wiki-monogram">
            W<span>.</span>
          </span>
          <span>GROUNDED IN YOUR KNOWLEDGE</span>
          <span className="journey-wiki-spark">✧</span>
        </div>
        <Ink time={time} start={19.15}>
          <div className="journey-wiki-taxonomy">系统架构 / 生成百科</div>
        </Ink>
        <Ink time={time} start={19.3}>
          <div className="journey-wiki-title">星舟网关</div>
        </Ink>
        <Ink time={time} start={19.6}>
          <div className="journey-wiki-english">Starship Gateway</div>
        </Ink>
        <Ink time={time} start={20.1}>
          <div className="journey-wiki-intro">
            连接服务的统一入口，
            <br />
            也是理解依赖关系的起点。
          </div>
        </Ink>
        <div
          className="journey-wiki-short-rule"
          style={{ width: 45 * content }}
        />
        <Ink time={time} start={20.55}>
          <div className="journey-wiki-article">
            <b>01</b>
            <div>
              <strong>服务与接入</strong>
              <p>
                统一管理服务接入与请求转发。<sup>[1]</sup>
              </p>
            </div>
          </div>
        </Ink>
        <Ink time={time} start={21.15}>
          <div className="journey-wiki-article">
            <b>02</b>
            <div>
              <strong>重试与恢复</strong>
              <p>
                请求失败时，按配置执行有界重试。<sup>[2]</sup>
              </p>
            </div>
          </div>
        </Ink>
        <Ink time={time} start={21.75}>
          <div className="journey-wiki-article">
            <b>03</b>
            <div>
              <strong>服务依赖</strong>
              <p>
                支付服务经由网关访问结算服务。<sup>[3]</sup>
              </p>
            </div>
          </div>
        </Ink>
        <div
          className="journey-wiki-sources"
          style={{
            opacity: phase(time, 22.1, 23.3),
            transform: `translateY(${mix(13, 0, phase(time, 22.1, 23.3))}px)`,
          }}
        >
          <span>来源切片</span>
          <div>
            {SOURCE_IDS.map((id, index) => (
              <span key={id}>
                [{index + 1}] {id}
              </span>
            ))}
          </div>
        </div>
        <div className="journey-wiki-bottom" style={{ opacity: content }}>
          AI 生成 <span>来源可回溯</span>
        </div>
      </div>
    </div>
  );
}

const DOCS = [
  {
    file: "网关设计说明.pdf",
    title: "网关设计说明",
    sub: "Starship Gateway · Architecture",
    sections: ["服务概览", "接入方式", "请求转发"],
    marks: ["#", "##", "##"],
  },
  {
    file: "故障处理手册.pdf",
    title: "故障处理手册",
    sub: "Gateway Recovery · Runbook",
    sections: ["重试与恢复", "异常分类", "退避策略"],
    marks: ["#", "##", "##"],
  },
  {
    file: "服务接入规范.pdf",
    title: "服务接入规范",
    sub: "Service Access · Specification",
    sections: ["调用关系", "依赖清单", "变更约定"],
    marks: ["#", "##", "##"],
  },
] as const;

export function OriginSheet({ time, index }: { time: number; index: number }) {
  const sheet = sheetState(time, index);
  const doc = DOCS[index];
  const sliceRows = doc.sections.map((_, row) =>
    Math.max(0, Math.min(1, (sheet.slice - row * 0.16) / 0.5)),
  );
  return (
    <div
      className="origin-sheet"
      style={{
        left: sheet.x - 310,
        top: sheet.y - 410,
        transform: `perspective(1700px) rotateY(${mix(-6, -2, sheet.morph)}deg) rotateZ(${sheet.angle}deg)`,
        zIndex: 2,
      }}
    >
      <div className="origin-sheet-back" />
      <div className="origin-sheet-paper">
        <div
          className="origin-sheet-file-layer"
          style={{ opacity: 1 - Math.min(1, sheet.morph / 0.42) }}
        >
          <div className="origin-sheet-top">
            <span className="origin-file-chip">PDF</span>
            <span>{doc.file}</span>
            <span className="origin-page-no">0{index + 1} / 03</span>
          </div>
          <div className="origin-file-title">{doc.title}</div>
          <div className="origin-file-sub">{doc.sub}</div>
          <div className="origin-hairline" />
          {doc.sections.map((section, row) => (
            <div key={section} className="origin-file-section">
              <span>0{row + 1}</span>
              <strong>{section}</strong>
            </div>
          ))}
          <div className="origin-file-lines">
            {[96, 88, 93, 72, 91, 64].map((width, row) => (
              <i key={row} style={{ width: `${width}%` }} />
            ))}
          </div>
          <div className="origin-sheet-bottom">
            <span>TECHNICAL DOCUMENT</span>
            <span>{doc.file}</span>
          </div>
        </div>
        <div
          className="origin-sheet-md-layer"
          style={{
            opacity: Math.max(0, Math.min(1, (sheet.morph - 0.5) / 0.38)),
          }}
        >
          <div className="origin-sheet-top">
            <span className="origin-md-chip">MD</span>
            <span>{doc.file.replace(".pdf", ".md")}</span>
            <span className="origin-page-no">structured</span>
          </div>
          {doc.sections.map((section, row) => (
            <div key={section} className="origin-md-section">
              <span className="origin-md-mark">{doc.marks[row]}</span>
              <div>
                <strong>{section}</strong>
                <p>
                  {row === 0
                    ? "结构化后，标题层级与语义一并保留。"
                    : "内容按语义边界组织，随时可拆成切片。"}
                </p>
              </div>
            </div>
          ))}
          <div className="origin-md-table">
            <span>| 项目 | 配置 |</span>
            <span>| --- | --- |</span>
            <span>| 重试策略 | 有界重试 |</span>
            <span>| 退避方式 | 指数退避 |</span>
          </div>
          <div className="origin-sheet-bottom">
            <span>MARKDOWN</span>
            <span>heading / paragraph / table</span>
          </div>
        </div>
        <div
          className="origin-sheet-scan"
          style={{
            top: mix(24, 700, sheet.scan),
            opacity: Math.sin(sheet.scan * Math.PI) * 0.85,
          }}
        />
        {sliceRows.map((amount, row) => (
          <div
            key={row}
            className="origin-slice-band"
            style={{
              top: 168 + row * 168,
              opacity: amount * 0.85,
              transform: `scaleX(${mix(0.25, 1, amount)})`,
            }}
          />
        ))}
      </div>
      <div className="origin-sheet-tag">
        {sheet.morph < 0.5 ? "MINERU · 解析" : "STRUCTURED MARKDOWN"}
      </div>
    </div>
  );
}

export function MinorChunk({
  time,
  sheetIndex,
  chunkIndex,
}: {
  time: number;
  sheetIndex: number;
  chunkIndex: number;
}) {
  const chunk = minorChunkAt(time, sheetIndex, chunkIndex);
  const doc = DOCS[sheetIndex];
  return (
    <div
      className="origin-minor-chunk"
      style={{
        left: chunk.x - 165,
        top: chunk.y - 52,
        opacity: chunk.alpha,
        transform: `rotate(${chunk.angle}deg)`,
      }}
    >
      <span className="journey-id">
        {SOURCE_IDS[sheetIndex]}·{chunkIndex + 2}
      </span>
      <strong>{doc.sections[chunkIndex + 1]}</strong>
      <p>
        {chunkIndex === 0
          ? "从文档结构中分离的语义切片。"
          : "保留标题路径与来源标记。"}
      </p>
    </div>
  );
}

export function World({
  time,
  camera = globalCameraAt(time),
  sourcePoses,
  children,
}: {
  time: number;
  camera?: Camera;
  sourcePoses?: readonly ChunkPose[];
  children?: React.ReactNode;
}) {
  const jt = time - FRONT_DURATION;
  const glide = phase(jt, 7.8, 14.2);
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
      <div
        className="journey-world-light entity-light"
        style={{ opacity: mix(0.14, 0.7, phase(jt, 9.0, 16.0)) }}
      />
      <div
        className="journey-world-light wiki-light"
        style={{ opacity: phase(jt, 17.0, 23.0) * 0.7 }}
      />
      <svg
        className="journey-world-grid"
        width="6400"
        height="1800"
        viewBox="0 0 6400 1800"
        fill="none"
      >
        <defs>
          <linearGradient
            id="journey-floor-gradient"
            x1="300"
            y1="1400"
            x2="3400"
            y2="1400"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#78deec" stopOpacity="0.08" />
            <stop offset="0.55" stopColor="#afe1a7" stopOpacity="0.14" />
            <stop offset="1" stopColor="#c0a8f2" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path
          d="M110 1430 C1200 1720 2270 1190 3560 1420 M110 1445 C1200 1735 2270 1205 3560 1435 M110 1460 C1200 1750 2270 1220 3560 1450"
          stroke="url(#journey-floor-gradient)"
        />
        {[310, 780, 1250, 1720, 2190, 2660, 3130, 3600].map((x, i) => (
          <g key={x} opacity="0.22" stroke="#a3b8b2">
            <path
              d={`M${x - 5} ${245 + (i % 2) * 54}h10 M${x} ${240 + (i % 2) * 54}v10`}
            />
            <path d={`M${x - 5} 1550h10 M${x} 1545v10`} />
          </g>
        ))}
        <path
          d="M1650 548 C1850 300 2260 350 2290 655 C2310 860 2070 1090 1780 1015"
          stroke="#bddbaa"
          strokeOpacity={0.16 * glide}
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - glide}
        />
      </svg>
      <ProvenanceLines time={jt} />
      {[0, 1, 2].map((index) => (
        <OriginSheet key={DOCS[index].file} time={time} index={index} />
      ))}
      {[0, 1, 2].map((sheetIndex) =>
        [0, 1].map((chunkIndex) => (
          <MinorChunk
            key={`${sheetIndex}-${chunkIndex}`}
            time={time}
            sheetIndex={sheetIndex}
            chunkIndex={chunkIndex}
          />
        )),
      )}
      {time < FRONT_DURATION
        ? [2, 1, 0].map((index) => (
            <SourceCard
              key={SOURCE_IDS[index]}
              time={jt}
              index={index}
              pose={frontChunkAt(time, index)}
            />
          ))
        : [2, 1, 0].map((index) => (
            <SourceCard
              key={SOURCE_IDS[index]}
              time={jt}
              index={index}
              pose={sourcePoses?.[index]}
            />
          ))}
      <EntityCore time={jt} />
      {[2, 1, 0].map((index) => (
        <EntityToken key={SOURCE_IDS[index]} time={jt} index={index} />
      ))}
      <WikiLeaf time={jt} />
      <div
        className="journey-world-label"
        style={{ left: 425, top: 215, opacity: phase(jt, 3.8, 5.0) }}
      >
        01 <span>SOURCE FRAGMENTS</span>
      </div>
      <div
        className="journey-world-label"
        style={{ left: 1813, top: 449, opacity: phase(jt, 15, 16.8) }}
      >
        02 <span>ENTITY RESOLUTION</span>
      </div>
      <div
        className="journey-world-label"
        style={{ left: 2585, top: 210, opacity: phase(jt, 22, 23.6) }}
      >
        03 <span>GROUNDED KNOWLEDGE</span>
      </div>
      {children}
    </div>
  );
}

export const INGEST_CAPTIONS = [
  { start: 0.4, end: 3.2, text: "从三份原始文档开始。" },
  { start: 3.8, end: 7.6, text: "MinerU 解析，保留文档结构。" },
  { start: 8.3, end: 12.6, text: "标题、段落与表格，成为结构化 Markdown。" },
  { start: 13.2, end: 17.0, text: "按结构，拆成可追溯的切片。" },
  { start: 17.4, end: 24.5, text: "每一片，都带着自己的来处。" },
  { start: 25.2, end: 28.1, text: "从正文中，抽取实体。" },
  { start: 28.4, end: 35.0, text: "不同称谓，汇聚成同一个实体。" },
  { start: 35.3, end: 37.6, text: "保留来源，筛选有证据支撑的实体。" },
  { start: 38.0, end: 43.5, text: "由关联切片，生成可追溯的百科。" },
  { start: 44.0, end: 47.6, text: "知识向前生长，来源始终相连。" },
] as const;

export const KnowledgeJourney = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load journey fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill className="journey" data-journey-time={time}>
      <Audio
        src={staticFile("motion-sound.wav")}
        premountFor={fps}
        volume={0.75}
      />
      <World time={time} />
      <div className="journey-vignette" />
      <div className="journey-hud">
        <span className="journey-brand">
          harness <i>/</i> RAG
        </span>
        <span className="journey-hud-right">THE JOURNEY OF KNOWLEDGE</span>
      </div>
      <div className="journey-captions">
        {INGEST_CAPTIONS.map((caption) => (
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
        <span style={{ width: `${(time / INGEST_DURATION) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};
