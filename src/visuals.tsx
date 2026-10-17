import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/600.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource-variable/manrope";
import "./style.css";

export const palette = {
  cyan: "#78deec",
  green: "#afe1a7",
  violet: "#c0a8f2",
  white: "#f4f1e9",
  muted: "#91a29e",
};

export function Positioned({
  x,
  y,
  width,
  style,
  children,
  className,
}: {
  x: number;
  y: number;
  width?: number;
  style?: CSSProperties;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ position: "absolute", left: x, top: y, width, ...style }}
    >
      {children}
    </div>
  );
}

export function Scene({
  chapter,
  accent,
  children,
}: {
  chapter: 1 | 2 | 3;
  accent: string;
  children: ReactNode;
}) {
  const [handle] = useState(() => delayRender("Load local typefaces"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill className={`scene scene-${chapter}`}>
      <div
        className="backlight"
        style={{
          background: `radial-gradient(ellipse, ${accent}14, transparent 66%)`,
        }}
      />
      <svg className="atmosphere" viewBox="0 0 1920 1080" fill="none">
        <defs>
          <radialGradient id={`floor-${chapter}`}>
            <stop stopColor={accent} stopOpacity="0.08" />
            <stop offset="1" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.83"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <ellipse
          cx="1270"
          cy="909"
          rx="770"
          ry="150"
          fill={`url(#floor-${chapter})`}
        />
        <path
          d="M620 1080 Q1250 810 1920 945"
          stroke={accent}
          strokeOpacity="0.08"
        />
        <path
          d="M550 1080 Q1250 840 1920 970"
          stroke={accent}
          strokeOpacity="0.05"
        />
        <rect width="1920" height="1080" filter="url(#grain)" opacity="0.028" />
      </svg>
      <Positioned x={94} y={65} className="brand">
        <svg width="34" height="36" viewBox="0 0 34 36" fill="none">
          <path
            d="M3 6 L16 1 L30 6 L17 11 Z M3 16 L17 22 L30 16 M3 27 L17 33 L30 27"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          harness <span className="brand-divider">/</span> RAG
        </span>
      </Positioned>
      <Positioned
        x={1293}
        y={76}
        className="eyebrow"
        style={{ color: "#a0aca8", textAlign: "right", width: 531 }}
      >
        THE JOURNEY OF KNOWLEDGE <span className="header-dot" />{" "}
        {String(chapter).padStart(2, "0")}
      </Positioned>
      {children}
      <div className="frame-footer">
        <span className="eyebrow">KNOWLEDGE, CONNECTED.</span>
        <div className="chapter-progress">
          {(["结构切片", "实体归一", "百科生成"] as const).map((label, i) => (
            <div
              key={label}
              className={i + 1 === chapter ? "chapter active" : "chapter"}
              style={i + 1 === chapter ? { color: accent } : undefined}
            >
              <span className="chapter-number">0{i + 1}</span>
              <span>{label}</span>
              <span className="chapter-rule" />
            </div>
          ))}
        </div>
        <span className="demo-label">机制示意 · 演示数据</span>
      </div>
    </AbsoluteFill>
  );
}

export function Headline({
  kicker,
  first,
  second,
  accent,
  y = 235,
}: {
  kicker: string;
  first: string;
  second: string;
  accent: string;
  y?: number;
}) {
  return (
    <Positioned x={96} y={y} width={770}>
      <div className="eyebrow section-kicker" style={{ color: accent }}>
        {kicker}
      </div>
      <h1>
        {first}
        <br />
        <span style={{ color: accent }}>{second}</span>
      </h1>
    </Positioned>
  );
}

export function SourceTag({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <span className={light ? "source-tag light" : "source-tag"}>
      <span className="source-square" />
      {children}
    </span>
  );
}

export function TextLines({
  lengths = [100, 87, 94, 65],
  color = "#bfc4c0",
  gap = 12,
}: {
  lengths?: number[];
  color?: string;
  gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {lengths.map((width, i) => (
        <div
          key={i}
          style={{
            width: `${width}%`,
            height: 4,
            borderRadius: 2,
            background: color,
            opacity: i === 3 ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
}

export function Paper({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`paper ${className}`} style={style}>
      {children}
      <div className="paper-grain" />
    </div>
  );
}

export function Crosshair({
  x,
  y,
  color = "#738781",
}: {
  x: number;
  y: number;
  color?: string;
}) {
  return (
    <g stroke={color} strokeWidth="1">
      <path d={`M${x - 5} ${y}h10 M${x} ${y - 5}v10`} />
    </g>
  );
}
