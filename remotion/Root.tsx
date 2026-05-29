import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "iphone",
      text: "L'app mobile.",
      bg: "#000000",
      accentColor: "#10B981",
      geo: "dots",
    },
    {
      type: "macbook",
      text: "Le dashboard.",
      bg: "#ffffff",
      accentColor: "#000000",
      url: "motionr.app",
      geo: "grid",
    },
    {
      type: "doubledevice",
      text: "Partout.",
      bg: "#ffffff",
      accentColor: "#7C3AED",
      geo: "circles",
    },
    {
      type: "browser",
      text: "En ligne.",
      bg: "#000000",
      accentColor: "#10B981",
      url: "motionr.app",
      geo: "dots",
    },
    {
      type: "dashboard",
      text: "Analytics.",
      bg: "#000000",
      accentColor: "#10B981",
      dashTitle: "Motionr Stats",
      geo: "grid",
    },
    {
      type: "chat",
      text: "Simple.",
      bg: "#ffffff",
      accentColor: "#000000",
      messages: [
        { text: "Génère une vidéo Nike", isUser: false },
        { text: "Vidéo prête en 2min ✓", isUser: true },
      ],
    },
    {
      type: "network",
      text: "Connecté.",
      bg: "#000000",
      accentColor: "#7C3AED",
      geo: "dots",
    },
    {
      type: "dataflow",
      text: "Intelligence.",
      bg: "#000000",
      accentColor: "#10B981",
    },
    {
      type: "worldmap",
      text: "Mondial.",
      bg: "#000000",
      accentColor: "#10B981",
    },
    {
      type: "horizontaltimeline",
      text: "Notre histoire.",
      bg: "#ffffff",
      accentColor: "#000000",
      events: [
        { year: "2023", label: "Lancement" },
        { year: "2024", label: "10K users" },
        { year: "2025", label: "1M vidéos" },
      ],
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 10 }, (_, i) => ({
    startFrame: i * 180,
    durationFrames: 180,
  })),
  totalFrames: 1800,
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
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 1800;

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
