import { AbsoluteFill, useCurrentFrame } from "remotion";

import { TextOverlay } from "../shared/StreamingText";
import {
  Backdrop,
  CameraFrame,
  CharacterShadows,
  Dust,
  Foreground,
  FrameGuide,
  Layer,
  TimeHud,
} from "../shared/Stage";
import {
  FPS,
  GRAY_DURATION,
  MOUNT_T,
  WIDTH,
  firstLineProgress,
  getCamera,
  questionProgress,
  secondLineProgress,
} from "../shared/config";
import { DuckStage, HorseStage } from "../shared/mascot-action";

export const PaperFrontierGraybox = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = getCamera(t);
  const first = firstLineProgress(t);
  const second = secondLineProgress(t);
  const question = questionProgress(t);
  const firstOpacity =
    1 - Math.max(0, Math.min(1, (t - 3.35) / 1.05));
  const rider = t >= MOUNT_T;

  return (
    <AbsoluteFill style={{ backgroundColor: "#171411" }}>
      <CameraFrame cam={cam}>
        <Backdrop cam={cam} look="gray" t={t} />
        <Layer cam={cam} parallax={1}>
          <TextOverlay
            firstProgress={first}
            secondProgress={second}
            questionProgress={question}
            firstOpacity={firstOpacity}
          />
          <CharacterShadows t={t} />
          <HorseStage t={t} rider={rider} />
          {!rider ? <DuckStage t={t} /> : null}
        </Layer>
        <Layer cam={cam} parallax={1.03}>
          <Dust t={t} />
        </Layer>
        <Layer cam={cam} parallax={1.3}>
          <Foreground look="gray" />
        </Layer>
      </CameraFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 46%, transparent 42%, rgba(10,7,5,0.38) 100%)",
        }}
      />
      <FrameGuide />
      <TimeHud t={Math.min(t, GRAY_DURATION)} />
      <div
        style={{
          position: "absolute",
          right: 64,
          top: 44,
          fontFamily: '"Manrope Variable", sans-serif',
          fontSize: 11,
          letterSpacing: 2.4,
          color: "rgba(244, 230, 201, 0.32)",
        }}
      >
        {WIDTH}×1080 / GATE 2
      </div>
    </AbsoluteFill>
  );
};
