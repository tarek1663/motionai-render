import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const testScenes = [
  { type: "singleword", text: "Nike.", bg: "#000000", accentColor: "#ffffff", geo: "dots", durationFrames: 60 },
  { type: "beatdrop", bg: "#ff0000", accentColor: "#ff0000", durationFrames: 20 },
  { type: "zoombrute", text: "Puissant.", bg: "#ffffff", accentColor: "#000000", geo: "grid", durationFrames: 80 },
  { type: "strobe", text: "Impact.", bg: "#000000", accentColor: "#ffffff", geo: "circles", durationFrames: 70 },
  { type: "explode", text: "Boom.", bg: "#ffffff", accentColor: "#000000", durationFrames: 80 },
  { type: "parallax", text: "Profond.", bg: "#000000", accentColor: "#ffffff", geo: "diagonal", durationFrames: 100 },
  { type: "shake", text: "Choc.", bg: "#ffffff", accentColor: "#000000", geo: "cross", durationFrames: 80 },
  { type: "droptext", text: "Chute.", bg: "#000000", accentColor: "#ffffff", geo: "dots", durationFrames: 90 },
  { type: "repeatcut", text: "Encore.", bg: "#ffffff", accentColor: "#000000", durationFrames: 90 },
  { type: "singleword", text: "Vite.", bg: "#000000", accentColor: "#ffffff", geo: "grid", durationFrames: 50 },
  { type: "singleword", text: "Plus.", bg: "#ffffff", accentColor: "#000000", geo: "dots", durationFrames: 40 },
  { type: "singleword", text: "Encore.", bg: "#000000", accentColor: "#ffffff", geo: "circles", durationFrames: 30 },
] as MotionVideoProps["scenes"];

const testSceneDurations = [
  { startFrame: 0, durationFrames: 60 },
  { startFrame: 60, durationFrames: 20 },
  { startFrame: 80, durationFrames: 80 },
  { startFrame: 160, durationFrames: 70 },
  { startFrame: 230, durationFrames: 80 },
  { startFrame: 310, durationFrames: 100 },
  { startFrame: 410, durationFrames: 80 },
  { startFrame: 490, durationFrames: 90 },
  { startFrame: 580, durationFrames: 90 },
  { startFrame: 670, durationFrames: 50 },
  { startFrame: 720, durationFrames: 40 },
  { startFrame: 760, durationFrames: 30 },
];

const testTotalFrames = 790;

const RemotionRoot = () => (
  <Composition
    id="MotionVideo"
    component={MotionVideo}
    durationInFrames={testTotalFrames}
    fps={fps}
    width={1080}
    height={1920}
    defaultProps={{
      audioSrc: null,
      musicSrc: null,
      scenes: testScenes,
      sceneDurations: testSceneDurations,
      totalFrames: testTotalFrames,
      musicVolume: 0.12,
    } as MotionVideoProps}
    calculateMetadata={async ({ props }) => {
      const p = props as MotionVideoProps;
      const sceneDurationsAdjusted = (p.sceneDurations || []).map((d) => {
        if (typeof d === "number") return Math.max(40, d);
        return {
          ...d,
          durationFrames: Math.max(40, d.durationFrames || 40),
        };
      });

      const total =
        Number.isFinite(p.totalFrames) && p.totalFrames > 0
          ? p.totalFrames
          : testTotalFrames;

      const fmt = (p as { format?: string }).format || "9:16";
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
