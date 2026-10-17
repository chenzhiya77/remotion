import {
  Crosshair,
  Headline,
  Paper,
  Positioned,
  Scene,
  SourceTag,
  TextLines,
  palette,
} from "./visuals";

function Material({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="wiki-material">
      <div className="material-heading">
        <span className="mono">{number}</span>
        <span>{title}</span>
      </div>
      <p>{text}</p>
      <TextLines lengths={[88, 63]} color="#415456" gap={9} />
    </div>
  );
}

export const WikiFrame = () => (
  <Scene chapter={3} accent={palette.violet}>
    <Headline
      kicker="03 / GROUNDED WIKI GENERATION"
      first="让零散证据，"
      second="长成知识。"
      accent={palette.violet}
      y={221}
    />
    <Positioned x={103} y={533} width={610} className="scene-description">
      围绕同一实体，组织关联切片。
      <br />
      生成百科，也留下来处。
    </Positioned>
    <Positioned x={104} y={730} width={482}>
      <div className="wiki-statement">
        <span className="statement-line" />
        <span>
          先有证据。
          <br />
          <strong>再有知识。</strong>
        </span>
      </div>
    </Positioned>
    <svg className="scene-svg" viewBox="0 0 1920 1080" fill="none">
      <defs>
        <linearGradient
          id="wiki-thread"
          x1="854"
          y1="526"
          x2="1290"
          y2="526"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#78deec" stopOpacity="0.3" />
          <stop offset="0.45" stopColor="#bce4ad" />
          <stop offset="1" stopColor="#c0a8f2" />
        </linearGradient>
        <radialGradient id="wiki-pool">
          <stop stopColor="#c0a8f2" stopOpacity="0.13" />
          <stop offset="1" stopColor="#c0a8f2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="1420" cy="605" rx="507" ry="450" fill="url(#wiki-pool)" />
      <path
        d="M941 341 C1029 346 973 494 1022 528 M898 531 H1022 M939 748 C1034 739 982 577 1022 550"
        stroke="url(#wiki-thread)"
        strokeWidth="1.4"
      />
      <path
        d="M1099 541 C1141 541 1154 501 1222 501"
        stroke="url(#wiki-thread)"
        strokeWidth="2"
      />
      <path
        d="M817 252 C1048 85 1642 137 1794 447 C1901 666 1742 886 1516 919"
        stroke="#c0a8f2"
        strokeOpacity="0.12"
      />
      <path
        d="M807 263 C1046 104 1632 160 1775 454"
        stroke="#c0a8f2"
        strokeOpacity="0.06"
      />
      <Crosshair x={993} y={184} color="#998eb2" />
      <Crosshair x={1794} y={448} color="#998eb2" />
      <circle cx="996" cy="444" r="4" fill="#afd5c2" />
      <circle cx="980" cy="679" r="4" fill="#afd5c2" />
      <circle cx="1157" cy="516" r="4" fill="#c0a8f2" />
    </svg>
    <Positioned x={701} y={267} width={277} style={{ rotate: "-8deg" }}>
      <Material
        number="001"
        title="服务概览"
        text="星舟网关统一管理服务接入。"
      />
    </Positioned>
    <Positioned x={650} y={456} width={277} style={{ rotate: "-3deg" }}>
      <Material
        number="014"
        title="重试策略"
        text="请求失败后，执行有界重试。"
      />
    </Positioned>
    <Positioned x={701} y={665} width={277} style={{ rotate: "5deg" }}>
      <Material
        number="008"
        title="依赖关系"
        text="支付服务经网关访问结算服务。"
      />
    </Positioned>
    <Positioned x={995} y={477} width={133}>
      <div className="qualification-seal">
        <svg width="43" height="43" viewBox="0 0 43 43" fill="none">
          <path
            d="M21.5 3 L37 12 V30 L21.5 39 L6 30 V12 Z"
            stroke="#b8e0a8"
            strokeWidth="1.3"
          />
          <path
            d="M14 21 L20 27 L29 15"
            stroke="#b8e0a8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Positioned>
    <Positioned x={962} y={625} width={192} className="qualification-caption">
      <strong>通过资格筛选</strong>
      <span>有效实体 · 多切片支撑</span>
    </Positioned>
    <Positioned x={1175} y={190} width={601} style={{ rotate: "4deg" }}>
      <Paper className="wiki-page">
        <div className="wiki-page-top">
          <span className="wiki-wordmark">
            W<span className="wiki-wordmark-dot">.</span>
          </span>
          <span className="eyebrow">A LIVING KNOWLEDGE BASE</span>
          <span className="page-corner">↗</span>
        </div>
        <div className="wiki-page-classification">
          <span className="wiki-category-dot" />
          系统架构 <span>/</span> 知识条目
        </div>
        <h2>星舟网关</h2>
        <div className="wiki-page-english">Starship Gateway</div>
        <p className="wiki-lead">
          统一连接服务，
          <br />
          让请求在清晰的边界内流转。
        </p>
        <div className="wiki-content-divider" />
        <section className="wiki-article-section">
          <span className="wiki-section-no">01</span>
          <div>
            <h3>服务与接入</h3>
            <p>
              统一管理服务接入，并承担请求转发。<sup>[1]</sup>
            </p>
          </div>
        </section>
        <section className="wiki-article-section">
          <span className="wiki-section-no">02</span>
          <div>
            <h3>重试与恢复</h3>
            <p>
              请求失败时，执行有界重试。<sup>[2]</sup>
            </p>
          </div>
        </section>
        <div className="wiki-source-block">
          <div className="wiki-source-title">
            来源切片 <span>3 SOURCE CHUNKS</span>
          </div>
          <div className="wiki-citations">
            <span>[1] 001</span>
            <span>[2] 014</span>
            <span>[3] 008</span>
          </div>
        </div>
        <div className="wiki-page-bottom">
          <SourceTag light>来自关联切片</SourceTag>
          <span>AI 生成 · 可回溯</span>
        </div>
      </Paper>
    </Positioned>
    <Positioned x={720} y={861} className="material-caption">
      源切片始终保留 <span style={{ color: palette.violet }}>↗</span>
    </Positioned>
  </Scene>
);
