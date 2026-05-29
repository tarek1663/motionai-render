import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "splitcolor",
      text: "Jaune ou noir.",
      bg: "#FDD835",
      bg2: "#000000",
      geo: "dots",
    },
    {
      type: "colorletters",
      text: "Motionr.",
      bg: "#000000",
      accentColor: "#10B981",
      geo: "grid",
    },
    {
      type: "gradient",
      text: "Premium.",
      bg: "#000000",
      bg2: "#1a1a2e",
      accentColor: "#7C3AED",
      geo: "cross",
    },
    {
      type: "hierarchytext",
      text: "Simple puissant rapide.",
      bg: "#ffffff",
      accentColor: "#000000",
      geo: "lines",
    },
    {
      type: "spotlight",
      text: "L'IA vidéo.",
      bg: "#000000",
      accentColor: "#ffffff",
      geo: "dots",
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 5 }, (_, i) => ({
    startFrame: i * 150,
    durationFrames: 150,
  })),
  totalFrames: 750,
  audioSrc: null,
  musicSrc: null,
};

const RemotionRoot = () => (
  <Composition
    id="MotionVideo"
    component={MotionVideo}
    durationInFrames={defaultProps.totalFrames}
    fps={fps}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
    calculateMetadata={async ({ props }) => {
      const p = props as MotionVideoProps;
      const sceneDurationsAdjusted = (p.sceneDurations || []).map((d) => {
        if (typeof d === "number") return Math.max(120, d);
        return {
          ...d,
          durationFrames: Math.max(120, d.durationFrames || 120),
        };
      });

      const total =
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 750;

      const fmt = (p as MotionVideoProps & { format?: string }).format || "9:16";
      const w = fmt === "16:9" ? 1920 : 1080;
      const h = fmt === "16:9" ? 1080 : fmt === "1:1" ? 1080 : 1920;

      return {
        durationInFrames: total,
        width: w,
        height: h,
        props: {
          ...p,
          sceneDurations: sceneDurationsAdjusted,
        },
      };
    }}
  />
);

registerRoot(RemotionRoot);
