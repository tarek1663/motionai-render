import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 30;

const getDimensions = (fmt: string) => {
  if (fmt === "16:9") return { width: 1920, height: 1080 };
  if (fmt === "1:1")  return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
};

// Démo Screenshot → Vidéo (mockup + motion)
const demoScenes = [
  {
    type: "glitch",
    text: "MonSaaS.",
    text2: "La solution N°1",
    bg: "#0a0a0a",
    accentColor: "#4285f4",
  },
  {
    type: "mockup",
    text: "Interface intuitive.",
    text2: "app.monsaas.com",
    mockupType: "browser",
    photoUrl: "photos/test.jpg",
    bg: "#0a0a0a",
    accentColor: "#4285f4",
  },
  {
    type: "particles",
    text: "Performant.",
    bg: "#0a0a0a",
    accentColor: "#4285f4",
  },
  {
    type: "mockup",
    text: "Partout avec toi.",
    text2: "app.monsaas.com",
    mockupType: "phone",
    photoUrl: "photos/test.jpg",
    bg: "#050510",
    accentColor: "#4285f4",
  },
  {
    type: "zoompunch",
    text: "N°1 mondial.",
    text2: "depuis 2024.",
    bg: "#ffffff",
    accentColor: "#4285f4",
  },
  {
    type: "cta",
    text: "Essaie maintenant.",
    text2: "Gratuit pour commencer.",
    bg: "#4285f4",
    accentColor: "#ffffff",
  },
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
