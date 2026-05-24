import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 30;

const getDimensions = (fmt: string) => {
  if (fmt === "16:9") return { width: 1920, height: 1080 };
  if (fmt === "1:1")  return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
};

// Démo — aperçu des nouvelles scènes dans Remotion Studio
const demoScenes = [
  { type: "typewriter", text: "Bienvenue sur MotionAI.", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "scramble", text: "Innovation.", bg: "#ffffff", accentColor: "#7C3AED" },
  { type: "neonglow", text: "NEON.", bg: "#050510", accentColor: "#ff0080" },
  { type: "progressring", text: "Performance", counterTo: 92, bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "notification", text: "Nouvelles alertes", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "starfield", text: "Au-delà des limites.", bg: "#00000f", accentColor: "#7C3AED" },
  { type: "matrix", text: "THE FUTURE.", bg: "#000800", accentColor: "#00ff41" },
  { type: "countdown", text: "5", text2: "Démarrage", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "flightboard", text: "Destinations", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "stockchart", text: "MOTION AI", bg: "#0a0a0a", accentColor: "#30d158" },
  { type: "hologram", text: "HOLOGRAM.", text2: "Next Generation", bg: "#000510", accentColor: "#00c8ff" },
  { type: "achievement", text: "First Video!", text2: "+500 XP", bg: "#0a0a0a", accentColor: "#ffd60a" },
  { type: "funnel", text: "Conversion", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "pricereveal", text: "Offre limitée", text2: "299€", counterTo: 49, bg: "#0a0a0a", accentColor: "#30d158" },
  { type: "cta", text: "Commencer.", text2: "Gratuit →", bg: "#7C3AED", accentColor: "#ffffff" },
] as any[];

const demoTotal = 30 * fps; // 1800 frames
const demoDurations = demoScenes.map(() => Math.round(demoTotal / demoScenes.length));

const RemotionRoot = () => (
  <Composition
    id="MotionVideo"
    component={MotionVideo}
    durationInFrames={7200}
    fps={fps}
    width={1080}
    height={1920}
    defaultProps={{
      audioSrc: null,
      scenes: demoScenes,
      sceneDurations: demoDurations,
      totalFrames: demoTotal,
      musicVolume: 0.12,
    } as MotionVideoProps}
    calculateMetadata={async ({ props }) => {
      const p = props as MotionVideoProps;
      const total = p.totalFrames || 1800;

      const fmt = (p as any).format || "9:16";
      const { width: w, height: h } = getDimensions(fmt);

      console.log("📐 calculateMetadata format:", fmt, w, "x", h);

      return {
        durationInFrames: Math.max(total + 30, 60),
        fps: 30,
        width: w,
        height: h,
      };
    }}
  />
);

registerRoot(RemotionRoot);
