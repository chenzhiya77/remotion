import { AbsoluteFill } from "remotion";

type StreamingLineProps = {
  readonly x: number;
  readonly baseline: number;
  readonly text: string;
  readonly progress: number;
  readonly variant: "first" | "second";
  readonly paper?: boolean;
  readonly questionProgress?: number;
  readonly opacity?: number;
};

const INK = "#2a1b14";
const CREAM = "#f4e6c9";
const BRASS = "#ebc98a";

export const StreamingLine = ({
  x,
  baseline,
  text,
  progress,
  variant,
  paper = false,
  questionProgress = 0,
  opacity = 1,
}: StreamingLineProps) => {
  const fontSize = variant === "first" ? 50 : 54;
  const top = baseline - fontSize * 0.78;
  const clamped = Math.max(0, Math.min(1, progress));
  const showQuestion = variant === "first";
  const phrase = text;
  const firstColor = paper ? INK : CREAM;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top,
        opacity,
        display: "flex",
        alignItems: "baseline",
        whiteSpace: "nowrap",
        fontFamily: '"Noto Sans SC", sans-serif',
        fontWeight: 700,
        fontSize,
        lineHeight: 1.1,
        letterSpacing: variant === "first" ? 1.2 : 2.4,
        color: variant === "first" ? firstColor : paper ? BRASS : CREAM,
        textShadow: paper
          ? variant === "first"
            ? "1px 2px 0 rgba(244, 230, 201, 0.35), 0 8px 20px rgba(32, 18, 10, 0.28)"
            : "0 2px 0 rgba(32, 18, 10, 0.55), 0 10px 26px rgba(8, 4, 2, 0.5)"
          : "0 2px 12px rgba(0,0,0,0.45)",
      }}
    >
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            display: "inline-block",
            clipPath: `inset(-35% ${(1 - clamped) * 100}% -35% 0)`,
          }}
        >
          {variant === "first" ? (
            <>
              {phrase.split("Harness RAG")[0]}
              <span
                style={{
                  fontFamily: '"Manrope Variable", sans-serif',
                  fontWeight: 700,
                  fontSize: 46,
                  letterSpacing: 0.5,
                }}
              >
                Harness RAG
              </span>
            </>
          ) : (
            phrase
          )}
        </span>
        {clamped > 0.002 && clamped < 0.998 ? (
          <span
            style={{
              position: "absolute",
              left: `${clamped * 100}%`,
              top: -8,
              width: 9,
              height: fontSize + 18,
              transform: "translateX(-50%)",
              borderRadius: 6,
              background:
                "linear-gradient(180deg, rgba(255,235,180,0) 0%, rgba(255,211,124,0.95) 24%, rgba(255,188,92,0.5) 76%, rgba(255,188,92,0) 100%)",
              boxShadow: "0 0 18px rgba(255,190,96,0.55)",
              filter: "blur(0.4px)",
            }}
          />
        ) : null}
      </span>
      {showQuestion ? (
        <span
          style={{
            position: "relative",
            display: "inline-block",
            marginLeft: 10,
            fontSize: 76,
            lineHeight: 0.9,
            color: variant === "first" ? firstColor : BRASS,
            opacity: questionProgress,
            transform: `translateY(${(1 - questionProgress) * -14}px) scale(${1.48 - 0.48 * questionProgress})`,
            transformOrigin: "50% 80%",
            textShadow: paper
              ? "0 3px 0 rgba(244, 230, 201, 0.28), 0 12px 26px rgba(32, 18, 10, 0.22)"
              : "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          ？
          {questionProgress > 0.02 && questionProgress < 0.999 ? (
            <span
              style={{
                position: "absolute",
                inset: -24,
                borderRadius: "50%",
                border: "2px solid rgba(255,208,120,0.45)",
                transform: `scale(${0.6 + questionProgress * 0.9})`,
                opacity: 1 - questionProgress,
              }}
            />
          ) : null}
        </span>
      ) : null}
    </div>
  );
};

export const TextOverlay = ({
  firstProgress,
  secondProgress,
  questionProgress,
  paper = false,
  firstOpacity = 1,
}: {
  readonly firstProgress: number;
  readonly secondProgress: number;
  readonly questionProgress: number;
  readonly paper?: boolean;
  readonly firstOpacity?: number;
}) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <StreamingLine
      x={900}
      baseline={380}
      text="什么是 Harness RAG"
      progress={firstProgress}
      questionProgress={questionProgress}
      variant="first"
      paper={paper}
      opacity={firstOpacity}
    />
    <StreamingLine
      x={1800}
      baseline={300}
      text="这是一场关于知识的旅程"
      progress={secondProgress}
      variant="second"
      paper={paper}
    />
  </AbsoluteFill>
);
