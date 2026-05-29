import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "appletext",
      text: "Simple.",
      text2: "Comme ça devrait l'être.",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "appleaccent",
      text: "Rapide. Précis.",
      text2: "Généré en quelques minutes.",
      bg: "#000000",
      accentColor: "#ffffff",
    },
    {
      type: "applenumber",
      text: "vidéos créées",
      text2: "",
      bg: "#ffffff",
      accentColor: "#000000",
      counterTo: 12400,
    },
    {
      type: "appleicon",
      text: "72 animations.",
      text2: "Choisies intelligemment.",
      bg: "#000000",
      accentColor: "#ffffff",
    },
    {
      type: "applephoto",
      text: "Crée sans limite.",
      text2: "Ton idée. Notre moteur.",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "applecta",
      text: "Commence.",
      text2: "3 vidéos gratuites.",
      bg: "#000000",
      accentColor: "#ffffff",
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: [
    { startFrame: 0, durationFrames: 180 },
    { startFrame: 180, durationFrames: 180 },
    { startFrame: 360, durationFrames: 180 },
    { startFrame: 540, durationFrames: 180 },
    { startFrame: 720, durationFrames: 180 },
    { startFrame: 900, durationFrames: 180 },
  ],
  totalFrames: 1080,
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
        : 1080;

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
