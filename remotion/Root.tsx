import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";
import { AppDemoVideo, AppDemoVideoProps } from "./AppDemoVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "iphone",
      text: "Écoute.",
      bg: "#121212",
      accentColor: "#1DB954",
      geo: "dots",
      websiteUrl: "spotify.com",
    },
    {
      type: "macbook",
      text: "Le dashboard.",
      bg: "#0a2540",
      accentColor: "#635BFF",
      geo: "grid",
      websiteUrl: "stripe.com",
    },
    {
      type: "browser",
      text: "En ligne.",
      bg: "#0f0f0f",
      accentColor: "#FF0000",
      geo: "circles",
      websiteUrl: "youtube.com",
    },
    {
      type: "doubledevice",
      text: "Partout.",
      bg: "#000000",
      accentColor: "#E50914",
      geo: "dots",
      websiteUrl: "netflix.com",
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 4 }, (_, i) => ({
    startFrame: i * 180,
    durationFrames: 180,
  })),
  totalFrames: 720,
  audioSrc: null,
  musicSrc: null,
};

const defaultAppDemoProps: AppDemoVideoProps = {
  screens: [
    {
      id: "demo1",
      name: "Dashboard",
      bgColor: "#ffffff",
      url: "motionr.app",
      duration: 180,
      elements: [
        { type: "navbar", logo: "Motionr", links: ["Features", "Pricing"], ctaText: "Start" },
        { type: "hero", headline: "Crée ta vidéo.", subline: "En 3 clics.", ctaText: "Essayer" },
      ],
      mousePath: [
        { x: 50, y: 20, frame: 0, action: "move" },
        { x: 50, y: 55, frame: 60, action: "click" },
      ],
    },
  ],
  screenDurations: [{ startFrame: 0, durationFrames: 180 }],
  format: "desktop",
  accent: "#10B981",
  appName: "Motionr",
  bgColor: "#f5f5f7",
  totalFrames: 1800,
};

const RemotionRoot = () => (
  <>
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
  <Composition
    id="AppDemo"
    component={AppDemoVideo}
    durationInFrames={defaultAppDemoProps.totalFrames}
    fps={fps}
    width={1920}
    height={1080}
    defaultProps={defaultAppDemoProps}
    calculateMetadata={async ({ props }) => {
      const p = props as AppDemoVideoProps;
      const total =
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 1800;
      const isMobile = p.format === "mobile";
      return {
        durationInFrames: total,
        fps: 60,
        width: isMobile ? 1080 : 1920,
        height: isMobile ? 1920 : 1080,
        props: p,
      };
    }}
  />
  </>
);

registerRoot(RemotionRoot);
