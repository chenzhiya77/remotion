import {
  Crosshair,
  Paper,
  Positioned,
  Scene,
  SourceTag,
  TextLines,
  palette,
} from "./visuals";

function SourceFragment({
  number,
  title,
  quote,
  rotate = "0deg",
}: {
  number: string;
  title: string;
  quote: string;
  rotate?: string;
}) {
  return (
    <Paper className="entity-source" style={{ rotate }}>
      <div className="entity-source-heading">
        <span className="mono">{number}</span>
        <SourceTag light>{title}</SourceTag>
      </div>
      <p>{quote}</p>
      <TextLines lengths={[91, 72]} color="#b3bcb4" gap={9} />
    </Paper>
  );
}

function Alias({
  x,
  y,
  label,
  width,
}: {
  x: number;
  y: number;
  label: string;
  width: number;
}) {
  return (
    <Positioned x={x} y={y} width={width} className="alias">
      <span className="alias-dot" />
      <span>{label}</span>
    </Positioned>
  );
}

export const EntityFrame = () => (
  <Scene chapter={2} accent={palette.green}>
    <Positioned x={97} y={169} width={1650}>
      <div className="eyebrow section-kicker" style={{ color: palette.green }}>
        02 / ENTITY RESOLUTION
      </div>
      <h1 className="wide-headline">
        不同的名字。<span style={{ color: palette.green }}> 同一个实体。</span>
      </h1>
    </Positioned>
    <Positioned
      x={103}
      y={362}
      width={540}
      className="scene-description entity-description"
    >
      归一的是称谓，
      <br />
      保留的是每一份证据。
    </Positioned>
    <svg className="scene-svg" viewBox="0 0 1920 1080" fill="none">
      <defs>
        <radialGradient id="entity-aura">
          <stop stopColor="#bfe8a9" stopOpacity="0.16" />
          <stop offset="0.6" stopColor="#7ab58c" stopOpacity="0.06" />
          <stop offset="1" stopColor="#7ab58c" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="entity-path"
          x1="390"
          y1="530"
          x2="1200"
          y2="630"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#78deec" stopOpacity="0.2" />
          <stop offset="1" stopColor="#c8edaa" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <ellipse cx="1130" cy="639" rx="448" ry="353" fill="url(#entity-aura)" />
      <ellipse
        cx="1125"
        cy="644"
        rx="419"
        ry="215"
        transform="rotate(-22 1125 644)"
        stroke="#b8dfa9"
        strokeOpacity="0.16"
      />
      <ellipse
        cx="1125"
        cy="644"
        rx="467"
        ry="246"
        transform="rotate(-22 1125 644)"
        stroke="#b8dfa9"
        strokeOpacity="0.065"
      />
      <path
        d="M416 583 C500 587 502 504 621 511 C842 524 883 554 965 597"
        stroke="url(#entity-path)"
        strokeWidth="1.6"
      />
      <path
        d="M696 842 C711 813 785 783 833 784 C934 785 996 758 1035 711"
        stroke="url(#entity-path)"
        strokeWidth="1.6"
      />
      <path
        d="M1514 737 C1495 639 1495 507 1511 446 C1485 401 1341 451 1240 550"
        stroke="#b8dfa9"
        strokeOpacity="0.65"
        strokeWidth="1.6"
      />
      <path
        d="M1072 829 C1264 864 1469 809 1514 737"
        stroke="#78deec"
        strokeOpacity="0.25"
        strokeDasharray="3 9"
      />
      <circle cx="892" cy="565" r="5" fill="#c8edaa" />
      <circle cx="962" cy="758" r="4" fill="#c8edaa" />
      <circle cx="1369" cy="451" r="4" fill="#c8edaa" />
      <Crosshair x={838} y={422} />
      <Crosshair x={1434} y={809} />
      <Crosshair x={754} y={828} />
    </svg>
    <Positioned x={104} y={517} width={319}>
      <SourceFragment
        number="001"
        title="网关设计说明.pdf"
        quote="星舟网关统一管理服务接入。"
        rotate="-7deg"
      />
    </Positioned>
    <Positioned x={401} y={770} width={323}>
      <SourceFragment
        number="014"
        title="故障处理手册.pdf"
        quote="SS Gateway 执行失败重试。"
        rotate="4deg"
      />
    </Positioned>
    <Positioned x={1489} y={664} width={324}>
      <SourceFragment
        number="008"
        title="服务接入规范.pdf"
        quote="通过 Starship Gateway 转发请求。"
        rotate="7deg"
      />
    </Positioned>
    <Alias x={516} y={478} label="星舟网关" width={230} />
    <Alias x={752} y={751} label="SS Gateway" width={245} />
    <Alias x={1381} y={407} label="Starship Gateway" width={347} />
    <Positioned x={919} y={446} width={375}>
      <div className="entity-lens">
        <div className="lens-edge" />
        <div className="lens-caustic" />
        <svg
          className="lens-symbol"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
        >
          <path
            d="M32 5 L55 18 V45 L32 58 L9 45 V18 Z M9 18 L32 32 L55 18 M32 32 V58"
            stroke="#c7edb3"
            strokeWidth="1.6"
          />
          <circle cx="32" cy="5" r="3" fill="#c7edb3" />
          <circle cx="9" cy="45" r="3" fill="#c7edb3" />
          <circle cx="55" cy="45" r="3" fill="#c7edb3" />
        </svg>
        <span className="eyebrow lens-eyebrow">CANONICAL ENTITY</span>
        <h2>星舟网关</h2>
        <div className="lens-rule" />
        <div className="lens-sources">
          <span>3</span> 份来源 · 同一知识对象
        </div>
      </div>
    </Positioned>
    <Positioned x={930} y={864} width={440} style={{ textAlign: "center" }}>
      <div className="resolution-caption">
        <span className="resolution-marker" />
        稠密向量匹配 <span className="process-arrow">→</span> 实体归一
      </div>
    </Positioned>
  </Scene>
);
