import { AbsoluteFill } from "remotion";

import { TextOverlay } from "../shared/StreamingText";
import {
  Backdrop,
  CameraFrame,
  CardTower,
  CharacterShadows,
  Dust,
  Foreground,
  Layer,
  PosterGrade,
  TextRibbon,
} from "../shared/Stage";
import { MOUNT_T, GROUND_Y, getCamera, horseBaseX } from "../shared/config";
import { DuckStage, HorseStage } from "../shared/mascot-action";

const PosterCaption = ({
  index,
  title,
  subtitle,
}: {
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
}) => (
  <div
    style={{
      position: "absolute",
      left: 64,
      bottom: 44,
      display: "flex",
      alignItems: "center",
      gap: 18,
      fontFamily: '"Manrope Variable", sans-serif',
      color: "rgba(244, 230, 201, 0.62)",
    }}
  >
    <span style={{ fontSize: 11, letterSpacing: 2.4 }}>{index}</span>
    <span
      style={{
        width: 48,
        height: 1,
        background: "rgba(244, 230, 201, 0.32)",
      }}
    />
    <span
      style={{
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: 2.2,
        color: "rgba(244, 230, 201, 0.9)",
      }}
    >
      {title}
    </span>
    <span
      style={{
        fontSize: 10,
        letterSpacing: 2.1,
        color: "rgba(244, 230, 201, 0.38)",
      }}
    >
      {subtitle}
    </span>
  </div>
);

const PosterLedge = () => {
  const t = 1.4;
  const cam = getCamera(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#171411" }}>
      <CameraFrame cam={cam}>
        <Backdrop cam={cam} look="paper" t={t} />
        <Layer cam={cam} parallax={1}>
          <TextRibbon
            x={858}
            top={304}
            width={940}
            height={142}
            rotation={-1.3}
            tone="cream"
          />
          <TextOverlay
            firstProgress={1}
            secondProgress={0}
            questionProgress={1}
            paper
          />
          <CharacterShadows t={t} />
          <HorseStage t={t} rider={false} paper />
          <DuckStage t={t} paper />
        </Layer>
        <Layer cam={cam} parallax={1.03}>
          <Dust t={t} />
        </Layer>
        <Layer cam={cam} parallax={1.3}>
          <Foreground look="paper" />
        </Layer>
      </CameraFrame>
      <PosterGrade />
      <PosterCaption index="01" title="立势" subtitle="THE LEDGE / 1.40S" />
    </AbsoluteFill>
  );
};

const PosterFall = () => {
  const t = 3.25;
  const cam = getCamera(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#171411" }}>
      <CameraFrame cam={cam}>
        <Backdrop cam={cam} look="paper" t={t} />
        <Layer cam={cam} parallax={1}>
          <TextRibbon
            x={858}
            top={304}
            width={940}
            height={142}
            rotation={-1.3}
            tone="cream"
          />
          <TextOverlay
            firstProgress={1}
            secondProgress={0}
            questionProgress={1}
            paper
          />
          <CharacterShadows t={t} />
          <HorseStage t={t} rider={false} paper />
          <DuckStage t={t} paper />
        </Layer>
        <Layer cam={cam} parallax={1.03}>
          <Dust t={t} />
        </Layer>
        <Layer cam={cam} parallax={1.3}>
          <Foreground look="paper" />
        </Layer>
      </CameraFrame>
      <PosterGrade />
      <PosterCaption index="02" title="坠落" subtitle="THE DROP / 3.00S" />
    </AbsoluteFill>
  );
};

const PosterMount = () => {
  const t = MOUNT_T;
  const cam = getCamera(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#171411" }}>
      <CameraFrame cam={cam}>
        <Backdrop cam={cam} look="paper" t={t} valley />
        <Layer cam={cam} parallax={1}>
          <TextRibbon
            x={1740}
            top={212}
            width={786}
            height={160}
            rotation={1.15}
            tone="dark"
          />
          <TextOverlay
            firstProgress={0}
            secondProgress={1}
            questionProgress={0}
            paper
          />
          <CharacterShadows t={t} />
          <div
            style={{
              position: "absolute",
              left: horseBaseX(t) - 330,
              top: GROUND_Y - 14,
              width: 660,
              height: 46,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(12, 7, 4, 0.58), rgba(12, 7, 4, 0.14) 60%, transparent 78%)",
            }}
          />
          <HorseStage t={t} rider paper />
        </Layer>
        <Layer cam={cam} parallax={1.03}>
          <Dust t={t} />
        </Layer>
      </CameraFrame>
      <PosterGrade />
      <PosterCaption index="03" title="上马" subtitle="THE MOUNT / 5.30S" />
    </AbsoluteFill>
  );
};

const CurtainPanel = ({ side }: { readonly side: "left" | "right" }) => (
  <div
    style={{
      position: "absolute",
      top: 54,
      bottom: -80,
      left: side === "left" ? -120 : 1260,
      width: 800,
      background:
        "repeating-linear-gradient(90deg, #6b513c 0px, #8f7153 34px, #a0805f 66px, #7a5c43 100px, #6b513c 132px)",
      borderTop: "10px solid #4a3222",
      boxShadow:
        side === "left"
          ? "inset -60px 0 70px rgba(20, 11, 6, 0.5), 18px 0 40px rgba(10, 6, 3, 0.45)"
          : "inset 60px 0 70px rgba(20, 11, 6, 0.5), -18px 0 40px rgba(10, 6, 3, 0.45)",
      clipPath:
        side === "left"
          ? "polygon(0 0, 100% 0, 96% 16%, 100% 33%, 95% 52%, 99% 70%, 94% 88%, 97% 100%, 0 100%)"
          : "polygon(0 0, 100% 0, 100% 100%, 3% 100%, 6% 87%, 1% 70%, 5% 51%, 0 32%, 4% 16%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.22,
        mixBlendMode: "overlay",
        background:
          "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 240, 210, 0.14) 2px, rgba(255, 240, 210, 0.14) 3px)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(255, 225, 176, 0.13), transparent 30%, rgba(18, 9, 5, 0.28))",
        mixBlendMode: "soft-light",
      }}
    />
    {[0, 1, 2, 3, 4].map((index) => (
      <div
        key={`fold-shadow-${side}-${index}`}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 48 + index * 128,
          width: 18,
          background:
            "linear-gradient(90deg, transparent, rgba(34, 19, 10, 0.34), transparent)",
        }}
      />
    ))}
    <div
      style={{
        position: "absolute",
        left: side === "left" ? 40 : 116,
        top: 90,
        fontFamily: '"Manrope Variable", sans-serif',
        fontSize: 11,
        letterSpacing: 3,
        color: "rgba(244, 225, 190, 0.3)",
        writingMode: "vertical-rl",
      }}
    >
      ARCHIVE CURTAIN / INGESTION
    </div>
  </div>
);

const PipelineGlimpse = () => (
  <div
    style={{
      position: "absolute",
      left: 660,
      top: 250,
      width: 600,
      height: 680,
      opacity: 0.95,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 130,
        top: 0,
        width: 340,
        height: 120,
        clipPath: "polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)",
        background: "linear-gradient(180deg, #e6d3ae, #b99b70)",
        border: "2px solid #173337",
        boxShadow: "0 18px 30px rgba(2, 12, 13, 0.45)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 176,
        top: 4,
        width: 248,
        height: 42,
        clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
        background: "linear-gradient(180deg, #0d1e21, #173337)",
        border: "1px solid rgba(230, 211, 174, 0.35)",
      }}
    />
    {[
      [214, 84, -8],
      [276, 126, 7],
      [336, 170, -4],
    ].map(([left, top, rot], index) => (
      <div
        key={`sheet-${index}`}
        style={{
          position: "absolute",
          left,
          top,
          width: 54,
          height: 72,
          background: "linear-gradient(135deg, #f1e0bd, #c5a97d)",
          border: "1px solid rgba(23, 51, 55, 0.55)",
          transform: `rotate(${rot}deg)`,
          boxShadow: "0 8px 12px rgba(2, 12, 13, 0.35)",
          opacity: 0.9 - index * 0.12,
        }}
      >
        {[0, 1, 2, 3].map((row) => (
          <div
            key={`sheet-line-${index}-${row}`}
            style={{
              position: "absolute",
              left: 8,
              top: 12 + row * 12,
              width: 36 - (row % 2) * 8,
              height: 1,
              background: "rgba(38, 22, 14, 0.35)",
            }}
          />
        ))}
      </div>
    ))}
    <div
      style={{
        position: "absolute",
        left: 270,
        top: 116,
        width: 60,
        height: 180,
        background: "linear-gradient(90deg, #2d5051, #163336)",
        border: "2px solid rgba(230, 211, 174, 0.35)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 320,
        width: 520,
        height: 150,
        background: "linear-gradient(180deg, #2a4c4e, #10282b)",
        border: "2px solid rgba(230, 211, 174, 0.3)",
        transform: "skewX(-12deg)",
        boxShadow: "0 20px 30px rgba(2, 12, 13, 0.4)",
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={`belt-${index}`}
          style={{
            position: "absolute",
            left: 24 + index * 82,
            top: 26,
            width: 46,
            height: 94,
            background:
              "linear-gradient(180deg, #e9d7b4, #b99a6e)",
            border: "1px solid rgba(23, 51, 55, 0.5)",
            transform: "skewX(12deg)",
            opacity: 0.84 - index * 0.06,
          }}
        />
      ))}
    </div>
    {[
      [94, 250, 84, 70],
      [380, 210, 108, 96],
    ].map(([left, top, width, height], index) => (
      <div
        key={`stamp-${index}`}
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          background: "linear-gradient(180deg, #c7a46d, #6c4b2e)",
          border: "2px solid #173337",
          boxShadow: "0 12px 18px rgba(2, 12, 13, 0.45)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -28,
            width: 8,
            height: 30,
            background: "#173337",
            transform: "translateX(-50%)",
          }}
        />
      </div>
    ))}
    {[0, 1, 2].map((index) => (
      <div
        key={`bin-${index}`}
        style={{
          position: "absolute",
          left: 80 + index * 170,
          bottom: 0,
          width: 130,
          height: 90,
          clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)",
          background: "linear-gradient(180deg, #315456, #153033)",
          border: "2px solid rgba(230, 211, 174, 0.28)",
        }}
      />
    ))}
    {[
      [240, 220, "INGEST"],
      [250, 300, "PARSE"],
      [250, 380, "CHUNK"],
    ].map(([left, top, label], index) => (
      <div
        key={`label-${index}`}
        style={{
          position: "absolute",
          left,
          top,
          fontFamily: '"Manrope Variable", sans-serif',
          fontSize: 10,
          letterSpacing: 2,
          color: "rgba(198, 236, 226, 0.55)",
        }}
      >
        {label}
      </div>
    ))}
    <div
      style={{
        position: "absolute",
        left: 250,
        top: 470,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "#9be8d8",
        boxShadow: "0 0 22px rgba(155, 232, 216, 0.8)",
      }}
    />
  </div>
);

const PosterThreshold = () => {
  const t = MOUNT_T;
  return (
    <AbsoluteFill style={{ backgroundColor: "#081214" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 48%, #e9f4e6 0%, #a9d6cd 14%, #3e706d 38%, #122c30 72%, #071113 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 120,
          width: 800,
          height: 860,
          background:
            "radial-gradient(ellipse at 50% 36%, rgba(255, 255, 245, 0.92), rgba(168, 224, 212, 0.42) 34%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />
      <CardTower x={-150} y={70} w={360} h={930} cols={5} rows={13} seed={11} />
      <CardTower x={1710} y={40} w={360} h={960} cols={5} rows={13} seed={12} />
      <PipelineGlimpse />
      <CurtainPanel side="left" />
      <CurtainPanel side="right" />
      <div
        style={{
          position: "absolute",
          left: -40,
          right: -40,
          top: 36,
          height: 118,
          background:
            "repeating-linear-gradient(90deg, #4f3a2a 0px, #7f634a 34px, #96795a 66px, #6c513b 98px, #4f3a2a 132px)",
          borderBottom: "8px solid #352316",
          boxShadow: "0 20px 40px rgba(5, 8, 8, 0.55)",
        }}
      />
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }}
      >
        <path
          d="M 962 805 C 1080 780, 1180 668, 1260 570 C 1340 470, 1400 330, 1430 230"
          fill="none"
          stroke="#2a1a10"
          strokeWidth={12}
          opacity={0.42}
        />
        <path
          d="M 962 805 C 1080 780, 1180 668, 1260 570 C 1340 470, 1400 330, 1430 230"
          fill="none"
          stroke="#c8a468"
          strokeWidth={6}
          strokeDasharray="12 5"
          opacity={0.8}
        />
        <circle cx={1430} cy={228} r={34} fill="#3e2a1b" stroke="#c8a468" strokeWidth={5} />
        <circle cx={1430} cy={228} r={11} fill="#c8a468" />
        <path
          d="M 1430 194 C 1520 164, 1640 164, 1740 194"
          fill="none"
          stroke="#c8a468"
          strokeWidth={5}
          opacity={0.7}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter:
            "brightness(0.66) saturate(0.76) contrast(1.06) drop-shadow(0 0 24px rgba(160, 235, 225, 0.55))",
        }}
      >
        <HorseStage
          t={t}
          rider
          paper
          x={960}
          scale={0.35}
          groundY={1035}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 230,
          background:
            "linear-gradient(180deg, transparent, rgba(3, 8, 8, 0.72))",
        }}
      />
      {[
        [706, 184, 5, 0.6],
        [1210, 220, 4, 0.5],
        [880, 310, 3, 0.45],
        [1300, 420, 6, 0.35],
        [760, 540, 4, 0.4],
      ].map(([x, y, size, opacity], index) => (
        <div
          key={`threshold-dust-${index}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(207, 245, 232, 0.8)",
            boxShadow: "0 0 16px rgba(207, 245, 232, 0.55)",
            opacity,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 48%, transparent 34%, rgba(1, 5, 6, 0.55) 100%)",
        }}
      />
      <PosterCaption index="04" title="门槛" subtitle="THE THRESHOLD / 5.30S" />
    </AbsoluteFill>
  );
};

export const PaperPosterLedge = () => <PosterLedge />;
export const PaperPosterFall = () => <PosterFall />;
export const PaperPosterMount = () => <PosterMount />;
export const PaperPosterThreshold = () => <PosterThreshold />;
