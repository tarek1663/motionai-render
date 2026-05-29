import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    { type: "singleword", text: "Simple.", bg: "#ffffff" },
    { type: "maskreveal", text: "Élégant.", bg: "#000000" },
    { type: "zoomword", text: "Rapide.", bg: "#ffffff" },
    { type: "slideword", text: "Précis.", bg: "#000000" },
    { type: "singleword", text: "Puissant.", bg: "#ffffff" },
    { type: "maskreveal", text: "Pour toi.", bg: "#000000" },
    { type: "zoomword", text: "Motionr.", bg: "#ffffff" },
    { type: "slideword", text: "Commence.", bg: "#000000" },
  ] as MotionVideoProps["scenes"],
  sceneDurations: [
    { startFrame: 0, durationFrames: 120 },
    { startFrame: 120, durationFrames: 120 },
    { startFrame: 240, durationFrames: 120 },
    { startFrame: 360, durationFrames: 120 },
    { startFrame: 480, durationFrames: 120 },
    { startFrame: 600, durationFrames: 120 },
    { startFrame: 720, durationFrames: 120 },
    { startFrame: 840, durationFrames: 120 },
  ],
  totalFrames: 960,
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
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 960;

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
