import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "appletext",
      text: "L'IA qui crée.",
      text2: "Des vidéos en quelques minutes.",
      bg: "#ffffff",
      accentColor: "#7C3AED",
    },
    {
      type: "appleaccent",
      text: "Simple. Puissant.",
      text2: "Décris ton idée. Motionr fait le reste.",
      bg: "#ffffff",
      accentColor: "#7C3AED",
    },
    {
      type: "applenumber",
      text: "vidéos générées",
      text2: "",
      bg: "#ffffff",
      accentColor: "#10B981",
      counterTo: 10247,
    },
    {
      type: "appleicon",
      text: "72+ animations",
      text2: "Toujours choisies intelligemment.",
      bg: "#0a0a0a",
      accentColor: "#7C3AED",
    },
    {
      type: "applephoto",
      text: "Crée sans limite.",
      text2: "Script, voix, animations — tout automatique.",
      bg: "#ffffff",
      accentColor: "#10B981",
    },
    {
      type: "applecta",
      text: "Commence maintenant.",
      text2: "3 vidéos gratuites. Sans carte.",
      bg: "#0a0a0a",
      accentColor: "#10B981",
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: [
    { startFrame: 0, durationFrames: 150 },
    { startFrame: 150, durationFrames: 150 },
    { startFrame: 300, durationFrames: 150 },
    { startFrame: 450, durationFrames: 150 },
    { startFrame: 600, durationFrames: 150 },
    { startFrame: 750, durationFrames: 150 },
  ],
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

      const total = Number.isFinite(p.totalFrames) && p.totalFrames > 0
        ? p.totalFrames
        : 900;

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
