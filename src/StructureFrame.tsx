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

function ExtractedSlice({
  number,
  section,
  text,
  children,
}: {
  number: string;
  section: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <Paper className="extracted-slice">
      <div className="slice-topline">
        <span className="mono">{number}</span>
        <span>网关设计说明 / {section}</span>
        <span className="slice-pin" />
      </div>
      <h3>{section}</h3>
      <p>{text}</p>
      {children}
    </Paper>
  );
}

export const StructureFrame = () => (
  <Scene chapter={1} accent={palette.cyan}>
    <Headline
      kicker="01 / STRUCTURE-AWARE CHUNKING"
      first="不是切碎。"
      second="是读懂结构。"
      accent={palette.cyan}
    />
    <Positioned x={103} y={548} width={635} className="scene-description">
      文档成为切片，
      <br />
      标题、语义与来源，依然相连。
    </Positioned>
    <Positioned x={103} y={717} width={570}>
      <div className="process-mini">
        <span>PDF</span>
        <span className="process-arrow">→</span>
        <span>MinerU</span>
        <span className="process-arrow">→</span>
        <strong>结构化 MD</strong>
      </div>
      <div className="quiet-copy">沿着内容的结构，展开知识。</div>
    </Positioned>
    <svg className="scene-svg" viewBox="0 0 1920 1080" fill="none">
      <defs>
        <linearGradient
          id="slice-thread"
          x1="800"
          y1="300"
          x2="1690"
          y2="820"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#78deec" stopOpacity="0" />
          <stop offset="0.5" stopColor="#78deec" stopOpacity="0.6" />
          <stop offset="1" stopColor="#78deec" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M801 371 C1000 277 1037 225 1280 192 C1575 150 1775 320 1792 531 C1809 731 1643 873 1423 897 C1218 919 1001 837 882 725"
        stroke="url(#slice-thread)"
      />
      <path
        d="M917 386 C1025 357 1049 346 1150 343 M937 535 C1033 525 1086 519 1181 546 M968 662 C1060 694 1102 733 1203 766"
        stroke="#78deec"
        strokeOpacity="0.39"
        strokeDasharray="3 9"
      />
      <Crosshair x={1790} y={530} color="#78deec" />
      <Crosshair x={1409} y={897} color="#78deec" />
      <circle cx="1070" cy="521" r="5" fill="#78deec" />
      <circle cx="1040" cy="365" r="3" fill="#78deec" />
      <circle cx="1100" cy="725" r="3" fill="#78deec" />
    </svg>
    <Positioned x={837} y={238} width={370} style={{ rotate: "-12deg" }}>
      <div className="source-document">
        <div className="source-document-header">
          <span className="mono">SOURCE / 01</span>
          <span>PDF</span>
        </div>
        <h2>网关设计说明</h2>
        <p className="source-document-sub">Starship Gateway · Architecture</p>
        <div className="document-hairline" />
        <div className="source-section">
          <span>01</span>
          <strong>服务概览</strong>
        </div>
        <TextLines lengths={[96, 87, 91, 62]} color="#53686d" />
        <div className="source-section">
          <span>02</span>
          <strong>重试策略</strong>
        </div>
        <div className="source-mini-table">
          <span>策略</span>
          <span>配置</span>
          <span>超时重试</span>
          <span>有界重试</span>
          <span>异常处理</span>
          <span>退避等待</span>
        </div>
        <div className="source-section">
          <span>03</span>
          <strong>依赖关系</strong>
        </div>
        <TextLines lengths={[93, 72, 87]} color="#53686d" />
        <div className="source-document-bottom">
          <span>TECHNICAL DOCUMENT</span>
          <span>01 / 06</span>
        </div>
      </div>
    </Positioned>
    <Positioned
      x={1200}
      y={166}
      className="eyebrow floating-label"
      style={{ color: palette.cyan, rotate: "-6deg" }}
    >
      STRUCTURE PRESERVED <span className="label-line" />
    </Positioned>
    <Positioned x={1110} y={239} width={567} style={{ rotate: "-6deg" }}>
      <ExtractedSlice
        number="001"
        section="服务概览"
        text="星舟网关统一管理服务接入与请求转发。"
      >
        <div className="slice-meta">
          <SourceTag light>网关设计说明.pdf</SourceTag>
          <span>标题路径保留</span>
        </div>
      </ExtractedSlice>
    </Positioned>
    <Positioned x={1136} y={459} width={567} style={{ rotate: "-3deg" }}>
      <ExtractedSlice
        number="002"
        section="重试策略"
        text="请求失败时，按配置执行有界重试与退避。"
      >
        <div className="slice-table">
          <span>重试策略</span>
          <span>最大次数</span>
          <span>指数退避</span>
          <strong>3</strong>
        </div>
      </ExtractedSlice>
    </Positioned>
    <Positioned x={1125} y={704} width={567} style={{ rotate: "1deg" }}>
      <ExtractedSlice
        number="003"
        section="依赖关系"
        text="支付服务经由星舟网关访问结算服务。"
      >
        <div className="slice-meta">
          <SourceTag light>网关设计说明.pdf</SourceTag>
          <span>来源始终可追溯</span>
        </div>
      </ExtractedSlice>
    </Positioned>
    <Positioned
      x={865}
      y={856}
      className="mono marginalia"
      style={{ rotate: "-12deg" }}
    >
      ONE DOCUMENT.
      <br />
      <span style={{ color: palette.cyan }}>MEANING IN EVERY SLICE.</span>
    </Positioned>
  </Scene>
);
