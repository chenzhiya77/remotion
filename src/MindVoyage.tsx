import { useEffect, useState, type CSSProperties } from "react";
import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { mix, phase, progress } from "./journey-motion";
import "./visuals";
import {
  FOREST,
  OCEAN_PAGES,
  OCEAN_SURFACE,
  PALETTE,
  QUESTION,
  STAR_HITS,
  bloomAt,
  branchAt,
  evidenceAt,
  mindCameraAt,
  nebulaHitAt,
  oceanPageAt,
  portalAt,
  questionCoreAt,
  questionScreenAt,
  stageAt,
  starAt,
  windowGrowth,
} from "./mind-voyage-motion";
import "./mind-voyage.css";

function ConversationFigure({ time, agent }: { time: number; agent: boolean }) {
  const stage = stageAt(time);
  const x = agent ? stage.agentX : stage.userX;
  const thinking = phase(time, 4.4, 5.8) * (1 - phase(time, 35.0, 36.0));
  const reply = phase(time, 36.3, 37.5);
  const headTilt = agent
    ? -thinking * 7 + Math.sin(time * 2.6) * 1.3 * reply
    : Math.sin(time * 2.2) * (1 - phase(time, 2.8, 3.2)) * 2 - thinking * 5;
  const id = agent ? "harness" : "user";
  return (
    <div
      className="mv-person"
      data-mv-figure={id}
      style={{
        left: x - 110,
        top: stage.floorY - 280,
        scale: `${stage.scale}`,
      }}
    >
      <svg width="220" height="280" viewBox="0 0 220 280" fill="none">
        <defs>
          <linearGradient
            id={`mv-body-${id}`}
            x1="45"
            y1="100"
            x2="178"
            y2="264"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={agent ? "#e3edc8" : "#f5f2e7"} />
            <stop offset="0.5" stopColor={agent ? "#aac690" : "#c4d3cb"} />
            <stop offset="1" stopColor={agent ? "#527b60" : "#5f807e"} />
          </linearGradient>
          <radialGradient id={`mv-head-${id}`} cx="0.35" cy="0.25" r="0.9">
            <stop stopColor={agent ? "#f2f3d7" : "#fff9ec"} />
            <stop offset="0.62" stopColor={agent ? "#c8dda8" : "#d5e2d8"} />
            <stop offset="1" stopColor={agent ? "#709774" : "#819d95"} />
          </radialGradient>
        </defs>
        <ellipse cx="110" cy="268" rx="70" ry="11" fill="#000" opacity="0.4" />
        <g transform={agent ? "translate(220 0) scale(-1 1)" : undefined}>
          <path
            d="M98 111 C61 109 51 145 51 185 L48 259 Q104 273 158 256 L153 181 C150 142 131 115 98 111 Z"
            fill={`url(#mv-body-${id})`}
          />
          <path
            d="M63 173 C65 139 78 122 96 121"
            stroke="#fffce5"
            strokeOpacity="0.22"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M127 147 Q150 166 159 190 L188 178"
            stroke={agent ? "#b0ca98" : "#d0ddd2"}
            strokeWidth="20"
            strokeLinecap="round"
            style={{
              transformOrigin: "127px 147px",
              rotate: `${Math.sin(time * 1.4) * 3 * (agent ? reply : 1 - reply)}deg`,
            }}
          />
          <g transform={`rotate(${headTilt} 109 107)`}>
            {agent && (
              <>
                <path
                  d="M75 64 Q59 44 65 19 M65 32 L44 20 M66 44 L45 39 M111 53 Q127 34 123 12 M124 27 L143 16 M122 39 L144 34"
                  stroke="#ccdda8"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M61 73 Q36 48 28 64 Q31 82 65 83 Z" fill="#a5c08d" />
              </>
            )}
            <path
              d="M74 52 C94 32 128 36 141 58 C147 69 149 75 162 83 Q168 89 153 94 Q151 118 130 122 L120 137 L86 130 L86 116 C57 102 54 72 74 52 Z"
              fill={`url(#mv-head-${id})`}
            />
            <ellipse
              cx="88"
              cy="57"
              rx="14"
              ry="8"
              fill="#fffde9"
              opacity="0.25"
            />
            <path
              d="M129 72 q8 4 12 -1"
              stroke="#3c6060"
              strokeWidth="3.3"
              strokeLinecap="round"
            />
            <path
              d="M139 105 q8 3 12 -3"
              stroke="#50695e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {agent && (
              <ellipse
                cx="140"
                cy="93"
                rx="8"
                ry="5"
                fill="#d8a893"
                opacity="0.38"
              />
            )}
          </g>
        </g>
      </svg>
      <span>{agent ? "harness" : "用户"}</span>
    </div>
  );
}

function Nebula({ time }: { time: number }) {
  return (
    <>
      <div className="mv-nebula-haze" />
      <div
        className="mv-nebula-haze"
        style={{ rotate: "-17deg", scale: "0.76 0.6", opacity: 0.6 }}
      />
      <svg
        className="mv-space"
        width="2600"
        height="1800"
        viewBox="0 0 2600 1800"
        fill="none"
      >
        <defs>
          <radialGradient id="mv-star-glow">
            <stop stopColor="#d5f7f3" stopOpacity="0.6" />
            <stop offset="1" stopColor="#7ccedb" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((ring) => (
          <ellipse
            key={ring}
            cx="1010"
            cy="790"
            rx={240 + ring * 100}
            ry={85 + ring * 45}
            stroke="#8dc9dc"
            strokeOpacity={0.03 + ring * 0.008}
            transform={`rotate(${12 + Math.sin(time * 0.08) * 2} 1010 790)`}
          />
        ))}
        {Array.from({ length: 320 }, (_, index) => {
          const star = starAt(time, index);
          const selected = STAR_HITS.indexOf(index as 18 | 63);
          const hit =
            selected < 0
              ? 0
              : phase(time, 11.1 + selected * 1.25, 11.8 + selected * 1.25);
          return (
            <g key={index} opacity={star.alpha + hit * 0.15}>
              <circle
                cx={star.x}
                cy={star.y}
                r={star.radius * (3.5 + hit * 3)}
                fill="url(#mv-star-glow)"
              />
              <circle
                cx={star.x}
                cy={star.y}
                r={star.radius * (1 + hit * 1.5)}
                fill={index % 9 === 0 ? "#d5d6f3" : "#b6e7e8"}
              />
            </g>
          );
        })}
        {Array.from({ length: 80 }, (_, i) => {
          const x = 170 + ((i * 137) % 2110);
          const y = 100 + ((i * 83) % 1380);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={0.8 + (i % 3) * 0.5}
              fill="#9aaec4"
              opacity="0.18"
            />
          );
        })}
        {[0, 1].map((index) => {
          const hit = nebulaHitAt(time, index);
          const pulse = progress(
            time,
            11.1 + index * 1.25,
            12.4 + index * 1.25,
          );
          return (
            <g key={index}>
              <circle
                cx={hit.starX}
                cy={hit.starY}
                r={15 + pulse * 60}
                stroke="#a6e9e9"
                opacity={Math.sin(Math.PI * pulse) * 0.6}
              />
              <path
                d={`M${hit.starX} ${hit.starY} Q${hit.x - 130} ${hit.y + 150} ${hit.x - 185} ${hit.y + 85}`}
                stroke="#a9e9e4"
                opacity={hit.alpha * 0.35}
              />
            </g>
          );
        })}
      </svg>
      <div className="mv-section-label" style={{ left: 285, top: 260 }}>
        <small>01 / HYBRID SEARCH</small>
        <strong>切片星云</strong>
        <p>关键词与语义，找到相关原文。</p>
      </div>
      {[0, 1].map((index) => {
        const hit = nebulaHitAt(time, index);
        return (
          <div
            key={index}
            data-mv-fragment={index === 0 ? "001" : "014"}
            className="mv-fragment"
            style={{
              left: hit.x - 238,
              top: hit.y - 110,
              opacity: hit.alpha,
              transform: `perspective(1100px) rotateY(${mix(-45, 0, hit.unfold)}deg) rotate(${index ? 3 : -3}deg) scale(${mix(0.08, 1, hit.unfold)})`,
            }}
          >
            <small>原文切片 · {index === 0 ? "001" : "014"}</small>
            <p>
              {index === 0 ? (
                <>
                  统一管理服务接入，
                  <br />
                  连接业务服务。
                </>
              ) : (
                <>
                  请求失败时，
                  <br />
                  按配置执行有界重试。
                </>
              )}
            </p>
            <footer>
              <span>{index === 0 ? "网关设计说明" : "故障处理手册"}</span>
              <span>[{index + 1}]</span>
            </footer>
          </div>
        );
      })}
    </>
  );
}

function EntityForest({ time }: { time: number }) {
  const born = phase(time, 16.8, 18.4);
  const root = { x: 1020, y: 2740 };
  return (
    <>
      <svg
        className="mv-space"
        width="2600"
        height="3300"
        viewBox="0 0 2600 3300"
        fill="none"
      >
        <defs>
          <linearGradient
            id="mv-branch"
            x1="600"
            y1="2720"
            x2="1300"
            y2="1750"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#46715e" />
            <stop offset="0.55" stopColor="#afcc89" />
            <stop offset="1" stopColor="#d0dfaa" />
          </linearGradient>
          <radialGradient id="mv-flower">
            <stop stopColor="#fff2b9" />
            <stop offset="0.5" stopColor="#dbe9a2" />
            <stop offset="1" stopColor="#78ae6d" />
          </radialGradient>
        </defs>
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M${150 + i * 340} 2840 Q${90 + i * 340} 2570 ${210 + i * 290} 2270 M${140 + i * 340} 2600 Q${20 + i * 340} 2460 ${20 + i * 340} 2260 M${170 + i * 340} 2570 Q${300 + i * 340} 2450 ${320 + i * 340} 2230`}
            stroke="#729b7638"
            strokeWidth="2"
          />
        ))}
        <ellipse
          cx="1050"
          cy="2780"
          rx="800"
          ry="120"
          fill="#7cab6f"
          opacity="0.025"
        />
        <path
          d={`M${root.x} ${root.y} Q870 2510 980 2300`}
          stroke="#b6d38c"
          strokeWidth="18"
          opacity="0.03"
        />
        <path
          d={`M${root.x} ${root.y} Q870 2510 980 2300`}
          stroke="url(#mv-branch)"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - born}
        />
        {FOREST.map((node, index) => {
          const parent = node.parent === -1 ? root : FOREST[node.parent];
          const growth = branchAt(time, index);
          const flower = bloomAt(time, index);
          const controlX = mix(parent.x, node.x, 0.72);
          const controlY = parent.y - 45;
          const remaining = 1 - growth;
          const pulseX =
            remaining ** 2 * parent.x +
            2 * remaining * growth * controlX +
            growth ** 2 * node.x;
          const pulseY =
            remaining ** 2 * parent.y +
            2 * remaining * growth * controlY +
            growth ** 2 * node.y;
          return (
            <g key={node.label}>
              {index > 0 && (
                <>
                  <path
                    d={`M${parent.x} ${parent.y} Q${controlX} ${controlY} ${node.x} ${node.y}`}
                    stroke="#b4dc92"
                    strokeWidth="2"
                    opacity="0.12"
                  />
                  <circle
                    data-mv-propagation={node.label}
                    cx={pulseX}
                    cy={pulseY}
                    r="6"
                    fill="#e4f3bb"
                    opacity={Math.sin(Math.PI * growth) * 0.85}
                  />
                  <path
                    d={`M${parent.x} ${parent.y} Q${controlX} ${controlY} ${node.x} ${node.y}`}
                    stroke="url(#mv-branch)"
                    strokeWidth={index < 3 ? 7 : 3.5}
                    strokeLinecap="round"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset={1 - growth}
                  />
                </>
              )}
              {[0, 1].map((leaf) => {
                const p = 0.47 + leaf * 0.18;
                const x = mix(parent.x, node.x, p);
                const y = mix(parent.y, node.y, p) + 24;
                return (
                  <ellipse
                    key={leaf}
                    cx={x}
                    cy={y}
                    rx={27 * growth}
                    ry={8 * growth}
                    fill="#9bc77e"
                    opacity={0.36 * growth}
                    transform={`rotate(${index % 2 ? -35 : 35} ${x} ${y})`}
                  />
                );
              })}
              <g
                transform={`translate(${node.x} ${node.y})`}
                opacity={
                  0.16 +
                  0.84 * phase(time, 17.55 + index * 0.29, 18.5 + index * 0.29)
                }
              >
                {index < 3 &&
                  [0, 1, 2, 3, 4, 5].map((petal) => (
                    <ellipse
                      key={petal}
                      cx="0"
                      cy={-24 * flower}
                      rx={12 * flower}
                      ry={27 * flower}
                      fill="url(#mv-flower)"
                      opacity={0.85 * flower}
                      transform={`rotate(${petal * 60})`}
                    />
                  ))}
                <circle
                  r={node.r}
                  fill="#132e23"
                  stroke="#abc991"
                  strokeWidth="1.8"
                />
                <circle
                  r={node.r * 0.48}
                  fill={index < 3 ? "#d2e8a2" : "#78936f"}
                  opacity={0.5 + flower * 0.5}
                />
                <text
                  y={index < 3 ? -76 : -node.r - 16}
                  textAnchor="middle"
                  className="mv-entity-name"
                  style={{
                    fontSize: index < 3 ? 32 : 22,
                    opacity: index < 3 ? 1 : 0.5,
                  }}
                >
                  {node.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <div
        className="mv-section-label"
        style={{ left: 330, top: 1550, color: "#c2d5aa" }}
      >
        <small>02 / GRAPH SEARCH</small>
        <strong>实体森林</strong>
        <p>从一个实体，触及相关知识。</p>
      </div>
      <div
        data-mv-graph-evidence
        className="mv-fragment mv-forest-card"
        style={{
          left: 1140,
          top: 2460,
          opacity: phase(time, 20.25, 21.1),
          transform: `translateY(${mix(45, 0, phase(time, 20.25, 21.1))}px) rotate(-3deg) scale(${mix(0.65, 1, phase(time, 20.25, 21.1))})`,
        }}
      >
        <small>关联切片 · 008</small>
        <p>
          星舟网关连接
          <br />
          支付与结算服务。
        </p>
        <footer>
          <span>服务接入规范</span>
          <span>[3]</span>
        </footer>
      </div>
    </>
  );
}

function WikiOcean({ time }: { time: number }) {
  const entry = progress(time, 23.8, 25.3);
  return (
    <>
      <div className="mv-ocean" />
      {[400, 1120, 1780].map((x) => (
        <div key={x} className="mv-ocean-beam" style={{ left: x }} />
      ))}
      <svg
        className="mv-space"
        width="2600"
        height="5100"
        viewBox="0 0 2600 5100"
        fill="none"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const y = OCEAN_SURFACE + i * 11;
          return (
            <path
              key={i}
              d={`M-400 ${y} C200 ${y - 35 - Math.sin(time * 0.6) * 12} 500 ${y + 28} 1000 ${y} S1900 ${y - 40} 2700 ${y + 5}`}
              stroke="#a7e7e5"
              strokeOpacity={0.21 - i * 0.014}
              strokeWidth={i === 0 ? 2.5 : 1}
            />
          );
        })}
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx="1020"
            cy={OCEAN_SURFACE + 25}
            rx={80 + entry * (210 + i * 90)}
            ry={(80 + entry * (210 + i * 90)) * 0.23}
            stroke="#bafaf3"
            strokeWidth="2"
            opacity={Math.sin(Math.PI * entry) * (0.45 - i * 0.1)}
          />
        ))}
        {OCEAN_PAGES.map((page, index) => {
          const pose = oceanPageAt(time, index);
          const bottom = { x: 620 + index * 420, y: 4640 };
          return (
            <g key={page.title} opacity={pose.hit * 0.35}>
              <path
                d={`M${pose.x} ${pose.y + 137} C${pose.x - 60} ${pose.y + 350} ${bottom.x + 30} 4460 ${bottom.x} ${bottom.y}`}
                stroke="#aec8e3"
                strokeWidth="1.2"
                strokeDasharray="3 9"
              />
              <circle cx={bottom.x} cy={bottom.y} r="5" fill="#d0dfeb" />
              <text
                x={bottom.x}
                y={bottom.y + 38}
                fill="#92b4c4"
                textAnchor="middle"
                fontSize="21"
              >
                {["001", "014", "008"][index]}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M100 ${4645 + i * 12} Q950 ${4590 + i * 13} 2110 ${4650 + i * 15}`}
            stroke="#7595ae"
            strokeOpacity={0.13 - i * 0.015}
          />
        ))}
        {Array.from({ length: 40 }, (_, i) => {
          const x = 100 + ((i * 173) % 2100);
          const y = 3460 + ((i * 193 + time * 5) % 1220);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.3 + (i % 3) * 0.5}
              stroke="#b9dbe8"
              strokeWidth="0.8"
              opacity="0.16"
            />
          );
        })}
      </svg>
      <div
        className="mv-section-label"
        style={{ left: 460, top: 3040, color: "#c1d2e1" }}
      >
        <small>03 / WIKI SEARCH</small>
        <strong>百科之海</strong>
        <p>潜入归纳后的知识，带回有来源的摘要。</p>
      </div>
      {OCEAN_PAGES.map((page, index) => {
        const pose = oceanPageAt(time, index);
        return (
          <div
            key={page.title}
            className="mv-wiki-page"
            data-mv-wiki-page={index}
            style={{
              left: pose.x - 305,
              top: pose.y - 137,
              transform: `perspective(1600px) rotateY(${pose.yaw}deg) rotateX(${pose.pitch}deg) rotateZ(${index % 2 ? -4 : 3}deg)`,
              borderColor: `rgba(207,222,248,${0.35 + pose.hit * 0.5})`,
            }}
          >
            <header>
              <b>W.</b>
              <span>生成百科 · 星舟网关</span>
            </header>
            <h3>{page.title}</h3>
            <small>{page.subtitle}</small>
            <p
              style={{
                background: `rgba(170,159,219,${pose.hit * 0.17})`,
                clipPath: `inset(0 ${100 * (1 - phase(time, page.hit, page.hit + 0.85))}% 0 0)`,
              }}
            >
              {page.text}
            </p>
            <footer>来源切片 · 001 / 014 / 008</footer>
          </div>
        );
      })}
    </>
  );
}

function RetrievedEvidence({ time }: { time: number }) {
  return (
    <>
      {[0, 1, 2].map((index) => {
        const p = evidenceAt(time, index);
        return (
          <div
            key={index}
            className="mv-pearl"
            data-mv-evidence={index}
            style={
              {
                left: p.x - 15,
                top: p.y - 15,
                opacity: p.alpha,
                scale: `${p.scale}`,
                "--pearl-color": PALETTE[index],
              } as CSSProperties
            }
          >
            <span className="mv-evidence-label">
              {["[1][2]", "[3]", "[4]"][index]}
            </span>
          </div>
        );
      })}
    </>
  );
}

function InnerWorld({ time }: { time: number }) {
  const portal = portalAt(time);
  const camera = mindCameraAt(time);
  const glow = questionCoreAt(time);
  return (
    <div
      className="mv-inner"
      style={{
        transform: `scale(${portal.w / 1920},${portal.h / 1080})`,
        opacity: phase(time, 6.3, 8.4) * (1 - phase(time, 35.05, 36.0)),
      }}
    >
      <div
        className="mv-landscape"
        data-mv-camera-y={camera.y}
        style={{
          transform: `translate(960px,540px) rotate(${camera.roll}deg) scale(${camera.zoom}) translate(${-camera.x}px,${-camera.y}px)`,
        }}
      >
        <div className="mv-world-atmosphere" />
        <Nebula time={time} />
        <EntityForest time={time} />
        <WikiOcean time={time} />
        <div
          style={{
            position: "absolute",
            left: glow.x - 260,
            top: glow.y - 260,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, #d8f0bf0a, transparent 65%)",
          }}
        />
        <RetrievedEvidence time={time} />
      </div>
      <div className="mv-vignette" />
    </div>
  );
}

const CAPTIONS: Caption[] = [
  {
    text: "一个问题，交给 harness。",
    startMs: 900,
    endMs: 3800,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "跟着问题，进入它的思考世界。",
    startMs: 5800,
    endMs: 9400,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "切片如星，命中后展开原文。",
    startMs: 10400,
    endMs: 14300,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "沿关系生长，在命中实体处开花。",
    startMs: 17400,
    endMs: 21200,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "花旁带回的，仍是有来源的切片。",
    startMs: 21300,
    endMs: 23400,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "再向深处，找到百科中的归纳与支撑。",
    startMs: 25200,
    endMs: 29000,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "三路证据，让思考落成答案。",
    startMs: 30900,
    endMs: 34800,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "回到对话，回答有据可循。",
    startMs: 37000,
    endMs: 39800,
    timestampMs: null,
    confidence: null,
  },
];

export const MindVoyage = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const [handle] = useState(() => delayRender("Load mind-voyage fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  const portal = portalAt(time);
  const stage = stageAt(time);
  const grow = windowGrowth(time);
  const transfer = phase(time, 3.2, 4.45);
  const question = questionScreenAt(time);
  const bubbleAlpha = phase(time, 0.6, 1.25) * (1 - phase(time, 3.5, 4.3));
  return (
    <AbsoluteFill className="mv" data-mind-voyage-time={time}>
      <Audio
        src={staticFile("mind-voyage-sound.wav")}
        premountFor={fps}
        volume={0.8}
      />
      <div className="mv-stage-light" />
      <div
        className="mv-floor"
        style={{
          left: mix(210, -420, grow),
          top: stage.floorY - 27,
          scale: `${mix(1, 0.75, grow)}`,
        }}
      />
      <ConversationFigure time={time} agent={false} />
      <ConversationFigure time={time} agent />
      <div
        className="mv-question"
        data-mv-user-question
        style={{
          left: mix(350, 985, transfer),
          top: mix(225, 250, transfer) - Math.sin(Math.PI * transfer) * 90,
          opacity: bubbleAlpha,
          scale: `${mix(1, 0.1, transfer)}`,
        }}
      >
        <small>用户的问题</small>
        <p>{QUESTION}</p>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="mv-portal-tail"
          style={{
            left: mix(1277 + i * 18, 492 + i * 29, grow),
            top: mix(493 - i * 30, 666 - i * 29, grow),
            width: 9 + i * 8,
            height: 9 + i * 8,
            opacity: phase(time, 4.4, 4.8),
          }}
        />
      ))}
      {[0, 1].map((i) => {
        const t = time < 20 ? time - i * 0.12 - 0.18 : time + i * 0.12 + 0.18;
        const r = portalAt(t);
        const amount = Math.sin(Math.PI * grow);
        return (
          <div
            key={i}
            className="mv-window-echo"
            style={{
              left: r.x - i * 7,
              top: r.y - i * 6,
              width: r.w + i * 14,
              height: r.h + i * 12,
              borderRadius: r.radius,
              opacity: amount * (0.34 - i * 0.1),
            }}
          />
        );
      })}
      <div
        className="mv-portal"
        data-mv-portal
        style={{
          left: portal.x,
          top: portal.y,
          width: portal.w,
          height: portal.h,
          borderRadius: portal.radius,
          opacity: phase(time, 4.4, 4.95),
        }}
      >
        <InnerWorld time={time} />
        <div
          className="mv-thinking"
          style={{ opacity: phase(time, 4.5, 5) * (1 - phase(time, 6.3, 7.3)) }}
        >
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              style={{
                translate: `0 ${Math.sin(time * 3 - i) * 5}px`,
                opacity: 0.45 + Math.sin(time * 3 - i) * 0.3,
              }}
            />
          ))}
        </div>
        <div
          className="mv-answer"
          data-mv-answer
          style={{ opacity: phase(time, 35.9, 36.5) }}
        >
          <header>
            <span>harness</span>
            <span>基于三路检索证据</span>
          </header>
          <p
            style={{
              clipPath: `inset(0 ${100 * (1 - phase(time, 36.25, 37.1))}% 0 0)`,
            }}
          >
            网关连接支付与结算服务，统一接入与转发。<sup>[1][3]</sup>
          </p>
          <p
            style={{
              clipPath: `inset(0 ${100 * (1 - phase(time, 37.1, 38.0))}% 0 0)`,
            }}
          >
            失败后执行有界重试，相关机制可见百科归纳。<sup>[2][4]</sup>
          </p>
        </div>
        <div className="mv-portal-rim" />
      </div>
      {Array.from({ length: 12 }, (_, i) => {
        const p = questionScreenAt(Math.max(0, time - i * 0.032));
        return (
          <i
            key={i}
            className="mv-core-trail"
            style={{
              left: p.x - 3,
              top: p.y - 3,
              opacity: p.alpha * (1 - i / 12) * 0.24,
            }}
          />
        );
      })}
      <div
        className="mv-core"
        data-mv-question-core
        style={{
          left: question.x - 14,
          top: question.y - 14,
          opacity: question.alpha,
        }}
      >
        <div
          className="mv-core-halo"
          style={{ scale: `${1 + Math.sin(time * 2.2) * 0.08}` }}
        />
      </div>
      <div className="mv-head">
        <span>harness / RAG</span>
        <small>ONE QUESTION · A WORLD OF KNOWLEDGE</small>
      </div>
      <div className="mv-caption">
        {CAPTIONS.map((caption) => {
          const start = caption.startMs / 1000;
          const end = caption.endMs / 1000;
          return (
            <div
              key={start}
              style={{
                opacity:
                  phase(time, start, start + 0.35) *
                  (1 - phase(time, end - 0.25, end)),
              }}
            >
              {caption.text}
            </div>
          );
        })}
      </div>
      <div className="mv-note">机制意象演示 · 非实时耗时</div>
    </AbsoluteFill>
  );
};
