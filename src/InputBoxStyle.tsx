import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/600.css";
import "@fontsource-variable/manrope";
import "./input-box-style.css";

type Token = { w: number; gap?: number };

const USER_TYPING: Token[] = [{ w: 104 }, { w: 70, gap: 22 }, { w: 110 }];
const ROWS: Token[][] = [
  [{ w: 122 }, { w: 82, gap: 22 }, { w: 126 }],
  [{ w: 110, gap: 22 }, { w: 156 }],
  [{ w: 92, gap: 22 }, { w: 148 }],
  [{ w: 128, gap: 22 }, { w: 96 }],
  [{ w: 104, gap: 22 }, { w: 132 }],
];

function TokenLine({ tokens, caret }: { tokens: Token[]; caret?: boolean }) {
  return (
    <div className="ibs-line">
      {tokens.map((token, index) => (
        <i
          key={index}
          style={{ width: token.w, marginRight: token.gap ?? 22 }}
        />
      ))}
      {caret ? <span className="ibs-caret" /> : null}
    </div>
  );
}

function UploadButton({ dispatched }: { dispatched: boolean }) {
  return (
    <div
      className={dispatched ? "ibs-send ibs-send-dark" : "ibs-send ibs-send-on"}
    >
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 17V5M6 10l5-5 5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Shape({
  variant,
  tag,
  word,
  question,
  style,
}: {
  variant: 0 | 1 | 2;
  tag: string;
  word: string;
  question: string;
  style: React.CSSProperties;
}) {
  return (
    <div className={`ibs-shape ibs-shape-${variant}`} style={style}>
      <div className="ibs-shape-sheen" />
      <div className="ibs-shape-top">
        <i />
        <span>{tag}</span>
      </div>
      <strong>{word}</strong>
      <p>{question}</p>
    </div>
  );
}

function Specimen({
  y,
  index,
  title,
  note,
  children,
}: {
  y: number;
  index: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ibs-specimen" style={{ top: y }}>
      <div className="ibs-specimen-head">
        <span className="ibs-index">{index}</span>
        <strong>{title}</strong>
      </div>
      <div className="ibs-specimen-body">{children}</div>
      <p className="ibs-note">{note}</p>
    </div>
  );
}

export const InputBoxStyle = () => {
  const [handle] = useState(() => delayRender("Load input-box fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill className="ibs">
      <div className="ibs-atmosphere" />
      <svg
        className="ibs-marks"
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        fill="none"
      >
        {[
          [122, 128],
          [1042, 220],
          [1760, 624],
          [92, 948],
        ].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x - 6} ${y}h12 M${x} ${y - 6}v12`}
            stroke="#a3b8b2"
            strokeOpacity="0.22"
          />
        ))}
      </svg>

      <div className="ibs-brand">
        harness <i>/</i> RAG
      </div>
      <div className="ibs-title">
        <span>内容输入框</span>
        <em>版式提案 · REV.04</em>
      </div>

      <Specimen
        y={176}
        index="01"
        title="用户 · 正在输入（一层基准）"
        note="消息级短框 440×57；词距、行距、内容到边框一律 22 等距。"
      >
        <div className="ibs-field ibs-field-user">
          <div className="ibs-sheen" />
          <div className="ibs-content">
            <TokenLine tokens={USER_TYPING} caret />
          </div>
          <UploadButton dispatched={false} />
        </div>
      </Specimen>

      <Specimen
        y={376}
        index="02"
        title="harness · 五层容器（向上再长两层）"
        note="三层再向上长两层＝共五层；五行内容同栅格排列，为三形状预留出完整的内部空间。"
      >
        <div className="ibs-field ibs-field-harness ibs-field-five">
          <div className="ibs-sheen" />
          <div className="ibs-content ibs-content-rows">
            {ROWS.map((row, index) => (
              <div className="ibs-row" key={index}>
                <TokenLine tokens={row} />
              </div>
            ))}
          </div>
        </div>
      </Specimen>

      <Specimen
        y={716}
        index="03"
        title="收缩完成态 · 三形状落位"
        note="同色收缩框自外框收到各形状边缘：匹配＝青、关系＝绿、深度＝紫；块间与到边框仍 22 等距。"
      >
        <div className="ibs-field ibs-field-harness ibs-field-five ibs-field-shapes">
          <div className="ibs-sheen" />
          <Shape
            variant={0}
            tag="Q1"
            word="匹配"
            question="我是谁？我在哪？"
            style={{ left: 22, top: 22, width: 187, height: 65 }}
          />
          <Shape
            variant={1}
            tag="Q2"
            word="关系"
            question="我们现在是什么关系？"
            style={{ left: 22, top: 110, width: 187, height: 65 }}
          />
          <Shape
            variant={2}
            tag="Q3"
            word="深度"
            question="你还要我怎样？"
            style={{ left: 231, top: 22, width: 187, height: 153 }}
          />
        </div>
      </Specimen>

      <aside className="ibs-specs">
        <h3>形态规格</h3>
        <dl>
          <div>
            <dt>框体</dt>
            <dd>消息级短框 440 宽 · 一层 440×57 / 五层 440×197</dd>
          </div>
          <div>
            <dt>生长</dt>
            <dd>一层 → 三层 → 五层（向上再长两层）</dd>
          </div>
          <div>
            <dt>间隙</dt>
            <dd>词距 / 行距 / 形状间距 / 到边框，一律 22</dd>
          </div>
          <div>
            <dt>三形状</dt>
            <dd>左二右一：匹配 187×65 · 关系 187×65 · 深度 187×153</dd>
          </div>
          <div>
            <dt>收缩</dt>
            <dd>同色框自外框收到形状边缘，落地即成形</dd>
          </div>
          <div>
            <dt>按钮</dt>
            <dd>仅用户一层框 · 亮＝待命 / 变暗＝出发</dd>
          </div>
        </dl>
      </aside>

      <div className="ibs-footer">机制演示 · 版式提案，未入片</div>
    </AbsoluteFill>
  );
};
