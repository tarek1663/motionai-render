import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "quote",
      text: "L'IA change tout.",
      author: "Motionr",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "beforeafter",
      before: "Des heures",
      after: "2 minutes",
      bg: "#000000",
      accentColor: "#10B981",
    },
    {
      type: "timeline",
      bg: "#ffffff",
      accentColor: "#000000",
      steps: [
        { number: "01", label: "Décris ton idée" },
        { number: "02", label: "L'IA génère" },
        { number: "03", label: "Tu publies" },
      ],
    },
    {
      type: "socialstats",
      bg: "#000000",
      accentColor: "#10B981",
      platform: "Instagram",
      statLabel: "abonnés",
      counterTo: 250000,
    },
    {
      type: "cinematictitle",
      text: "Motionr",
      subtitle: "L'IA vidéo",
      bg: "#000000",
    },
    {
      type: "checklist",
      bg: "#ffffff",
      accentColor: "#000000",
      items: ["Script auto", "Voix naturelle", "1080p", "Prêt à publier"],
    },
    {
      type: "location",
      text: "Paris, France",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "productmockup",
      text: "Motionr App",
      bg: "#000000",
      accentColor: "#10B981",
    },
    {
      type: "headline",
      text: "L'IA crée vos vidéos.",
      tag: "NOUVEAU",
      bg: "#ffffff",
      accentColor: "#000000",
    },
    {
      type: "audioviz",
      text: "Voix naturelle.",
      bg: "#000000",
      accentColor: "#ffffff",
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 10 }, (_, i) => ({
    startFrame: i * 150,
    durationFrames: 150,
  })),
  totalFrames: 1500,
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
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 1500;

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
