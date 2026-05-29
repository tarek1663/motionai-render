import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    { type: "fadeupl", text: "Élégant.", bg: "#ffffff" },
    { type: "blurin", text: "Fluide.", bg: "#000000" },
    { type: "scalein", text: "Précis.", bg: "#ffffff" },
    { type: "slideup", text: "Rapide.", bg: "#000000" },
    { type: "cliptop", text: "Simple.", bg: "#ffffff" },
    { type: "staggerwords", text: "Fait pour toi.", bg: "#000000" },
    { type: "morphweight", text: "Premium.", bg: "#ffffff" },
    { type: "fadepure", text: "Sobre.", bg: "#000000" },
    { type: "tracking", text: "Motionr.", bg: "#ffffff" },
    { type: "rotatein", text: "Commence.", bg: "#000000" },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 10 }, (_, i) => ({
    startFrame: i * 120,
    durationFrames: 120,
  })),
  totalFrames: 1200,
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
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 1200;

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
