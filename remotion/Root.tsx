import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "linedraw",
      text: "Motionr.",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "linedraw",
      text: "Élégant.",
      bg: "#000000",
      accentColor: "#ffffff",
    },
    {
      type: "shape",
      text: "Simple.",
      bg: "#ffffff",
      accentColor: "#000000",
      shape: "circle",
    },
    {
      type: "shape",
      text: "Précis.",
      bg: "#000000",
      accentColor: "#ffffff",
      shape: "square",
    },
    {
      type: "expandingshape",
      text: "Infini.",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "expandingshape",
      text: "Puissant.",
      bg: "#000000",
      accentColor: "#ffffff",
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 6 }, (_, i) => ({
    startFrame: i * 150,
    durationFrames: 150,
  })),
  totalFrames: 900,
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
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 900;

      const fmt = (p as MotionVideoProps & { format?: string }).format || "9:16";
      const w = fmt === "16:9" ? 1920 : 1080;
      const h = fmt === "16:9" ? 1080 : fmt === "1:1" ? 1080 : 1920;

      return {
        durationInFrames: total,
        fps: 60,
        width: w,
        height: h,
        props: {
          ...p,
          sceneDurations: sceneDurationsAdjusted.length
            ? sceneDurationsAdjusted
            : p.sceneDurations,
        },
      };
    }}
  />
);

registerRoot(RemotionRoot);
