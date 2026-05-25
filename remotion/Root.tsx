import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const getDimensions = (fmt: string) => {
  if (fmt === "16:9") return { width: 1920, height: 1080 };
  if (fmt === "1:1")  return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
};

// Démo — aperçu batch 3 dans Remotion Studio
const demoScenes = [
  { type: "logoreveal", text: "MotionAI", text2: "✦", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "brandintro", text: "MOTION AI", text2: "EST. 2024", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "geometric", text: "Innovation.", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "liquid", text: "Plein à ras bord.", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "heartbeat", text: "En pleine forme.", bg: "#0a0a0a", accentColor: "#ff375f" },
  { type: "audiowaveform", text: "Son premium.", text2: "ElevenLabs", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "vinyl", text: "Midnight Dreams.", text2: "MotionAI Records", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "scoreboard", text: "Mi-temps", text2: "Finale 2024", counterTo: 3, bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "infographic", text: "98%:Satisfaction|2min:Génération|1080p:Qualité|72:Scènes", text2: "MotionAI en chiffres", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "pullquote", text: "La meilleure app de motion design que j'ai jamais utilisée.", text2: "— Marie L., Créatrice", bg: "#ffffff", accentColor: "#7C3AED" },
  { type: "magazinecover", text: "L'IA qui crée.", text2: "MOTION", bg: "#0a0a0a", accentColor: "#7C3AED" },
  { type: "cta", text: "Essaie maintenant.", text2: "Gratuit →", bg: "#7C3AED", accentColor: "#ffffff" },
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
      const total = Number.isFinite(p.totalFrames) && p.totalFrames > 0
        ? p.totalFrames
        : 1800;

      console.log("📐 calculateMetadata totalFrames:", total, "=", total / 60, "seconds");

      const fmt = (p as any).format || "9:16";
      const w = fmt === "16:9" ? 1920 : 1080;
      const h = fmt === "16:9" ? 1080 : fmt === "1:1" ? 1080 : 1920;

      return {
        durationInFrames: total,
        fps: 60,
        width: w,
        height: h,
      };
    }}
  />
);

registerRoot(RemotionRoot);
