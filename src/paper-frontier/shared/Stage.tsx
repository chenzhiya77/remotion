import { AbsoluteFill } from "remotion";

import {
  CameraState,
  FPS,
  GROUND_Y,
  HEIGHT,
  HORSE_BASE_X_AT_UNDER,
  HORSE_SCALE,
  HORSE_SPEED,
  MOUNT_ANCHOR_Y,
  WIDTH,
  duckAnchorY,
  duckBaseX,
  horseBaseX,
} from "./config";

export type Look = "gray" | "paper";

const PALETTES = {
  gray: {
    skyTop: "#2f3233",
    skyMid: "#5c5650",
    skyLow: "#b6a48d",
    sun: "#e2c79e",
    sunGlow: "rgba(226, 199, 158, 0.18)",
    far: ["#3b3b39", "#4a4742", "#59534b"],
    mid: ["#47433d", "#554f47", "#625b51"],
    ground: "#4d463d",
    groundLow: "#332d27",
    trail: "#6a5f50",
    ink: "#1b1815",
    cream: "#eadfc9",
    paperEdge: "rgba(234, 223, 201, 0.35)",
    dust: "rgba(206, 190, 166, 0.34)",
    shadow: "rgba(12, 9, 7, 0.45)",
  },
  paper: {
    skyTop: "#2f4b4a",
    skyMid: "#9b6b52",
    skyLow: "#e7aa67",
    sun: "#f2cc86",
    sunGlow: "rgba(242, 204, 134, 0.24)",
    far: ["#6d402e", "#8b5238", "#a86947"],
    mid: ["#5d3527", "#70412e", "#854d35"],
    ground: "#a56a45",
    groundLow: "#5b3424",
    trail: "#c38959",
    ink: "#241710",
    cream: "#f4e6c9",
    paperEdge: "rgba(255, 239, 208, 0.62)",
    dust: "rgba(242, 206, 154, 0.5)",
    shadow: "rgba(28, 14, 8, 0.42)",
  },
} as const;

export const Layer = ({
  cam,
  parallax,
  children,
  style,
}: {
  readonly cam: CameraState;
  readonly parallax: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translate(${-cam.x * parallax + cam.shakeX}px, ${-cam.y * parallax + cam.shakeY}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const CameraFrame = ({
  cam,
  children,
}: {
  readonly cam: CameraState;
  readonly children: React.ReactNode;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transformOrigin: "960px 540px",
      transform: `scale(${cam.zoom})`,
    }}
  >
    {children}
  </div>
);

const PaperGrain = ({ look }: { readonly look: Look }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity: look === "paper" ? 0.13 : 0.08,
      mixBlendMode: "overlay",
      background:
        "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,244,218,0.14) 2px, rgba(255,244,218,0.14) 3px), repeating-linear-gradient(91deg, transparent 0px, transparent 5px, rgba(28,15,8,0.1) 5px, rgba(28,15,8,0.1) 6px)",
      pointerEvents: "none",
    }}
  />
);

export const Sky = ({ look }: { readonly look: Look }) => {
  const p = PALETTES[look];
  return (
    <div style={{ position: "absolute", inset: "-12% -8%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyMid} 58%, ${p.skyLow} 86%, #d9a875 100%)`,
        }}
      />
      {look === "paper" ? (
        <>
          <div
            style={{
              position: "absolute",
              left: "58%",
              top: "43%",
              width: 330,
              height: 330,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 42% 38%, #f8e1aa 0%, #efc37b 38%, #dfa45f 66%, rgba(223,164,95,0) 72%)",
              boxShadow: "0 0 160px 70px rgba(242, 204, 134, 0.26)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "57.4%",
              top: "39.5%",
              width: 380,
              height: 380,
              borderRadius: "50%",
              border: "1px solid rgba(255, 236, 195, 0.34)",
              boxShadow: "inset 0 0 0 18px rgba(255, 230, 180, 0.04)",
            }}
          />
          {[
            [8, 24, 470, 58],
            [40, 12, 640, 74],
            [64, 29, 360, 52],
            [20, 41, 300, 44],
          ].map(([left, top, width, height], index) => (
            <div
              key={`cloud-${index}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                width,
                height,
                borderRadius: "50%",
                background:
                  "linear-gradient(180deg, rgba(248, 235, 210, 0.26), rgba(248, 235, 210, 0.04))",
                filter: "blur(10px)",
              }}
            />
          ))}
          {[-24, -8, 12, 28].map((rotate, index) => (
            <div
              key={`ray-${index}`}
              style={{
                position: "absolute",
                left: "42%",
                top: "24%",
                width: 1150,
                height: 150 + index * 34,
                transform: `rotate(${rotate}deg)`,
                transformOrigin: "18% 34%",
                background:
                  "linear-gradient(90deg, rgba(255, 224, 164, 0.16), rgba(255, 224, 164, 0.04) 42%, transparent 78%)",
                filter: "blur(16px)",
                opacity: 0.55 - index * 0.07,
              }}
            />
          ))}
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            left: "61%",
            top: "47%",
            width: 240,
            height: 240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(226,199,158,0.5) 0%, rgba(226,199,158,0.12) 60%, transparent 72%)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "34%",
          background:
            "linear-gradient(180deg, transparent, rgba(255, 221, 173, 0.12) 60%, rgba(255, 221, 173, 0.2))",
        }}
      />
      <PaperGrain look={look} />
    </div>
  );
};

const mesaPoints = (
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) => {
  const top: string[] = [];
  const steps = 7;
  for (let index = 0; index <= steps; index++) {
    const px = x + (w / steps) * index;
    const py =
      y +
      Math.sin(seed * 3.1 + index * 1.7) * h * 0.045 +
      Math.sin(seed * 1.3 + index * 0.8) * h * 0.03;
    top.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `${x},${y + h} ${top.join(" ")} ${x + w},${y + h}`;
};

export const FarMesas = ({ look }: { readonly look: Look }) => {
  const p = PALETTES[look];
  return (
    <svg
      viewBox="0 0 3000 820"
      style={{ position: "absolute", left: -540, top: 210, width: 3000, height: 820 }}
    >
      <g opacity={0.95}>
        {[
          [-60, 360, 620, 300, 1.2],
          [430, 420, 520, 250, 2.1],
          [1040, 380, 540, 280, 3.4],
          [1560, 440, 460, 230, 4.2],
          [2040, 340, 680, 320, 5.6],
          [2640, 410, 430, 250, 6.7],
        ].map(([x, y, w, h, seed], index) => (
          <g key={`far-${index}`}>
            <polygon
              points={mesaPoints(x, y, w, h, seed)}
              fill={p.far[index % p.far.length]}
              opacity={0.72}
            />
            <polyline
              points={mesaPoints(x, y, w, h, seed).split(" ").slice(1, 8).join(" ")}
              fill="none"
              stroke={p.paperEdge}
              strokeWidth={2}
              opacity={look === "paper" ? 0.6 : 0.25}
            />
          </g>
        ))}
      </g>
      <g opacity={0.5}>
        {[80, 760, 1320, 1880, 2440].map((x, index) => (
          <rect
            key={`line-${index}`}
            x={x}
            y={610 + (index % 2) * 40}
            width={280}
            height={2}
            fill={p.paperEdge}
            opacity={0.35}
          />
        ))}
      </g>
    </svg>
  );
};

export const MidGround = ({
  look,
  valley = false,
}: {
  readonly look: Look;
  readonly valley?: boolean;
}) => {
  const p = PALETTES[look];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg
        viewBox="0 0 2200 900"
        style={{ position: "absolute", left: -160, top: 160, width: 2200, height: 900 }}
      >
        {valley ? (
          <>
            <polygon
              points="0,900 0,642 180,606 340,682 430,900"
              fill={p.mid[0]}
            />
            <polygon
              points="1660,900 1790,712 2020,668 2200,724 2200,900"
              fill={p.mid[1]}
            />
            <polyline
              points="1790,712 2020,668 2200,724"
              fill="none"
              stroke={p.paperEdge}
              strokeWidth={2.5}
              opacity={look === "paper" ? 0.45 : 0.18}
            />
            <polyline
              points="0,642 180,606 340,682"
              fill="none"
              stroke={p.paperEdge}
              strokeWidth={2.5}
              opacity={look === "paper" ? 0.45 : 0.18}
            />
          </>
        ) : (
          <>
            <polygon
              points="0,900 0,300 180,240 330,330 400,900"
              fill={p.mid[0]}
            />
            <polygon
              points="0,900 0,430 140,380 260,470 300,900"
              fill={p.mid[1]}
              opacity={0.9}
            />
            <polyline
              points="0,300 180,240 330,330"
              fill="none"
              stroke={p.paperEdge}
              strokeWidth={2.5}
              opacity={look === "paper" ? 0.55 : 0.2}
            />
            <polygon
              points="1740,900 1810,520 2020,470 2200,560 2200,900"
              fill={p.mid[1]}
            />
            <polygon
              points="1880,900 1940,610 2110,570 2200,630 2200,900"
              fill={p.mid[2]}
              opacity={0.85}
            />
            <polyline
              points="1810,520 2020,470 2200,560"
              fill="none"
              stroke={p.paperEdge}
              strokeWidth={2.5}
              opacity={look === "paper" ? 0.55 : 0.2}
            />
          </>
        )}
        {look === "paper" ? (
          <g opacity={0.38}>
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <rect
                key={`wallline-${row}`}
                x={18}
                y={480 + row * 46}
                width={300 - row * 16}
                height={1.5}
                fill={p.cream}
              />
            ))}
            {[0, 1, 2, 3, 4].map((row) => (
              <rect
                key={`wallline-r-${row}`}
                x={1900 + row * 8}
                y={620 + row * 42}
                width={240 - row * 18}
                height={1.5}
                fill={p.cream}
              />
            ))}
          </g>
        ) : null}
      </svg>
    </div>
  );
};

export const Ground = ({ look }: { readonly look: Look }) => {
  const p = PALETTES[look];
  return (
    <div
      style={{
        position: "absolute",
        left: -900,
        top: GROUND_Y,
        width: 3800,
        height: 380,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${p.ground} 0%, ${p.groundLow} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 28,
          height: 34,
          background: `linear-gradient(180deg, ${p.trail}, transparent)`,
          opacity: 0.72,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 44,
          borderTop: `2px dashed ${p.ink}`,
          opacity: look === "paper" ? 0.28 : 0.18,
        }}
      />
      {look === "paper" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.14,
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 22px, rgba(255,227,183,0.3) 22px, rgba(255,227,183,0.3) 23px)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -80,
          height: 100,
          background:
            "linear-gradient(180deg, transparent, rgba(255, 218, 172, 0.16))",
          filter: "blur(12px)",
        }}
      />
      <PaperGrain look={look} />
    </div>
  );
};

const FallingCard = ({ t }: { readonly t: number }) => {
  if (t < 2.5) return null;
  const u = Math.min(1, (t - 2.5) / 1.1);
  const y = 520 + 610 * u * u;
  return (
    <div
      style={{
        position: "absolute",
        left: 672 + Math.sin(u * 4) * 22,
        top: y,
        width: 76,
        height: 52,
        borderRadius: 4,
        background: "linear-gradient(135deg, #d9c8ac, #a78f6f)",
        border: "1px solid rgba(63, 40, 25, 0.55)",
        boxShadow: "0 10px 16px rgba(20, 12, 8, 0.28)",
        transform: `rotate(${u * 220}deg)`,
        opacity: 1 - u * 0.65,
      }}
    />
  );
};

export const Ledge = ({
  t,
  look,
}: {
  readonly t: number;
  readonly look: Look;
}) => {
  const p = PALETTES[look];
  const card = look === "paper" ? "#d9c6a7" : "#645d53";
  const cardDark = look === "paper" ? "#bda889" : "#4f4941";
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 638,
          top: 509,
          width: 126,
          height: 18,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(20, 12, 8, 0.54), rgba(20, 12, 8, 0.12) 60%, transparent 78%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 586,
          top: 520,
          width: 230,
          height: 440,
        }}
      >
        {[
          { x: 22, y: 0, w: 186, h: 18, r: -1.4, fill: card },
          { x: 8, y: 18, w: 212, h: 22, r: 1.1, fill: cardDark },
          { x: 0, y: 40, w: 230, h: 26, r: -0.6, fill: card },
          { x: 16, y: 66, w: 198, h: 22, r: 0.8, fill: cardDark },
        ].map((item, index) => (
          <div
            key={`ledge-card-${index}`}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y,
              width: item.w,
              height: item.h,
              borderRadius: 4,
              background: item.fill,
              border: `1px solid ${p.ink}`,
              boxShadow: "0 8px 14px rgba(20, 12, 8, 0.25)",
              transform: `rotate(${item.r}deg)`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 86,
            width: 194,
            height: 350,
            clipPath: "polygon(9% 0%, 91% 0%, 100% 100%, 0% 100%)",
            background: `linear-gradient(90deg, ${cardDark}, ${card} 38%, ${cardDark})`,
            border: `1px solid ${p.ink}`,
            boxShadow: "0 20px 30px rgba(20, 12, 8, 0.28)",
          }}
        />
        {look === "paper"
          ? [0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div
                key={`ledge-line-${row}`}
                style={{
                  position: "absolute",
                  left: 44,
                  top: 96 + row * 42,
                  width: 142 - (row % 3) * 18,
                  height: 2,
                  background: "rgba(54, 34, 21, 0.4)",
                }}
              />
            ))
          : null}
      </div>
      <FallingCard t={t} />
    </>
  );
};

export const CharacterShadows = ({ t }: { readonly t: number }) => {
  const horseX = horseBaseX(t);
  const duckX = duckBaseX(t);
  const footY = duckAnchorY(t) + 143.7 * (0.45 * HORSE_SCALE);
  const height = Math.max(0, GROUND_Y - footY);
  const duckOpacity = t < 2.5 ? 0 : Math.max(0.08, 0.4 - height / 1500);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: horseX - 300,
          top: GROUND_Y - 20,
          width: 620,
          height: 58,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(20, 12, 8, 0.5), rgba(20, 12, 8, 0.12) 58%, transparent 75%)",
          transform: "rotate(-2deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: horseX - 230,
          top: GROUND_Y - 9,
          width: 460,
          height: 24,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(12, 7, 4, 0.62), rgba(12, 7, 4, 0.2) 56%, transparent 76%)",
        }}
      />
      {t >= 2.5 ? (
        <div
          style={{
            position: "absolute",
            left: duckX - 70 - height * 0.14,
            top: GROUND_Y - 16,
            width: 140 + height * 0.2,
            height: 28 + height * 0.03,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, rgba(20, 12, 8, ${duckOpacity}), transparent 72%)`,
          }}
        />
      ) : null}
    </>
  );
};

const Puff = ({
  x,
  y,
  size,
  opacity,
}: {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly opacity: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size * 0.62,
      borderRadius: "50%",
      background:
        "radial-gradient(ellipse, rgba(226, 204, 170, 0.5), rgba(196, 172, 138, 0.2) 54%, transparent 74%)",
      filter: "blur(2px)",
      opacity,
    }}
  />
);

export const Dust = ({ t }: { readonly t: number }) => {
  const horseX = horseBaseX(t);
  const duckX = duckBaseX(t);
  const trail = new Array(9).fill(0).map((_, index) => {
    const phase = (t * HORSE_SPEED + index * 46) % 420;
    return {
      x: horseX - 170 - phase,
      y: GROUND_Y - 14 + Math.sin(index * 3.2 + t * 9) * 8,
      size: 52 + (index % 3) * 24,
      opacity: (1 - phase / 470) * 0.3,
    };
  });
  const runDust =
    t > 3.7 && t < 4.9
      ? new Array(5).fill(0).map((_, index) => {
          const phase = (t * 650 + index * 30) % 200;
          return {
            x: duckX - 40 - phase,
            y: GROUND_Y - 10,
            size: 34 + (index % 2) * 14,
            opacity: (1 - phase / 230) * 0.26,
          };
        })
      : [];
  const impact =
    t > 3.4 && t < 4.3
      ? new Array(7).fill(0).map((_, index) => {
          const u = (t - 3.4) / 0.9;
          const angle = (index / 7) * Math.PI * 2;
          const radius = 30 + u * 190;
          return {
            x: HORSE_BASE_X_AT_UNDER + Math.cos(angle) * radius,
            y: GROUND_Y - 14 + Math.sin(angle) * radius * 0.26,
            size: 44 + u * 100,
            opacity: Math.max(0, 0.38 * (1 - u)),
          };
        })
      : [];
  const landing =
    t > 5.3 && t < 5.42
      ? new Array(5).fill(0).map((_, index) => {
          const u = (t - 5.3) / 0.12;
          const angle = (index / 5) * Math.PI * 2;
          const radius = 18 + u * 80;
          return {
            x: horseBaseX(5.3) + Math.cos(angle) * radius,
            y: MOUNT_ANCHOR_Y + Math.sin(angle) * radius * 0.36,
            size: 30 + u * 60,
            opacity: 0.34 * (1 - u),
          };
        })
      : [];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {[...trail, ...runDust, ...impact, ...landing].map((puff, index) => (
        <Puff key={`puff-${index}`} {...puff} />
      ))}
    </div>
  );
};

export const Foreground = ({ look }: { readonly look: Look }) => {
  const p = PALETTES[look];
  const paper = look === "paper";
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: -300,
          bottom: -180,
          width: 640,
          height: 340,
          clipPath: "polygon(0% 100%, 0% 46%, 18% 25%, 39% 44%, 56% 12%, 76% 38%, 100% 100%)",
          background: paper
            ? "linear-gradient(155deg, #3a2418, #120a06)"
            : `linear-gradient(155deg, ${p.mid[2]}, ${p.ink})`,
          filter: paper ? "blur(4px)" : "blur(2px)",
          opacity: paper ? 0.9 : 0.96,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -260,
          bottom: -150,
          width: 560,
          height: 280,
          clipPath: "polygon(0% 100%, 12% 46%, 34% 22%, 52% 50%, 72% 18%, 100% 54%, 100% 100%)",
          background: paper
            ? "linear-gradient(205deg, #2e1b12, #0f0805)"
            : `linear-gradient(205deg, ${p.mid[1]}, ${p.ink})`,
          filter: paper ? "blur(5px)" : "blur(3px)",
          opacity: paper ? 0.88 : 0.94,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 190,
          background:
            "linear-gradient(180deg, transparent, rgba(18, 11, 7, 0.58))",
        }}
      />
    </div>
  );
};

const PaperBirds = ({ t }: { readonly t: number }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    {[
      [1320, 250, 0.8],
      [1400, 292, 0.6],
      [1470, 232, 0.5],
      [1190, 610, 0.35],
    ].map(([x, y, opacity], index) => {
      const drift = Math.sin(t * 0.8 + index) * 12;
      return (
        <svg
          key={`bird-${index}`}
          viewBox="0 0 40 20"
          style={{
            position: "absolute",
            left: x + drift,
            top: y + Math.sin(t * 1.2 + index) * 6,
            width: 42,
            height: 22,
            opacity,
          }}
        >
          <path
            d="M2 12 Q10 2 20 11 Q30 2 38 12"
            fill="none"
            stroke="#f4e6c9"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      );
    })}
  </div>
);

const Cactus = ({
  x,
  y,
  height,
  flip,
}: {
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly flip?: boolean;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: height * 0.42,
      height,
      transform: `scaleX(${flip ? -1 : 1})`,
      opacity: 0.9,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "38%",
        top: 0,
        width: "24%",
        height: "100%",
        borderRadius: "40% 40% 8% 8%",
        background: "linear-gradient(90deg, #2e2117, #4a3423)",
        border: "1px solid rgba(244, 226, 190, 0.22)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: "26%",
        width: "46%",
        height: "15%",
        borderRadius: 999,
        background: "linear-gradient(180deg, #3b2a1d, #24170f)",
        border: "1px solid rgba(244, 226, 190, 0.16)",
        transform: "rotate(18deg)",
        transformOrigin: "100% 50%",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "18%",
        width: "38%",
        height: "13%",
        borderRadius: 999,
        background: "linear-gradient(180deg, #3b2a1d, #24170f)",
        border: "1px solid rgba(244, 226, 190, 0.16)",
        transform: "rotate(-24deg)",
        transformOrigin: "0% 50%",
      }}
    />
  </div>
);

export const CanyonProps = ({
  t,
  showPole = true,
}: {
  readonly t: number;
  readonly showPole?: boolean;
}) => (
  <div style={{ position: "absolute", inset: 0 }}>
    {showPole ? (
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }}
      >
        <path
          d="M 120 274 Q 940 320 1822 258"
          fill="none"
          stroke="rgba(38, 22, 14, 0.4)"
          strokeWidth={2}
        />
        <path
          d="M 120 302 Q 940 348 1822 286"
          fill="none"
          stroke="rgba(38, 22, 14, 0.32)"
          strokeWidth={1.5}
        />
        <path
          d="M 120 330 Q 940 376 1822 314"
          fill="none"
          stroke="rgba(38, 22, 14, 0.24)"
          strokeWidth={1}
        />
        <rect x={1815} y={206} width={10} height={724} fill="#2d1c12" opacity={0.9} />
        <rect x={1778} y={246} width={84} height={8} fill="#3a2619" />
        <rect x={1778} y={278} width={84} height={8} fill="#3a2619" />
        {[1788, 1812, 1836].map((x, index) => (
          <circle
            key={`insulator-${index}`}
            cx={x}
            cy={244}
            r={5}
            fill="#c9a45e"
            opacity={0.7}
          />
        ))}
        {[1788, 1812, 1836].map((x, index) => (
          <circle
            key={`insulator-b-${index}`}
            cx={x}
            cy={276}
            r={5}
            fill="#c9a45e"
            opacity={0.7}
          />
        ))}
      </svg>
    ) : null}
    <Cactus x={1092} y={748} height={182} />
    <Cactus x={946} y={812} height={118} flip />
    <div
      style={{
        position: "absolute",
        left: 1320,
        top: 690,
        width: 170,
        height: 60,
        borderRadius: "50% 50% 0 0",
        background: "linear-gradient(180deg, #543a26, #2b1b11)",
        opacity: 0.9,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 1370,
        top: 720,
        width: 70,
        height: 30,
        borderRadius: "50% 50% 0 0",
        background: "linear-gradient(180deg, #6b4a2f, #332116)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 1500 + Math.sin(t * 0.7) * 12,
        top: 430,
        width: 7,
        height: 4,
        background: "rgba(244, 224, 183, 0.35)",
        transform: "rotate(23deg)",
      }}
    />
  </div>
);

export const Motes = ({ t }: { readonly t: number }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    {new Array(26).fill(0).map((_, index) => {
      const x = 120 + ((index * 173) % 1700);
      const y = 180 + ((index * 97) % 560);
      const size = 1.5 + (index % 4) * 1.1;
      return (
        <div
          key={`mote-${index}`}
          style={{
            position: "absolute",
            left: x + Math.sin(t * 0.6 + index) * 14,
            top: y + Math.cos(t * 0.45 + index * 1.7) * 10,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(255, 231, 189, 0.7)",
            boxShadow: "0 0 6px rgba(255, 215, 153, 0.5)",
            opacity: 0.18 + (index % 5) * 0.07,
          }}
        />
      );
    })}
  </div>
);

export const CardTower = ({
  x,
  y,
  w,
  h,
  cols,
  rows,
  seed,
}: {  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly cols: number;
  readonly rows: number;
  readonly seed: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: "linear-gradient(155deg, #5b3424, #341c15)",
      border: "1px solid rgba(246, 221, 176, 0.35)",
      boxShadow: "0 18px 30px rgba(18, 9, 5, 0.35)",
      borderRadius: 2,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 8,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 4,
      }}
    >
      {new Array(cols * rows).fill(0).map((_, index) => (
        <div
          key={`drawer-${seed}-${index}`}
          style={{
            background:
              index % 5 === 0
                ? "linear-gradient(180deg, #81553b, #512d20)"
                : "linear-gradient(180deg, #6c422d, #43251a)",
            border: "1px solid rgba(28, 14, 8, 0.45)",
            boxShadow: "inset 0 1px 0 rgba(255, 222, 175, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 10,
              height: 2,
              borderRadius: 2,
              background: "#c9a45e",
              opacity: 0.75,
            }}
          />
        </div>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 7,
        background: "rgba(246, 221, 176, 0.22)",
      }}
    />
  </div>
);

const BookSpine = ({
  x,
  y,
  w,
  h,
  color,
  label,
}: {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly color: string;
  readonly label: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: "3px 3px 0 0",
      background: `linear-gradient(90deg, ${color}, rgba(18, 9, 5, 0.82))`,
      border: "1px solid rgba(246, 221, 176, 0.22)",
      boxShadow: "0 16px 22px rgba(18, 9, 5, 0.3)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        top: 18,
        height: 2,
        background: "rgba(244, 224, 183, 0.32)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 8,
        right: 8,
        bottom: 18,
        height: 1,
        background: "rgba(244, 224, 183, 0.24)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        transform: "translate(-50%, -50%) rotate(-90deg)",
        transformOrigin: "center",
        fontFamily: '"Manrope Variable", sans-serif',
        fontSize: 9,
        letterSpacing: 2,
        color: "rgba(244, 224, 183, 0.4)",
        whiteSpace: "nowrap",
      }}
    >
      ARCHIVE {String(label).padStart(3, "0")}
    </div>
  </div>
);

export const KnowledgeValley = ({ t }: { readonly t: number }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        left: 700,
        top: 500,
        width: 1600,
        height: 280,
        background:
          "radial-gradient(ellipse, rgba(255, 225, 170, 0.22), transparent 68%)",
        filter: "blur(18px)",
      }}
    />
    <CardTower x={120} y={430} w={240} h={420} cols={4} rows={8} seed={1} />
    <CardTower x={520} y={500} w={190} h={350} cols={3} rows={7} seed={2} />
    <CardTower x={1720} y={520} w={230} h={340} cols={4} rows={7} seed={3} />
    <CardTower x={2420} y={510} w={210} h={340} cols={3} rows={6} seed={4} />
    <BookSpine x={390} y={560} w={64} h={290} color="#6f4a2f" label={12} />
    <BookSpine x={462} y={610} w={42} h={240} color="#3b5548" label={13} />
    <BookSpine x={740} y={530} w={78} h={320} color="#7c5033" label={14} />
    <BookSpine x={826} y={590} w={48} h={260} color="#3b4f52" label={15} />
    <BookSpine x={2120} y={540} w={70} h={310} color="#6d4630" label={16} />
    <BookSpine x={2196} y={600} w={46} h={250} color="#3c534d" label={17} />
    {[
      [1150, 190, 90, 130, -1.5],
      [1248, 240, 76, 110, 1.2],
      [1280, 176, 84, 124, 0.4],
      [2020, 220, 82, 120, -0.8],
    ].map(([x, y, w, h, rot], index) => (
      <div
        key={`hanging-${index}`}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          background: "linear-gradient(135deg, #efe0c1, #cbb58e)",
          border: "1px solid rgba(58, 34, 20, 0.55)",
          boxShadow: "0 14px 22px rgba(18, 9, 5, 0.28)",
          transform: `rotate(${rot}deg)`,
        }}
      >
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={`hanging-line-${index}-${row}`}
            style={{
              position: "absolute",
              left: 12,
              top: 18 + row * 17,
              width: w - 24 - (row % 3) * 10,
              height: 2,
              background: "rgba(62, 38, 23, 0.35)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -70,
            height: 70,
            width: 1,
            background: "rgba(38, 22, 14, 0.5)",
          }}
        />
      </div>
    ))}
    {[0, 1, 2, 3].map((index) => (
      <div
        key={`valley-dust-${index}`}
        style={{
          position: "absolute",
          left: 260 + index * 560 + Math.sin(t * 1.3 + index) * 18,
          top: 480 + Math.sin(t * 0.9 + index * 2) * 24,
          width: 7 + (index % 2) * 5,
          height: 3,
          background: "rgba(244, 224, 183, 0.35)",
          transform: `rotate(${index * 31}deg)`,
        }}
      />
    ))}
  </div>
);

export const TextRibbon = ({
  x,
  top,
  width,
  height,
  rotation,
  tone,
}: {
  readonly x: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly tone: "cream" | "dark";
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top,
      width,
      height,
      transform: `rotate(${rotation}deg)`,
      filter: "drop-shadow(0 18px 22px rgba(20, 10, 5, 0.34))",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "cream"
            ? "linear-gradient(112deg, #f6e6c8 0%, #e8d2ac 48%, #d3b789 100%)"
            : "linear-gradient(115deg, #1b3d3e 0%, #112a2c 58%, #0b1c1f 100%)",
        border:
          tone === "cream"
            ? "1px solid rgba(86, 50, 27, 0.5)"
            : "1px solid rgba(235, 201, 138, 0.35)",
        clipPath:
          "polygon(0% 7%, 2% 2%, 7% 4%, 14% 1%, 22% 3%, 33% 0%, 45% 3%, 58% 1%, 71% 3%, 83% 0%, 92% 4%, 98% 1%, 100% 9%, 99% 91%, 96% 98%, 88% 95%, 79% 99%, 68% 96%, 55% 99%, 42% 96%, 31% 99%, 19% 96%, 9% 99%, 2% 94%, 0% 88%)",
        boxShadow: "inset 0 1px 0 rgba(255, 244, 220, 0.25)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        top: "50%",
        height: 1,
        background:
          tone === "cream"
            ? "rgba(86, 50, 27, 0.16)"
            : "rgba(235, 201, 138, 0.16)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 16,
        top: 16,
        width: 10,
        height: 10,
        borderRadius: "50%",
        border:
          tone === "cream"
            ? "1px solid rgba(86, 50, 27, 0.4)"
            : "1px solid rgba(235, 201, 138, 0.42)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 15,
        width: 10,
        height: 10,
        borderRadius: "50%",
        border:
          tone === "cream"
            ? "1px solid rgba(86, 50, 27, 0.4)"
            : "1px solid rgba(235, 201, 138, 0.42)",
      }}
    />
  </div>
);

export const PosterGrade = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(18, 40, 42, 0.18) 0%, transparent 28%, transparent 64%, rgba(38, 18, 10, 0.4) 100%)",
        mixBlendMode: "multiply",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 72% 48%, rgba(255, 199, 123, 0.2), transparent 52%)",
        mixBlendMode: "screen",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 46%, transparent 40%, rgba(12, 7, 4, 0.5) 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.16,
        mixBlendMode: "overlay",
        background:
          "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,244,218,0.16) 2px, rgba(255,244,218,0.16) 3px), repeating-linear-gradient(91deg, transparent 0px, transparent 5px, rgba(28,15,8,0.12) 5px, rgba(28,15,8,0.12) 6px)",
      }}
    />
  </AbsoluteFill>
);

export const Backdrop = ({
  cam,
  look,
  t,
  valley = false,
}: {
  readonly cam: CameraState;
  readonly look: Look;
  readonly t: number;
  readonly valley?: boolean;
}) => (
  <>
    <Layer cam={cam} parallax={0.04}>
      <Sky look={look} />
    </Layer>
    <Layer cam={cam} parallax={0.22}>
      <div style={{ position: "absolute", inset: 0, filter: "blur(1.6px)", opacity: 0.94 }}>
        <FarMesas look={look} />
      </div>
    </Layer>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, transparent 32%, rgba(244, 206, 150, 0.12) 58%, transparent 78%)",
        pointerEvents: "none",
      }}
    />
    {valley ? (
      <Layer cam={cam} parallax={0.32}>
        <div style={{ position: "absolute", inset: 0, filter: "blur(0.9px)", opacity: 0.9 }}>
          <KnowledgeValley t={t} />
        </div>
      </Layer>
    ) : null}
    <Layer cam={cam} parallax={0.5}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: look === "paper" ? "blur(0.55px)" : undefined,
        }}
      >
        <MidGround look={look} valley={valley} />
      </div>
      {look === "paper" ? <PaperBirds t={t} /> : null}
    </Layer>
    {look === "paper" ? (
      <>
        <Layer cam={cam} parallax={0.64}>
          <CanyonProps t={t} showPole={!valley} />
        </Layer>
        <Layer cam={cam} parallax={0.74}>
          <Motes t={t} />
        </Layer>
      </>
    ) : null}
    <Layer cam={cam} parallax={1}>
      <Ground look={look} />
      <Ledge t={t} look={look} />
    </Layer>
  </>
);

export const TimeHud = ({ t }: { readonly t: number }) => {
  const beat =
    t < 2.5 ? "01 立势" : t < 3.4 ? "02 坠落" : t < 4.6 ? "03 追马" : "04 上马";
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 42,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: '"Manrope Variable", sans-serif',
        fontSize: 13,
        letterSpacing: 2.2,
        color: "rgba(244, 230, 201, 0.58)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#e9b36f",
          boxShadow: "0 0 12px rgba(233, 179, 111, 0.55)",
        }}
      />
      <span>GATE 2 · {beat}</span>
      <span style={{ color: "rgba(244, 230, 201, 0.9)" }}>
        {t.toFixed(2)}s
      </span>
      <span style={{ opacity: 0.5 }}>/ 6.00s</span>
    </div>
  );
};

export const FrameGuide = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        inset: 36,
        border: "1px solid rgba(244, 230, 201, 0.1)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: WIDTH / 2 - 0.5,
        top: 0,
        width: 1,
        height: HEIGHT,
        background: "rgba(244, 230, 201, 0.045)",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: HEIGHT / 2 - 0.5,
        left: 0,
        width: WIDTH,
        height: 1,
        background: "rgba(244, 230, 201, 0.045)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 48,
        fontFamily: '"Manrope Variable", sans-serif',
        fontSize: 12,
        letterSpacing: 2.4,
        color: "rgba(244, 230, 201, 0.36)",
      }}
    >
      PAPER FRONTIER / GATE 2 / 1920×1080 / {FPS}FPS
    </div>
  </AbsoluteFill>
);

export const GroundLine = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: GROUND_Y,
      height: 1,
      background: "rgba(244, 230, 201, 0.14)",
    }}
  />
);
