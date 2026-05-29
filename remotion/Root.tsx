import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    { type: "singleword", text: "Simple.", bg: "#ffffff", accentColor: "#000000" },
    { type: "scalepunch", text: "Puissant.", bg: "#000000", accentColor: "#ffffff" },
    { type: "maskreveal", text: "Élégant.", bg: "#ffffff", accentColor: "#000000" },
    { type: "slideword", text: "Rapide.", bg: "#000000", accentColor: "#ffffff" },
    { type: "zoomword", text: "Précis.", bg: "#ffffff", accentColor: "#000000" },
    { type: "sequentialwords", text: "Fait pour toi.", bg: "#000000", accentColor: "#ffffff" },
    { type: "appletypewriter", text: "Commence maintenant.", bg: "#ffffff", accentColor: "#000000" },
    { type: "splitwords", text: "Motionr. L'IA vidéo.", bg: "#000000", accentColor: "#ffffff" },
  ] as MotionVideoProps["scenes"],
  sceneDurations: [
    { startFrame: 0, durationFrames: 120 },
    { startFrame: 120, durationFrames: 120 },
    { startFrame: 240, durationFrames: 120 },
    { startFrame: 360, durationFrames: 120 },
    { startFrame: 480, durationFrames: 120 },
    { startFrame: 600, durationFrames: 120 },
    { startFrame: 720, durationFrames: 180 },
    { startFrame: 900, durationFrames: 150 },
  ],
  totalFrames: 1050,
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

      const total = Number.isFinite(p.totalFrames) && p.totalFrames > 0
        ? p.totalFrames
        : 1050;

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
          sceneDurations: sceneDurationsAdjusted.length ? sceneDurationsAdjusted : p.sceneDurations,
        },
      };
    }}
  />
);

registerRoot(RemotionRoot);
