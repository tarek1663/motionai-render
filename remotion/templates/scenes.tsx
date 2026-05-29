import {
  AbsoluteFill, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";
import React from "react";
import { IconComponent, detectIcon, type IconType } from "./icons";

const fontFamily = "'SF Pro Display', 'SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', sans-serif";

/** Chiffres alignés style SF Pro */
const tabularNums = { fontVariantNumeric: "tabular-nums" as const };

// Easing premium Apple — accélération rapide, décélération douce
const E_PREMIUM = Easing.bezier(0.16, 1, 0.3, 1);
const E_OUT = E_PREMIUM;
const E_IN   = Easing.bezier(0.7, 0, 0.84, 0);
const E_IO   = Easing.bezier(0.76, 0, 0.24, 1);

const APPLE_SPRING = { damping: 32, stiffness: 220, mass: 0.8 };
const APPLE_CARD_SHADOW = "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)";

const CLAMP_BOTH = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/** Input range strictement croissante pour interpolate() */
const monoRange = (...values: number[]): number[] => {
  const out: number[] = [];
  for (const v of values) {
    const n = Number.isFinite(v) ? v : 0;
    if (out.length === 0) {
      out.push(n);
    } else if (n > out[out.length - 1]) {
      out.push(n);
    }
  }
  return out.length >= 2 ? out : [0, 1];
};

const scenePhotoSrc = (photoUrl?: string) =>
  photoUrl?.startsWith("http")
    ? photoUrl
    : photoUrl
      ? staticFile(photoUrl.replace(/^\//, ""))
      : "";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
export type SceneData = {
  type:
    | "word" | "split" | "sentence" | "counter" | "chart" | "card" | "cta"
    | "reveal" | "kinetic" | "glitch" | "floatstats" | "zoompunch"
    | "particles" | "timeline" | "highlight" | "numbers" | "icon"
    | "worldmap" | "waveform" | "progressbars" | "quote" | "countdown"
    | "mirror" | "datascroll" | "burst" | "morphshapes" | "text3d" | "splitscreen"
    | "photo" | "mockup" | "reconstructed" | "generatedui"
    | "typewriter" | "scramble" | "neonglow" | "stamp" | "wavetext"
    | "outlinefill" | "odometer" | "progressring" | "gauge" | "bubblechart"
    | "notification" | "successcheck" | "featurehighlight" | "likeexplosion"
    | "followercounter" | "starfield" | "aurora" | "matrix" | "countdownring"
    | "xpbar" | "flightboard" | "stockchart" | "hologram" | "moneyrain" | "titlecard"
    | "magnetic" | "gradientslide" | "cascade" | "blurfocus"
    | "particlerain" | "fire" | "snow" | "sunray"
    | "funnel" | "comparisonbars" | "roi"
    | "achievement" | "circuit" | "glitchscreen"
    | "pollresults" | "commentthread"
    | "endcredits" | "wipe" | "dollyzoom"
    | "steps" | "compare" | "quotereveal" | "benefits"
    | "moodboard" | "minimalist" | "gradientbg" | "pricereveal"
    | "logoreveal" | "brandintro" | "colorpalette"
    | "property" | "scoreboard" | "playerstat"
    | "menuitem" | "heartbeat"
    | "geometric" | "liquid" | "morphshape" | "dna"
    | "swipe" | "click" | "loading"
    | "audiowaveform" | "vinyl"
    | "magazinecover" | "pullquote" | "infographic"
    | "terminal" | "toggle" | "financialchart" | "instagramprofile" | "netflixreveal"
    | "timer" | "githubstars" | "squiggletext" | "mcpanimation" | "glowtext" | "ascii"
    | "pricetag" | "musicvisualizer" | "splitreveal" | "counterpunch"
    | "cleantext" | "highlightword" | "phototext" | "photocard" | "icontext" | "stat"
    | "cleanlist" | "cleanquote" | "cleancta" | "underline" | "splittext"
    | "accentfirstword" | "bignumber" | "puretext"
    | "appletext" | "appleaccent" | "applenumber" | "applephoto" | "appleicon" | "applecta";
  text?: string;
  text2?: string;
  bg?: string;
  accentColor: string;
  counterFrom?: number;
  counterTo?: number;
  counterSuffix?: string;
  counterPrefix?: string;
  chartValues?: number[];
  chartLabel?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardMetric?: string;
  cardMetricLabel?: string;
  // Timeline
  timelineItems?: string; // "2010|Fondée|2015|100M|2020|1B"
  // Highlight
  highlightWord?: string;
  // Numbers
  numberItems?: string; // "8 Mds|92%|25 ans|N°1"
  numberLabels?: string; // "Recherches|Parts|Expérience|Rang"
  // Icon
  iconType?: string;
  photoUrl?: string;    // URL locale /photos/xxx.jpg
  photoQuery?: string;  // mot-clé Pexels (génération)
  mockupType?: "browser" | "phone" | "macbook";
  componentCode?: string;
  uiData?: UiData;
  logoUrl?: string;     // URL Clearbit
  /** Durée en frames pour cette scène (injectée par le pipeline voix) */
  _duration?: number;
  /** Index séquence (injecté par MotionVideo pour patterns) */
  _index?: number;
};

export type UiSectionItem = {
  label?: string;
  value?: string;
  trend?: string;
  icon?: string;
  type?: string;
};

export type UiSection = {
  type?: string;
  title?: string;
  subtitle?: string;
  items?: UiSectionItem[];
};

export type UiData = {
  layout?: {
    hasNavbar?: boolean;
    navbarBg?: string;
    logo?: string;
    navbarItems?: string[];
    hasSidebar?: boolean;
    sidebarItems?: string[];
  };
  sections?: UiSection[];
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  mockupType?: "browser" | "phone" | "macbook";
  productName?: string;
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
// GRAIN — plus visible
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{
      position: "absolute", inset: 0, opacity: 0.08,
      pointerEvents: "none", zIndex: 100, mixBlendMode: "overlay",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='${f % 60}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    }} />
  );
};

// VIGNETTE — plus forte
const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.65 }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99,
    background: `radial-gradient(ellipse 75% 75% at center, transparent 30%, rgba(0,0,0,${strength}) 100%)`,
  }} />
);

// DRIFT — plus subtil
const useDrift = () => {
  const f = useCurrentFrame();
  return {
    x: Math.sin(f * 0.005) * 3 + Math.sin(f * 0.011) * 1,
    y: Math.cos(f * 0.007) * 2 + Math.cos(f * 0.013) * 0.8,
    s: 1.005 + Math.sin(f * 0.004) * 0.006,
    r: Math.sin(f * 0.003) * 0.1,
  };
};

const isLight = (bg: string) =>
  bg === "#f5f5f7" || bg === "#ffffff" || bg === "#eeeeee" || bg === "#f5f5f5";

// Calcule la luminosité d'une couleur hex
const getLuminance = (hex: string): number => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Toujours retourner une couleur qui contraste avec le fond
const textColor = (bg: string): string => {
  if (isLight(bg)) return "#1d1d1f";
  const lum = getLuminance(bg);
  // Si fond clair (luminance > 0.4) → texte noir, sinon → texte blanc
  return lum > 0.4 ? "#1d1d1f" : "#f5f5f0";
};

// Couleur sous-texte qui contraste
const subTextColor = (bg: string): string => {
  if (isLight(bg)) return "#6e6e73";
  const lum = getLuminance(bg);
  return lum > 0.4 ? "#333333" : "#86868b";
};

// Couleur accent qui ne clash pas avec le fond
const safeAccent = (accent: string, bg: string): string => {
  const accentLum = getLuminance(accent);
  const bgLum = getLuminance(bg);
  const diff = Math.abs(accentLum - bgLum);
  // Contraste minimum 0.35
  if (diff < 0.35) {
    return bgLum > 0.5 ? "#0a0a0a" : "#ffffff";
  }
  return accent;
};

const getMainColor = textColor;

// ─────────────────────────────────────────────────────────
// PATTERNS GÉOMÉTRIQUES
// ─────────────────────────────────────────────────────────
const BgPattern: React.FC<{
  patternIndex: number;
  frame: number;
  bg?: string;
}> = ({ patternIndex, frame, bg = "#0a0a0a" }) => {
  const i = patternIndex % 10;
  const rot = Math.sin(frame * 0.0015) * 1.2;
  const px  = Math.sin(frame * 0.005) * 8;
  const py  = Math.cos(frame * 0.007) * 6;

  const lum = getLuminance(bg);
  const lineOpacity = lum > 0.15 ? 0.12 : 0.07;
  const dotOpacity  = lum > 0.15 ? 0.18 : 0.10;
  const lineColor   = lum > 0.4
    ? `rgba(0,0,0,${lineOpacity})`
    : `rgba(255,255,255,${lineOpacity})`;
  const dotColor    = lum > 0.4
    ? `rgba(0,0,0,${dotOpacity})`
    : `rgba(255,255,255,${dotOpacity})`;

  const wrap: React.CSSProperties = {
    position: "absolute", inset: "-15%", pointerEvents: "none",
    transform: `rotate(${rot}deg) translate(${px}px, ${py}px)`,
  };

  if (i === 0) return (
    <div style={{ ...wrap,
      backgroundImage: `
        linear-gradient(${lineColor} 1px, transparent 1px),
        linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
    }} />
  );

  if (i === 1) return (
    <div style={{ ...wrap,
      backgroundImage: `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`,
      backgroundSize: "44px 44px",
    }} />
  );

  if (i === 2) return (
    <div style={{ ...wrap,
      backgroundImage: `repeating-linear-gradient(
        -45deg,
        ${lineColor} 0px, ${lineColor} 1px,
        transparent 1px, transparent 52px
      )`,
    }} />
  );

  if (i === 3) return (
    <div style={{ position: "absolute", inset: "-15%", pointerEvents: "none",
      transform: `rotate(${rot}deg) translate(${px}px, ${py}px)`,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(${lineColor} 1px, transparent 1px),
          linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
        `,
        backgroundSize: "72px 72px",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, ${dotColor} 2px, transparent 2px)`,
        backgroundSize: "72px 72px",
      }} />
    </div>
  );

  if (i === 4) return (
    <svg style={{ position: "absolute", inset: 0, width: "120%", height: "120%",
      left: "-10%", top: "-10%", pointerEvents: "none",
      transform: `rotate(${rot}deg) translate(${px}px, ${py}px)`,
    }}>
      <defs>
        <pattern id="sq4" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect x="10" y="10" width="80" height="80" fill="none"
            stroke={lineColor} strokeWidth="1" />
          <rect x="30" y="30" width="40" height="40" fill="none"
            stroke={lineColor} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sq4)" />
    </svg>
  );

  if (i === 5) return (
    <svg style={{ position: "absolute", inset: 0, width: "120%", height: "120%",
      left: "-10%", top: "-10%", pointerEvents: "none",
      transform: `rotate(${rot * 0.5}deg) translate(${px}px, ${py}px)`,
    }}>
      <defs>
        <pattern id="circ5" x="0" y="0" width="96" height="96" patternUnits="userSpaceOnUse">
          <line x1="0" y1="24" x2="60" y2="24" stroke={lineColor} strokeWidth="0.8" />
          <line x1="36" y1="72" x2="96" y2="72" stroke={lineColor} strokeWidth="0.8" />
          <line x1="36" y1="0" x2="36" y2="48" stroke={lineColor} strokeWidth="0.8" />
          <line x1="72" y1="48" x2="72" y2="96" stroke={lineColor} strokeWidth="0.8" />
          <circle cx="36" cy="24" r="2.5" fill={dotColor} />
          <circle cx="72" cy="72" r="2.5" fill={dotColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circ5)" />
    </svg>
  );

  if (i === 6) return (
    <div style={{ position: "absolute", inset: "-15%", pointerEvents: "none",
      transform: `rotate(${rot}deg) translate(${px}px, ${py}px)`,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: "52px 52px",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, ${dotColor} 3px, transparent 3px)`,
        backgroundSize: "104px 104px",
        backgroundPosition: "26px 26px",
      }} />
    </div>
  );

  if (i === 7) return (
    <svg style={{ position: "absolute", inset: "-10%", width: "120%", height: "120%",
      pointerEvents: "none",
      transform: `rotate(${rot * 0.5}deg) translate(${px}px, ${py}px)`,
    }}>
      <defs>
        <pattern id="hex7" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
          <polygon points="40,4 76,24 76,68 40,88 4,68 4,24"
            fill="none" stroke={lineColor} strokeWidth="0.8" />
          <polygon points="80,4 116,24 116,68 80,88 44,68 44,24"
            fill="none" stroke={lineColor} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex7)" />
    </svg>
  );

  if (i === 8) return (
    <svg style={{ position: "absolute", inset: 0, width: "120%", height: "120%",
      left: "-10%", top: "-10%", pointerEvents: "none",
      transform: `rotate(${rot}deg) translate(${px}px, ${py}px)`,
    }}>
      <defs>
        <pattern id="grid8" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="80" height="80" fill="none"
            stroke={lineColor} strokeWidth="0.8" />
          <rect x="20" y="20" width="40" height="40" fill="none"
            stroke={lineColor} strokeWidth="0.5" />
          <circle cx="40" cy="40" r="2" fill={dotColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid8)" />
    </svg>
  );

  if (i === 9) return (
    <svg style={{ position: "absolute", inset: 0, width: "120%", height: "120%",
      left: "-10%", top: "-10%", pointerEvents: "none",
      transform: `rotate(${rot}deg) translate(${px}px, ${py}px)`,
    }}>
      <defs>
        <pattern id="cross9" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
          <line x1="28" y1="18" x2="28" y2="38" stroke={lineColor} strokeWidth="1" />
          <line x1="18" y1="28" x2="38" y2="28" stroke={lineColor} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cross9)" />
    </svg>
  );

  return null;
};

// ─────────────────────────────────────────────────────────
// FOND PRINCIPAL
// Alterne 50% noir / 50% couleur accent sombre
// ─────────────────────────────────────────────────────────
const Bg: React.FC<{
  color: string;
  accent?: string;
  sceneIndex?: number;
}> = ({ color, sceneIndex = 0 }) => {
  const patterns = [
    `radial-gradient(circle, ${isLight(color) ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"} 1px, transparent 1px)`,
    `repeating-linear-gradient(0deg, transparent, transparent 80px, ${isLight(color) ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)"} 80px, ${isLight(color) ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)"} 81px)`,
    "none",
  ];

  const pattern = patterns[sceneIndex % patterns.length];

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: color,
      backgroundImage: pattern === "none" ? undefined : pattern,
      backgroundSize: pattern === "none" ? undefined : "40px 40px",
    }} />
  );
};

// Anneaux de profondeur améliorés
const DepthRings: React.FC<{ accent: string; intensity?: number }> = ({ accent, intensity = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <svg
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        width={3200} height={3200} viewBox="-1600 -1600 3200 3200"
      >
        {[240, 520, 840, 1200, 1560].map((r, i) => (
          <circle key={i} cx={0} cy={0} r={r} fill="none"
            stroke={accent} strokeWidth={i === 0 ? 1.2 : 0.6}
            strokeOpacity={(0.1 - i * 0.015) * intensity}
            strokeDasharray={i % 2 === 0 ? "none" : `${r * 0.15} ${r * 0.08}`}
            transform={`rotate(${frame * 0.06 * (i % 2 === 0 ? 1 : -0.8)})`}
          />
        ))}
        {/* Croix centrale */}
        <line x1={-30} y1={0} x2={30} y2={0} stroke={accent} strokeWidth={0.5} strokeOpacity={0.08 * intensity} />
        <line x1={0} y1={-30} x2={0} y2={30} stroke={accent} strokeWidth={0.5} strokeOpacity={0.08 * intensity} />
      </svg>
    </div>
  );
};

// ACCENT LINE — avec glow
const AccentLine: React.FC<{ accent: string; delay?: number; width?: number }> = ({ accent, delay = 10, width = 70 }) => {
  const frame = useCurrentFrame();
  const w  = interpolate(Math.max(0, frame - delay), [0, 22], [0, width], { extrapolateRight: "clamp", easing: E_OUT });
  const op = interpolate(Math.max(0, frame - delay), [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{
      width: w, height: 3,
      background: `linear-gradient(90deg, ${accent}66, ${accent}, ${accent}66)`,
      borderRadius: 2, opacity: op,
      boxShadow: `0 0 20px ${accent}99, 0 0 40px ${accent}44`,
    }} />
  );
};

const useFade = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_PREMIUM,
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );

  return Math.min(fadeIn, fadeOut);
};

const useTextReveal = (delay = 0) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_PREMIUM,
  });

  const y = interpolate(localFrame, [0, 20], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_PREMIUM,
  });

  const blur = interpolate(localFrame, [0, 16], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_PREMIUM,
  });

  return { opacity, y, blur };
};

const useFloat = (amplitude = 5, speed = 0.025, offset = 0) => {
  const frame = useCurrentFrame();
  return Math.sin(frame * speed + offset) * amplitude;
};

const useScaleIn = (delay = 0, from = 0.96) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: APPLE_SPRING,
    from,
    to: 1,
  });
};

const useMicroZoom = (from = 1.0, to = 1.03) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
};

/** Fond avec micro-zoom Apple (1.00 → 1.025) */
const SceneBg: React.FC<{
  color: string;
  accent?: string;
  sceneIndex?: number;
}> = (props) => {
  const bgZoom = useMicroZoom(1.0, 1.025);
  return (
    <div style={{
      position: "absolute", inset: 0,
      transform: `scale(${bgZoom})`,
      transformOrigin: "center center",
      overflow: "hidden",
    }}>
      <Bg {...props} />
    </div>
  );
};

// FONT SIZE — titres Apple plus gros et bold
const autoFontSize = (text: string, max = 160, min = 60): number => {
  const len = (text || "").replace(/\s+/g, " ").trim().length;
  if (len <= 4) return max;
  if (len <= 8) return Math.round(max * 0.85);
  if (len <= 12) return Math.round(max * 0.7);
  if (len <= 20) return Math.round(max * 0.55);
  if (len <= 30) return Math.round(max * 0.45);
  return Math.max(min, Math.round(max * 0.35));
};

const MAIN_TEXT_BOX: React.CSSProperties = {
  width: "100%",
  overflow: "visible",
  wordBreak: "break-word",
  whiteSpace: "normal",
};

// TRACKING — plus serré
const autoTracking = (fontSize: number): string => {
  if (fontSize >= 180) return "-0.07em";
  if (fontSize >= 140) return "-0.06em";
  if (fontSize >= 100) return "-0.05em";
  if (fontSize >= 70)  return "-0.04em";
  return "-0.03em";
};

// LINE HEIGHT — plus serré sur les grands titres
const autoLineHeight = (fontSize: number): number => {
  if (fontSize >= 180) return 0.88;
  if (fontSize >= 140) return 0.92;
  if (fontSize >= 100) return 0.95;
  return 1.1;
};

// GLOW TEXT — drop shadow coloré
const glowStyle = (color: string, intensity = 1): React.CSSProperties => {
  const a1 = Math.round(intensity * 60).toString(16).padStart(2, "0");
  const a2 = Math.round(intensity * 30).toString(16).padStart(2, "0");
  const a3 = Math.round(intensity * 80).toString(16).padStart(2, "0");
  return {
    textShadow: `0 0 40px ${color}${a1}, 0 0 80px ${color}${a2}`,
    filter: `drop-shadow(0 0 20px ${color}${a3})`,
  };
};

// ---------------------------------------------------------
// 1. WORD SCENE
// ---------------------------------------------------------
export const WordScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const words = (scene.text || "").split(" ");
  const fontSize = autoFontSize(scene.text || "", 160, 70);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexWrap: "wrap", gap: 16, padding: "0 80px",
        opacity: fade,
      }}>
        {words.map((word, i) => {
          const delay = i * 8;
          const localFrame = Math.max(0, frame - delay);
          const opacity = interpolate(localFrame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
          const y = interpolate(localFrame, [0, 20], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
          const blur = interpolate(localFrame, [0, 16], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
          const scale = spring({ frame: localFrame, fps, config: APPLE_SPRING, from: 0.96, to: 1 });
          const floatY = Math.sin(frame * 0.025 + i * 0.5) * 5;

          return (
            <span key={i} style={{
              fontSize,
              fontWeight: 900,
              fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: i % 2 === 0 ? textColor(bg) : safeAccent(scene.accentColor, bg),
              transform: `translateY(${y + floatY}px) scale(${scale})`,
              filter: `blur(${blur}px)`,
              opacity,
              display: "inline-block",
              lineHeight: autoLineHeight(fontSize),
            }}>
              {word}
            </span>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 2. REVEAL SCENE — texte qui sort de derrière un masque
// ---------------------------------------------------------
export const RevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const subColor = subTextColor(bg);
  const fontSize = autoFontSize(scene.text || "", 185);
  const { opacity, y, blur } = useTextReveal(0);
  const scale = useScaleIn(0, 0.96);
  const floatY = useFloat(5, 0.025, sceneIndex * 0.5);
  const text2Reveal = useTextReveal(18);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          fontSize, fontWeight: 900,
          color: textColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize),
          lineHeight: autoLineHeight(fontSize),
          opacity,
          transform: `translateY(${y + floatY}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          textAlign: "center",
          padding: "0 80px",
        }}>
          {scene.text}
        </div>
        <AccentLine accent={scene.accentColor} delay={20} />
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.32), fontWeight: 200,
            color: subColor,
            fontFamily, letterSpacing: autoTracking(Math.round(fontSize * 0.32)),
            opacity: text2Reveal.opacity,
            transform: `translateY(${text2Reveal.y}px)`,
            filter: `blur(${text2Reveal.blur}px)`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.08 : 0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 3. SPLIT SCENE
// ---------------------------------------------------------
export const SplitScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainCol = getMainColor(bg);
  const fontSize = autoFontSize(scene.text || "", 170);

  const l1s  = spring({ frame, fps, config: { damping: 32, stiffness: 260 }, from: 0.88, to: 1 });
  const l1op = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const l1bl = interpolate(frame, [0, 16], [14, 0], { extrapolateRight: "clamp" });
  const push = interpolate(Math.max(0, frame - 10), [0, 18], [0, -24], { extrapolateRight: "clamp", easing: E_OUT });

  const l2op = interpolate(Math.max(0, frame - 12), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const l2s  = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 32, stiffness: 260 }, from: 0.88, to: 1 });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 10,
        opacity: fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900,
          lineHeight: autoLineHeight(fontSize),
          letterSpacing: autoTracking(fontSize),
          fontFamily,
          color: mainCol, opacity: l1op,
          transform: `scale(${l1s}) translateY(${push}px)`,
          filter: `blur(${l1bl}px)`,
        }}>
          {scene.text}
        </div>

        <AccentLine accent={scene.accentColor} delay={16} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.max(32, Math.round(fontSize * 0.36)),
            fontWeight: 200, letterSpacing: autoTracking(Math.round(fontSize * 0.36)),
            color: light ? "#6e6e73" : "#666",
            fontFamily, opacity: l2op,
            transform: `scale(${l2s})`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.1 : 0.65} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 4. SENTENCE SCENE
// ---------------------------------------------------------
export const SentenceScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const words = (scene.text || "").split(" ");
  const fontSize = 64;
  const stagger = Math.max(3, Math.floor((durationInFrames * 0.35) / Math.max(words.length, 1)));

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: fade, padding: "60px 120px",
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap",
          justifyContent: "center", alignItems: "baseline",
          gap: `${fontSize * 0.22}px`,
          textAlign: "center",
        }}>
          {words.map((word, i) => {
            const delay = i * stagger;
            const localFrame = Math.max(0, frame - delay);
            const opacity = interpolate(localFrame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
            const y = interpolate(localFrame, [0, 20], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
            const blur = interpolate(localFrame, [0, 16], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
            const scale = spring({ frame: localFrame, fps, config: APPLE_SPRING, from: 0.96, to: 1 });
            const floatY = Math.sin(frame * 0.025 + i * 0.5) * 5;
            const isAccent = i === 0;
            const isBold = i % 3 === 0;
            return (
              <span key={i} style={{
                fontSize, fontWeight: isBold ? 900 : 200,
                letterSpacing: autoTracking(fontSize),
                lineHeight: autoLineHeight(fontSize),
                color: isAccent ? safeAccent(scene.accentColor, bg) : textColor(bg),
                fontFamily, display: "inline-block",
                opacity,
                transform: `translateY(${y + floatY}px) scale(${scale})`,
                filter: `blur(${blur}px)`,
                ...(isAccent ? glowStyle(scene.accentColor, 0.4) : {}),
              }}>
                {word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette strength={light ? 0.1 : 0.65} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 5. COUNTER SCENE — avec barre de progression
// ---------------------------------------------------------
export const CounterScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const s    = spring({ frame, fps, config: { damping: 30, stiffness: 240 }, from: 0.85, to: 1 });
  const bl   = interpolate(frame, [0, 18], [20, 0], { extrapolateRight: "clamp" });
  const op   = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const idle = Math.sin(frame * 0.025) * 2;

  const from = scene.counterFrom || 0;
  const to   = scene.counterTo || 100;
  const prog = interpolate(frame, [6, Math.min(80, durationInFrames - 14)], [0, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const value = from + (to - from) * prog;
  const fontSize = 210;

  const formatted = (() => {
    if (Math.abs(to) >= 1e12) return (value / 1e12).toFixed(1).replace(".", ",") + " T";
    if (Math.abs(to) >= 1e9)  return (value / 1e9).toFixed(1).replace(".", ",") + " Mds";
    if (Math.abs(to) >= 1e6)  return (value / 1e6).toFixed(1).replace(".", ",") + " M";
    if (Math.abs(to) >= 1e3 && to < 2e4) return Math.round(value).toLocaleString("fr-FR");
    if (Math.abs(to) >= 1e3)  return (value / 1e3).toFixed(0) + "K";
    if (to <= 100)             return value.toFixed(0);
    return Math.round(value).toLocaleString("fr-FR");
  })();

  const subOp = interpolate(Math.max(0, frame - 12), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const barW  = interpolate(prog, [0, 1], [0, 1360], { easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 14,
        opacity: op * fade, textAlign: "center",
      }}>
        <div style={{
          transform: `scale(${s}) translateY(${idle}px)`,
          filter: `blur(${bl}px)`,
        }}>
          <div style={{
            fontSize, fontWeight: 900, lineHeight: autoLineHeight(fontSize),
            fontFamily,
            letterSpacing: autoTracking(fontSize),
            ...tabularNums,
            ...(isLight(bg) ? {
              color: safeAccent(scene.accentColor, bg),
            } : {
              background: `linear-gradient(145deg, ${safeAccent(scene.accentColor, bg)} 0%, #ffffff 60%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }),
            ...glowStyle(safeAccent(scene.accentColor, bg), 0.5),
          }}>
            {scene.counterPrefix || ""}{formatted}{scene.counterSuffix || ""}
          </div>
        </div>

        <div style={{
          width: 1120, height: 3,
          background: light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
          borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            width: `${(barW / 1360) * 100}%`, height: "100%",
            background: `linear-gradient(90deg, ${scene.accentColor}66, ${scene.accentColor})`,
            borderRadius: 2, boxShadow: `0 0 12px ${scene.accentColor}`,
          }} />
        </div>

        {scene.text && (
          <div style={{
            fontSize: 40, fontWeight: 200,
            color: light ? "#6e6e73" : "#666",
            fontFamily, letterSpacing: "-0.01em",
            opacity: subOp,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.1 : 0.65} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 6. CHART SCENE — courbe SVG premium
// ---------------------------------------------------------
export const ChartScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const s     = spring({ frame, fps, config: { damping: 28, stiffness: 180 }, from: 0, to: 1 });
  const idleY = s > 0.95 ? Math.sin(frame * 0.022) * 3 : 0;

  const values = scene.chartValues || [15, 28, 38, 55, 48, 72, 65, 88];
  const W = 1760, H = 720, pad = 120;
  const cW = W - pad * 2, cH = H - pad * 2;
  const maxVal = Math.max(...values);

  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * cW,
    y: pad + cH - (v / maxVal) * cH,
    value: v,
  }));

  const pathD = points.map((p, i) =>
    i === 0
      ? `M ${p.x} ${p.y}`
      : `C ${points[i - 1].x + 55} ${points[i - 1].y} ${p.x - 55} ${p.y} ${p.x} ${p.y}`
  ).join(" ");

  const pathLength = 1200;
  const revealed = interpolate(frame, [6, 80], [0, pathLength], {
    extrapolateRight: "clamp", easing: E_OUT,
  });

  const fillPath = pathD + ` L ${points[points.length - 1].x} ${pad + cH} L ${pad} ${pad + cH} Z`;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />

      {scene.chartLabel && (
        <div style={{
          position: "absolute", left: "50%", top: "14%",
          transform: "translateX(-50%)",
          fontSize: 28, fontWeight: 200,
          color: light ? "#6e6e73" : "#555",
          fontFamily, letterSpacing: "0.08em", textTransform: "uppercase",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }) * fade,
        }}>
          {scene.chartLabel}
        </div>
      )}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: `translate(-50%, -50%) translateY(${idleY}px) scale(${s})`,
        opacity: fade,
      }}>
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={safeAccent(scene.accentColor, bg)} stopOpacity="0.3" />
              <stop offset="100%" stopColor={safeAccent(scene.accentColor, bg)} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={safeAccent(scene.accentColor, bg)} stopOpacity="0.3" />
              <stop offset="100%" stopColor={safeAccent(scene.accentColor, bg)} stopOpacity="1" />
            </linearGradient>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((v, i) => (
            <line key={i}
              x1={pad} y1={pad + cH * (1 - v)}
              x2={pad + cW} y2={pad + cH * (1 - v)}
              stroke={light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
              strokeWidth={1} strokeDasharray="4 8"
            />
          ))}

          {/* Fill area */}
          <path d={fillPath} fill="url(#fillGrad)" />

          <path d={pathD} fill="none" stroke={scene.accentColor} strokeWidth={8}
            strokeDasharray={pathLength} strokeDashoffset={pathLength - revealed}
            opacity={0.25} style={{ filter: "blur(10px)" }}
          />

          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={pathLength} strokeDashoffset={pathLength - revealed}
            style={{ filter: "url(#lineGlow)" }}
          />

          {points.map((p, i) => {
            const threshold = (i / (points.length - 1)) * pathLength;
            const dotOp = interpolate(revealed, [threshold - 40, threshold + 40], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const isLast = i === points.length - 1;
            return (
              <g key={i} opacity={dotOp}>
                <circle cx={p.x} cy={p.y} r={isLast ? 18 : 10} fill={scene.accentColor} opacity={0.15} />
                <circle cx={p.x} cy={p.y} r={isLast ? 7 : 4} fill={scene.accentColor}
                  style={{ filter: `drop-shadow(0 0 8px ${scene.accentColor})` }}
                />
                {(isLast || i % 2 === 0) && (
                  <text x={p.x} y={p.y - 22} textAnchor="middle"
                    fill={light ? "#1d1d1f" : "#f5f5f0"}
                    fontSize={isLast ? 34 : 22}
                    fontWeight={isLast ? 900 : 500}
                    fontFamily={fontFamily}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {p.value}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <Vignette strength={light ? 0.1 : 0.65} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 7. CARD SCENE — avec effet lumière qui défile
// ---------------------------------------------------------
export const CardScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const delay = 0;
  const scale = useScaleIn(delay, 0.95);
  const floatY = useFloat(4, 0.02, sceneIndex * 0.8);
  const entY  = interpolate(frame, [0, 40], [60, 0], { extrapolateRight: "clamp", easing: E_PREMIUM });
  const bl    = interpolate(frame, [0, 22], [14, 0], { extrapolateRight: "clamp" });
  const tiltX = -4;
  const tiltY = 3;

  const lightX = interpolate(frame, [0, 100], [-30, 130], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const metricOp = interpolate(Math.max(0, frame - 6), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const titleOp  = interpolate(Math.max(0, frame - 14), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const lineW    = interpolate(Math.max(0, frame - 10), [0, 20], [0, 60], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
        <div style={{
          width: 1560, position: "relative", overflow: "hidden",
          background: "linear-gradient(145deg, rgba(22,22,22,0.98), rgba(10,10,10,0.98))",
          borderRadius: 24, padding: "48px 56px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: APPLE_CARD_SHADOW,
          transform: `scale(${scale}) translateY(${entY + floatY}px) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(1deg)`,
          filter: `blur(${bl}px)`,
          textAlign: "center",
        }}>
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${lightX}%`, width: "35%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            pointerEvents: "none",
          }} />

          {scene.cardMetric && (
            <div style={{
              fontSize: 120, fontWeight: 900, lineHeight: 1,
              fontFamily,
              letterSpacing: autoTracking(120),
              ...tabularNums,
              background: `linear-gradient(145deg, ${scene.accentColor} 0%, #ffffff 60%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              opacity: metricOp, marginBottom: 4,
              ...glowStyle(scene.accentColor, 0.4),
            }}>
              {scene.cardMetric}
            </div>
          )}
          {scene.cardMetricLabel && (
            <div style={{
              fontSize: 26, fontWeight: 300, color: "#555",
              fontFamily, marginBottom: 24, opacity: metricOp,
            }}>
              {scene.cardMetricLabel}
            </div>
          )}
          <div style={{
            width: lineW, height: 2, background: scene.accentColor,
            borderRadius: 2, margin: "0 auto 24px",
            boxShadow: `0 0 16px ${scene.accentColor}`,
          }} />
          {scene.cardTitle && (
            <div style={{
              fontSize: 42, fontWeight: 900, color: "#f5f5f0",
              fontFamily, letterSpacing: "-0.03em",
              opacity: titleOp, marginBottom: 10,
            }}>
              {scene.cardTitle}
            </div>
          )}
          {scene.cardSubtitle && (
            <div style={{
              fontSize: 22, fontWeight: 300, color: "#555",
              fontFamily, lineHeight: 1.6,
              opacity: interpolate(Math.max(0, frame - 20), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
            }}>
              {scene.cardSubtitle}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.65} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 9. CTA SCENE
// ---------------------------------------------------------
export const CTAScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || scene.accentColor || "#7C3AED";
  const fontSize = autoFontSize(scene.text || "", 140, 60);
  const { opacity, y, blur } = useTextReveal(0);
  const scale = useScaleIn(0, 0.96);
  const floatY = useFloat(5, 0.025, 0);
  const btnS = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 28, stiffness: 250, mass: 0.8 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24, opacity: fade }}>
        <div style={{
          fontSize,
          fontWeight: 900,
          fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: isLight(bg) ? "#0a0a0a" : "#ffffff",
          opacity,
          transform: `translateY(${y + floatY}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          textAlign: "center",
          padding: "0 80px",
          lineHeight: autoLineHeight(fontSize),
        }}>
          {scene.text}
        </div>

        {scene.text2 && (
          <div style={{
            fontSize: 32, fontWeight: 400,
            color: isLight(bg) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
            fontFamily, transform: `scale(${btnS})`, opacity: btnS,
          }}>
            {scene.text2}
          </div>
        )}

        <div style={{
          marginTop: 8,
          background: isLight(bg) ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)",
          backdropFilter: "blur(20px)",
          borderRadius: 100,
          padding: "16px 40px",
          transform: `scale(${btnS})`,
          opacity: btnS,
          border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.2)"}`,
          boxShadow: APPLE_CARD_SHADOW,
        }}>
          <span style={{
            fontSize: 22, fontWeight: 700, fontFamily,
            color: isLight(bg) ? "#0a0a0a" : "#ffffff",
            letterSpacing: "-0.01em",
          }}>
            {scene.text2 || "En savoir plus →"}
          </span>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.2} />
    </AbsoluteFill>
  );
};
// ---------------------------------------------------------
// 10. KINETIC SCENE
// ---------------------------------------------------------
export const KineticScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const words = (scene.text || "").split(" ");
  const fontSize = autoFontSize(scene.text || "", 150, 64);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        padding: "0 60px", flexWrap: "wrap", gap: 12,
        opacity: fade,
      }}>
        {words.map((word, i) => {
          const delay = i * 6;
          const localFrame = Math.max(0, frame - delay);
          const opacity = interpolate(localFrame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
          const y = interpolate(localFrame, [0, 20], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
          const blur = interpolate(localFrame, [0, 16], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM });
          const scale = spring({ frame: localFrame, fps, config: APPLE_SPRING, from: 0.96, to: 1 });
          const floatY = Math.sin(frame * 0.025 + i * 0.5) * 5;
          const isHighlight = i === Math.floor(words.length / 2);

          return (
            <span key={i} style={{
              fontSize: isHighlight ? fontSize * 1.1 : fontSize,
              fontWeight: 900,
              fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: isHighlight ? safeAccent(scene.accentColor, bg) : textColor(bg),
              transform: `translateY(${y + floatY}px) scale(${scale})`,
              filter: `blur(${blur}px)`,
              opacity,
              display: "inline-block",
              lineHeight: autoLineHeight(fontSize),
              textShadow: isHighlight ? `0 0 30px ${scene.accentColor}44` : "none",
            }}>
              {word}
            </span>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 11. GLITCH SCENE — aberration chromatique sur impact
// ---------------------------------------------------------
export const GlitchScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainColor = getMainColor(bg);
  const subColor = subTextColor(bg);

  const s    = spring({ frame, fps, config: { damping: 22, stiffness: 280 }, from: 0.85, to: 1 });
  const op   = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });

  const isGlitching = frame < 22;
  const glitchIntensity = interpolate(frame, [0, 22], [1, 0], { extrapolateRight: "clamp", easing: E_IN });

  const rShift = isGlitching ? Math.sin(frame * 8.3) * 14 * glitchIntensity : 0;
  const bShift = isGlitching ? Math.cos(frame * 7.1) * 12 * glitchIntensity : 0;

  const scanOffset = isGlitching && frame % 3 === 0 ? (Math.random() > 0.7 ? Math.sin(frame * 12) * 20 : 0) : 0;

  const fontSize = autoFontSize(scene.text || "", 190);
  const idle = Math.sin(frame * 0.028) * 3;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        {isGlitching && (
          <div style={{
            position: "absolute",
            fontSize, fontWeight: 900, color: "#ff0000",
            fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
            opacity: glitchIntensity * 0.7,
            transform: `translateX(${rShift}px) translateY(${scanOffset}px) scale(${s})`,
            mixBlendMode: "screen",
          }}>
            {scene.text}
          </div>
        )}

        {isGlitching && (
          <div style={{
            position: "absolute",
            fontSize, fontWeight: 900, color: "#0000ff",
            fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
            opacity: glitchIntensity * 0.7,
            transform: `translateX(${bShift}px) scale(${s})`,
            mixBlendMode: "screen",
          }}>
            {scene.text}
          </div>
        )}

        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900,
          color: mainColor,
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          transform: `scale(${s}) translateY(${idle}px)`,
          filter: isGlitching ? `blur(${glitchIntensity * 3}px)` : "none",
          position: "relative",
        }}>
          {scene.text}
        </div>

        <AccentLine accent={scene.accentColor} delay={22} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.3), fontWeight: 200,
            color: subColor,
            fontFamily, letterSpacing: autoTracking(Math.round(fontSize * 0.3)),
            opacity: interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
            transform: `translateY(${interpolate(Math.max(0, frame - 20), [0, 18], [18, 0], { extrapolateRight: "clamp", easing: E_OUT })}px)`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.08 : 0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 12. FLOATING STATS SCENE — 3 stats qui flottent en 3D
// ---------------------------------------------------------
export const FloatingStatsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainColor = getMainColor(bg);
  const subColor = subTextColor(bg);

  const stats = (scene.text || "N°1 | $2T | 92%").split("|").map(s => s.trim());
  const labels = (scene.text2 || "Rang mondial | Valorisation | Parts de marché").split("|").map(s => s.trim());

  const configs = [
    { delay: 0,  x: -260, y: -80,  rot: -6, zRot: -4,  scale: 0.95 },
    { delay: 10, x: 0,    y: 40,   rot: 2,  zRot: 2,   scale: 1.08 },
    { delay: 20, x: 260,  y: -60,  rot: 5,  zRot: -3,  scale: 0.92 },
  ];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} intensity={0.6} />
      <Grain />

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: fade,
      }}>
        {configs.map((cfg, i) => {
          if (i >= stats.length) return null;
          const s = spring({ frame: Math.max(0, frame - cfg.delay), fps, config: { damping: 22, stiffness: 180, mass: 1.1 }, from: 0, to: 1 });
          const entryY = interpolate(Math.max(0, frame - cfg.delay), [0, 40], [80, 0], { extrapolateRight: "clamp", easing: E_OUT });
          const bl = interpolate(Math.max(0, frame - cfg.delay), [0, 22], [12, 0], { extrapolateRight: "clamp" });

          const floatY = s > 0.95 ? Math.sin(frame * 0.025 + i * 1.8) * 8 : 0;
          const floatR = s > 0.95 ? Math.sin(frame * 0.018 + i * 1.2) * 1.5 : 0;

          const lightX = i === 1 ? interpolate(frame, [0, 180], [-20, 120], { extrapolateRight: "clamp" }) : 50;
          const cardBg = i === 1 ? "#1c1c1c" : "#121212"; // rgba(28,28,28) / rgba(18,18,18)

          return (
            <div key={i} style={{
              position: "absolute",
              transform: `translateX(${cfg.x}px) translateY(${cfg.y + entryY + floatY}px) scale(${s * cfg.scale}) perspective(1200px) rotateX(${cfg.rot + floatR}deg) rotateY(${cfg.zRot}deg)`,
              opacity: s,
              filter: `blur(${bl}px)`,
              zIndex: i === 1 ? 2 : 1,
            }}>
              <div style={{
                width: i === 1 ? 320 : 270,
                background: i === 1
                  ? `linear-gradient(145deg, rgba(28,28,28,0.99), rgba(14,14,14,0.99))`
                  : `linear-gradient(145deg, rgba(18,18,18,0.95), rgba(10,10,10,0.95))`,
                borderRadius: 20,
                padding: i === 1 ? "36px 32px" : "28px 28px",
                border: i === 1 ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
                borderTop: i === 1 ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: i === 1
                  ? `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)`
                  : `0 20px 50px rgba(0,0,0,0.35)`,
                textAlign: "center",
                overflow: "hidden",
                position: "relative",
              }}>
                {i === 1 && (
                  <div style={{
                    position: "absolute", top: 0, bottom: 0,
                    left: `${lightX}%`, width: "40%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
                    pointerEvents: "none",
                  }} />
                )}

                <div style={{
                  fontSize: i === 1 ? 72 : 58, fontWeight: 900,
                  color: i === 1 ? safeAccent(scene.accentColor, cardBg) : textColor(cardBg),
                  fontFamily, letterSpacing: autoTracking(i === 1 ? 72 : 58), lineHeight: 1,
                  ...tabularNums,
                  textShadow: i === 1 ? `0 0 40px ${scene.accentColor}55` : "none",
                }}>
                  {stats[i]}
                </div>
                <div style={{
                  fontSize: i === 1 ? 18 : 15, fontWeight: 300, color: subColor,
                  fontFamily, marginTop: 8, letterSpacing: autoTracking(i === 1 ? 18 : 15),
                }}>
                  {labels[i] || ""}
                </div>

                {i === 1 && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${scene.accentColor}, transparent)`,
                    opacity: 0.6,
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------
// 13. ZOOM PUNCH SCENE — texte qui zoom depuis l'infini
// ---------------------------------------------------------
export const ZoomPunchScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainColor = getMainColor(bg);
  const subColor = subTextColor(bg);

  const s = spring({ frame, fps, config: { damping: 14, stiffness: 220, mass: 0.8 }, from: 8, to: 1 });
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const bgS = spring({ frame, fps, config: { damping: 20, stiffness: 120 }, from: 0.3, to: 1 });

  const idle = Math.sin(frame * 0.028) * 3;
  const fontSize = autoFontSize(scene.text || "", 195);

  const subOp = interpolate(Math.max(0, frame - 18), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });

  const useGradient = !light;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <div style={{
        position: "absolute", inset: "-10%",
        background: bg,
        transform: `scale(${bgS})`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${scene.accentColor}14 0%, transparent 65%)`,
          transform: `scale(${1 + Math.sin(frame * 0.025) * 0.06})`,
        }} />
      </div>
      <DepthRings accent={scene.accentColor} />
      <Grain />

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 18,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900,
          overflow: "visible",
          ...(useGradient ? {
            background: `linear-gradient(135deg, #ffffff 0%, ${safeAccent(scene.accentColor, bg)} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          } : {
            color: mainColor,
          }),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.9,
          transform: `scale(${s}) translateY(${idle}px)`,
          filter: `blur(${bl}px)`,
        }}>
          {scene.text}
        </div>

        <AccentLine accent={scene.accentColor} delay={20} width={80} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.3), fontWeight: 200,
            color: subColor,
            overflow: "visible",
            fontFamily, letterSpacing: autoTracking(Math.round(fontSize * 0.3)),
            opacity: subOp,
            transform: `translateY(${interpolate(Math.max(0, frame - 18), [0, 18], [20, 0], { extrapolateRight: "clamp", easing: E_OUT })}px)`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.1 : 0.55} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// PARTICLES SCENE — texte avec explosion de particules
// ─────────────────────────────────────────────────────────
export const ParticlesScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainCol = getMainColor(bg);
  const fontSize = autoFontSize(scene.text || "", 185);

  const s = spring({ frame, fps, config: { damping: 28, stiffness: 200 }, from: 0.88, to: 1 });
  const op = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const blur = interpolate(frame, [0, 24], [20, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const particles = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const speed = 2 + (i % 5) * 1.2;
    const size = 2 + (i % 4);
    const delay = (i % 8) * 2;
    const f = Math.max(0, frame - delay);
    const dist = interpolate(f, [0, 50], [0, speed * 180], {
      extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    });
    const pOp = interpolate(f, [0, 8, 40, 55], [0, 1, 0.8, 0], {
      extrapolateRight: "clamp",
    });
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size, opacity: pOp,
      color: i % 3 === 0 ? safeAccent(scene.accentColor, bg) : i % 3 === 1 ? "#ffffff" : `${safeAccent(scene.accentColor, bg)}88`,
    };
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {particles.map((p, i) => (
          <div key={i} style={{
            position: "absolute",
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: p.opacity,
            transform: `translate(${p.x}px, ${p.y}px)`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: mainCol,
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          transform: `scale(${s})`, filter: `blur(${blur}px)`,
        }}>
          {scene.text}
        </div>
        <AccentLine accent={scene.accentColor} delay={12} />
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.3), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 16), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// TIMELINE SCENE — frise chronologique animée
// ─────────────────────────────────────────────────────────
export const TimelineScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const raw = (scene.text || "2010|Début|2015|Croissance|2020|Succès|2024|Leader").split("|");
  const items: { year: string; label: string }[] = [];
  for (let i = 0; i < raw.length - 1; i += 2) {
    items.push({ year: raw[i].trim(), label: raw[i + 1].trim() });
  }

  const lineProgress = interpolate(frame, [10, 70], [0, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      {scene.text2 && (
        <div style={{
          position: "absolute", left: 80, top: "16%",
          fontSize: 28, fontWeight: 200,
          color: subTextColor(bg),
          fontFamily, letterSpacing: "0.08em", textTransform: "uppercase",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }) * fade,
        }}>
          {scene.text2}
        </div>
      )}
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", opacity: fade,
        padding: "60px 120px",
      }}>
        <div style={{ position: "relative", width: "100%", marginBottom: 60 }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 2, background: "rgba(255,255,255,0.08)",
            borderRadius: 1,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0,
            height: 2, borderRadius: 1,
            width: `${lineProgress * 100}%`,
            background: `linear-gradient(90deg, ${scene.accentColor}88, ${scene.accentColor})`,
            boxShadow: `0 0 12px ${scene.accentColor}88`,
          }} />
          <div style={{
            position: "relative", display: "flex",
            justifyContent: "space-between", height: 2,
          }}>
            {items.map((item, i) => {
              const threshold = i / (items.length - 1);
              const itemProgress = interpolate(lineProgress, [threshold - 0.05, threshold + 0.05], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              });
              const s = spring({ frame: Math.max(0, frame - i * 8), fps, config: { damping: 20, stiffness: 300 }, from: 0, to: 1 });

              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  opacity: itemProgress,
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: safeAccent(scene.accentColor, bg),
                    border: `2px solid ${light ? "#f5f5f7" : "#0a0a0a"}`,
                    boxShadow: `0 0 16px ${safeAccent(scene.accentColor, bg)}88`,
                    transform: `scale(${s}) translateY(-6px)`,
                  }} />
                  <div style={{
                    fontSize: 36, fontWeight: 900, color: safeAccent(scene.accentColor, bg),
                    fontFamily, letterSpacing: "-0.04em",
                    ...tabularNums,
                    marginTop: 20,
                    transform: `translateY(${interpolate(itemProgress, [0, 1], [20, 0])}px)`,
                  }}>
                    {item.year}
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 300,
                    color: isLight(bg) ? "#6e6e73" : subTextColor(bg),
                    fontFamily, marginTop: 6, textAlign: "center", maxWidth: 160,
                    transform: `translateY(${interpolate(itemProgress, [0, 1], [10, 0])}px)`,
                  }}>
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// HIGHLIGHT SCENE — mot qui s'illumine dans une phrase
// ─────────────────────────────────────────────────────────
export const HighlightScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const words = (scene.text || "").split(" ");
  const highlightWord = (scene.text2 || "").toLowerCase();

  const phraseReveal = useTextReveal(0);
  const phraseFloat = useFloat(5, 0.025, sceneIndex * 0.5);

  const fontSize = 68;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: fade,
        padding: "60px 120px",
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap",
          justifyContent: "center", alignItems: "baseline",
          gap: `${fontSize * 0.2}px`,
          transform: `translateY(${phraseReveal.y + phraseFloat}px)`,
          filter: `blur(${phraseReveal.blur}px)`,
          opacity: phraseReveal.opacity,
          textAlign: "center",
        }}>
          {words.map((word, i) => {
            const isHighlighted = word.toLowerCase().replace(/[.,!?]/g, "") === highlightWord;
            const hlDelay = i * 5;
            const hlFrame = Math.max(0, frame - 20 - hlDelay);
            const hlProgress = interpolate(hlFrame, [0, 20], [0, 1], {
              extrapolateRight: "clamp", easing: E_OUT,
            });
            const bgWidth = isHighlighted ? interpolate(hlProgress, [0, 1], [0, 100], { easing: E_OUT }) : 0;
            const wordOp = interpolate(Math.max(0, frame - i * 5), [0, 18], [0, 1], {
              extrapolateRight: "clamp", easing: E_OUT,
            });

            return (
              <span key={i} style={{
                position: "relative", display: "inline-block",
                fontSize, fontWeight: isHighlighted ? 800 : 300,
                color: isHighlighted
                  ? (light ? "#1d1d1f" : "#f5f5f0")
                  : subTextColor(bg),
                fontFamily, letterSpacing: "-0.03em",
                opacity: wordOp,
              }}>
                {isHighlighted && (
                  <span style={{
                    position: "absolute",
                    left: `-${fontSize * 0.15}px`,
                    right: `-${fontSize * 0.15}px`,
                    top: `-${fontSize * 0.1}px`,
                    bottom: `-${fontSize * 0.1}px`,
                    background: `linear-gradient(135deg, ${scene.accentColor}33, ${scene.accentColor}22)`,
                    borderRadius: 8,
                    border: `1px solid ${scene.accentColor}44`,
                    clipPath: `inset(0 ${100 - bgWidth}% 0 0)`,
                    boxShadow: `0 0 30px ${scene.accentColor}33`,
                  }} />
                )}
                <span style={{
                  position: "relative", zIndex: 1,
                  color: isHighlighted && hlProgress > 0.5 ? safeAccent(scene.accentColor, bg) : undefined,
                }}>
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.45} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// NUMBERS SCENE — plusieurs chiffres en cascade
// ─────────────────────────────────────────────────────────
export const NumbersScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const numbers = (scene.text || "8 Mds|92%|25 ans|N°1").split("|").map(s => s.trim());
  const labels = (scene.text2 || "Recherches|Parts marché|D'expérience|Mondial").split("|").map(s => s.trim());

  const positions = [
    { x: -280, y: -200, scale: 1.1 },
    { x: 200, y: -120, scale: 0.9 },
    { x: -200, y: 160, scale: 0.85 },
    { x: 250, y: 200, scale: 1.0 },
  ];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: fade,
      }}>
        {numbers.slice(0, 4).map((num, i) => {
          const pos = positions[i] || { x: 0, y: 0, scale: 1 };
          const delay = i * 12;
          const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 200, mass: 1.1 }, from: 0, to: 1 });
          const bl = interpolate(Math.max(0, frame - delay), [0, 20], [12, 0], { extrapolateRight: "clamp" });
          const idleY = s > 0.95 ? Math.sin(frame * 0.025 + i * 1.4) * 6 : 0;
          const idleR = Math.sin(frame * 0.015 + i * 0.9) * 1.5;
          const isMain = i === 0;

          return (
            <div key={i} style={{
              position: "absolute",
              transform: `translate(${pos.x}px, ${pos.y + idleY}px) scale(${s * pos.scale}) rotate(${idleR}deg)`,
              opacity: s,
              filter: `blur(${bl}px)`,
              textAlign: "center",
            }}>
              <div style={{
                background: isMain
                  ? "linear-gradient(145deg, rgba(22,22,22,0.98), rgba(10,10,10,0.98))"
                  : "linear-gradient(145deg, rgba(16,16,16,0.95), rgba(8,8,8,0.95))",
                borderRadius: 20, padding: isMain ? "28px 36px" : "20px 28px",
                border: isMain ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
                borderTop: `1px solid ${scene.accentColor}${isMain ? "44" : "22"}`,
                boxShadow: isMain
                  ? `0 24px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 ${scene.accentColor}22`
                  : "0 16px 40px rgba(0,0,0,0.35)",
              }}>
                <div style={{
                  fontSize: isMain ? 72 : 54,
                  fontWeight: 900, color: safeAccent(scene.accentColor, bg),
                  fontFamily, letterSpacing: "-0.05em", lineHeight: 1,
                  ...tabularNums,
                  textShadow: `0 0 40px ${scene.accentColor}44`,
                }}>
                  {num}
                </div>
                <div style={{
                  fontSize: isMain ? 22 : 17,
                  fontWeight: 300, color: "#666",
                  fontFamily, marginTop: 6,
                }}>
                  {labels[i] || ""}
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// ICON SCENE — texte + icône SVG animée
// ─────────────────────────────────────────────────────────
export const IconScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainCol = getMainColor(bg);
  const fontSize = autoFontSize(scene.text || "", 160);

  const s = spring({ frame, fps, config: { damping: 26, stiffness: 200 }, from: 0, to: 1 });
  const op = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl = interpolate(frame, [0, 22], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const idle = Math.sin(frame * 0.028) * 5;

  const iconType = (scene.iconType || detectIcon(scene.text || "")) as IconType;
  const glowPulse = 1 + Math.sin(frame * 0.04) * 0.08;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 32,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          position: "relative",
          transform: `scale(${s}) translateY(${idle}px)`,
          filter: `blur(${bl}px)`,
        }}>
          <div style={{
            position: "absolute", inset: -30,
            background: `radial-gradient(circle, ${scene.accentColor}22 0%, transparent 65%)`,
            transform: `scale(${glowPulse})`,
            borderRadius: "50%",
            filter: "blur(10px)",
          }} />
          <IconComponent
            type={iconType}
            color={safeAccent(scene.accentColor, bg)}
            size={160}
            delay={0}
          />
        </div>

        <div style={{
          transform: `translateY(${interpolate(Math.max(0, frame - 12), [0, 22], [20, 0], { extrapolateRight: "clamp", easing: E_OUT })}px)`,
          opacity: interpolate(Math.max(0, frame - 12), [0, 22], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
        }}>
          <div style={{
            fontSize, fontWeight: 900, color: mainCol,
            fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          }}>
            {scene.text}
          </div>
        </div>

        <AccentLine accent={scene.accentColor} delay={20} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.3), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// WORLD MAP SCENE — carte du monde avec points
// ─────────────────────────────────────────────────────────
export const WorldMapScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const s   = spring({ frame, fps, config: { damping: 26, stiffness: 160 }, from: 0, to: 1 });
  const op  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl  = interpolate(frame, [0, 24], [12, 0], { extrapolateRight: "clamp" });

  // Points géographiques précis (lat/lon → %)
  const cities = [
    { name: "New York",  x: 23,  y: 37 },
    { name: "LA",        x: 14,  y: 39 },
    { name: "Toronto",   x: 22,  y: 33 },
    { name: "Mexico",    x: 18,  y: 45 },
    { name: "São Paulo", x: 31,  y: 64 },
    { name: "Londres",   x: 48,  y: 27 },
    { name: "Paris",     x: 49,  y: 28 },
    { name: "Berlin",    x: 51,  y: 26 },
    { name: "Moscow",    x: 57,  y: 24 },
    { name: "Cairo",     x: 54,  y: 39 },
    { name: "Lagos",     x: 49,  y: 51 },
    { name: "Nairobi",   x: 57,  y: 53 },
    { name: "Dubai",     x: 62,  y: 40 },
    { name: "Mumbai",    x: 64,  y: 44 },
    { name: "Delhi",     x: 65,  y: 38 },
    { name: "Shanghai",  x: 77,  y: 36 },
    { name: "Seoul",     x: 79,  y: 33 },
    { name: "Tokyo",     x: 81,  y: 34 },
    { name: "Singapore", x: 74,  y: 54 },
    { name: "Sydney",    x: 82,  y: 69 },
  ];

  const labelOp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />

      {/* Label haut */}
      {scene.text2 && (
        <div style={{
          position: "absolute", left: "50%", top: "10%",
          transform: "translateX(-50%)",
          fontSize: 28, fontWeight: 200,
          color: subTextColor(bg),
          fontFamily, letterSpacing: "0.1em", textTransform: "uppercase",
          opacity: labelOp * fade, whiteSpace: "nowrap",
        }}>
          {scene.text2}
        </div>
      )}

      {/* Carte SVG réelle */}
      <div style={{
        position: "absolute",
        left: "50%", top: "48%",
        transform: `translate(-50%, -50%) scale(${s * 1.05})`,
        width: "110%",
        opacity: op * fade * 0.35,
        filter: `blur(${bl}px)`,
      }}>
        <img
          src={staticFile("world.svg")}
          style={{
            width: "100%",
            filter: `brightness(0) invert(1) opacity(0.6) drop-shadow(0 0 2px ${scene.accentColor}44)`,
          }}
        />
      </div>

      {/* Overlay couleur accent sur la carte */}
      <div style={{
        position: "absolute",
        left: "50%", top: "48%",
        transform: `translate(-50%, -50%) scale(${s * 1.05})`,
        width: "110%",
        opacity: op * fade * 0.12,
        filter: `blur(${bl}px)`,
        mixBlendMode: "screen",
      }}>
        <img
          src={staticFile("world.svg")}
          style={{
            width: "100%",
            filter: `brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(${
              scene.accentColor === "#4285f4" ? "200deg" :
              scene.accentColor === "#1db954" ? "100deg" :
              scene.accentColor === "#e50914" ? "330deg" :
              "200deg"
            })`,
          }}
        />
      </div>

      {/* Points des villes */}
      <AbsoluteFill style={{ opacity: fade }}>
        {cities.map((city, i) => {
          const delay = i * 3;
          const dotS  = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 18, stiffness: 300 }, from: 0, to: 1 });
          const pulse = 1 + Math.sin(frame * 0.05 + i * 0.8) * 0.35;

          return (
            <div key={i} style={{
              position: "absolute",
              left: `${city.x}%`, top: `${city.y}%`,
              transform: "translate(-50%, -50%)",
            }}>
              {/* Halo pulsant */}
              <div style={{
                position: "absolute",
                width: 20, height: 20,
                borderRadius: "50%",
                background: scene.accentColor,
                opacity: 0.12 * dotS * pulse,
                transform: `translate(-50%, -50%) scale(${pulse * 1.5})`,
                left: "50%", top: "50%",
              }} />
              {/* Point */}
              <div style={{
                width: 6, height: 6,
                borderRadius: "50%",
                background: scene.accentColor,
                opacity: dotS * 0.9,
                boxShadow: `0 0 8px ${scene.accentColor}, 0 0 16px ${scene.accentColor}44`,
                transform: `scale(${dotS})`,
              }} />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Titre en bas */}
      {scene.text && (
        <div style={{
          position: "absolute", bottom: "10%", left: "50%",
          transform: "translateX(-50%)",
          fontSize: autoFontSize(scene.text, 90, 50),
          fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(80),
          opacity: interpolate(Math.max(0, frame - 24), [0, 22], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }) * fade,
          textAlign: "center", whiteSpace: "nowrap",
        }}>
          {scene.text}
        </div>
      )}

      <Vignette strength={light ? 0.06 : 0.55} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// WAVEFORM SCENE — onde sonore / equalizer
// ─────────────────────────────────────────────────────────
export const WaveformScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 160);

  const s   = spring({ frame, fps, config: { damping: 26, stiffness: 200 }, from: 0.88, to: 1 });
  const op  = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl  = interpolate(frame, [0, 22], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const barCount = 48;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const baseH = 0.2 + Math.sin(i * 0.4) * 0.15;
    const wave1 = Math.sin(frame * 0.08 + i * 0.3) * 0.35;
    const wave2 = Math.sin(frame * 0.05 + i * 0.5) * 0.2;
    const wave3 = Math.cos(frame * 0.1 + i * 0.2) * 0.15;
    const entryProgress = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
    return Math.max(0.05, (baseH + wave1 + wave2 + wave3) * entryProgress);
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 40,
        opacity: op * fade, padding: "60px 120px",
      }}>
        {/* Texte principal */}
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          transform: `scale(${s})`, filter: `blur(${bl}px)`,
          textAlign: "center",
        }}>
          {scene.text}
        </div>

        {/* Waveform */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          height: 160, width: "100%",
          transform: `scale(${s})`,
        }}>
          {bars.map((h, i) => {
            const isCenter = Math.abs(i - barCount / 2) < barCount * 0.15;
            const opacity = 0.4 + (isCenter ? 0.6 : 0) + (h > 0.5 ? 0.2 : 0);
            return (
              <div key={i} style={{
                flex: 1, height: `${h * 100}%`,
                background: isCenter
                  ? scene.accentColor
                  : `${scene.accentColor}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
                borderRadius: 3,
                boxShadow: isCenter && h > 0.5 ? `0 0 8px ${scene.accentColor}66` : "none",
              }} />
            );
          })}
        </div>

        <AccentLine accent={scene.accentColor} delay={20} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// PROGRESS BARS SCENE — barres multiples
// ─────────────────────────────────────────────────────────
export const ProgressBarsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  // Parse: "iPhone 98%|Android 72%|Samsung 68%|Xiaomi 45%"
  const items = (scene.text || "Performance 95%|Design 88%|Innovation 92%|Valeur 78%")
    .split("|").map(item => {
      const match = item.trim().match(/^(.+?)\s+(\d+)%?$/);
      return { label: match?.[1] || item, value: parseInt(match?.[2] || "80") };
    });

  const labelOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />

      {scene.text2 && (
        <div style={{
          position: "absolute", left: "50%", top: "12%",
          transform: "translateX(-50%)",
          fontSize: 28, fontWeight: 200,
          color: subTextColor(bg),
          fontFamily, letterSpacing: "0.08em", textTransform: "uppercase",
          opacity: labelOp * fade,
        }}>
          {scene.text2}
        </div>
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 32,
        opacity: fade, padding: "100px 80px",
      }}>
        {items.map((item, i) => {
          const delay = i * 10;
          const barProgress = interpolate(Math.max(0, frame - delay), [0, 50], [0, item.value / 100], {
            extrapolateRight: "clamp", easing: E_OUT,
          });
          const itemOp = interpolate(Math.max(0, frame - delay), [0, 16], [0, 1], {
            extrapolateRight: "clamp", easing: E_OUT,
          });
          const itemY = interpolate(Math.max(0, frame - delay), [0, 20], [30, 0], {
            extrapolateRight: "clamp", easing: E_OUT,
          });

          return (
            <div key={i} style={{
              width: "100%", opacity: itemOp,
              transform: `translateY(${itemY}px)`,
            }}>
              {/* Label + valeur */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 10,
              }}>
                <div style={{
                  fontSize: 36, fontWeight: 600,
                  color: getMainColor(bg), fontFamily, letterSpacing: "-0.02em",
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: 36, fontWeight: 900,
                  color: safeAccent(scene.accentColor, bg), fontFamily, letterSpacing: "-0.03em",
                  ...tabularNums,
                }}>
                  {Math.round(barProgress * 100)}%
                </div>
              </div>
              {/* Barre */}
              <div style={{
                width: "100%", height: 8,
                background: light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
                borderRadius: 4, overflow: "hidden",
              }}>
                <div style={{
                  width: `${barProgress * 100}%`, height: "100%",
                  background: `linear-gradient(90deg, ${scene.accentColor}88, ${scene.accentColor})`,
                  borderRadius: 4,
                  boxShadow: `0 0 12px ${scene.accentColor}66`,
                }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// QUOTE SCENE — citation dans une bulle
// ─────────────────────────────────────────────────────────
export const QuoteScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const scale = useScaleIn(0, 0.95);
  const floatY = useFloat(4, 0.02, sceneIndex * 0.8);
  const op  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_PREMIUM });
  const entY = interpolate(frame, [0, 36], [50, 0], { extrapolateRight: "clamp", easing: E_PREMIUM });

  const wordsOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const authorOp = interpolate(Math.max(0, frame - 28), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const authorY  = interpolate(Math.max(0, frame - 28), [0, 20], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  // Guillemets animés
  const quoteScale = spring({ frame, fps, config: { damping: 20, stiffness: 300 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: op * fade, padding: "60px 80px",
      }}>
        <div style={{
          width: "100%",
          background: light
            ? "rgba(0,0,0,0.03)"
            : "linear-gradient(145deg, rgba(22,22,22,0.95), rgba(10,10,10,0.95))",
          border: `1px solid ${scene.accentColor}22`,
          borderLeft: `4px solid ${scene.accentColor}`,
          borderRadius: 20,
          padding: "44px 52px",
          transform: `scale(${scale}) translateY(${entY + floatY}px) perspective(1000px) rotateX(-2deg) rotateY(1deg)`,
          boxShadow: APPLE_CARD_SHADOW,
          position: "relative",
        }}>
          {/* Guillemet ouvrant */}
          <div style={{
            position: "absolute", top: 16, left: 20,
            fontSize: 80, color: safeAccent(scene.accentColor, bg),
            fontFamily, lineHeight: 1, opacity: 0.4,
            transform: `scale(${quoteScale})`,
            transformOrigin: "top left",
          }}>
            "
          </div>

          {/* Texte de la citation */}
          <div style={{
            fontSize: 48, fontWeight: 300,
            color: getMainColor(bg),
            fontFamily, letterSpacing: "-0.025em",
            lineHeight: 1.45, opacity: wordsOp,
            paddingTop: 20,
          }}>
            {scene.text}
          </div>

          {/* Guillemet fermant */}
          <div style={{
            position: "absolute", bottom: 8, right: 24,
            fontSize: 80, color: safeAccent(scene.accentColor, bg),
            fontFamily, lineHeight: 1, opacity: 0.4,
            transform: `scale(${quoteScale})`,
            transformOrigin: "bottom right",
          }}>
            "
          </div>
        </div>

        {/* Auteur */}
        {scene.text2 && (
          <div style={{
            marginTop: 24, textAlign: "center",
            opacity: authorOp, transform: `translateY(${authorY}px)`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <div style={{
                width: 32, height: 2,
                background: scene.accentColor, borderRadius: 1,
              }} />
              <div style={{
                fontSize: 28, fontWeight: 600,
                color: safeAccent(scene.accentColor, bg), fontFamily, letterSpacing: "0.02em",
              }}>
                {scene.text2}
              </div>
              <div style={{
                width: 32, height: 2,
                background: scene.accentColor, borderRadius: 1,
              }} />
            </div>
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.45} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// COUNTDOWN SCENE — compte à rebours explosif
// ─────────────────────────────────────────────────────────
export const CountdownScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const startNum = parseInt(scene.text || "5");
  const framesPerNum = Math.max(4, Math.floor(durationInFrames / (startNum + 1)));
  const currentNum = Math.max(0, startNum - Math.floor(frame / framesPerNum));
  const localFrame = frame % framesPerNum;

  // Animation pour chaque chiffre
  const scaleIn = spring({ frame: localFrame, fps, config: { damping: 8, stiffness: 400, mass: 0.8 }, from: 3, to: 1 });
  const tFadeIn = Math.min(8, Math.max(1, Math.floor(framesPerNum * 0.15)));
  const tFadeOut = Math.max(tFadeIn + 1, framesPerNum - 12);
  const tEnd = Math.max(tFadeOut + 1, framesPerNum);
  const numOp = tFadeOut >= tEnd - 1
    ? interpolate(localFrame, [0, tEnd], [0, 1], CLAMP_BOTH)
    : interpolate(localFrame, monoRange(0, tFadeIn, tFadeOut, tEnd), [0, 1, 1, 0], CLAMP_BOTH);
  const blurNum = interpolate(localFrame, [0, 12], [20, 0], { extrapolateRight: "clamp" });

  // Cercle de progression
  const circleProgress = (localFrame / framesPerNum);
  const circumference = 2 * Math.PI * 400;
  const strokeOffset = circumference * (1 - circleProgress);

  const isZero = currentNum === 0;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: fade,
      }}>
        {/* Cercle de progression */}
        <svg style={{ position: "absolute" }} width={1000} height={1000} viewBox="-500 -500 1000 1000">
          <circle cx={0} cy={0} r={400} fill="none"
            stroke={`${scene.accentColor}18`} strokeWidth={4} />
          <circle cx={0} cy={0} r={400} fill="none"
            stroke={scene.accentColor} strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform="rotate(-90)"
            style={{ filter: `drop-shadow(0 0 8px ${scene.accentColor}88)` }}
          />
        </svg>

        {/* Chiffre */}
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize: isZero ? 120 : 240,
          fontWeight: 900,
          color: isZero ? safeAccent(scene.accentColor, bg) : getMainColor(bg),
          fontFamily, letterSpacing: "-0.06em", lineHeight: 1,
          ...tabularNums,
          transform: `scale(${scaleIn})`,
          opacity: numOp,
          filter: `blur(${blurNum}px)`,
          textAlign: "center",
          ...(isZero ? {
            background: `linear-gradient(135deg, ${safeAccent(scene.accentColor, bg)}, #ffffff)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none",
          } : {}),
        }}>
          {isZero ? (scene.text2 || "GO!") : currentNum}
        </div>
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// MIRROR TEXT SCENE — texte avec reflet
// ─────────────────────────────────────────────────────────
export const MirrorScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 180);

  const blur  = interpolate(frame, [0, 30], [22, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const s     = spring({ frame, fps, config: { damping: 28, stiffness: 200 }, from: 0.92, to: 1 });
  const op    = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const idle  = Math.sin(frame * 0.028) * 3;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column",
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        {/* Texte principal */}
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 1,
          transform: `scale(${s}) translateY(${idle}px)`,
          filter: `blur(${blur}px)`,
        }}>
          {scene.text}
        </div>

        {/* Ligne séparatrice */}
        <div style={{
          width: "80%", height: 1,
          background: `linear-gradient(90deg, transparent, ${scene.accentColor}44, transparent)`,
          margin: "8px 0",
          opacity: interpolate(Math.max(0, frame - 16), [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Reflet miroir */}
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 1,
          transform: `scale(${s}) translateY(${-idle}px) scaleY(-1)`,
          filter: `blur(${blur + 2}px)`,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 60%)",
          opacity: op * 0.4,
        }}>
          {scene.text}
        </div>

        <AccentLine accent={scene.accentColor} delay={16} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, marginTop: 8,
            opacity: interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// DATA SCROLL SCENE — chiffres qui défilent en bg
// ─────────────────────────────────────────────────────────
export const DataScrollScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 170);

  const s  = spring({ frame, fps, config: { damping: 28, stiffness: 200 }, from: 0.9, to: 1 });
  const op = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl = interpolate(frame, [0, 24], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  // Colonnes de données qui défilent
  const columns = [
    { x: "8%",  speed: 0.8,  data: ["94.2%", "1.2B", "$847M", "32.1K", "99.9%", "4.8M", "17.3%", "2.1T"] },
    { x: "22%", speed: -0.6, data: ["$1.2T", "48.3M", "99.1%", "3.7B", "12.4K", "$892M", "67.2%", "1.1B"] },
    { x: "72%", speed: 0.9,  data: ["3.2B", "78.4%", "$2.1M", "9.8K", "44.1%", "$156B", "8.7M", "31.2%"] },
    { x: "86%", speed: -0.7, data: ["$445M", "12.3%", "7.9B", "23.1K", "88.4%", "1.4T", "$67M", "55.3%"] },
  ];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />

      {/* Colonnes de données en arrière-plan */}
      {columns.map((col, ci) => {
        const scrollY = (frame * col.speed) % (col.data.length * 60);
        return (
          <div key={ci} style={{
            position: "absolute", left: col.x, top: 0,
            transform: `translateY(${-scrollY}px)`,
            opacity: 0.06,
          }}>
            {[...col.data, ...col.data, ...col.data].map((val, i) => (
              <div key={i} style={{
                fontSize: 24, fontWeight: 600,
                color: safeAccent(scene.accentColor, bg), fontFamily,
                letterSpacing: "0.02em", lineHeight: 2.5,
                whiteSpace: "nowrap",
                ...tabularNums,
              }}>
                {val}
              </div>
            ))}
          </div>
        );
      })}

      <Grain />

      {/* Contenu principal */}
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          transform: `scale(${s})`, filter: `blur(${bl}px)`,
        }}>
          {scene.text}
        </div>
        <AccentLine accent={scene.accentColor} delay={12} />
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 16), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.55} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// BURST LINES SCENE — explosion de lignes
// ─────────────────────────────────────────────────────────
export const BurstScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 185);

  const s  = spring({ frame, fps, config: { damping: 22, stiffness: 280, mass: 0.8 }, from: 0.5, to: 1 });
  const op = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl = interpolate(frame, [0, 20], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  // Lignes qui explosent depuis le centre
  const lineCount = 24;
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const angle  = (i / lineCount) * Math.PI * 2;
    const delay  = i % 4;
    const f      = Math.max(0, frame - delay);
    const length = interpolate(f, [0, 28], [0, 300 + (i % 3) * 80], {
      extrapolateRight: "clamp", easing: E_OUT,
    });
    const lineOp = interpolate(f, [0, 6, 30, 50], [0, 0.6, 0.3, 0], {
      extrapolateRight: "clamp",
    });
    const width = i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0.5;
    return { angle, length, opacity: lineOp, width };
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />

      {/* Lignes burst */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg width="1080" height="1920" viewBox="-540 -960 1080 1920" style={{ position: "absolute" }}>
          {lines.map((line, i) => (
            <line key={i}
              x1={0} y1={0}
              x2={Math.cos(line.angle) * line.length}
              y2={Math.sin(line.angle) * line.length}
              stroke={scene.accentColor}
              strokeWidth={line.width}
              opacity={line.opacity}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </AbsoluteFill>

      <Grain />

      {/* Texte principal */}
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          transform: `scale(${s})`, filter: `blur(${bl}px)`,
        }}>
          {scene.text}
        </div>
        <AccentLine accent={scene.accentColor} delay={14} />
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 18), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// MORPH SHAPES SCENE — morphing de formes géométriques
// ─────────────────────────────────────────────────────────
export const MorphShapesScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 160);

  const s  = spring({ frame, fps, config: { damping: 26, stiffness: 200 }, from: 0.88, to: 1 });
  const op = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl = interpolate(frame, [0, 22], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  // Morphing entre formes via interpolation des points
  const morphProgress = interpolate(
    frame % 90, [0, 45, 90], [0, 1, 0],
    { easing: Easing.inOut(Easing.cubic) }
  );

  // Cercle → Carré → Triangle (via clip-path simulé en SVG)
  const shapePhase = Math.floor(frame / 90) % 3;
  const r = 180;
  const size = r;

  // Points pour chaque forme
  const circlePoints = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
  const squarePoints = [
    { x: -size, y: -size }, { x: 0, y: -size }, { x: size, y: -size }, { x: size, y: 0 },
    { x: size, y: size }, { x: 0, y: size }, { x: -size, y: size }, { x: -size, y: 0 },
  ];
  const trianglePoints = [
    { x: 0, y: -size * 1.2 }, { x: size * 0.6, y: -size * 0.4 },
    { x: size, y: size * 0.8 }, { x: size * 0.3, y: size * 0.8 },
    { x: 0, y: size * 0.8 }, { x: -size * 0.3, y: size * 0.8 },
    { x: -size, y: size * 0.8 }, { x: -size * 0.6, y: -size * 0.4 },
  ];

  const shapes = [circlePoints, squarePoints, trianglePoints];
  const fromShape = shapes[shapePhase % 3];
  const toShape   = shapes[(shapePhase + 1) % 3];

  const currentPoints = fromShape.map((p, i) => ({
    x: p.x + (toShape[i].x - p.x) * morphProgress,
    y: p.y + (toShape[i].y - p.y) * morphProgress,
  }));

  const pathD = currentPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  const rotation = frame * 0.3;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />

      {/* Forme qui morphe */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg width="600" height="600" viewBox="-300 -300 600 600" style={{ opacity: 0.15 }}>
          <g transform={`rotate(${rotation})`}>
            <path d={pathD} fill={scene.accentColor} />
          </g>
        </svg>
      </AbsoluteFill>

      {/* Texte */}
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900, color: getMainColor(bg),
          fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
          transform: `scale(${s})`, filter: `blur(${bl}px)`,
        }}>
          {scene.text}
        </div>
        <AccentLine accent={scene.accentColor} delay={14} />
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 18), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// 3D TEXT SCENE — texte en perspective 3D
// ─────────────────────────────────────────────────────────
export const Text3DScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 160);

  // Arrivée depuis la profondeur
  const perspective = interpolate(frame, [0, 40], [2000, 800], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const zScale = interpolate(frame, [0, 40], [0.1, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const rotX = interpolate(frame, [0, 40], [45, 0], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const op  = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const bl  = interpolate(frame, [0, 22], [14, 0], { extrapolateRight: "clamp" });
  const idle = Math.sin(frame * 0.02) * 1.5;

  // Ombre 3D
  const shadowLayers = 6;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 20,
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
        perspective: `${perspective}px`,
      }}>
        <div style={{
          transform: `rotateX(${rotX + idle}deg) scale(${zScale})`,
          filter: `blur(${bl}px)`,
          position: "relative",
        }}>
          {/* Couches d'ombre 3D */}
          {Array.from({ length: shadowLayers }, (_, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              fontSize, fontWeight: 900,
              color: `${safeAccent(scene.accentColor, bg)}${Math.round((0.08 - i * 0.01) * 255).toString(16).padStart(2, "0")}`,
              fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
              transform: `translate(${(i + 1) * 2}px, ${(i + 1) * 3}px)`,
              userSelect: "none",
            }}>
              {scene.text}
            </div>
          ))}
          {/* Texte principal */}
          <div style={{
            fontSize, fontWeight: 900, color: getMainColor(bg),
            fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
            position: "relative",
          }}>
            {scene.text}
          </div>
        </div>

        <AccentLine accent={scene.accentColor} delay={20} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 200,
            color: subTextColor(bg),
            fontFamily, letterSpacing: "-0.02em",
            opacity: interpolate(Math.max(0, frame - 22), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT }),
            transform: `perspective(${perspective}px) rotateX(${(rotX + idle) * 0.3}deg)`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// SPLIT SCREEN SCENE — 2-3 panneaux
// ─────────────────────────────────────────────────────────
export const SplitScreenScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();

  // Parse: "Titre1|Titre2|Titre3" et bgs: "bg1|bg2|bg3"
  const titles = (scene.text || "Vitesse|Puissance|Précision").split("|").map(s => s.trim());
  const count  = Math.min(titles.length, 3);

  const directions = ["up", "right", "down"] as const;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0a0a0a" }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
      <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
        {titles.slice(0, count).map((title, i) => {
          const dir = directions[i % 3];
          const delay = i * 6;
          const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 24, stiffness: 200 }, from: 0, to: 1 });

          let entryTransform = "";
          if (dir === "up")    entryTransform = `translateY(${(1 - s) * -100}%)`;
          if (dir === "right") entryTransform = `translateX(${(1 - s) * 100}%)`;
          if (dir === "down")  entryTransform = `translateY(${(1 - s) * 100}%)`;

          // Alterner les fonds entre les panneaux
          const panelBgs = ["#0a0a0a", scene.accentColor, "#ffffff"];
          const panelBg  = panelBgs[i % 3] || "#0a0a0a";
          const panelText = panelBg === "#ffffff" ? "#1d1d1f" : "#f5f5f0";

          const fontSize = autoFontSize(title, 130, 60);

          return (
            <div key={i} style={{
              flex: 1, display: "flex",
              justifyContent: "center", alignItems: "center",
              background: panelBg || "#0a0a0a",
              transform: entryTransform,
              overflow: "hidden",
              borderBottom: i < count - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              position: "relative",
            }}>
              {/* Pattern dans chaque panneau */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }} />
              <div style={{
                fontSize, fontWeight: 900, color: panelText,
                fontFamily, letterSpacing: autoTracking(fontSize),
                opacity: s, position: "relative",
                textAlign: "center",
              }}>
                {title}
              </div>
            </div>
          );
        })}
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// PHOTO SCENE — texte + photo dans un cadre
// ─────────────────────────────────────────────────────────
export const PhotoScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 110, 60);

  const textOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const textY  = interpolate(frame, [0, 24], [30, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const photoS  = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 24, stiffness: 180, mass: 1.1 }, from: 0, to: 1 });
  const photoOp = interpolate(Math.max(0, frame - 8), [0, 24], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const photoY  = interpolate(Math.max(0, frame - 8), [0, 28], [40, 0], { extrapolateRight: "clamp", easing: E_OUT });

  // Ken Burns sur la photo
  const kb = interpolate(frame, [0, 150], [1.0, 1.08], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const textBelow = sceneIndex % 2 === 0; // alterne texte haut/bas

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 36,
        opacity: fade, padding: "60px 60px",
      }}>

        {/* Texte AU DESSUS si textBelow=false */}
        {!textBelow && (
          <div style={{
            opacity: textOp,
            transform: `translateY(${-textY}px)`,
            textAlign: "center", width: "100%",
          }}>
            <div style={{
              fontSize, fontWeight: 900, color: textColor(bg),
              fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
            }}>
              {scene.text}
            </div>
            {scene.text2 && (
              <div style={{
                fontSize: Math.round(fontSize * 0.35), fontWeight: 200,
                color: subTextColor(bg), fontFamily,
                marginTop: 12, letterSpacing: "-0.02em",
              }}>
                {scene.text2}
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={14} />
            </div>
          </div>
        )}

        {/* CADRE PHOTO — taille limitée, centrée */}
        {scene.photoUrl && (
          <div style={{
            width: 680,
            height: 420,
            borderRadius: 20,
            overflow: "hidden",
            opacity: photoOp,
            transform: `scale(${photoS}) translateY(${photoY}px)`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px ${scene.accentColor}22`,
            border: `1px solid ${scene.accentColor}22`,
            flexShrink: 0,
            position: "relative",
          }}>
            <img
              src={scenePhotoSrc(scene.photoUrl)}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                transform: `scale(${kb})`,
                transformOrigin: "center center",
                display: "block",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.25) 100%)`,
              pointerEvents: "none",
            }} />
          </div>
        )}

        {/* Texte EN DESSOUS si textBelow=true */}
        {textBelow && (
          <div style={{
            opacity: textOp,
            transform: `translateY(${textY}px)`,
            textAlign: "center", width: "100%",
          }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={20} />
            </div>
            <div style={{
              fontSize, fontWeight: 900, color: textColor(bg),
              fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
            }}>
              {scene.text}
            </div>
            {scene.text2 && (
              <div style={{
                fontSize: Math.round(fontSize * 0.35), fontWeight: 200,
                color: subTextColor(bg), fontFamily,
                marginTop: 12, letterSpacing: "-0.02em",
              }}>
                {scene.text2}
              </div>
            )}
          </div>
        )}

      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.45} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// MOCKUP SCENE — screenshot animé premium
// ─────────────────────────────────────────────────────────
export const MockupScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);

  const s      = spring({ frame, fps, config: { damping: 20, stiffness: 140, mass: 1.3 }, from: 0, to: 1 });
  const entY   = interpolate(frame, [0, 60], [120, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const bl     = interpolate(frame, [0, 30], [20, 0], { extrapolateRight: "clamp" });
  const idleY  = s > 0.95 ? Math.sin(frame * 0.02) * 5 : 0;
  const tiltX  = Math.sin(frame * 0.012) * 1.2;
  const tiltY  = Math.cos(frame * 0.009) * 0.8;

  const kb = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const type     = scene.mockupType || "browser";
  const imageUrl = scene.photoUrl || "";

  const glow = 0.4 + Math.sin(frame * 0.04) * 0.15;

  const labelOp = interpolate(Math.max(0, frame - 30), [0, 24], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const labelY  = interpolate(Math.max(0, frame - 30), [0, 24], [20, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const ScreenContent = () => imageUrl ? (
    <img
      src={scenePhotoSrc(imageUrl)}
      alt=""
      style={{
        width: "100%", height: "100%",
        objectFit: "cover", objectPosition: "top",
        transform: `scale(${kb})`,
        transformOrigin: "top center",
        display: "block",
      }}
    />
  ) : (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(135deg, #1a1a2e, #16213e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 48,
    }}>🖥️</div>
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 24,
        opacity: fade,
        padding: "60px 40px",
      }}>

        {type === "browser" && (
          <div style={{
            width: 1640,
            transform: `scale(${s}) translateY(${entY + idleY}px) perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            filter: `blur(${bl}px)`,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: -30,
              background: `radial-gradient(ellipse, ${scene.accentColor}${Math.round(glow * 30).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
              filter: "blur(20px)", zIndex: -1,
            }} />
            <div style={{
              borderRadius: "16px 16px 0 0",
              background: "linear-gradient(180deg, #252525 0%, #1c1c1c 100%)",
              padding: "12px 16px 10px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
              {[["#ff5f57", "#ff5f57cc"], ["#febc2e", "#febc2ecc"], ["#28c840", "#28c840cc"]].map(([c, shadow], i) => (
                <div key={i} style={{
                  width: 11, height: 11, borderRadius: "50%",
                  background: c, boxShadow: `0 0 6px ${shadow}`,
                }} />
              ))}
              <div style={{ display: "flex", gap: 8, marginLeft: 4 }}>
                {["‹", "›"].map((a, i) => (
                  <div key={i} style={{
                    fontSize: 14, color: "rgba(255,255,255,0.25)",
                    fontWeight: 900, lineHeight: 1,
                  }}>{a}</div>
                ))}
              </div>
              <div style={{
                flex: 1, marginLeft: 4,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 7, padding: "5px 12px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 9, color: "#30d158" }}>🔒</span>
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.35)",
                  fontFamily, fontWeight: 500,
                }}>
                  {scene.text2 || "app.yoursaas.com"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["↩", "⊕", "⋯"].map((icon, i) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{icon}</div>
                ))}
              </div>
            </div>

            <div style={{
              height: 920, overflow: "hidden", position: "relative",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "none", borderRadius: "0 0 12px 12px",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            }}>
              <ScreenContent />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
                background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
                pointerEvents: "none",
              }} />
            </div>
          </div>
        )}

        {type === "phone" && (
          <div style={{
            width: 260,
            transform: `scale(${s}) translateY(${entY + idleY}px) perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY * 2}deg)`,
            filter: `blur(${bl}px)`,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: -40,
              background: `radial-gradient(ellipse, ${scene.accentColor}${Math.round(glow * 25).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
              filter: "blur(20px)", zIndex: -1,
            }} />
            <div style={{
              background: "linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 100%)",
              borderRadius: 44, padding: 10,
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: 90, height: 24, background: "#0a0a0a",
                borderRadius: 12, margin: "0 auto 6px",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8)",
              }} />
              <div style={{
                borderRadius: 34, overflow: "hidden", height: 1000,
                border: "1px solid rgba(255,255,255,0.04)",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3)",
              }}>
                <ScreenContent />
              </div>
              <div style={{
                width: 110, height: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2, margin: "8px auto 2px",
              }} />
            </div>
          </div>
        )}

        {type === "macbook" && (
          <div style={{
            width: 1760,
            transform: `scale(${s * 0.88}) translateY(${entY + idleY}px) perspective(1600px) rotateX(${tiltX + 4}deg) rotateY(${tiltY}deg)`,
            filter: `blur(${bl}px)`,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: -40,
              background: `radial-gradient(ellipse, ${scene.accentColor}${Math.round(glow * 20).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
              filter: "blur(30px)", zIndex: -1,
            }} />
            <div style={{
              background: "linear-gradient(180deg, #2a2a2a, #1c1c1c)",
              borderRadius: "16px 16px 4px 4px", padding: "14px 14px 0",
              border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                margin: "0 auto 10px",
              }} />
              <div style={{ borderRadius: "8px 8px 0 0", overflow: "hidden", height: 840 }}>
                <ScreenContent />
              </div>
            </div>
            <div style={{
              background: "linear-gradient(180deg, #1c1c1c, #141414)",
              height: 6, border: "1px solid rgba(255,255,255,0.06)", borderTop: "none",
            }} />
            <div style={{
              background: "linear-gradient(180deg, #222, #1a1a1a)",
              height: 18, borderRadius: "0 0 4px 4px",
              border: "1px solid rgba(255,255,255,0.06)", borderTop: "none",
              boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
            }} />
            <div style={{
              background: "linear-gradient(180deg, #1e1e1e, #161616)",
              height: 12, borderRadius: "0 0 20px 20px",
              width: "108%", marginLeft: "-4%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.04)", borderTop: "none",
            }} />
          </div>
        )}

        {scene.text && (
          <div style={{
            textAlign: "center",
            opacity: labelOp,
            transform: `translateY(${labelY}px)`,
          }}>
            <div style={{
              fontSize: autoFontSize(scene.text, 64, 36),
              fontWeight: 900, color: textColor(bg),
              fontFamily, letterSpacing: autoTracking(56),
              lineHeight: 1, marginBottom: 10,
            }}>
              {scene.text}
            </div>
            <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={34} width={60} />
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={light ? 0.06 : 0.55} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// RECONSTRUCTED UI SCENE — interface reconstruite + animée
// ─────────────────────────────────────────────────────────
export const ReconstructedUIScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const s    = spring({ frame, fps, config: { damping: 22, stiffness: 160, mass: 1.1 }, from: 0, to: 1 });
  const entY = interpolate(frame, [0, 50], [80, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const bl   = interpolate(frame, [0, 28], [16, 0], { extrapolateRight: "clamp" });

  const uiData       = scene.uiData || {};
  const layout       = uiData.layout || {};
  const sections     = uiData.sections || [];
  const accent       = uiData.accentColor || scene.accentColor || "#4285f4";
  const uiBg         = uiData.bgColor || "#ffffff";
  const uiText       = uiData.textColor || "#0a0a0a";
  const mockupType   = uiData.mockupType || "browser";

  const scrollY = interpolate(frame, [30, 120], [0, 200], {
    extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });

  const highlightPulse = 0.5 + Math.sin(frame * 0.08) * 0.3;

  const UIContent = () => (
    <div style={{
      width: "100%", height: "100%",
      background: uiBg, overflow: "hidden",
      fontFamily,
      position: "relative",
    }}>
      {layout.hasNavbar && (
        <div style={{
          width: "100%", padding: "10px 20px",
          background: layout.navbarBg || uiBg,
          borderBottom: `1px solid ${accent}22`,
          display: "flex", alignItems: "center", gap: 16,
          position: "sticky", top: 0, zIndex: 10,
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
        }}>
          <div style={{
            fontSize: 14, fontWeight: 900, color: accent,
            letterSpacing: "-0.03em",
          }}>
            {layout.logo || uiData.productName || "App"}
          </div>
          <div style={{ display: "flex", gap: 16, marginLeft: 16 }}>
            {(layout.navbarItems || []).slice(0, 5).map((item: string, i: number) => (
              <div key={i} style={{
                fontSize: 11, color: i === 0 ? accent : `${uiText}66`,
                fontWeight: i === 0 ? 600 : 400,
                padding: "3px 8px", borderRadius: 4,
                background: i === 0 ? `${accent}15` : "transparent",
              }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{
              padding: "5px 14px", background: accent,
              borderRadius: 6, fontSize: 11, fontWeight: 900, color: "#fff",
            }}>
              Get started
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", height: layout.hasNavbar ? "calc(100% - 42px)" : "100%" }}>
        {layout.hasSidebar && (
          <div style={{
            width: 180, flexShrink: 0,
            background: `${accent}08`,
            borderRight: `1px solid ${accent}18`,
            padding: "12px 8px",
          }}>
            {(layout.sidebarItems || []).slice(0, 8).map((item: string, i: number) => {
              const itemOp = interpolate(Math.max(0, frame - i * 4), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
              const isActive = i === 0;
              return (
                <div key={i} style={{
                  padding: "7px 10px", borderRadius: 7, marginBottom: 2,
                  background: isActive ? `${accent}20` : "transparent",
                  border: isActive ? `1px solid ${accent}30` : "1px solid transparent",
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                  color: isActive ? accent : `${uiText}66`,
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: itemOp,
                }}>
                  <span style={{ fontSize: 13 }}>
                    {["📊", "📈", "👥", "⚙️", "📁", "🔔", "💳", "📋"][i] || "•"}
                  </span>
                  {item}
                </div>
              );
            })}
          </div>
        )}

        <div style={{
          flex: 1, overflow: "hidden",
          transform: `translateY(-${scrollY}px)`,
          padding: "16px 20px",
        }}>
          {sections.map((section: UiSection, si: number) => {
            const sectionOp = interpolate(Math.max(0, frame - si * 8), [0, 20], [0, 1], {
              extrapolateRight: "clamp", easing: E_OUT,
            });
            const sectionY = interpolate(Math.max(0, frame - si * 8), [0, 20], [20, 0], {
              extrapolateRight: "clamp", easing: E_OUT,
            });

            return (
              <div key={si} style={{
                marginBottom: 20, opacity: sectionOp,
                transform: `translateY(${sectionY}px)`,
              }}>
                {section.title && (
                  <div style={{
                    fontSize: 13, fontWeight: 900, color: uiText,
                    marginBottom: 10, letterSpacing: "-0.02em",
                  }}>
                    {section.title}
                    {section.subtitle && (
                      <span style={{ fontSize: 10, fontWeight: 400, color: `${uiText}55`, marginLeft: 8 }}>
                        {section.subtitle}
                      </span>
                    )}
                  </div>
                )}

                {section.type === "stats" && (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(section.items?.length || 3, 4)}, 1fr)`, gap: 10 }}>
                    {(section.items || []).slice(0, 4).map((item: UiSectionItem, ii: number) => {
                      const isHighlighted = ii === 0;
                      return (
                        <div key={ii} style={{
                          padding: "12px 14px", borderRadius: 10,
                          background: isHighlighted ? `${accent}12` : `${uiText}06`,
                          border: `1px solid ${isHighlighted ? accent + "30" : uiText + "10"}`,
                          boxShadow: isHighlighted ? `0 0 20px ${accent}${Math.round(highlightPulse * 20).toString(16).padStart(2, "0")}` : "none",
                        }}>
                          <div style={{ fontSize: 9, color: `${uiText}55`, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontSize: 20, fontWeight: 900,
                            color: isHighlighted ? accent : uiText,
                            fontFamily,
                            letterSpacing: "-0.04em",
                            ...tabularNums,
                          }}>
                            {item.value}
                          </div>
                          {item.trend && (
                            <div style={{
                              fontSize: 9, color: item.trend.startsWith("+") ? "#30d158" : "#ff3b30",
                              fontWeight: 600, fontFamily, marginTop: 2,
                              ...tabularNums,
                            }}>
                              {item.trend}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(section.type === "features" || section.type === "cards") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {(section.items || []).slice(0, 6).map((item: UiSectionItem, ii: number) => (
                      <div key={ii} style={{
                        padding: "12px", borderRadius: 8,
                        background: `${uiText}04`,
                        border: `1px solid ${uiText}10`,
                      }}>
                        <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon || "✦"}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: uiText, marginBottom: 3 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 9, color: `${uiText}55`, lineHeight: 1.4 }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === "chart" && (
                  <div style={{
                    height: 100, background: `${uiText}04`,
                    borderRadius: 8, padding: "10px 12px",
                    border: `1px solid ${uiText}10`,
                    display: "flex", alignItems: "flex-end", gap: 3,
                  }}>
                    {Array.from({ length: 12 }, (_, i) => {
                      const barH = 20 + Math.sin(i * 0.8) * 25 + Math.cos(i * 0.5) * 15;
                      const revealProg = interpolate(Math.max(0, frame - i * 3 - 10), [0, 20], [0, 1], {
                        extrapolateRight: "clamp", easing: E_OUT,
                      });
                      return (
                        <div key={i} style={{
                          flex: 1, height: `${barH * revealProg}%`,
                          background: i === 11 ? accent : `${accent}44`,
                          borderRadius: "2px 2px 0 0",
                          minHeight: 2,
                        }} />
                      );
                    })}
                  </div>
                )}

                {section.type === "hero" && (
                  <div style={{ padding: "20px 0" }}>
                    <div style={{
                      fontSize: 22, fontWeight: 900, color: uiText,
                      letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 8,
                    }}>
                      {section.title}
                    </div>
                    {section.subtitle && (
                      <div style={{ fontSize: 12, color: `${uiText}66`, marginBottom: 16, lineHeight: 1.5 }}>
                        {section.subtitle}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      {(section.items || []).filter((i) => i.type === "button").slice(0, 2).map((btn, bi) => (
                        <div key={bi} style={{
                          padding: "8px 16px", borderRadius: 7,
                          background: bi === 0 ? accent : "transparent",
                          border: bi === 0 ? "none" : `1px solid ${uiText}22`,
                          fontSize: 11, fontWeight: 900,
                          color: bi === 0 ? "#fff" : uiText,
                          boxShadow: bi === 0 ? `0 4px 16px ${accent}44` : "none",
                        }}>
                          {btn.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(section.type === "feed" || section.type === "table") && (
                  <div style={{
                    background: `${uiText}03`,
                    borderRadius: 8, border: `1px solid ${uiText}10`,
                    overflow: "hidden",
                  }}>
                    {(section.items || []).slice(0, 5).map((item: UiSectionItem, ii: number) => {
                      const rowOp = interpolate(Math.max(0, frame - ii * 4 - 15), [0, 16], [0, 1], {
                        extrapolateRight: "clamp", easing: E_OUT,
                      });
                      return (
                        <div key={ii} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px",
                          borderBottom: ii < (section.items?.length || 0) - 1 ? `1px solid ${uiText}08` : "none",
                          opacity: rowOp,
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: `${accent}20`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11,
                          }}>
                            {item.icon || "👤"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: uiText }}>
                              {item.label}
                            </div>
                            {item.value && (
                              <div style={{ fontSize: 9, color: `${uiText}55` }}>{item.value}</div>
                            )}
                          </div>
                          {item.trend && (
                            <div style={{
                              fontSize: 10, fontWeight: 900,
                              color: item.trend.startsWith("+") ? "#30d158" : "#ff3b30",
                              fontFamily,
                              padding: "2px 6px", borderRadius: 4,
                              background: item.trend.startsWith("+") ? "#30d15820" : "#ff3b3020",
                              ...tabularNums,
                            }}>
                              {item.trend}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={accent} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: fade,
      }}>
        {mockupType === "browser" && (
          <div style={{
            width: 1640,
            transform: `scale(${s}) translateY(${entY}px)`,
            filter: `blur(${bl}px)`,
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          }}>
            <div style={{
              background: "linear-gradient(180deg, #252525, #1c1c1c)",
              borderRadius: "14px 14px 0 0",
              padding: "10px 16px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {[["#ff5f57"], ["#febc2e"], ["#28c840"]].map(([c], i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
              <div style={{
                flex: 1, marginLeft: 8,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6, padding: "4px 12px",
                fontSize: 11, color: "rgba(255,255,255,0.3)",
                fontFamily, display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ color: "#30d158", fontSize: 9 }}>🔒</span>
                {uiData.productName?.toLowerCase().replace(/\s/g, "") + ".com" || "app.example.com"}
              </div>
            </div>
            <div style={{
              height: 480, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "none", borderRadius: "0 0 12px 12px",
            }}>
              <UIContent />
            </div>
          </div>
        )}

        {mockupType === "phone" && (
          <div style={{
            width: 260,
            transform: `scale(${s}) translateY(${entY}px)`,
            filter: `blur(${bl}px)`,
          }}>
            <div style={{
              background: "linear-gradient(145deg, #2d2d2d, #1a1a1a)",
              borderRadius: 44, padding: 10,
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
              <div style={{ width: 90, height: 24, background: "#0a0a0a", borderRadius: 12, margin: "0 auto 6px" }} />
              <div style={{ borderRadius: 34, overflow: "hidden", height: 1000 }}>
                <UIContent />
              </div>
              <div style={{ width: 110, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "8px auto 2px" }} />
            </div>
          </div>
        )}

        {mockupType === "macbook" && (
          <div style={{
            width: 1760,
            transform: `scale(${s * 0.85}) translateY(${entY}px)`,
            filter: `blur(${bl}px)`,
          }}>
            <div style={{
              background: "linear-gradient(180deg, #2a2a2a, #1c1c1c)",
              borderRadius: "16px 16px 4px 4px", padding: "14px 14px 0",
              border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.15)", margin: "0 auto 10px" }} />
              <div style={{ borderRadius: "8px 8px 0 0", overflow: "hidden", height: 840 }}>
                <UIContent />
              </div>
            </div>
            <div style={{ background: "linear-gradient(180deg, #1c1c1c, #141414)", height: 6, border: "1px solid rgba(255,255,255,0.06)", borderTop: "none" }} />
            <div style={{ background: "linear-gradient(180deg, #222, #1a1a1a)", height: 18, borderRadius: "0 0 4px 4px", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }} />
            <div style={{ background: "linear-gradient(180deg, #1e1e1e, #161616)", height: 12, borderRadius: "0 0 20px 20px", width: "108%", marginLeft: "-4%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }} />
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────
// GENERATED UI SCENE — composant React généré par Claude Vision
// ─────────────────────────────────────────────────────────
export const GeneratedUIScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const s     = spring({ frame, fps, config: { damping: 22, stiffness: 160, mass: 1.1 }, from: 0, to: 1 });
  const entY  = interpolate(frame, [0, 55], [100, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const bl    = interpolate(frame, [0, 30], [18, 0], { extrapolateRight: "clamp" });
  const idleY = s > 0.95 ? Math.sin(frame * 0.02) * 4 : 0;
  const tiltX = Math.sin(frame * 0.012) * 1.2;
  const tiltY = Math.cos(frame * 0.009) * 0.8;
  const glow  = 0.3 + Math.sin(frame * 0.04) * 0.15;

  const photoUrl      = scene.photoUrl || "";
  const componentCode = scene.componentCode || "";
  const mockupType    = scene.mockupType || "browser";
  const accent        = scene.accentColor || "#7C3AED";

  let GeneratedComponent: React.FC | null = null;
  try {
    if (componentCode) {
      const fn = new Function(
        "React", "useCurrentFrame", "interpolate", "spring", "Easing", "staticFile",
        `"use strict";
      try {
        const useCurrentFrame = arguments[1];
        const interpolate = arguments[2];
        const spring = arguments[3];
        const Easing = arguments[4];
        const staticFile = arguments[5];
        return ${componentCode};
      } catch(e) {
        return null;
      }`
      );
      const result = fn(React, useCurrentFrame, interpolate, spring, Easing, staticFile);
      if (typeof result === "function") {
        GeneratedComponent = result;
      }
    }
  } catch (e) {
    console.error("Component exec error:", e);
  }

  const FallbackComponent: React.FC = () => {
    const f = useCurrentFrame();

    const kb = interpolate(f, [0, 150], [1.0, 1.12], {
      extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    });
    const scrollY = interpolate(f, [15, 120], [0, 180], {
      extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
    });
    const scanY = interpolate(f, [10, 130], [5, 90], {
      extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
    });
    const scanOp = interpolate(f, [10, 30, 100, 130], [0, 1, 1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    const spotX = 40 + Math.sin(f * 0.02) * 20;
    const spotY = 30 + Math.cos(f * 0.015) * 15;

    return (
      <div style={{
        width: "100%", height: "100%",
        overflow: "hidden", position: "relative",
        background: "#fff",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          transform: `scale(${kb}) translateY(-${scrollY}px)`,
          transformOrigin: "top center",
        }}>
          {photoUrl ? (
            <img
              src={scenePhotoSrc(photoUrl)}
              alt=""
              style={{ width: "100%", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#f5f5f5" }} />
          )}
        </div>

        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(circle 200px at ${spotX}% ${spotY}%, rgba(255,255,255,0.15) 0%, transparent 70%)`,
        }} />

        <div style={{
          position: "absolute", left: 0, right: 0,
          top: `${scanY}%`, height: 2, pointerEvents: "none",
          background: `linear-gradient(90deg, transparent 0%, ${accent}cc 30%, ${accent} 50%, ${accent}cc 70%, transparent 100%)`,
          opacity: scanOp,
          boxShadow: `0 0 20px ${accent}88`,
        }} />

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.25))",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
        }} />
      </div>
    );
  };

  const UIContent = GeneratedComponent ? <GeneratedComponent /> : <FallbackComponent />;

  const label = scene.text;
  const labelOp = interpolate(Math.max(0, frame - 35), [0, 22], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneBg color={bg} accent={accent} sceneIndex={sceneIndex} />
      <DepthRings accent={accent} />
      <Grain />

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 20,
        opacity: fade,
      }}>

        {mockupType === "browser" && (
          <div style={{
            width: 1640, position: "relative",
            transform: `scale(${s}) translateY(${entY + idleY}px) perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            filter: `blur(${bl}px)`,
          }}>
            <div style={{
              position: "absolute", inset: -40, zIndex: -1,
              background: `radial-gradient(ellipse, ${accent}${Math.round(glow * 25).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
              filter: "blur(24px)",
            }} />
            <div style={{
              background: "linear-gradient(180deg, #2a2a2a 0%, #1d1d1d 100%)",
              borderRadius: "16px 16px 0 0",
              padding: "12px 16px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
              {[["#ff5f57", "#ff3b30"], ["#febc2e", "#f5a623"], ["#28c840", "#1aac2a"]].map(([c, s2], i) => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: `radial-gradient(circle at 40% 35%, ${c}, ${s2})`,
                  boxShadow: `0 1px 3px ${s2}88`,
                }} />
              ))}
              <div style={{ display: "flex", gap: 10, marginLeft: 6 }}>
                {["‹", "›", "↻"].map((a, i) => (
                  <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{a}</div>
                ))}
              </div>
              <div style={{
                flex: 1, marginLeft: 4,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "5px 12px",
                display: "flex", alignItems: "center", gap: 6,
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontSize: 10, color: "#30d158" }}>🔒</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily, fontWeight: 500 }}>
                  {label?.toLowerCase().replace(/\s/g, "") || "app"}.com
                </span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {["⊕", "⋯"].map((icon, i) => (
                  <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>{icon}</div>
                ))}
              </div>
            </div>
            <div style={{
              height: 1000, overflow: "hidden", position: "relative",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
              boxShadow: "0 50px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
            }}>
              {UIContent}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%)",
              }} />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 60, pointerEvents: "none",
                background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.15))",
              }} />
            </div>
          </div>
        )}

        {mockupType === "phone" && (
          <div style={{
            width: 270, position: "relative",
            transform: `scale(${s}) translateY(${entY + idleY}px) perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY * 2}deg)`,
            filter: `blur(${bl}px)`,
          }}>
            <div style={{
              position: "absolute", inset: -50, zIndex: -1,
              background: `radial-gradient(ellipse, ${accent}${Math.round(glow * 20).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
              filter: "blur(20px)",
            }} />
            <div style={{
              background: "linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)",
              borderRadius: 50, padding: 10,
              boxShadow: "0 50px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)",
            }}>
              <div style={{
                width: 95, height: 26, background: "#0a0a0a",
                borderRadius: 13, margin: "0 auto 8px",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333" }} />
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#333" }} />
              </div>
              <div style={{
                borderRadius: 38, overflow: "hidden", height: 520,
                border: "1px solid rgba(0,0,0,0.5)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}>
                {UIContent}
              </div>
              <div style={{
                width: 115, height: 5, background: "rgba(255,255,255,0.25)",
                borderRadius: 3, margin: "10px auto 2px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
        )}

        {mockupType === "macbook" && (
          <div style={{
            width: 1800, position: "relative",
            transform: `scale(${s * 0.85}) translateY(${entY + idleY}px) perspective(1600px) rotateX(${tiltX + 5}deg) rotateY(${tiltY}deg)`,
            filter: `blur(${bl}px)`,
          }}>
            <div style={{
              position: "absolute", inset: -50, zIndex: -1,
              background: `radial-gradient(ellipse, ${accent}${Math.round(glow * 18).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
              filter: "blur(30px)",
            }} />
            <div style={{
              background: "linear-gradient(180deg, #2c2c2c, #1e1e1e)",
              borderRadius: "18px 18px 4px 4px", padding: "14px 14px 0",
              border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "radial-gradient(circle at 40% 35%, #2a2a2a, #0a0a0a)",
                border: "1px solid #333",
                margin: "0 auto 10px",
              }} />
              <div style={{ borderRadius: "8px 8px 0 0", overflow: "hidden", height: 440 }}>
                {UIContent}
              </div>
            </div>
            <div style={{
              height: 5, background: "linear-gradient(180deg, #1a1a1a, #111)",
              border: "1px solid rgba(255,255,255,0.05)", borderTop: "none",
            }} />
            <div style={{
              height: 20, background: "linear-gradient(180deg, #242424, #1a1a1a)",
              borderRadius: "0 0 6px 6px",
              border: "1px solid rgba(255,255,255,0.06)", borderTop: "none",
              boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
            }} />
            <div style={{
              height: 14, background: "linear-gradient(180deg, #1e1e1e, #161616)",
              borderRadius: "0 0 24px 24px",
              width: "108%", marginLeft: "-4%",
              border: "1px solid rgba(255,255,255,0.04)", borderTop: "none",
              boxShadow: "0 10px 50px rgba(0,0,0,0.6)",
            }} />
          </div>
        )}

        {label && (
          <div style={{
            textAlign: "center",
            opacity: labelOp,
            transform: `translateY(${interpolate(Math.max(0, frame - 35), [0, 22], [16, 0], { extrapolateRight: "clamp", easing: E_OUT })}px)`,
          }}>
            <div style={{
              fontSize: autoFontSize(label, 60, 32),
              fontWeight: 900, color: textColor(bg),
              fontFamily, letterSpacing: autoTracking(52),
            }}>
              {label}
            </div>
            <AccentLine accent={safeAccent(accent, bg)} delay={40} width={55} />
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};


// ═══════════════════════════════════════════════════════
// BATCH 1 — TEXTE & TYPOGRAPHIE
// ═══════════════════════════════════════════════════════

export const TypewriterScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const text = scene.text || "";
  const charsPerFrame = 0.4;
  const visibleChars = Math.floor(frame * charsPerFrame);
  const displayed = text.slice(0, visibleChars);
  const showCursor = frame % 30 < 20;
  const fontSize = autoFontSize(text, 100, 48);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px" }}>
        <div style={{
          fontSize, fontWeight: 900, color: textColor(bg),
          fontFamily, letterSpacing: "-0.03em", lineHeight: 1.2,
        }}>
          {displayed}
          {showCursor && <span style={{ color: scene.accentColor, opacity: 0.9 }}>|</span>}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ScrambleTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const text = scene.text || "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const revealProgress = Math.min(1, frame / 60);
  const revealedChars = Math.floor(revealProgress * text.length);
  const fontSize = autoFontSize(text, 140, 60);

  const scrambled = text.split("").map((char, i) => {
    if (char === " ") return " ";
    if (i < revealedChars) return char;
    return chars[Math.floor((frame * (i + 1) * 7) % chars.length)];
  }).join("");

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px", textAlign: "center" }}>
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: textColor(bg),
        }}>
          {scrambled.split("").map((char, i) => (
            <span key={i} style={{
              color: i < revealedChars ? textColor(bg) : safeAccent(scene.accentColor, bg),
              opacity: i < revealedChars ? 1 : 0.5 + Math.sin(frame * 0.3 + i) * 0.3,
            }}>{char}</span>
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const NeonGlowScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#050510";
  const pulse = 0.7 + Math.sin(frame * 0.08) * 0.3;
  const flicker = frame % 20 < 2 ? 0.3 : 1;
  const fontSize = autoFontSize(scene.text || "", 140, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade * flicker, padding: "0 80px", textAlign: "center", flexDirection: "column", gap: 16 }}>
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: scene.accentColor,
          textShadow: `
            0 0 10px ${scene.accentColor},
            0 0 20px ${scene.accentColor},
            0 0 40px ${scene.accentColor}${Math.round(pulse * 200).toString(16).padStart(2, "0")},
            0 0 80px ${scene.accentColor}${Math.round(pulse * 100).toString(16).padStart(2, "0")}
          `,
        }}>
          {scene.text}
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.35), fontWeight: 300,
            color: "rgba(255,255,255,0.5)", fontFamily,
            textShadow: `0 0 20px ${scene.accentColor}44`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

export const StampScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const s = spring({ frame, fps, config: { damping: 8, stiffness: 400, mass: 0.8 }, from: 2, to: 1 });
  const op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const rotation = interpolate(frame, [0, 1], [-3, 0], { extrapolateRight: "clamp" });
  const fontSize = autoFontSize(scene.text || "", 120, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
        <div style={{
          transform: `scale(${s}) rotate(${rotation}deg)`,
          opacity: op,
          padding: "24px 48px",
          border: `8px solid ${scene.accentColor}`,
          borderRadius: 8,
          textAlign: "center",
        }}>
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: scene.accentColor,
          }}>
            {scene.text}
          </div>
          {scene.text2 && (
            <div style={{ fontSize: 28, fontWeight: 400, color: scene.accentColor, opacity: 0.7, marginTop: 8 }}>
              {scene.text2}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.1 : 0.5} />
    </AbsoluteFill>
  );
};

export const WaveTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const words = (scene.text || "").split(" ");
  const fontSize = autoFontSize(scene.text || "", 100, 48);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px", flexWrap: "wrap", gap: 16 }}>
        {words.map((word, i) => {
          const waveY = Math.sin(frame * 0.08 + i * 0.8) * 20;
          const op = interpolate(Math.max(0, frame - i * 4), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
          return (
            <div key={i} style={{
              fontSize, fontWeight: 900, fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: i % 2 === 0 ? textColor(bg) : safeAccent(scene.accentColor, bg),
              transform: `translateY(${waveY}px)`,
              opacity: op,
              display: "inline-block",
            }}>
              {word}
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const OutlineFillScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const fillProgress = interpolate(frame, [10, 70], [0, 100], { extrapolateRight: "clamp", easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 140, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px", textAlign: "center", position: "relative" }}>
        {/* Outline */}
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          WebkitTextStroke: `2px ${safeAccent(scene.accentColor, bg)}`,
          color: "transparent",
          position: "absolute",
        }}>
          {scene.text}
        </div>
        {/* Fill avec clip */}
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: safeAccent(scene.accentColor, bg),
          clipPath: `inset(0 ${100 - fillProgress}% 0 0)`,
        }}>
          {scene.text}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 2 — DATA & STATS
// ═══════════════════════════════════════════════════════

export const OdometerScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const to = scene.counterTo || 1000000;
  const odometerEnd = Math.max(2, Math.round(durationInFrames * 0.8));
  const progress = interpolate(frame, [0, odometerEnd], [0, 1], { ...CLAMP_BOTH, easing: Easing.out(Easing.cubic) });
  const value = Math.round(to * progress);
  const digits = value.toLocaleString("fr-FR").split("");

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {digits.map((digit, i) => (
            <div key={i} style={{
              fontSize: 120, fontWeight: 900, fontFamily,
              color: digit === "," || digit === " " ? safeAccent(scene.accentColor, bg) : textColor(bg),
              letterSpacing: "-0.05em",
              transform: digit !== "," && digit !== " " ? `translateY(${Math.sin(frame * 0.1 + i) * 2}px)` : "none",
            }}>
              {digit}
            </div>
          ))}
        </div>
        {scene.text && (
          <div style={{ fontSize: 36, fontWeight: 300, color: isLight(bg) ? "#666" : "#555", fontFamily }}>
            {scene.text}
          </div>
        )}
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={10} width={80} />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ProgressRingScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const targetPct = scene.counterTo || 78;
  const ringEnd = Math.max(12, Math.round(durationInFrames * 0.8));
  const progress = interpolate(frame, monoRange(10, ringEnd), [0, targetPct], { ...CLAMP_BOTH, easing: E_OUT });
  const r = 160;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (progress / 100) * circumference;
  const numOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 24 }}>
        <div style={{ position: "relative", width: 380, height: 380 }}>
          <svg width="380" height="380" viewBox="0 0 380 380" style={{ transform: "rotate(-90deg)" }}>
            {/* Track */}
            <circle cx="190" cy="190" r={r} fill="none"
              stroke={isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}
              strokeWidth="16" />
            {/* Progress */}
            <circle cx="190" cy="190" r={r} fill="none"
              stroke={safeAccent(scene.accentColor, bg)}
              strokeWidth="16" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ filter: `drop-shadow(0 0 12px ${scene.accentColor})` }}
            />
          </svg>
          {/* Center text */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            opacity: numOp,
          }}>
            <div style={{
              fontSize: 72, fontWeight: 900, fontFamily,
              color: safeAccent(scene.accentColor, bg),
              letterSpacing: "-0.04em",
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>
        {scene.text && (
          <div style={{ fontSize: 32, fontWeight: 300, color: isLight(bg) ? "#666" : "#555", fontFamily }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const GaugeScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const targetPct = scene.counterTo || 85;
  const gaugeEnd = Math.max(12, Math.round(durationInFrames * 0.8));
  const progress = interpolate(frame, monoRange(10, gaugeEnd), [0, targetPct / 100], { ...CLAMP_BOTH, easing: E_OUT });
  const angle = -135 + progress * 270;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 24 }}>
        <div style={{ position: "relative", width: 400, height: 260 }}>
          <svg width="400" height="260" viewBox="0 0 400 260">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#30d158" />
                <stop offset="50%" stopColor={scene.accentColor} />
                <stop offset="100%" stopColor="#ff3b30" />
              </linearGradient>
            </defs>
            {/* Track arc */}
            <path d="M 40 220 A 160 160 0 0 1 360 220" fill="none"
              stroke={isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}
              strokeWidth="20" strokeLinecap="round" />
            {/* Colored arc */}
            <path d="M 40 220 A 160 160 0 0 1 360 220" fill="none"
              stroke="url(#gaugeGrad)" strokeWidth="20" strokeLinecap="round"
              strokeDasharray="503" strokeDashoffset={503 - 503 * progress} />
            {/* Needle */}
            <g transform={`translate(200, 220) rotate(${angle})`}>
              <line x1="0" y1="0" x2="0" y2="-130" stroke={textColor(bg)} strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="0" r="10" fill={safeAccent(scene.accentColor, bg)} />
            </g>
          </svg>
          {/* Value */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            fontSize: 64, fontWeight: 900, fontFamily,
            color: safeAccent(scene.accentColor, bg),
            letterSpacing: "-0.04em",
          }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
        {scene.text && (
          <div style={{ fontSize: 32, fontWeight: 300, color: isLight(bg) ? "#666" : "#555", fontFamily }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const BubbleChartScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const bubbles = [
    { x: 200, y: 300, r: 120, label: "80%", color: scene.accentColor },
    { x: 500, y: 250, r: 90, label: "60%", color: safeAccent(scene.accentColor, bg) },
    { x: 800, y: 350, r: 70, label: "45%", color: scene.accentColor + "88" },
    { x: 350, y: 500, r: 60, label: "30%", color: safeAccent(scene.accentColor, bg) + "88" },
    { x: 650, y: 480, r: 50, label: "20%", color: scene.accentColor + "66" },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920">
          {bubbles.map((b, i) => {
            const scale = interpolate(Math.max(0, frame - i * 8), [0, 24], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
            const idleY = Math.sin(frame * 0.04 + i) * 8;
            return (
              <g key={i} transform={`translate(${b.x}, ${b.y + idleY}) scale(${scale})`}>
                <circle r={b.r} fill={b.color} opacity={0.85} />
                <circle r={b.r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
                <text textAnchor="middle" dy="0.35em"
                  fontSize={b.r * 0.4} fontWeight="900" fontFamily={fontFamily}
                  fill={isLight(b.color) ? "#0a0a0a" : "#ffffff"}>
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
        {scene.text && (
          <div style={{
            position: "absolute", bottom: 200, left: 0, right: 0,
            textAlign: "center", fontSize: 48, fontWeight: 300,
            color: isLight(bg) ? "#666" : "#555", fontFamily,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 3 — UI & PRODUIT
// ═══════════════════════════════════════════════════════

export const NotificationScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const notifications = [
    { icon: "💳", title: "Payment received", sub: "$2,400 from Sarah", time: "now", delay: 0 },
    { icon: "📦", title: "Order shipped", sub: "Package on the way", time: "2m ago", delay: 20 },
    { icon: "🎉", title: "New milestone!", sub: "1,000 followers", time: "5m ago", delay: 40 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px" }}>
        {notifications.map((notif, i) => {
          const localFrame = Math.max(0, frame - notif.delay);
          const cardScale = spring({ frame: localFrame, fps, config: APPLE_SPRING, from: 0.95, to: 1 });
          const floatY = Math.sin(frame * 0.02 + i * 0.8) * 4;
          const x = interpolate(localFrame, [0, 24], [200, 0], { extrapolateRight: "clamp", easing: E_PREMIUM });
          const op = interpolate(localFrame, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_PREMIUM });
          return (
            <div key={i} style={{
              width: "100%", padding: "16px 20px",
              background: isLight(bg) ? "rgba(255,255,255,0.9)" : "rgba(30,30,30,0.9)",
              backdropFilter: "blur(20px)",
              borderRadius: 24,
              border: "1px solid rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: 14,
              opacity: op,
              transform: `translateX(${x}px) scale(${cardScale}) translateY(${floatY}px) perspective(1000px) rotateX(-2deg) rotateY(1deg)`,
              boxShadow: APPLE_CARD_SHADOW,
            }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{notif.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: isLight(bg) ? "#0a0a0a" : "#ffffff", fontFamily }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: 14, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
                  {notif.sub}
                </div>
              </div>
              <div style={{ fontSize: 12, color: isLight(bg) ? "#aaa" : "#444", fontFamily }}>
                {notif.time}
              </div>
            </div>
          );
        })}
        {scene.text && (
          <div style={{ fontSize: 36, fontWeight: 900, color: textColor(bg), fontFamily, marginTop: 16 }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const SuccessCheckScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 300 }, from: 0, to: 1 });
  const checkProgress = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const r = 120;
  const checkLength = 300;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 32 }}>
        <div style={{ transform: `scale(${s})` }}>
          <svg width={r * 2 + 40} height={r * 2 + 40} viewBox={`0 0 ${r * 2 + 40} ${r * 2 + 40}`}>
            {/* Circle */}
            <circle cx={r + 20} cy={r + 20} r={r} fill="none"
              stroke={safeAccent(scene.accentColor, bg)} strokeWidth="6"
              strokeDasharray={2 * Math.PI * r}
              strokeDashoffset={(1 - checkProgress) * 2 * Math.PI * r}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 12px ${scene.accentColor})` }}
            />
            {/* Checkmark */}
            <polyline points={`${r - 40},${r + 20} ${r + 5},${r + 65} ${r + 60},${r - 30}`}
              fill="none" stroke={safeAccent(scene.accentColor, bg)} strokeWidth="8"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={checkLength}
              strokeDashoffset={(1 - checkProgress) * checkLength}
            />
          </svg>
        </div>
        {scene.text && (
          <div style={{ fontSize: 56, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        {scene.text2 && (
          <div style={{ fontSize: 28, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const FeatureHighlightScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const photoUrl = (scene as any).photoUrl || "";
  const kb = interpolate(frame, [0, 120], [1, 1.06], { extrapolateRight: "clamp", easing: E_OUT });

  // Highlight qui se déplace
  const highlights = [
    { x: 30, y: 25, w: 40, h: 15, delay: 20 },
    { x: 15, y: 55, w: 60, h: 20, delay: 50 },
    { x: 40, y: 75, w: 35, h: 12, delay: 80 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ opacity: fade, justifyContent: "center", alignItems: "center" }}>
        {/* Mockup avec highlights */}
        <div style={{
          width: 780, borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          position: "relative",
        }}>
          {photoUrl ? (
            <img src={scenePhotoSrc(photoUrl)}
              style={{ width: "100%", display: "block", transform: `scale(${kb})`, transformOrigin: "top center" }} />
          ) : (
            <div style={{ height: 480, background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🖥️</div>
          )}
          {/* Highlights animés */}
          {highlights.map((h, i) => {
            const highlightT = Math.max(0, frame - h.delay);
            const op = interpolate(highlightT, [0, 16, 40, 56], [0, 0.8, 0.8, 0], CLAMP_BOTH);
            return (
              <div key={i} style={{
                position: "absolute",
                left: `${h.x}%`, top: `${h.y}%`,
                width: `${h.w}%`, height: `${h.h}%`,
                background: `${scene.accentColor}33`,
                border: `2px solid ${scene.accentColor}`,
                borderRadius: 4,
                opacity: op,
                boxShadow: `0 0 20px ${scene.accentColor}66`,
              }} />
            );
          })}
        </div>
        {scene.text && (
          <div style={{
            position: "absolute", bottom: 100, left: 0, right: 0,
            textAlign: "center", fontSize: 48, fontWeight: 900,
            color: textColor(bg), fontFamily, letterSpacing: "-0.03em",
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 4 — SOCIAL MEDIA
// ═══════════════════════════════════════════════════════

export const LikeExplosionScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const count = scene.counterTo || 10247;
  const progress = interpolate(frame, [0, 80], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const currentCount = Math.round(count * progress);

  const hearts = Array.from({ length: 20 }, (_, i) => ({
    x: 400 + Math.cos(i * 0.5) * (60 + i * 15),
    y: 900 - (frame * (1.5 + i * 0.1) + i * 20),
    scale: 0.5 + Math.sin(i * 1.3) * 0.5,
    opacity: Math.max(0, 1 - (frame * 0.015 + i * 0.05)),
    delay: i * 3,
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ opacity: fade, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}>
        {/* Coeurs flottants */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {hearts.map((h, i) => (
            <div key={i} style={{
              position: "absolute",
              left: h.x, top: h.y,
              fontSize: 32 * h.scale,
              opacity: Math.max(0, h.opacity),
              transform: `rotate(${Math.sin(i) * 20}deg)`,
            }}>❤️</div>
          ))}
        </div>
        {/* Compteur */}
        <div style={{ fontSize: 140, fontWeight: 900, fontFamily, color: "#ff375f", letterSpacing: "-0.05em",
          textShadow: "0 0 40px rgba(255,55,95,0.5)", position: "relative" }}>
          {currentCount.toLocaleString("fr-FR")}
        </div>
        <div style={{ fontSize: 36, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
          {scene.text || "J'aime"}
        </div>
        <AccentLine accent="#ff375f" delay={10} width={80} />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const FollowerCounterScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const target = scene.counterTo || 100000;
  const followerEnd = Math.max(2, Math.round(durationInFrames * 0.8));
  const progress = interpolate(frame, [0, followerEnd], [0, 1], { ...CLAMP_BOTH, easing: Easing.out(Easing.cubic) });
  const current = Math.round(target * progress);
  const milestoneStart = Math.round(durationInFrames * 0.75);
  const milestoneEnd = Math.max(milestoneStart + 1, Math.round(durationInFrames * 0.85));
  const milestoneOp = interpolate(frame, [milestoneStart, milestoneEnd], [0, 1], CLAMP_BOTH);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Abonnés
        </div>
        <div style={{ fontSize: 140, fontWeight: 900, fontFamily, letterSpacing: "-0.05em",
          background: `linear-gradient(135deg, ${safeAccent(scene.accentColor, bg)}, #ffffff)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {current >= 1000 ? `${(current / 1000).toFixed(1)}K` : current.toLocaleString()}
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={10} width={80} />
        <div style={{ opacity: milestoneOp, fontSize: 32, fontWeight: 900, color: safeAccent(scene.accentColor, bg), fontFamily }}>
          🎉 {target >= 1000 ? `${target / 1000}K` : target} atteints !
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 5 — CINÉMATIQUE & AMBIANCE
// ═══════════════════════════════════════════════════════

export const StarfieldScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#00000f";

  const stars = Array.from({ length: 80 }, (_, i) => ({
    x: (((i * 137.508 + frame * (0.1 + i * 0.002)) % 1080)),
    y: (((i * 97.3 + frame * (0.05 + i * 0.001)) % 1920)),
    r: 0.5 + (i % 4) * 0.5,
    pulse: 0.5 + Math.sin(frame * 0.05 + i) * 0.4,
  }));

  const textOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const textY  = interpolate(frame, [20, 40], [30, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 120, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r}
            fill="white" opacity={star.pulse} />
        ))}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: "#ffffff",
            opacity: textOp,
            transform: `translateY(${textY}px)`,
            textAlign: "center", padding: "0 80px",
            textShadow: `0 0 40px ${scene.accentColor}88`,
          }}>
            {scene.text}
          </div>
        )}
        <AccentLine accent={scene.accentColor} delay={30} width={80} />
        {scene.text2 && (
          <div style={{
            fontSize: 32, fontWeight: 200, color: "rgba(255,255,255,0.5)",
            fontFamily, opacity: textOp,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

export const AuroraScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#000510";
  const fontSize = autoFontSize(scene.text || "", 120, 60);

  const waves = [
    { color: "#00ff88", opacity: 0.15, speed: 0.02, offset: 0 },
    { color: scene.accentColor, opacity: 0.12, speed: 0.015, offset: 200 },
    { color: "#0088ff", opacity: 0.1, speed: 0.025, offset: 400 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {waves.map((wave, i) => {
          const points = Array.from({ length: 20 }, (_, j) => {
            const x = j * 60;
            const y = 600 + wave.offset + Math.sin(j * 0.5 + frame * wave.speed) * 200 + Math.cos(j * 0.3 + frame * wave.speed * 0.7) * 100;
            return `${x},${y}`;
          }).join(" ");
          return (
            <g key={i}>
              <polyline points={points} fill="none" stroke={wave.color} strokeWidth="120" opacity={wave.opacity} strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: "#ffffff", textAlign: "center", padding: "0 80px",
            textShadow: "0 0 60px rgba(0,255,136,0.3)",
          }}>
            {scene.text}
          </div>
        )}
        <AccentLine accent="#00ff88" delay={20} width={80} />
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const MatrixRainScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#000800";
  const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";
  const columns = 20;
  const fontSize = autoFontSize(scene.text || "", 100, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* Matrix rain */}
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
        {Array.from({ length: columns }, (_, col) => {
          const x = (col / columns) * 1080 + 27;
          const speed = 8 + (col % 5) * 3;
          return Array.from({ length: 12 }, (_, row) => {
            const y = ((frame * speed + col * 150 + row * 160) % 2200) - 200;
            const charIdx = Math.floor((frame * 0.3 + col * 7 + row * 13) % chars.length);
            const opacity = 1 - row * 0.08;
            return (
              <text key={`${col}-${row}`} x={x} y={y}
                fill="#00ff41" opacity={Math.max(0, opacity)}
                fontSize="28" fontFamily="monospace" textAnchor="middle">
                {chars[charIdx]}
              </text>
            );
          });
        })}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: "#00ff41",
            textShadow: "0 0 20px #00ff41, 0 0 40px #00ff4188",
            textAlign: "center", padding: "0 80px",
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const CountdownRingScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const startCount = scene.counterTo || 5;
  const progress = frame / durationInFrames;
  const currentCount = Math.max(0, Math.ceil(startCount * (1 - progress)));
  const frameInCount = frame % Math.round(durationInFrames / startCount);
  const pulseProg = frameInCount / Math.round(durationInFrames / startCount);
  const scale = 1 + (1 - pulseProg) * 0.3;
  const r = 180;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * pulseProg;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 24 }}>
        <div style={{ position: "relative", width: 420, height: 420 }}>
          <svg width="420" height="420" viewBox="0 0 420 420" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="210" cy="210" r={r} fill="none"
              stroke={isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}
              strokeWidth="12" />
            <circle cx="210" cy="210" r={r} fill="none"
              stroke={safeAccent(scene.accentColor, bg)}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ filter: `drop-shadow(0 0 16px ${scene.accentColor})` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontSize: 180, fontWeight: 900, fontFamily,
              color: safeAccent(scene.accentColor, bg),
              letterSpacing: "-0.06em",
              transform: `scale(${scale})`,
              textShadow: `0 0 40px ${scene.accentColor}66`,
            }}>
              {currentCount}
            </div>
          </div>
        </div>
        {scene.text && (
          <div style={{ fontSize: 40, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const XPBarScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const targetXP = scene.counterTo || 8500;
  const maxXP = 10000;
  const xpEnd = Math.max(12, Math.round(durationInFrames * 0.8));
  const progress = interpolate(frame, monoRange(10, xpEnd), [0, targetXP / maxXP], { ...CLAMP_BOTH, easing: E_OUT });
  const barWidth = 800;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 32, padding: "0 80px" }}>
        {/* Level badge */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: `linear-gradient(135deg, ${safeAccent(scene.accentColor, bg)}, ${safeAccent(scene.accentColor, bg)}88)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, fontWeight: 900, color: isLight(scene.accentColor) ? "#0a0a0a" : "#ffffff",
          fontFamily, boxShadow: `0 0 40px ${scene.accentColor}66`,
        }}>
          42
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em" }}>
          {scene.text || "Level Up!"}
        </div>
        {/* XP Bar */}
        <div style={{ width: barWidth, position: "relative" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 20, color: isLight(bg) ? "#888" : "#555", fontFamily,
            marginBottom: 10,
          }}>
            <span>XP</span>
            <span>{Math.round(progress * maxXP).toLocaleString()} / {maxXP.toLocaleString()}</span>
          </div>
          <div style={{ height: 16, background: isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${safeAccent(scene.accentColor, bg)}88, ${safeAccent(scene.accentColor, bg)})`,
              borderRadius: 8,
              boxShadow: `0 0 12px ${scene.accentColor}`,
              transition: "width 0.1s",
            }} />
          </div>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const FlightBoardScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#0a0a0a";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const flights = [
    { dest: "TOKYO", flight: "JL 3", time: "15:00", gate: "A7", status: "ON TIME" },
    { dest: "PARIS", flight: "AF 1", time: "15:30", gate: "B12", status: "BOARDING" },
    { dest: "NEW YORK", flight: "AA 2", time: "16:00", gate: "C3", status: "DELAYED" },
    { dest: "DUBAI", flight: "EK 5", time: "16:45", gate: "D8", status: "ON TIME" },
  ];

  const scrambleText = (text: string, progress: number, colIdx: number) => {
    const revealed = Math.floor(progress * text.length);
    return text.split("").map((char, i) => {
      if (char === " ") return " ";
      if (i < revealed) return char;
      return chars[Math.floor((frame * (colIdx + 1) * 3 + i * 7) % chars.length)];
    }).join("");
  };

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 60px", flexDirection: "column", gap: 8 }}>
        {/* Header */}
        <div style={{
          width: "100%", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
          borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 12, marginBottom: 12,
        }}>
          {["DESTINATION", "FLIGHT", "TIME", "GATE", "STATUS"].map(h => (
            <div key={h} style={{ fontSize: 18, fontWeight: 900, color: safeAccent(scene.accentColor, bg), fontFamily, letterSpacing: "0.08em" }}>
              {h}
            </div>
          ))}
        </div>
        {/* Rows */}
        {flights.map((f, i) => {
          const rowProgress = interpolate(Math.max(0, frame - i * 12), [0, 40], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
          return (
            <div key={i} style={{
              width: "100%", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
              padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
              opacity: rowProgress,
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", fontFamily, letterSpacing: "0.05em" }}>
                {scrambleText(f.dest, rowProgress, i * 5)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 400, color: "rgba(255,255,255,0.7)", fontFamily }}>
                {scrambleText(f.flight, rowProgress, i * 3 + 1)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 400, color: "rgba(255,255,255,0.7)", fontFamily }}>
                {f.time}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: safeAccent(scene.accentColor, bg), fontFamily }}>
                {f.gate}
              </div>
              <div style={{
                fontSize: 18, fontWeight: 900, fontFamily,
                color: f.status === "ON TIME" ? "#30d158" : f.status === "BOARDING" ? scene.accentColor : "#ff3b30",
              }}>
                {f.status}
              </div>
            </div>
          );
        })}
        {scene.text && (
          <div style={{ fontSize: 36, fontWeight: 300, color: "rgba(255,255,255,0.4)", fontFamily, marginTop: 20 }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const StockChartScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const stockData = [42, 38, 45, 41, 55, 52, 48, 61, 58, 65, 70, 68, 75, 72, 80, 85, 82, 90, 88, 95];
  const W = 900, H = 400, pad = 40;
  const cW = W - pad * 2, cH = H - pad * 2;
  const maxVal = Math.max(...stockData);
  const minVal = Math.min(...stockData);

  const revealed = interpolate(frame, [6, 90], [0, stockData.length], { extrapolateRight: "clamp", easing: E_OUT });
  const visibleData = stockData.slice(0, Math.max(2, Math.round(revealed)));

  const points = visibleData.map((v, i) => ({
    x: pad + (i / (stockData.length - 1)) * cW,
    y: pad + cH - ((v - minVal) / (maxVal - minVal)) * cH,
    value: v,
  }));

  const pathD = points.length >= 2 ? points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `C ${points[i-1].x + 25} ${points[i-1].y} ${p.x - 25} ${p.y} ${p.x} ${p.y}`
  ).join(" ") : "";

  const fillPath = pathD + ` L ${points[points.length-1].x} ${pad + cH} L ${pad} ${pad + cH} Z`;
  const isUp = stockData[stockData.length - 1] > stockData[0];
  const chartColor = isUp ? "#30d158" : "#ff3b30";
  const lastValue = visibleData[visibleData.length - 1] || stockData[0];
  const changePercent = ((lastValue - stockData[0]) / stockData[0] * 100).toFixed(1);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 60px" }}>
        {/* Header */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>{scene.text || "MOTION AI"}</div>
            <div style={{ fontSize: 72, fontWeight: 900, fontFamily, color: textColor(bg), letterSpacing: "-0.04em" }}>
              ${lastValue.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: chartColor, fontFamily }}>
              {isUp ? "▲" : "▼"} {Math.abs(Number(changePercent))}%
            </div>
            <div style={{ fontSize: 20, color: isLight(bg) ? "#888" : "#555", fontFamily }}>Today</div>
          </div>
        </div>
        {/* Chart */}
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="stockFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {pathD && (
            <>
              <path d={fillPath} fill="url(#stockFill)" />
              <path d={pathD} fill="none" stroke={chartColor} strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 8px ${chartColor})` }}
              />
              {/* Last point */}
              {points.length > 0 && (
                <g>
                  <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="16" fill={chartColor} opacity="0.2" />
                  <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="6" fill={chartColor}
                    style={{ filter: `drop-shadow(0 0 8px ${chartColor})` }}
                  />
                </g>
              )}
            </>
          )}
        </svg>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const HologramScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#000510";
  const scanLine = (frame * 8) % 1920;
  const glitch = frame % 40 < 2 ? Math.random() * 20 - 10 : 0;
  const fontSize = autoFontSize(scene.text || "", 130, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      {/* Grid holographique */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,200,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,200,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        opacity: 0.6,
      }} />
      {/* Scan line */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        top: scanLine,
        background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.6), transparent)",
        pointerEvents: "none",
      }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 24 }}>
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: "#00c8ff",
          textShadow: `
            0 0 10px #00c8ff,
            0 0 20px #00c8ff88,
            0 0 40px #00c8ff44,
            ${glitch}px 0 rgba(255,0,80,0.5),
            ${-glitch}px 0 rgba(0,255,200,0.5)
          `,
          textAlign: "center", padding: "0 80px",
          transform: `translateX(${glitch * 0.5}px)`,
        }}>
          {scene.text}
        </div>
        {scene.text2 && (
          <div style={{ fontSize: 32, fontWeight: 300, color: "rgba(0,200,255,0.6)", fontFamily, letterSpacing: "0.1em" }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const MoneyRainScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const fontSize = autoFontSize(scene.text || "", 120, 60);

  const bills = Array.from({ length: 25 }, (_, i) => ({
    x: (i * 43 + Math.sin(i * 1.5) * 100) % 1080,
    y: ((frame * (3 + i % 3) + i * 80) % 2200) - 200,
    rotation: Math.sin(frame * 0.05 + i) * 30,
    scale: 0.6 + (i % 4) * 0.15,
    opacity: 0.3 + Math.sin(frame * 0.08 + i) * 0.2,
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      {/* Billets */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {bills.map((bill, i) => (
          <div key={i} style={{
            position: "absolute",
            left: bill.x, top: bill.y,
            fontSize: 40 * bill.scale,
            transform: `rotate(${bill.rotation}deg)`,
            opacity: bill.opacity,
          }}>
            💵
          </div>
        ))}
      </div>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: "#30d158",
            textShadow: "0 0 40px rgba(48,209,88,0.5)",
            textAlign: "center", padding: "0 80px",
          }}>
            {scene.text}
          </div>
        )}
        {scene.counterTo && (
          <div style={{ fontSize: 80, fontWeight: 900, fontFamily, color: "#30d158", letterSpacing: "-0.04em" }}>
            ${scene.counterTo.toLocaleString()}
          </div>
        )}
        <AccentLine accent="#30d158" delay={20} width={80} />
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

export const TitleCardScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const lineW = interpolate(frame, [10, 40], [0, 800], { extrapolateRight: "clamp", easing: E_OUT });
  const titleOp = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const titleY = interpolate(frame, [20, 45], [24, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const subOp = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 100, 48);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, padding: "0 120px", flexDirection: "column", gap: 20 }}>
        {/* Ligne accent */}
        <div style={{ width: lineW, height: 4, background: safeAccent(scene.accentColor, bg), borderRadius: 2,
          boxShadow: `0 0 20px ${scene.accentColor}` }} />
        {/* Titre */}
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: textColor(bg), lineHeight: autoLineHeight(fontSize),
          opacity: titleOp, transform: `translateY(${titleY}px)`,
        }}>
          {scene.text}
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.3), fontWeight: 300,
            color: isLight(bg) ? "#888" : "#555", fontFamily,
            letterSpacing: "0.08em", textTransform: "uppercase",
            opacity: subOp,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};


// ═══════════════════════════════════════════════════════
// BATCH 6 — TEXTE AVANCÉ
// ═══════════════════════════════════════════════════════

export const MagneticTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const words = (scene.text || "").split(" ");
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px", flexWrap: "wrap", gap: 20 }}>
        {words.map((word, i) => {
          const delay = i * 6;
          const progress = interpolate(Math.max(0, frame - delay), [0, 30], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
          const startX = i % 2 === 0 ? -800 : 800;
          const x = interpolate(progress, [0, 1], [startX, 0], { easing: Easing.out(Easing.back(2)) });
          const op = interpolate(Math.max(0, frame - delay), [0, 16], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              fontSize, fontWeight: 900, fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: i % 2 === 0 ? textColor(bg) : safeAccent(scene.accentColor, bg),
              transform: `translateX(${x}px)`,
              opacity: op,
              display: "inline-block",
            }}>
              {word}
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const GradientSlideScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const slideX = interpolate(frame, [0, Math.max(1, durationInFrames)], [-100, 200], CLAMP_BOTH);
  const fontSize = autoFontSize(scene.text || "", 140, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px", textAlign: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Base text */}
          <div style={{ fontSize, fontWeight: 900, fontFamily, letterSpacing: autoTracking(fontSize), color: isLight(bg) ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}>
            {scene.text}
          </div>
          {/* Gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(90deg, transparent ${slideX - 30}%, ${scene.accentColor} ${slideX}%, #ffffff ${slideX + 20}%, transparent ${slideX + 50}%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
          }}>
            {scene.text}
          </div>
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={10} />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const CascadeScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const letters = (scene.text || "").split("");
  const fontSize = autoFontSize(scene.text || "", 160, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 60px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
          {letters.map((letter, i) => {
            const delay = i * 3;
            const y = interpolate(Math.max(0, frame - delay), [0, 24], [-100, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)) });
            const op = interpolate(Math.max(0, frame - delay), [0, 14], [0, 1], { extrapolateRight: "clamp" });
            const isAccentLetter = i % 4 === 0;
            return (
              <span key={i} style={{
                fontSize, fontWeight: 900, fontFamily,
                letterSpacing: "-0.02em",
                color: isAccentLetter ? safeAccent(scene.accentColor, bg) : textColor(bg),
                transform: `translateY(${y}px)`,
                opacity: op,
                display: "inline-block",
              }}>
                {letter === " " ? "\u00A0" : letter}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const BlurFocusScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const blur = interpolate(frame, [0, 40], [20, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const scale = interpolate(frame, [0, 40], [1.1, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 140, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 80px", textAlign: "center", flexDirection: "column", gap: 16 }}>
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: textColor(bg),
          filter: `blur(${blur}px)`,
          transform: `scale(${scale})`,
          lineHeight: autoLineHeight(fontSize),
        }}>
          {scene.text}
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={35} />
        {scene.text2 && (
          <div style={{
            fontSize: 36, fontWeight: 200,
            color: isLight(bg) ? "#888" : "#555", fontFamily,
            filter: `blur(${blur * 0.5}px)`,
            opacity: interpolate(frame, [20, 50], [0, 1], CLAMP_BOTH),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 7 — ENVIRONNEMENTS & AMBIANCES
// ═══════════════════════════════════════════════════════

export const ParticleRainScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#050510";
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  const drops = Array.from({ length: 60 }, (_, i) => ({
    x: (i * 18.3) % 1080,
    y: ((frame * (4 + i % 5) + i * 32) % 2100) - 100,
    h: 20 + (i % 6) * 8,
    opacity: 0.1 + (i % 5) * 0.06,
    width: 1 + (i % 3) * 0.5,
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {drops.map((drop, i) => (
          <rect key={i} x={drop.x} y={drop.y} width={drop.width} height={drop.h}
            fill={scene.accentColor} opacity={drop.opacity} rx="1" />
        ))}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: textColor(bg),
            textShadow: `0 0 40px ${scene.accentColor}66`,
          }}>{scene.text}</div>
        )}
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={20} />
      </AbsoluteFill>
      <Vignette strength={0.65} />
    </AbsoluteFill>
  );
};

export const FireParticlesScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#0a0300";
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  const particles = Array.from({ length: 50 }, (_, i) => {
    const lifespan = 80 + (i % 40);
    const localFrame = (frame + i * 7) % lifespan;
    const progress = localFrame / lifespan;
    const x = 540 + Math.sin(i * 2.5 + frame * 0.03) * (60 + i * 5);
    const y = 1200 - progress * (800 + i * 10);
    const size = (1 - progress) * (8 + (i % 5) * 4);
    const colors = ["#ff6b00", "#ff9500", "#ffcc00", "#ff3b00"];
    return { x, y, size, opacity: (1 - progress) * 0.8, color: colors[i % 4] };
  });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.size}
            fill={p.color} opacity={p.opacity}
            style={{ filter: `blur(${p.size * 0.3}px)` }} />
        ))}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px", paddingBottom: "400px" }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: "#ffffff",
            textShadow: "0 0 40px rgba(255,107,0,0.8)",
          }}>{scene.text}</div>
        )}
        <AccentLine accent="#ff6b00" delay={20} />
      </AbsoluteFill>
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

export const SnowFallScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#050510";
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  const flakes = Array.from({ length: 50 }, (_, i) => ({
    x: (i * 22.4 + Math.sin(frame * 0.02 + i) * 30) % 1080,
    y: ((frame * (1 + i % 3) + i * 40) % 2100) - 50,
    size: 4 + (i % 5) * 3,
    opacity: 0.3 + (i % 4) * 0.15,
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {flakes.map((flake, i) => (
          <text key={i} x={flake.x} y={flake.y} fontSize={flake.size * 3}
            fill="white" opacity={flake.opacity} textAnchor="middle">❄</text>
        ))}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: textColor(bg),
          }}>{scene.text}</div>
        )}
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={20} />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const SunRayScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0500";
  const rotation = frame * 0.3;
  const pulse = 0.6 + Math.sin(frame * 0.05) * 0.2;
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* Rayons */}
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 + rotation;
          const rad = (angle * Math.PI) / 180;
          const x2 = 540 + Math.cos(rad) * 1200;
          const y2 = 960 + Math.sin(rad) * 1200;
          return (
            <line key={i} x1="540" y1="960" x2={x2} y2={y2}
              stroke={scene.accentColor} strokeWidth="2"
              opacity={pulse * (0.3 + (i % 3) * 0.1)} />
          );
        })}
        <circle cx="540" cy="960" r={80 + Math.sin(frame * 0.05) * 10}
          fill={scene.accentColor} opacity="0.9"
          style={{ filter: `drop-shadow(0 0 40px ${scene.accentColor})` }} />
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px 200px" }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: textColor(bg), textAlign: "center",
          }}>{scene.text}</div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 8 — BUSINESS & FINANCE
// ═══════════════════════════════════════════════════════

export const FunnelScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const stages = [
    { label: "Visiteurs", value: "10,000", width: 100, color: scene.accentColor },
    { label: "Leads", value: "2,500", width: 75, color: scene.accentColor + "cc" },
    { label: "Prospects", value: "800", width: 55, color: scene.accentColor + "99" },
    { label: "Clients", value: "200", width: 35, color: scene.accentColor + "66" },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 8, padding: "0 80px" }}>
        {scene.text && (
          <div style={{ fontSize: 56, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", marginBottom: 32, textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        {stages.map((stage, i) => {
          const stageOp = interpolate(Math.max(0, frame - i * 10), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
          const stageW = interpolate(Math.max(0, frame - i * 10), [0, 30], [0, stage.width], { extrapolateRight: "clamp", easing: E_OUT });
          return (
            <div key={i} style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, opacity: stageOp }}>
              <div style={{ width: `${stageW}%`, height: 52, background: stage.color, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 20px ${scene.accentColor}44`,
                transition: "width 0.1s",
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", fontFamily }}>{stage.value}</div>
              </div>
              <div style={{ fontSize: 18, color: isLight(bg) ? "#888" : "#555", fontFamily, whiteSpace: "nowrap" }}>{stage.label}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ComparisonBarsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const bars = [
    { label: "Avant", value: 35, color: isLight(bg) ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" },
    { label: "Après", value: 87, color: safeAccent(scene.accentColor, bg) },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 32, padding: "0 120px" }}>
        {scene.text && (
          <div style={{ fontSize: 64, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.04em", textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        <div style={{ width: "100%", display: "flex", gap: 32, alignItems: "flex-end", height: 500 }}>
          {bars.map((bar, i) => {
            const barH = interpolate(Math.max(0, frame - i * 12), [0, 40], [0, bar.value / 100 * 500], { extrapolateRight: "clamp", easing: E_OUT });
            const valOp = interpolate(Math.max(0, frame - i * 12 - 20), [0, 16], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: bar.color, fontFamily, opacity: valOp }}>
                  {bar.value}%
                </div>
                <div style={{ width: "100%", height: barH, background: bar.color, borderRadius: "12px 12px 0 0",
                  boxShadow: i === 1 ? `0 0 30px ${scene.accentColor}66` : "none",
                }} />
                <div style={{ fontSize: 24, fontWeight: 600, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ROIScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const targetROI = scene.counterTo || 347;
  const roiEnd = Math.max(11, Math.round(durationInFrames * 0.75));
  const progress = interpolate(frame, monoRange(10, roiEnd), [0, 1], { ...CLAMP_BOTH, easing: E_OUT });
  const currentROI = Math.round(targetROI * progress);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Retour sur investissement
        </div>
        <div style={{
          fontSize: 180, fontWeight: 900, fontFamily, letterSpacing: "-0.06em",
          background: `linear-gradient(135deg, ${safeAccent(scene.accentColor, bg)}, #ffffff)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          +{currentROI}%
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={10} width={100} />
        {scene.text && (
          <div style={{ fontSize: 32, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, textAlign: "center", maxWidth: 700 }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 9 — GAMING & TECH
// ═══════════════════════════════════════════════════════

export const AchievementScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const scale = useScaleIn(0, 0.95);
  const floatY = useFloat(4, 0.02, sceneIndex * 0.8);
  const slideY = interpolate(frame, [0, 28], [-200, 0], { extrapolateRight: "clamp", easing: E_PREMIUM });
  const glow = 0.5 + Math.sin(frame * 0.1) * 0.3;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
        <div style={{
          transform: `scale(${scale}) translateY(${slideY + floatY}px) perspective(1000px) rotateX(-4deg) rotateY(3deg) rotateZ(1deg)`,
          background: "linear-gradient(145deg, rgba(30,30,30,0.98), rgba(15,15,15,0.98))",
          borderRadius: 24, padding: "32px 48px",
          border: `1px solid rgba(0,0,0,0.05)`,
          boxShadow: `${APPLE_CARD_SHADOW}, 0 0 40px ${scene.accentColor}${Math.round(glow * 60).toString(16).padStart(2, "0")}`,
          display: "flex", alignItems: "center", gap: 28, maxWidth: 800,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: `radial-gradient(circle, ${scene.accentColor}, ${scene.accentColor}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, flexShrink: 0,
            boxShadow: `0 0 30px ${scene.accentColor}`,
          }}>
            🏆
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: scene.accentColor, fontFamily, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Achievement Unlocked
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", fontFamily, letterSpacing: "-0.02em" }}>
              {scene.text || "First Video!"}
            </div>
            {scene.text2 && (
              <div style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", fontFamily, marginTop: 4 }}>
                {scene.text2}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const CircuitBoardScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#020a06";
  const fontSize = autoFontSize(scene.text || "", 110, 56);

  const paths = [
    { d: "M 100 200 L 300 200 L 300 400 L 500 400", delay: 0 },
    { d: "M 200 100 L 200 300 L 400 300 L 400 600", delay: 8 },
    { d: "M 600 150 L 600 350 L 800 350 L 800 550", delay: 16 },
    { d: "M 700 250 L 500 250 L 500 500 L 700 500", delay: 24 },
    { d: "M 150 700 L 350 700 L 350 850 L 650 850", delay: 32 },
    { d: "M 400 750 L 400 900 L 700 900 L 700 1000", delay: 40 },
    { d: "M 100 500 L 300 500 L 300 650 L 550 650", delay: 48 },
    { d: "M 750 400 L 900 400 L 900 700 L 750 700", delay: 56 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        {paths.map((path, i) => {
          const progress = interpolate(Math.max(0, frame - path.delay), [0, 50], [0, 1], { extrapolateRight: "clamp" });
          return (
            <g key={i}>
              <path d={path.d} fill="none" stroke={scene.accentColor} strokeWidth="2"
                strokeDasharray="1000" strokeDashoffset={1000 - 1000 * progress}
                opacity={0.6} />
              <circle cx={parseFloat(path.d.split(" ").slice(-2)[0])}
                cy={parseFloat(path.d.split(" ").slice(-1)[0])}
                r={4} fill={scene.accentColor} opacity={progress}
                style={{ filter: `drop-shadow(0 0 6px ${scene.accentColor})` }} />
            </g>
          );
        })}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: scene.accentColor,
            textShadow: `0 0 30px ${scene.accentColor}66`,
          }}>{scene.text}</div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

export const GlitchScreenScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#050505";
  const glitchIntensity = frame % 8 < 1 ? 1 : frame % 20 < 2 ? 0.5 : 0;
  const fontSize = autoFontSize(scene.text || "", 130, 60);

  const scanLines = Array.from({ length: 20 }, (_, i) => ({
    y: (i * 96 + frame * 2) % 1920,
    opacity: 0.03 + (i % 3) * 0.01,
    height: 2 + (i % 3),
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* Scan lines */}
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {scanLines.map((line, i) => (
          <rect key={i} x="0" y={line.y} width="1080" height={line.height}
            fill="rgba(255,255,255,0.05)" opacity={line.opacity} />
        ))}
      </svg>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
        {scene.text && (
          <>
            {/* Glitch layers */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 80px",
            }}>
              <div style={{
                fontSize, fontWeight: 900, fontFamily, letterSpacing: autoTracking(fontSize),
                color: "#ff0040", opacity: glitchIntensity * 0.7,
                transform: `translateX(${glitchIntensity * 8}px)`,
                textAlign: "center",
              }}>{scene.text}</div>
            </div>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 80px",
            }}>
              <div style={{
                fontSize, fontWeight: 900, fontFamily, letterSpacing: autoTracking(fontSize),
                color: "#00ffcc", opacity: glitchIntensity * 0.7,
                transform: `translateX(${-glitchIntensity * 6}px)`,
                textAlign: "center",
              }}>{scene.text}</div>
            </div>
            {/* Main text */}
            <div style={{
              fontSize, fontWeight: 900, fontFamily, letterSpacing: autoTracking(fontSize),
              color: "#ffffff", textAlign: "center", position: "relative",
            }}>{scene.text}</div>
          </>
        )}
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 10 — SOCIAL & VIRAL
// ═══════════════════════════════════════════════════════

export const PollResultsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const options = [
    { label: "Option A", votes: 72, color: safeAccent(scene.accentColor, bg) },
    { label: "Option B", votes: 28, color: isLight(bg) ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 28, padding: "0 100px" }}>
        {scene.text && (
          <div style={{ fontSize: 52, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 16 }}>
            {scene.text}
          </div>
        )}
        {options.map((opt, i) => {
          const barW = interpolate(Math.max(0, frame - i * 12), [0, 40], [0, opt.votes], { extrapolateRight: "clamp", easing: E_OUT });
          const valOp = interpolate(Math.max(0, frame - i * 12 - 16), [0, 14], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: textColor(bg), fontFamily }}>{opt.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: opt.color, fontFamily, opacity: valOp }}>{opt.votes}%</div>
              </div>
              <div style={{ height: 52, background: isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${barW}%`,
                  background: opt.color, borderRadius: 12,
                  boxShadow: i === 0 ? `0 0 20px ${scene.accentColor}66` : "none",
                }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const CommentThreadScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const comments = [
    { avatar: "👤", name: "Marie L.", text: "Absolument incroyable ! 🔥", likes: 234, delay: 0 },
    { avatar: "👤", name: "Thomas B.", text: "J'utilise ça tous les jours", likes: 187, delay: 18 },
    { avatar: "👤", name: "Sophie M.", text: "Le meilleur outil du marché", likes: 156, delay: 36 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 14, padding: "0 80px" }}>
        {scene.text && (
          <div style={{ fontSize: 52, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", marginBottom: 20, textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        {comments.map((comment, i) => {
          const s = spring({ frame: Math.max(0, frame - comment.delay), fps, config: { damping: 20, stiffness: 200 }, from: 0, to: 1 });
          const x = interpolate(Math.max(0, frame - comment.delay), [0, 24], [-400, 0], { extrapolateRight: "clamp", easing: E_OUT });
          const op = interpolate(Math.max(0, frame - comment.delay), [0, 14], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              width: "100%", padding: "16px 20px",
              background: isLight(bg) ? "rgba(255,255,255,0.9)" : "rgba(30,30,30,0.9)",
              borderRadius: 16, border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
              display: "flex", alignItems: "flex-start", gap: 14,
              opacity: op, transform: `translateX(${x}px) scale(${s})`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `${scene.accentColor}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>{comment.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: isLight(bg) ? "#0a0a0a" : "#ffffff", fontFamily }}>{comment.name}</div>
                <div style={{ fontSize: 14, color: isLight(bg) ? "#555" : "#aaa", fontFamily, marginTop: 2 }}>{comment.text}</div>
              </div>
              <div style={{ fontSize: 14, color: scene.accentColor, fontFamily, fontWeight: 600, flexShrink: 0 }}>
                ❤️ {comment.likes}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 11 — CINÉMA & CRÉATIF
// ═══════════════════════════════════════════════════════

export const EndCreditsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const scrollY = interpolate(frame, [0, Math.max(1, durationInFrames)], [600, -800], CLAMP_BOTH);

  const credits = [
    { role: "Créé avec", name: "MotionAI" },
    { role: "Voix", name: "ElevenLabs" },
    { role: "Animations", name: "Remotion" },
    { role: "Intelligence", name: "Claude AI" },
    { role: "Direction", name: scene.text || "Vous" },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ overflow: "hidden", opacity: fade }}>
        <div style={{
          position: "absolute", left: 0, right: 0,
          transform: `translateY(${scrollY}px)`,
          textAlign: "center", padding: "0 80px",
        }}>
          {/* Logo */}
          <div style={{
            fontSize: 72, fontWeight: 900, fontFamily,
            color: safeAccent(scene.accentColor, bg),
            letterSpacing: "-0.05em", marginBottom: 60,
            textShadow: `0 0 40px ${scene.accentColor}66`,
          }}>
            MotionAI
          </div>
          <div style={{ width: 80, height: 3, background: safeAccent(scene.accentColor, bg), margin: "0 auto 60px", borderRadius: 2 }} />
          {credits.map((credit, i) => (
            <div key={i} style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 22, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {credit.role}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.02em", marginTop: 4 }}>
                {credit.name}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const WipeTransitionScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const wipeEnd = Math.max(1, Math.round(durationInFrames * 0.6));
  const wipeX = interpolate(frame, [0, wipeEnd], [-1080, 0], { ...CLAMP_BOTH, easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 130, 60);

  return (
    <AbsoluteFill style={{ background: isLight(bg) ? "#ffffff" : "#111111" }}>
      <Grain />
      {/* Wipe reveal */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `translateX(${wipeX}px)`,
        background: bg,
        overflow: "hidden",
      }}>
        <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center", opacity: fade }}>
          {scene.text && (
            <div style={{ fontSize, fontWeight: 900, fontFamily, letterSpacing: autoTracking(fontSize), color: textColor(bg) }}>
              {scene.text}
            </div>
          )}
          <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={20} />
        </AbsoluteFill>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const DollyZoomScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const dollyEnd = Math.max(1, durationInFrames);
  const scale = interpolate(frame, [0, dollyEnd], [1, 2.5], { ...CLAMP_BOTH, easing: Easing.out(Easing.cubic) });
  const bgScale = interpolate(frame, [0, dollyEnd], [2.5, 1], { ...CLAMP_BOTH, easing: Easing.out(Easing.cubic) });
  const fontSize = autoFontSize(scene.text || "", 130, 60);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {/* Background qui rétrécit */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${bgScale})` }}>
        <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      </div>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
        {/* Text qui grandit */}
        <div style={{
          transform: `scale(${scale})`,
          textAlign: "center", padding: "0 80px",
        }}>
          {scene.text && (
            <div style={{
              fontSize, fontWeight: 900, fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: textColor(bg),
            }}>
              {scene.text}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 12 — ÉDUCATIF & EXPLICATIF
// ═══════════════════════════════════════════════════════

export const StepsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const steps = (scene.text || "").split("|").map(s => s.trim()).filter(Boolean);
  const activeStep = Math.floor(frame / 30) % steps.length;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, flexDirection: "column", gap: 20, padding: "0 100px" }}>
        {scene.text2 && (
          <div style={{ fontSize: 36, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, marginBottom: 16 }}>
            {scene.text2}
          </div>
        )}
        {steps.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          const op = interpolate(Math.max(0, frame - i * 8), [0, 14], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20,
              opacity: op,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: isDone ? safeAccent(scene.accentColor, bg) : isActive ? `${scene.accentColor}33` : isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                border: `2px solid ${isActive || isDone ? safeAccent(scene.accentColor, bg) : isLight(bg) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, fontFamily,
                color: isDone ? "#ffffff" : isActive ? safeAccent(scene.accentColor, bg) : isLight(bg) ? "#888" : "#555",
              }}>
                {isDone ? "✓" : i + 1}
              </div>
              <div style={{
                fontSize: isActive ? 32 : 26,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? textColor(bg) : isLight(bg) ? "#888" : "#555",
                fontFamily,
                transition: "all 0.2s",
              }}>
                {step}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const CompareScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const dividerX = interpolate(frame, [10, 40], [540, 540], { extrapolateRight: "clamp" });

  const leftItems = (scene.text || "").split("|").map(s => s.trim()).filter(Boolean);
  const rightItems = (scene.text2 || "").split("|").map(s => s.trim()).filter(Boolean);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        {/* Left — Sans */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: "50%", height: "100%",
          background: isLight(bg) ? "#fff5f5" : "rgba(255,59,48,0.05)",
          padding: "120px 60px 80px 80px",
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#ff3b30", fontFamily, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ✕ Sans
          </div>
          {leftItems.map((item, i) => {
            const op = interpolate(Math.max(0, frame - i * 6), [0, 16], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ fontSize: 22, color: isLight(bg) ? "#888" : "#555", fontFamily, opacity: op, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#ff3b30", flexShrink: 0 }}>✕</span>{item}
              </div>
            );
          })}
        </div>
        {/* Right — Avec */}
        <div style={{
          position: "absolute", right: 0, top: 0, width: "50%", height: "100%",
          background: isLight(bg) ? "#f0fff4" : "rgba(48,209,88,0.05)",
          padding: "120px 80px 80px 60px",
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#30d158", fontFamily, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ✓ Avec
          </div>
          {rightItems.map((item, i) => {
            const op = interpolate(Math.max(0, frame - i * 6 - 8), [0, 16], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ fontSize: 22, color: textColor(bg), fontFamily, opacity: op, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#30d158", flexShrink: 0 }}>✓</span>{item}
              </div>
            );
          })}
        </div>
        {/* Divider */}
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0, width: 2,
          background: isLight(bg) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
          transform: "translateX(-50%)",
        }} />
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.1 : 0.4} />
    </AbsoluteFill>
  );
};

export const QuoteRevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const quoteOp = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const quoteY  = interpolate(frame, [0, 24], [30, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const authorOp = interpolate(Math.max(0, frame - 28), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const lineW  = interpolate(Math.max(0, frame - 16), [0, 24], [0, 100], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, padding: "0 120px", flexDirection: "column", gap: 24 }}>
        {/* Quote mark */}
        <div style={{ fontSize: 120, color: safeAccent(scene.accentColor, bg), opacity: 0.3, lineHeight: 0.8, fontFamily }}>
          "
        </div>
        {/* Quote text */}
        <div style={{
          fontSize: 52, fontWeight: 300, fontFamily,
          color: textColor(bg), lineHeight: 1.4,
          letterSpacing: "-0.01em",
          opacity: quoteOp, transform: `translateY(${quoteY}px)`,
          fontStyle: "italic",
        }}>
          {scene.text}
        </div>
        {/* Divider */}
        <div style={{ width: `${lineW}%`, height: 2, background: safeAccent(scene.accentColor, bg), borderRadius: 2 }} />
        {/* Author */}
        {scene.text2 && (
          <div style={{ fontSize: 28, fontWeight: 600, color: isLight(bg) ? "#888" : "#555", fontFamily, opacity: authorOp }}>
            — {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const BenefitsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const benefits = (scene.text || "").split("|").map(s => s.trim()).filter(Boolean);
  const emojis = ["⚡", "🎯", "💎", "🚀", "✨", "🔥"];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, flexDirection: "column", gap: 18, padding: "80px 100px" }}>
        {scene.text2 && (
          <div style={{ fontSize: 52, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", marginBottom: 16 }}>
            {scene.text2}
          </div>
        )}
        {benefits.map((benefit, i) => {
          const op = interpolate(Math.max(0, frame - i * 8), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
          const x  = interpolate(Math.max(0, frame - i * 8), [0, 20], [-60, 0], { extrapolateRight: "clamp", easing: E_OUT });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20,
              opacity: op, transform: `translateX(${x}px)`,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `${scene.accentColor}22`,
                border: `1px solid ${scene.accentColor}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>
                {emojis[i % emojis.length]}
              </div>
              <div style={{ fontSize: 28, fontWeight: 500, color: textColor(bg), fontFamily }}>
                {benefit}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 13 — LIFESTYLE & CRÉATIF
// ═══════════════════════════════════════════════════════

export const MoodBoardScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#f5f5f0";
  const colors = [scene.accentColor, "#ffffff", "#0a0a0a", scene.accentColor + "88", "#f5f5f0"];

  const rects = [
    { x: 60, y: 80, w: 380, h: 500, color: colors[0], delay: 0, r: 16 },
    { x: 480, y: 80, w: 280, h: 240, color: colors[1], delay: 6, r: 16 },
    { x: 480, y: 360, w: 280, h: 220, color: colors[2], delay: 12, r: 16 },
    { x: 60, y: 620, w: 260, h: 200, color: colors[3], delay: 18, r: 16 },
    { x: 360, y: 620, w: 400, h: 200, color: colors[4], delay: 24, r: 16 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          {rects.map((rect, i) => {
            const s = interpolate(Math.max(0, frame - rect.delay), [0, 20], [0.8, 1], { extrapolateRight: "clamp", easing: E_OUT });
            const op = interpolate(Math.max(0, frame - rect.delay), [0, 16], [0, 1], { extrapolateRight: "clamp" });
            return (
              <rect key={i} x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                fill={rect.color} rx={rect.r}
                opacity={op}
                transform={`translate(${(1 - s) * rect.w / 2 + rect.x}, ${(1 - s) * rect.h / 2 + rect.y}) scale(${s}) translate(${-(1 - s) * rect.w / 2 - rect.x}, ${-(1 - s) * rect.h / 2 - rect.y})`}
              />
            );
          })}
        </svg>
        {scene.text && (
          <div style={{
            position: "absolute", bottom: 300, left: 0, right: 0,
            textAlign: "center", padding: "0 80px",
            fontSize: 64, fontWeight: 900, fontFamily,
            color: isLight(bg) ? "#0a0a0a" : "#ffffff",
            letterSpacing: "-0.04em",
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.15} />
    </AbsoluteFill>
  );
};

export const MinimalistScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#ffffff";
  const lineW = interpolate(frame, [10, 40], [0, 600], { extrapolateRight: "clamp", easing: E_OUT });
  const textOp = interpolate(Math.max(0, frame - 20), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 130, 56);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 24, padding: "0 120px" }}>
        <div style={{ width: lineW, height: 1, background: "#0a0a0a", opacity: 0.2 }} />
        <div style={{
          fontSize, fontWeight: 200, fontFamily,
          letterSpacing: autoTracking(fontSize),
          color: "#0a0a0a", textAlign: "center",
          opacity: textOp, lineHeight: autoLineHeight(fontSize),
        }}>
          {scene.text}
        </div>
        <div style={{ width: lineW * 0.3, height: 2, background: scene.accentColor, borderRadius: 2 }} />
        {scene.text2 && (
          <div style={{ fontSize: 24, fontWeight: 400, color: "#888", fontFamily, opacity: textOp, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.08} />
    </AbsoluteFill>
  );
};

export const GradientBgScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const r1 = (frame * 0.5) % 360;
  const r2 = (frame * 0.3 + 120) % 360;
  const fontSize = autoFontSize(scene.text || "", 130, 56);

  const bg1 = scene.accentColor;
  const bg2 = scene.bg || "#0a0a0a";

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${r1}deg, ${bg1}, ${bg2}, ${bg1})`,
    }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: "#ffffff",
            textShadow: "0 2px 40px rgba(0,0,0,0.3)",
            lineHeight: autoLineHeight(fontSize),
          }}>
            {scene.text}
          </div>
        )}
        <AccentLine accent="rgba(255,255,255,0.8)" delay={20} />
        {scene.text2 && (
          <div style={{ fontSize: 36, fontWeight: 200, color: "rgba(255,255,255,0.7)", fontFamily }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.3} />
    </AbsoluteFill>
  );
};

export const PriceRevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 200 }, from: 0.5, to: 1 });
  const oldPriceOp = interpolate(frame, [0, 20, 40], [1, 1, 0], CLAMP_BOTH);
  const newPriceOp = interpolate(Math.max(0, frame - 30), [0, 20], [0, 1], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20 }}>
        {scene.text && (
          <div style={{ fontSize: 36, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, marginBottom: 16 }}>
            {scene.text}
          </div>
        )}
        {/* Old price */}
        <div style={{
          fontSize: 80, fontWeight: 900, fontFamily,
          color: isLight(bg) ? "#ccc" : "#333",
          letterSpacing: "-0.04em", position: "relative",
          opacity: oldPriceOp,
        }}>
          {scene.text2 || "299€"}
          <div style={{
            position: "absolute", top: "50%", left: -10, right: -10, height: 4,
            background: "#ff3b30", borderRadius: 2,
            transform: `scaleX(${interpolate(frame, [10, 35], [0, 1], { extrapolateRight: "clamp" })})`,
            transformOrigin: "left",
          }} />
        </div>
        {/* New price */}
        <div style={{
          fontSize: 160, fontWeight: 900, fontFamily,
          letterSpacing: "-0.06em",
          background: `linear-gradient(135deg, ${safeAccent(scene.accentColor, bg)}, #ffffff)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          opacity: newPriceOp, transform: `scale(${s})`,
        }}>
          {scene.counterTo ? `${scene.counterTo}€` : "49€"}
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={40} width={80} />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 14 — LOGO & BRAND
// ═══════════════════════════════════════════════════════

export const LogoRevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 180 }, from: 0, to: 1 });
  const ringScale = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 20, stiffness: 200 }, from: 0.5, to: 1 });
  const ringOp = interpolate(Math.max(0, frame - 8), monoRange(0, 16, 40, 56), [0, 0.8, 0.4, 0], CLAMP_BOTH);
  const textOp = interpolate(Math.max(0, frame - 24), [0, 20], [0, 1], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 32 }}>
        {/* Logo circle */}
        <div style={{ position: "relative", width: 200, height: 200 }}>
          {/* Ripple rings */}
          {[1, 1.4, 1.8].map((scale, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: `2px solid ${scene.accentColor}`,
              transform: `scale(${ringScale * scale})`,
              opacity: ringOp * (1 - i * 0.3),
            }} />
          ))}
          {/* Logo */}
          <div style={{
            width: 200, height: 200, borderRadius: "50%",
            background: `linear-gradient(135deg, ${scene.accentColor}, ${scene.accentColor}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${s})`,
            boxShadow: `0 0 60px ${scene.accentColor}66`,
            fontSize: 80,
          }}>
            {scene.text2 || "✦"}
          </div>
        </div>
        {/* Brand name */}
        <div style={{
          fontSize: 72, fontWeight: 900, fontFamily,
          color: textColor(bg), letterSpacing: "-0.04em",
          opacity: textOp,
        }}>
          {scene.text || "Brand"}
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={32} width={80} />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const BrandIntroScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const lineW = interpolate(frame, [0, 30], [0, 1080], { ...CLAMP_BOTH, easing: E_OUT });
  const textOp = interpolate(Math.max(0, frame - 20), [0, 20], [0, 1], { ...CLAMP_BOTH, easing: E_OUT });
  const subOp  = interpolate(Math.max(0, frame - 36), [0, 18], [0, 1], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      {/* Horizontal line reveal */}
      <div style={{
        position: "absolute", top: "50%", left: 0,
        width: lineW, height: 1,
        background: `linear-gradient(90deg, transparent, ${scene.accentColor}, transparent)`,
        opacity: 0.5,
      }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 12 }}>
        <div style={{
          fontSize: 100, fontWeight: 900, fontFamily,
          letterSpacing: "-0.06em", color: textColor(bg),
          opacity: textOp,
        }}>
          {scene.text}
        </div>
        <div style={{
          fontSize: 24, fontWeight: 300, letterSpacing: "0.3em",
          textTransform: "uppercase", color: safeAccent(scene.accentColor, bg),
          opacity: subOp, fontFamily,
        }}>
          {scene.text2 || "EST. 2024"}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ColorPaletteScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const colors = [
    scene.accentColor,
    scene.accentColor + "cc",
    scene.accentColor + "88",
    scene.accentColor + "44",
    isLight(bg) ? "#0a0a0a" : "#ffffff",
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 0 }}>
        {colors.map((color, i) => {
          const h = interpolate(Math.max(0, frame - i * 8), [0, 24], [0, 380], { ...CLAMP_BOTH, easing: E_OUT });
          return (
            <div key={i} style={{
              width: "100%", height: h,
              background: color,
              display: "flex", alignItems: "center", padding: "0 60px",
              overflow: "hidden",
            }}>
              {h > 30 && (
                <div style={{
                  fontSize: 20, fontWeight: 600, fontFamily,
                  color: getLuminance(color) > 0.4 ? "#0a0a0a" : "#ffffff",
                  opacity: Math.min(1, (h - 30) / 30),
                  letterSpacing: "0.06em",
                }}>
                  {color.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        {scene.text && (
          <div style={{
            position: "absolute", bottom: 120, left: 0, right: 0,
            textAlign: "center", fontSize: 52, fontWeight: 900, fontFamily,
            color: isLight(bg) ? "#0a0a0a" : "#ffffff", letterSpacing: "-0.03em",
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.1} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 15 — IMMOBILIER
// ═══════════════════════════════════════════════════════

export const PropertyScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const photoUrl = (scene as any).photoUrl || "";
  const kb = interpolate(frame, [0, 120], [1, 1.06], { ...CLAMP_BOTH, easing: E_OUT });

  const stats = [
    { icon: "📐", label: "Surface", value: scene.text2 || "120 m²" },
    { icon: "🛏️", label: "Chambres", value: "4" },
    { icon: "🛁", label: "SDB", value: "2" },
    { icon: "🚗", label: "Garage", value: "Oui" },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      {photoUrl ? (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <img src={scenePhotoSrc(photoUrl)}
            style={{ width: "100%", height: "60%", objectFit: "cover", transform: `scale(${kb})`, transformOrigin: "center" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60%",
            background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60%",
          background: `linear-gradient(135deg, ${scene.accentColor}33, #0a0a0a)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>🏠</div>
      )}
      <Grain />
      <AbsoluteFill style={{ justifyContent: "flex-end", opacity: fade, padding: "0 60px 80px", flexDirection: "column", gap: 20 }}>
        {/* Price */}
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily, color: "#ffffff", letterSpacing: "-0.04em" }}>
          {scene.text || "450 000 €"}
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((stat, i) => {
            const op = interpolate(Math.max(0, frame - i * 6), [0, 16], [0, 1], CLAMP_BOTH);
            return (
              <div key={i} style={{
                padding: "10px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
                opacity: op,
              }}>
                <div style={{ fontSize: 20 }}>{stat.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", fontFamily }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 16 — SPORT
// ═══════════════════════════════════════════════════════

export const ScoreboardScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const score1 = interpolate(frame, [10, 50], [0, scene.counterTo || 3], { ...CLAMP_BOTH, easing: E_OUT });
  const score2 = interpolate(Math.max(0, frame - 20), [0, 40], [0, (scene as any).counterTo2 || 1], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 24 }}>
        {/* Match title */}
        {scene.text2 && (
          <div style={{ fontSize: 28, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {scene.text2}
          </div>
        )}
        {/* Scoreboard */}
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: textColor(bg), fontFamily }}>Équipe A</div>
            <div style={{ fontSize: 160, fontWeight: 900, fontFamily, letterSpacing: "-0.06em",
              color: safeAccent(scene.accentColor, bg),
              textShadow: `0 0 40px ${scene.accentColor}66` }}>
              {Math.round(score1)}
            </div>
          </div>
          <div style={{ fontSize: 60, fontWeight: 200, color: isLight(bg) ? "#ccc" : "#333", fontFamily }}>—</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: textColor(bg), fontFamily }}>Équipe B</div>
            <div style={{ fontSize: 160, fontWeight: 900, fontFamily, letterSpacing: "-0.06em",
              color: textColor(bg) }}>
              {Math.round(score2)}
            </div>
          </div>
        </div>
        {scene.text && (
          <div style={{ fontSize: 32, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const PlayerStatScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const stats = [
    { label: "Buts", value: 28, max: 40, delay: 0 },
    { label: "Passes", value: 15, max: 40, delay: 10 },
    { label: "Matchs", value: 34, max: 40, delay: 20 },
    { label: "Note", value: 9.2, max: 10, delay: 30 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, flexDirection: "column", gap: 28, padding: "0 100px" }}>
        {scene.text && (
          <div style={{ fontSize: 64, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.04em", marginBottom: 16 }}>
            {scene.text}
          </div>
        )}
        {stats.map((stat, i) => {
          const prog = interpolate(Math.max(0, frame - stat.delay), [0, 50], [0, stat.value / stat.max], { ...CLAMP_BOTH, easing: E_OUT });
          const valOp = interpolate(Math.max(0, frame - stat.delay - 10), [0, 16], [0, 1], CLAMP_BOTH);
          return (
            <div key={i} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: textColor(bg), fontFamily }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: safeAccent(scene.accentColor, bg), fontFamily, opacity: valOp }}>
                  {stat.value}
                </div>
              </div>
              <div style={{ height: 8, background: isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${prog * 100}%`,
                  background: `linear-gradient(90deg, ${scene.accentColor}88, ${scene.accentColor})`,
                  borderRadius: 4, boxShadow: `0 0 12px ${scene.accentColor}66`,
                }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 17 — FOOD & RESTAURANT
// ═══════════════════════════════════════════════════════

export const MenuItemScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#1a0a00";
  const photoUrl = (scene as any).photoUrl || "";
  const s = spring({ frame, fps, config: { damping: 20, stiffness: 160 }, from: 0.8, to: 1 });
  const kb = interpolate(frame, [0, 120], [1.05, 1.12], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "flex-end", opacity: fade, flexDirection: "column" }}>
        {/* Photo */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {photoUrl ? (
            <img src={scenePhotoSrc(photoUrl)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #3d1a00, #1a0800)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120 }}>🍽️</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 30%, transparent 70%)" }} />
        </div>
        {/* Info */}
        <div style={{ position: "relative", padding: "0 60px 80px", transform: `scale(${s})`, transformOrigin: "bottom center" }}>
          <div style={{ fontSize: 72, fontWeight: 900, fontFamily, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {scene.text || "Signature Dish"}
          </div>
          {scene.text2 && (
            <div style={{ fontSize: 32, fontWeight: 300, color: "rgba(255,255,255,0.7)", fontFamily, marginTop: 8, fontStyle: "italic" }}>
              {scene.text2}
            </div>
          )}
          {scene.counterTo && (
            <div style={{ fontSize: 52, fontWeight: 900, fontFamily, color: scene.accentColor, marginTop: 16 }}>
              {scene.counterTo}€
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 18 — SANTÉ & MÉDICAL
// ═══════════════════════════════════════════════════════

export const HeartbeatScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const bpm = 72;
  const beatFrame = frame % Math.round(60 / (bpm / 60));
  const beat = beatFrame < 6 ? 1 + (1 - beatFrame / 6) * 0.3 : 1;

  // ECG path
  const ecgPoints = Array.from({ length: 100 }, (_, i) => {
    const x = i * 11;
    const localI = (i + Math.floor(frame * 0.8)) % 100;
    let y = 960;
    if (localI > 30 && localI < 33) y = 960 - 300;
    else if (localI > 33 && localI < 36) y = 960 + 100;
    else if (localI > 36 && localI < 42) y = 960 - 600;
    else if (localI > 42 && localI < 48) y = 960 + 80;
    else if (localI > 48 && localI < 54) y = 960 - 120;
    return `${x},${y}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        {/* ECG */}
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <polyline points={ecgPoints} fill="none"
            stroke={scene.accentColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 120, transform: `scale(${beat})` }}>❤️</div>
          <div style={{ fontSize: 100, fontWeight: 900, fontFamily, color: scene.accentColor, letterSpacing: "-0.05em" }}>
            {bpm} BPM
          </div>
          {scene.text && (
            <div style={{ fontSize: 40, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
              {scene.text}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 19 — GÉOMÉTRIQUE & ABSTRAIT
// ═══════════════════════════════════════════════════════

export const GeometricScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const rotation = frame * 0.5;
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  const shapes = [
    { x: 540, y: 600, r: 300, sides: 6, delay: 0 },
    { x: 540, y: 600, r: 220, sides: 4, delay: 8 },
    { x: 540, y: 600, r: 140, sides: 3, delay: 16 },
  ];

  const polygon = (cx: number, cy: number, r: number, sides: number, rot: number) => {
    return Array.from({ length: sides }, (_, i) => {
      const angle = (i / sides) * Math.PI * 2 + rot;
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    }).join(" ");
  };

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          {shapes.map((shape, i) => {
            const op = interpolate(Math.max(0, frame - shape.delay), [0, 20], [0, 1], CLAMP_BOTH);
            const dir = i % 2 === 0 ? 1 : -1;
            return (
              <polygon key={i}
                points={polygon(shape.x, shape.y, shape.r, shape.sides, (rotation * dir * 0.008))}
                fill="none" stroke={scene.accentColor} strokeWidth="1.5"
                opacity={op * (0.6 - i * 0.15)}
                style={{ filter: i === 0 ? `drop-shadow(0 0 20px ${scene.accentColor}44)` : "none" }}
              />
            );
          })}
        </svg>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
          {scene.text && (
            <div style={{
              fontSize, fontWeight: 900, fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: textColor(bg),
              marginTop: 600,
            }}>
              {scene.text}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const LiquidScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const fillEnd = Math.max(12, Math.round(durationInFrames * 0.8));
  const fill = interpolate(frame, monoRange(10, fillEnd), [100, 0], CLAMP_BOTH);
  const wave1 = Math.sin(frame * 0.06) * 20;
  const wave2 = Math.sin(frame * 0.04 + 1) * 15;
  const fontSize = autoFontSize(scene.text || "", 130, 56);

  const wavePath = `M 0 ${fill * 19.2} Q 270 ${fill * 19.2 + wave1} 540 ${fill * 19.2 + wave2} Q 810 ${fill * 19.2 - wave1} 1080 ${fill * 19.2 + wave2} L 1080 1920 L 0 1920 Z`;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          <path d={wavePath} fill={scene.accentColor} opacity={0.85} />
          <path d={`M 0 ${fill * 19.2 + 30} Q 270 ${fill * 19.2 + 30 - wave1} 540 ${fill * 19.2 + 30 + wave2} Q 810 ${fill * 19.2 + 30 + wave1} 1080 ${fill * 19.2 + 30 - wave2} L 1080 1920 L 0 1920 Z`}
            fill={scene.accentColor} opacity={0.3} />
        </svg>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16, padding: "0 80px", textAlign: "center" }}>
          {scene.text && (
            <div style={{
              fontSize, fontWeight: 900, fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: fill < 50 ? (isLight(scene.accentColor) ? "#0a0a0a" : "#ffffff") : textColor(bg),
            }}>
              {scene.text}
            </div>
          )}
          <AccentLine accent={fill < 50 ? "rgba(255,255,255,0.8)" : safeAccent(scene.accentColor, bg)} delay={20} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MorphShapeScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const morphProgress = (Math.sin(frame * 0.04) + 1) / 2;
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  // Morphing entre cercle et carré
  const r = 200;
  const smoothness = morphProgress;
  const borderRadius = smoothness * r;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 40 }}>
        <div style={{
          width: r * 2, height: r * 2,
          borderRadius: borderRadius,
          background: `linear-gradient(${frame * 2}deg, ${scene.accentColor}, ${scene.accentColor}66)`,
          boxShadow: `0 0 60px ${scene.accentColor}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 80, color: isLight(scene.accentColor) ? "#0a0a0a" : "#ffffff",
        }}>
          {scene.text2 || "✦"}
        </div>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: textColor(bg), textAlign: "center", padding: "0 80px",
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const DNAScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#050510";
  const fontSize = autoFontSize(scene.text || "", 100, 56);

  const strands = Array.from({ length: 15 }, (_, i) => {
    const y = i * 130;
    const phase = frame * 0.06;
    const x1 = 540 + Math.sin(i * 0.6 + phase) * 200;
    const x2 = 540 + Math.sin(i * 0.6 + phase + Math.PI) * 200;
    const midX = (x1 + x2) / 2;
    return { x1, x2, y, midX };
  });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          {strands.map((strand, i) => {
            const op = interpolate(Math.max(0, frame - i * 3), [0, 12], [0, 1], CLAMP_BOTH);
            return (
              <g key={i} opacity={op}>
                <line x1={strand.x1} y1={strand.y} x2={strand.x2} y2={strand.y}
                  stroke={scene.accentColor} strokeWidth="2" opacity="0.6" />
                <circle cx={strand.x1} cy={strand.y} r="8" fill={scene.accentColor}
                  style={{ filter: `drop-shadow(0 0 6px ${scene.accentColor})` }} />
                <circle cx={strand.x2} cy={strand.y} r="8" fill="#30d158"
                  style={{ filter: "drop-shadow(0 0 6px #30d158)" }} />
              </g>
            );
          })}
          {/* Backbone */}
          {strands.map((strand, i) => {
            if (i === 0) return null;
            const prev = strands[i - 1];
            const op = interpolate(Math.max(0, frame - i * 3), [0, 12], [0, 1], CLAMP_BOTH);
            return (
              <g key={`b${i}`} opacity={op}>
                <line x1={strand.x1} y1={strand.y} x2={prev.x1} y2={prev.y}
                  stroke={scene.accentColor} strokeWidth="2" opacity="0.4" />
                <line x1={strand.x2} y1={strand.y} x2={prev.x2} y2={prev.y}
                  stroke="#30d158" strokeWidth="2" opacity="0.4" />
              </g>
            );
          })}
        </svg>
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 80px 200px", flexDirection: "column", gap: 16 }}>
          {scene.text && (
            <div style={{
              fontSize, fontWeight: 900, fontFamily,
              letterSpacing: autoTracking(fontSize),
              color: "#ffffff", textAlign: "center",
              textShadow: `0 0 30px ${scene.accentColor}66`,
            }}>
              {scene.text}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 20 — INTERACTIONS & UX
// ═══════════════════════════════════════════════════════

export const SwipeScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const swipeX = interpolate(frame, [20, 60], [0, 800], { ...CLAMP_BOTH, easing: Easing.out(Easing.cubic) });
  const cursorOp = interpolate(frame, monoRange(0, 10, Math.max(11, durationInFrames - 10), Math.max(12, durationInFrames)), [0, 1, 1, 0], CLAMP_BOTH);
  const fontSize = autoFontSize(scene.text || "", 100, 56);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 60 }}>
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: textColor(bg), textAlign: "center", padding: "0 80px",
          }}>
            {scene.text}
          </div>
        )}
        {/* Swipe indicator */}
        <div style={{ position: "relative", width: 700, height: 80 }}>
          <div style={{
            width: "100%", height: 3,
            background: isLight(bg) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            borderRadius: 2, position: "absolute", top: "50%",
          }} />
          {/* Trail */}
          <div style={{
            position: "absolute", left: 0, top: "50%", height: 3,
            width: swipeX, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${scene.accentColor})`,
            transform: "translateY(-50%)",
          }} />
          {/* Cursor */}
          <div style={{
            position: "absolute", top: "50%", left: swipeX,
            transform: "translate(-50%, -50%)",
            width: 50, height: 50, borderRadius: "50%",
            background: scene.accentColor,
            boxShadow: `0 0 20px ${scene.accentColor}`,
            opacity: cursorOp,
          }} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, letterSpacing: "0.1em" }}>
          {scene.text2 || "Glissez →"}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ClickScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const clickFrame = 30;
  const hasClicked = frame >= clickFrame;
  const ripple = hasClicked ? spring({ frame: frame - clickFrame, fps, config: { damping: 30, stiffness: 100 }, from: 0, to: 1 }) : 0;
  const btnScale = hasClicked
    ? spring({ frame: frame - clickFrame, fps, config: { damping: 12, stiffness: 400 }, from: 0.9, to: 1 })
    : 1;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 60 }}>
        {scene.text && (
          <div style={{ fontSize: 60, fontWeight: 900, color: isLight(bg) ? "#0a0a0a" : "#ffffff", fontFamily, letterSpacing: "-0.03em", textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        {/* Button */}
        <div style={{ position: "relative" }}>
          {/* Ripple */}
          <div style={{
            position: "absolute", inset: -ripple * 60,
            borderRadius: 999, border: `2px solid ${scene.accentColor}`,
            opacity: (1 - ripple) * 0.6,
          }} />
          <div style={{
            padding: "24px 60px",
            background: hasClicked ? `linear-gradient(135deg, ${scene.accentColor}dd, ${scene.accentColor})` : scene.accentColor,
            borderRadius: 16,
            transform: `scale(${btnScale})`,
            boxShadow: hasClicked ? `0 8px 40px ${scene.accentColor}66` : `0 4px 20px ${scene.accentColor}44`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", fontFamily }}>
              {hasClicked ? (scene.text2 || "✓ Cliqué !") : (scene.text2 || "Cliquer ici")}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.08 : 0.4} />
    </AbsoluteFill>
  );
};

export const LoadingScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const fontSize = autoFontSize(scene.text || "", 80, 48);

  const skeletons = [
    { w: "80%", h: 40, y: 0 },
    { w: "60%", h: 28, y: 56 },
    { w: "100%", h: 200, y: 100 },
    { w: "90%", h: 28, y: 316 },
    { w: "70%", h: 28, y: 360 },
  ];

  const shimmer = (frame * 4) % 200 - 50;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 40, padding: "0 80px" }}>
        {scene.text && (
          <div style={{ fontSize, fontWeight: 900, color: isLight(bg) ? "#0a0a0a" : "#ffffff", fontFamily, letterSpacing: "-0.02em", textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        <div style={{ width: "100%", position: "relative" }}>
          {skeletons.map((sk, i) => (
            <div key={i} style={{
              position: i === 0 ? "relative" : "absolute",
              top: sk.y, left: 0, width: sk.w, height: sk.h,
              background: isLight(bg) ? "#e8e8e8" : "#222",
              borderRadius: 8, overflow: "hidden", marginBottom: i === 0 ? 0 : 0,
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, transparent ${shimmer}%, ${isLight(bg) ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.08)"} ${shimmer + 50}%, transparent ${shimmer + 100}%)`,
              }} />
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.05 : 0.4} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 21 — MUSIQUE & AUDIO
// ═══════════════════════════════════════════════════════

export const AudioWaveformScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const bars = 40;
  const fontSize = autoFontSize(scene.text || "", 80, 48);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 40 }}>
        {/* Waveform */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, height: 200 }}>
          {Array.from({ length: bars }, (_, i) => {
            const h = 30 + Math.abs(Math.sin(frame * 0.1 + i * 0.4)) * 140 + Math.abs(Math.sin(frame * 0.07 + i * 0.8)) * 60;
            const isCenter = Math.abs(i - bars / 2) < 5;
            return (
              <div key={i} style={{
                width: 16, height: h,
                background: isCenter ? scene.accentColor : `${scene.accentColor}66`,
                borderRadius: 8,
                boxShadow: isCenter ? `0 0 12px ${scene.accentColor}` : "none",
              }} />
            );
          })}
        </div>
        {scene.text && (
          <div style={{ fontSize, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.02em", textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        {scene.text2 && (
          <div style={{ fontSize: 32, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const VinylScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const rotation = frame * 2;
  const s = spring({ frame, fps, config: { damping: 20, stiffness: 150 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 40 }}>
        {/* Vinyl record */}
        <div style={{ transform: `scale(${s}) rotate(${rotation}deg)`, position: "relative", width: 400, height: 400 }}>
          <svg width="400" height="400" viewBox="0 0 400 400">
            {/* Outer ring */}
            <circle cx="200" cy="200" r="190" fill="#111" stroke="#222" strokeWidth="2" />
            {/* Grooves */}
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx="200" cy="200" r={60 + i * 11}
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            {/* Label */}
            <circle cx="200" cy="200" r="60" fill={scene.accentColor} />
            <circle cx="200" cy="200" r="10" fill="#111" />
            {/* Shine */}
            <ellipse cx="150" cy="120" rx="60" ry="30" fill="rgba(255,255,255,0.05)" transform="rotate(-30 150 120)" />
          </svg>
        </div>
        {scene.text && (
          <div style={{ fontSize: 56, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", textAlign: "center" }}>
            {scene.text}
          </div>
        )}
        {scene.text2 && (
          <div style={{ fontSize: 28, fontWeight: 300, color: scene.accentColor, fontFamily }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 22 — ÉDITORIAL & MAGAZINE
// ═══════════════════════════════════════════════════════

export const MagazineCoverScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const photoUrl = (scene as any).photoUrl || "";
  const kb = interpolate(frame, [0, 120], [1, 1.05], { ...CLAMP_BOTH, easing: E_OUT });
  const titleOp = interpolate(frame, [16, 36], [0, 1], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* Background image */}
      {photoUrl && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <img src={scenePhotoSrc(photoUrl)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)" }} />
        </div>
      )}
      <Grain />
      <AbsoluteFill style={{ opacity: fade, justifyContent: "space-between", flexDirection: "column", padding: "60px 60px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", fontFamily, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {scene.text2 || "MAGAZINE"}
          </div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontFamily }}>
            N°01 — 2024
          </div>
        </div>
        {/* Bottom content */}
        <div style={{ opacity: titleOp }}>
          <div style={{ width: 60, height: 4, background: scene.accentColor, marginBottom: 20 }} />
          <div style={{ fontSize: 80, fontWeight: 900, fontFamily, color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            {scene.text || "Cover Story"}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const PullQuoteScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const lineH = interpolate(frame, [0, 24], [0, 400], { ...CLAMP_BOTH, easing: E_OUT });
  const textOp = interpolate(Math.max(0, frame - 16), [0, 20], [0, 1], { ...CLAMP_BOTH, easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", opacity: fade, padding: "0 100px", flexDirection: "row", gap: 40 }}>
        {/* Vertical line */}
        <div style={{ width: 4, height: lineH, background: scene.accentColor, flexShrink: 0, borderRadius: 2, alignSelf: "center" }} />
        {/* Content */}
        <div style={{ opacity: textOp }}>
          <div style={{ fontSize: 52, fontWeight: 200, fontFamily, color: isLight(bg) ? "#0a0a0a" : "#ffffff", lineHeight: 1.4, fontStyle: "italic", letterSpacing: "-0.01em" }}>
            {scene.text}
          </div>
          {scene.text2 && (
            <div style={{ fontSize: 22, fontWeight: 900, color: scene.accentColor, fontFamily, marginTop: 24, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {scene.text2}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.08} />
    </AbsoluteFill>
  );
};

export const InfographicScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const items = (scene.text || "").split("|").map(s => s.trim()).filter(Boolean);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20, padding: "80px 80px" }}>
        {scene.text2 && (
          <div style={{ fontSize: 52, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 20 }}>
            {scene.text2}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%" }}>
          {items.slice(0, 4).map((item, i) => {
            const op = interpolate(Math.max(0, frame - i * 8), [0, 18], [0, 1], CLAMP_BOTH);
            const parts = item.split(":");
            return (
              <div key={i} style={{
                padding: "28px", borderRadius: 20,
                background: i % 2 === 0
                  ? `${scene.accentColor}15`
                  : isLight(bg) ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${i % 2 === 0 ? scene.accentColor + "30" : isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
                opacity: op,
              }}>
                <div style={{ fontSize: 56, fontWeight: 900, fontFamily, color: safeAccent(scene.accentColor, bg), letterSpacing: "-0.04em" }}>
                  {parts[0]}
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: textColor(bg), fontFamily, marginTop: 6 }}>
                  {parts[1] || ""}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// BATCH 23 — SCÈNES VISUELLES PURES (sans texte obligatoire)
// ═══════════════════════════════════════════════════════

export const TerminalScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#0a1628";
  const lines = [
    "$ motionr init",
    "✓ Initializing project...",
    "✓ Loading AI models...",
    "✓ Preparing animations...",
    "$ motionr generate --prompt \"" + (scene.text || "Create magic") + "\"",
    "⚡ Generating video...",
    "✓ Done! Video ready.",
  ];
  const charsPerFrame = 1.5;
  const visibleChars = Math.floor(frame * charsPerFrame);

  let shown = "";
  let count = 0;
  for (const line of lines) {
    for (const char of line + "\n") {
      if (count >= visibleChars) break;
      shown += char;
      count++;
    }
    if (count >= visibleChars) break;
  }

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade, padding: "60px 50px", justifyContent: "flex-start" }}>
        <div style={{
          background: "#1a2540", borderRadius: "12px 12px 0 0",
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: 8, fontFamily: "monospace" }}>
            motionr — terminal
          </span>
        </div>
        <div style={{
          flex: 1, background: "#111927",
          border: "1px solid rgba(255,255,255,0.06)",
          borderTop: "none", borderRadius: "0 0 12px 12px",
          padding: "24px 20px", overflow: "hidden",
        }}>
          <pre style={{
            fontSize: 22, color: "#a8ff78", fontFamily: "monospace",
            lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0,
          }}>
            {shown}
            <span style={{ opacity: frame % 30 < 15 ? 1 : 0, color: safeAccent(scene.accentColor || "#a8ff78", bg) }}>█</span>
          </pre>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const ToggleScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";
  const isOn = frame > 30;
  const toggleX = interpolate(frame, [20, 40], [4, 36], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const accent = scene.accentColor || "#10B981";
  const glowScale = 1 + Math.sin(frame * 0.1) * 0.05;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 32 }}>
        <div style={{
          width: 120, height: 68, borderRadius: 34,
          background: isOn ? accent : "rgba(0,0,0,0.15)",
          position: "relative",
          boxShadow: isOn ? `0 0 40px ${accent}66` : "none",
          transform: `scale(${glowScale})`,
        }}>
          <div style={{
            position: "absolute", top: 6,
            left: toggleX,
            width: 56, height: 56, borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }} />
        </div>
        <div style={{
          fontSize: 32, fontWeight: 900,
          color: isOn ? accent : "rgba(0,0,0,0.3)",
          letterSpacing: "0.2em", fontFamily,
          textTransform: "uppercase",
        }}>
          {isOn ? "ON" : "OFF"}
        </div>
        {scene.text && (
          <div style={{ fontSize: 28, fontWeight: 900, color: isLight(bg) ? "#0a0a0a" : "#fff", fontFamily, letterSpacing: "-0.05em" }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.1} />
    </AbsoluteFill>
  );
};

export const FinancialChartScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const data = [12, 19, 15, 28, 24, 35, 31, 48, 44, 52, 49, 61, 58, 72, 68, 85, 82, 94, 91, 100];
  const revealed = interpolate(frame, [6, durationInFrames * 0.8], [0, data.length], { extrapolateRight: "clamp", easing: E_OUT });
  const visibleData = data.slice(0, Math.max(2, Math.round(revealed)));

  const W = 900, H = 400, pad = 40;
  const cW = W - pad * 2, cH = H - pad * 2;
  const maxVal = Math.max(...data);

  const points = visibleData.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * cW,
    y: pad + cH - (v / maxVal) * cH,
  }));

  const pathD = points.length >= 2
    ? points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `C ${points[i - 1].x + 25} ${points[i - 1].y} ${p.x - 25} ${p.y} ${p.x} ${p.y}`).join(" ")
    : "";

  const fillPath = pathD + ` L ${points[points.length - 1]?.x || pad} ${pad + cH} L ${pad} ${pad + cH} Z`;
  const currentValue = Math.round((visibleData[visibleData.length - 1] || 0) * (scene.counterTo || 10000) / 100);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20, padding: "0 60px" }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 22, color: isLight(bg) ? "#888" : "#555", fontFamily, fontWeight: 300 }}>
              {scene.text || "Revenue"}
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.05em" }}>
              ${currentValue.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#30d158", fontFamily }}>▲ +{Math.round(revealed * 4)}%</div>
            <div style={{ fontSize: 16, color: isLight(bg) ? "#888" : "#555", fontFamily }}>vs last period</div>
          </div>
        </div>
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="finFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={scene.accentColor || "#30d158"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={scene.accentColor || "#30d158"} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {pathD && (
            <>
              <path d={fillPath} fill="url(#finFill)" />
              <path d={pathD} fill="none" stroke={scene.accentColor || "#30d158"} strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 8px ${scene.accentColor || "#30d158"})` }} />
              {points.length > 0 && (
                <g>
                  <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="16"
                    fill={scene.accentColor || "#30d158"} opacity="0.2" />
                  <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="6"
                    fill={scene.accentColor || "#30d158"}
                    style={{ filter: `drop-shadow(0 0 8px ${scene.accentColor || "#30d158"})` }} />
                </g>
              )}
            </>
          )}
        </svg>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const InstagramProfileScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#ffffff";

  const stats = [
    { label: "posts", value: scene.counterTo || 247 },
    { label: "followers", value: 143000 },
    { label: "following", value: 275 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 60px" }}>
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40, marginBottom: 28 }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              padding: 3, flexShrink: 0,
              transform: `scale(${spring({ frame, fps, config: { damping: 20, stiffness: 200 }, from: 0, to: 1 })})`,
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: isLight(bg) ? "#f5f5f5" : "#1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 40,
              }}>
                {scene.text2 || "👤"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: isLight(bg) ? "#0a0a0a" : "#fff", fontFamily, marginBottom: 16 }}>
                {scene.text || "motionr.app"}
              </div>
              <div style={{ display: "flex", gap: 32 }}>
                {stats.map((stat, i) => {
                  const prog = interpolate(Math.max(0, frame - i * 8), [0, 30], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
                  return (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: isLight(bg) ? "#0a0a0a" : "#fff", fontFamily }}>
                        {stat.value >= 1000 ? `${(stat.value * prog / 1000).toFixed(1)}K` : Math.round(stat.value * prog)}
                      </div>
                      <div style={{ fontSize: 13, color: isLight(bg) ? "#888" : "#555", fontFamily }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {["Follow", "Message", "Email"].map((btn, i) => {
              const op = interpolate(Math.max(0, frame - 20 - i * 8), [0, 16], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
              return (
                <div key={btn} style={{
                  padding: "8px 20px", borderRadius: 8,
                  background: btn === "Follow" ? "#3897f0" : isLight(bg) ? "#f0f0f0" : "#2a2a2a",
                  color: btn === "Follow" ? "#fff" : isLight(bg) ? "#0a0a0a" : "#fff",
                  fontSize: 14, fontWeight: 600, fontFamily,
                  opacity: op,
                }}>
                  {btn}
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
            {Array.from({ length: 6 }, (_, i) => {
              const op = interpolate(Math.max(0, frame - 30 - i * 5), [0, 14], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
              const colors = [scene.accentColor || "#7C3AED", "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b6b"];
              return (
                <div key={i} style={{
                  aspectRatio: "1", borderRadius: 4,
                  background: colors[i % colors.length] + "33",
                  border: `1px solid ${colors[i % colors.length]}22`,
                  opacity: op,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                }}>
                  🎬
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.1} />
    </AbsoluteFill>
  );
};

export const NetflixRevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = "#000000";

  const s = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 20, stiffness: 150 }, from: 0.3, to: 1 });
  const glow = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const textOp = interpolate(Math.max(0, frame - 30), [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: E_OUT });
  const color = scene.accentColor || "#E50914";

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20 }}>
        <div style={{ transform: `scale(${s})`, textAlign: "center" }}>
          <div style={{
            fontSize: 180, fontWeight: 900,
            color,
            letterSpacing: "-0.08em",
            fontFamily,
            textShadow: `0 0 ${glow * 60}px ${color}66, 0 0 ${glow * 120}px ${color}33`,
            lineHeight: 1,
          }}>
            {scene.text || "N"}
          </div>
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: 28, fontWeight: 300, color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.3em", textTransform: "uppercase",
            fontFamily, opacity: textOp,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

export const TimerScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const totalSeconds = scene.counterTo || 300;
  const elapsed = frame / fps;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  const ms = Math.floor((elapsed % 1) * 100);

  const progress = elapsed / (totalSeconds / 10);
  const circumference = 2 * Math.PI * 200;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        <svg width="500" height="500" viewBox="0 0 500 500" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="250" cy="250" r="200" fill="none"
            stroke={isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}
            strokeWidth="8" />
          <circle cx="250" cy="250" r="200" fill="none"
            stroke={safeAccent(scene.accentColor, bg)}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - (progress % 1))}
            style={{ filter: `drop-shadow(0 0 12px ${scene.accentColor})` }}
          />
        </svg>
        <div style={{
          position: "absolute",
          fontSize: 72, fontWeight: 900, fontFamily,
          color: textColor(bg), letterSpacing: "-0.05em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          <span style={{ fontSize: 32, color: safeAccent(scene.accentColor, bg), marginLeft: 4 }}>
            .{String(ms).padStart(2, "0")}
          </span>
        </div>
        {scene.text && (
          <div style={{
            position: "absolute", bottom: 200,
            fontSize: 28, fontWeight: 300,
            color: isLight(bg) ? "#888" : "#555", fontFamily,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const GithubStarsScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0d1117";

  const targetStars = scene.counterTo || 12400;
  const progress = interpolate(frame, [10, durationInFrames * 0.8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const currentStars = Math.round(targetStars * progress);

  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    x: 540 + Math.cos((i / 12) * Math.PI * 2) * (120 + Math.sin(frame * 0.1 + i) * 30),
    y: 700 + Math.sin((i / 12) * Math.PI * 2) * (120 + Math.cos(frame * 0.1 + i) * 30),
    size: 8 + Math.sin(frame * 0.15 + i * 0.8) * 4,
    opacity: 0.4 + Math.sin(frame * 0.12 + i) * 0.3,
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20 }}>
        <svg width="1080" height="400" style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-200px)" }}>
          {sparkles.map((s, i) => (
            <text key={i} x={s.x} y={s.y} fontSize={s.size * 3}
              textAnchor="middle" opacity={s.opacity} fill="#ffd60a">
              ⭐
            </text>
          ))}
        </svg>
        <div style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.5)", fontFamily, letterSpacing: "0.02em" }}>
          {scene.text || "motionr / motionr"}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "20px 36px",
        }}>
          <span style={{ fontSize: 48 }}>⭐</span>
          <div style={{
            fontSize: 96, fontWeight: 900, fontFamily,
            color: "#ffd60a", letterSpacing: "-0.05em",
            textShadow: "0 0 40px rgba(255,214,10,0.4)",
          }}>
            {currentStars >= 1000 ? `${(currentStars / 1000).toFixed(1)}k` : currentStars}
          </div>
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.3)", fontFamily }}>
          GitHub Stars
        </div>
        <AccentLine accent="#ffd60a" delay={20} width={80} />
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

export const SquiggleTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#1a1aff";
  const text = (scene.text || "MOTION").toUpperCase();
  const letters = text.split("");

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column" }}>
        <div style={{ position: "relative", padding: "40px 60px" }}>
          {letters.map((letter, i) => {
            const delay = i * 4;
            const op = interpolate(Math.max(0, frame - delay), [0, 14], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            const y = Math.sin(frame * 0.08 + i * 0.6) * 15;
            const rotate = Math.sin(frame * 0.06 + i * 0.4) * 5;
            const colors = ["#ffffff", "#ffd60a", "#ff6b6b", "#ffffff", "#a8ff78", "#ffffff"];
            return (
              <span key={i} style={{
                fontSize: 140, fontWeight: 900, fontFamily,
                letterSpacing: "-0.05em", display: "inline-block",
                color: colors[i % colors.length],
                transform: `translateY(${y}px) rotate(${rotate}deg)`,
                opacity: op,
              }}>
                {letter}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.3} />
    </AbsoluteFill>
  );
};

export const MCPAnimationScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const nodes = [
    { id: "M", x: 540, y: 500, color: "#ff6b6b", delay: 0 },
    { id: "G", x: 300, y: 750, color: "#4d96ff", delay: 10 },
    { id: "S", x: 780, y: 750, color: "#6bcb77", delay: 20 },
    { id: "A", x: 180, y: 600, color: "#ffd93d", delay: 30 },
    { id: "B", x: 900, y: 600, color: "#ff6b6b", delay: 40 },
  ];

  const connections = [
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 0, to: 3 }, { from: 0, to: 4 },
  ];

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          {connections.map((conn, i) => {
            const from = nodes[conn.from];
            const to = nodes[conn.to];
            const op = interpolate(Math.max(0, frame - to.delay), [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            const dashOffset = interpolate(Math.max(0, frame - to.delay), [0, 40], [300, 0], { extrapolateRight: "clamp" });
            return (
              <line key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="rgba(255,255,255,0.15)" strokeWidth="2"
                strokeDasharray="300" strokeDashoffset={dashOffset}
                opacity={op}
              />
            );
          })}
          {nodes.map((node, i) => {
            const s = spring({ frame: Math.max(0, frame - node.delay), fps, config: { damping: 14, stiffness: 200 }, from: 0, to: 1 });
            const pulse = 1 + Math.sin(frame * 0.08 + i) * 0.05;
            return (
              <g key={i} transform={`translate(${node.x}, ${node.y}) scale(${s * pulse})`}>
                <circle r="50" fill={node.color} opacity="0.9"
                  style={{ filter: `drop-shadow(0 0 20px ${node.color})` }} />
                <text textAnchor="middle" dy="0.35em"
                  fontSize="36" fontWeight="900" fontFamily={fontFamily}
                  fill="#ffffff">
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 200 }}>
          {scene.text && (
            <div style={{
              fontSize: 48, fontWeight: 900, color: textColor(bg), fontFamily,
              letterSpacing: "-0.05em", textAlign: "center",
            }}>
              {scene.text}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const GlowTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#000000";
  const text = scene.text || "FUTURE";
  const fontSize = autoFontSize(text, 180, 80);

  const glowIntensity = 0.5 + Math.sin(frame * 0.05) * 0.3;
  const letters = text.split("");

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 8 }}>
        {scene.text2 && (
          <div style={{
            fontSize: 18, fontWeight: 300, letterSpacing: "0.4em",
            color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
            fontFamily, marginBottom: 8,
          }}>
            {scene.text2}
          </div>
        )}
        <div style={{ display: "flex", position: "relative" }}>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            filter: `blur(${20 + glowIntensity * 10}px)`,
          }}>
            <div style={{
              fontSize, fontWeight: 900, fontFamily,
              color: scene.accentColor || "#ffffff",
              letterSpacing: autoTracking(fontSize),
              opacity: glowIntensity * 0.8,
            }}>
              {text}
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {letters.map((letter, i) => {
              const op = interpolate(Math.max(0, frame - i * 3), [0, 14], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: E_OUT });
              const y = interpolate(Math.max(0, frame - i * 3), [0, 20], [20, 0], { extrapolateRight: "clamp", easing: E_OUT });
              return (
                <span key={i} style={{
                  fontSize, fontWeight: 900, fontFamily,
                  letterSpacing: "-0.05em",
                  color: "#ffffff",
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  display: "inline-block",
                }}>
                  {letter}
                </span>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

export const ASCIIScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = "#0a0a0a";
  const text = scene.text || "2026";
  const asciiChars = "█▓▒░ #@%&*+=-:. ";
  const fontSize = autoFontSize(text, 200, 80);
  const phase = Math.min(1, Math.max(0, (frame - 20) / 40));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            color: "#ffffff", letterSpacing: autoTracking(fontSize),
            opacity: 1 - phase,
            position: phase > 0.5 ? "absolute" : "relative",
            inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {text}
          </div>
          {phase > 0.2 && (
            <div style={{
              fontSize: Math.round(fontSize * 0.15),
              fontFamily: "monospace",
              color: scene.accentColor || "#00ff41",
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              opacity: phase,
              whiteSpace: "pre",
            }}>
              {Array.from({ length: 12 }, (_, row) =>
                Array.from({ length: 20 }, (_, col) => {
                  const charIdx = Math.floor((frame * 0.3 + row * 7 + col * 3) % asciiChars.length);
                  return asciiChars[charIdx];
                }).join(""),
              ).join("\n")}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const PriceTagScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const price = scene.counterTo || 9999;

  const s = spring({ frame, fps, config: { damping: 16, stiffness: 200 }, from: 0.5, to: 1 });
  const rotate = spring({ frame, fps, config: { damping: 20, stiffness: 180 }, from: -15, to: 0 });
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    x: 540 + Math.cos(i * 0.5) * (100 + i * 20),
    y: 600 - (frame * (2 + i % 3) + i * 15),
    size: 8 + (i % 4) * 4,
    color: ["#ffd60a", "#ff6b6b", "#4d96ff", "#6bcb77", "#ff9500"][i % 5],
    opacity: Math.max(0, 1 - frame * 0.015),
    rotate: frame * (i % 2 === 0 ? 3 : -3),
  }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        {confetti.map((c, i) => (
          <rect key={i} x={c.x - c.size / 2} y={c.y} width={c.size} height={c.size * 0.4}
            fill={c.color} opacity={c.opacity}
            transform={`rotate(${c.rotate}, ${c.x}, ${c.y})`} rx="2" />
        ))}
      </svg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 20 }}>
        <div style={{ transform: `scale(${s}) rotate(${rotate}deg)` }}>
          <div style={{
            background: "#ffffff", borderRadius: 20,
            padding: "40px 60px", textAlign: "center",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -14, left: "50%",
              transform: "translateX(-50%)",
              width: 28, height: 28, borderRadius: "50%",
              border: "4px solid #ddd", background: isLight(bg) ? "#f5f5f5" : "#0a0a0a",
            }} />
            <div style={{
              position: "absolute", top: -50, left: "50%",
              transform: "translateX(-50%)",
              width: 2, height: 40,
              background: "#ccc", borderRadius: 2,
            }} />
            <div style={{ fontSize: 18, fontWeight: 300, color: "#888", letterSpacing: "0.1em", marginBottom: 4 }}>
              {scene.text || "Prix exceptionnel"}
            </div>
            <div style={{
              fontSize: 80, fontWeight: 900, fontFamily,
              color: scene.accentColor || "#0a0a0a",
              letterSpacing: "-0.06em", lineHeight: 1,
            }}>
              {price}€
            </div>
            {scene.text2 && (
              <div style={{ fontSize: 16, color: "#aaa", marginTop: 8 }}>
                {scene.text2}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MusicVisualizerScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const bars = 60;
  const accent = scene.accentColor || "#7C3AED";

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ opacity: fade, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 32 }}>
        <div style={{
          width: 300, height: 300, borderRadius: "50%",
          background: "#111",
          border: "3px solid #222",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `rotate(${frame * 1.5}deg)`,
          position: "relative",
        }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              position: "absolute", inset: i * 15,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.04)",
            }} />
          ))}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}, ${accent}88)`,
            boxShadow: `0 0 20px ${accent}`,
          }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
          {Array.from({ length: bars }, (_, i) => {
            const h = 20 + Math.abs(Math.sin(frame * 0.1 + i * 0.3)) * 80 + Math.abs(Math.cos(frame * 0.07 + i * 0.5)) * 40;
            const isAccent = i % 5 === 0;
            return (
              <div key={i} style={{
                width: 8, height: h, borderRadius: 4,
                background: isAccent ? accent : `${accent}44`,
                boxShadow: isAccent ? `0 0 8px ${accent}` : "none",
              }} />
            );
          })}
        </div>
        {scene.text && (
          <div style={{ fontSize: 36, fontWeight: 900, color: textColor(bg), fontFamily, letterSpacing: "-0.05em" }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const SplitRevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const splitProgress = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)) });
  const textOp = interpolate(Math.max(0, frame - 20), [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: E_OUT });
  const fontSize = autoFontSize(scene.text || "", 160, 60);
  const accent = scene.accentColor || "#7C3AED";
  const panelTextColor = isLight(accent) ? "#0a0a0a" : "#ffffff";

  return (
    <AbsoluteFill style={{ background: bg }}>
      <Grain />
      <AbsoluteFill style={{ opacity: fade }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: `${50 - splitProgress * 50}%`,
          background: accent, overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            textAlign: "center", padding: "0 60px",
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: panelTextColor,
            lineHeight: 1,
          }}>
            {scene.text}
          </div>
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${50 - splitProgress * 50}%`,
          background: accent, overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            textAlign: "center", padding: "0 60px",
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: panelTextColor,
            lineHeight: 1,
          }}>
            {scene.text}
          </div>
        </div>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16 }}>
          <div style={{
            fontSize, fontWeight: 900, fontFamily,
            letterSpacing: autoTracking(fontSize),
            color: textColor(bg), opacity: textOp,
            textAlign: "center", padding: "0 60px",
          }}>
            {scene.text}
          </div>
          {scene.text2 && (
            <div style={{
              fontSize: 32, fontWeight: 300,
              color: isLight(bg) ? "#888" : "#555",
              fontFamily, opacity: textOp,
            }}>
              {scene.text2}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const CounterPunchScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";

  const target = scene.counterTo || 1000000;
  const progress = interpolate(frame, [0, durationInFrames * 0.85], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });
  const current = Math.round(target * progress);
  const punch = 1 + Math.sin(progress * Math.PI) * 0.08;
  const digits = current.toLocaleString("fr-FR").split("");

  return (
    <AbsoluteFill style={{ background: bg }}>
      <SceneBg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, flexDirection: "column", gap: 16 }}>
        {scene.text && (
          <div style={{ fontSize: 24, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {scene.text}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", transform: `scale(${punch})` }}>
          {digits.map((digit, i) => (
            <div key={i} style={{
              fontSize: digit === " " || digit === "," ? 80 : 160,
              fontWeight: 900, fontFamily,
              letterSpacing: "-0.06em",
              color: digit === " " || digit === "," ? safeAccent(scene.accentColor, bg) : textColor(bg),
              lineHeight: 1,
            }}>
              {digit === " " ? "\u00A0" : digit}
            </div>
          ))}
        </div>
        <AccentLine accent={safeAccent(scene.accentColor, bg)} delay={10} width={100} />
        {scene.text2 && (
          <div style={{ fontSize: 28, fontWeight: 300, color: isLight(bg) ? "#888" : "#555", fontFamily }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// SYSTÈME DE BASE APPLE/LINEAR — scènes clean premium
// ═══════════════════════════════════════════════════════

const getRevealValues = (frame: number, delay = 0) => {
  const f = Math.max(0, frame - delay);
  return {
    opacity: interpolate(f, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM }),
    y: interpolate(f, [0, 20], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM }),
    blur: interpolate(f, [0, 16], [6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_PREMIUM }),
  };
};

const useReveal = (delay = 0) => {
  const frame = useCurrentFrame();
  return getRevealValues(frame, delay);
};

const useScaleReveal = (delay = 0) => useScaleIn(delay, 0.94);

// Fond grille carreau — très discret (style Apple / Notion)
const GridBg: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `
        linear-gradient(${light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"} 1px, transparent 1px),
        linear-gradient(90deg, ${light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"} 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, ${light ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.0)"} 0%, transparent 70%)`,
      }} />
    </div>
  );
};

const GeoBg: React.FC<{ bg: string; accent: string }> = ({ bg, accent }) => {
  const isLightBg = isLight(bg);
  const shapeColor = isLightBg ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 800, height: 800, borderRadius: "50%",
        border: `1px solid ${shapeColor}`, top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        border: `1px solid ${shapeColor}`, top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
      }} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: "50%", height: 1,
        background: `linear-gradient(90deg, transparent, ${shapeColor}, transparent)`,
      }} />
      <div style={{
        position: "absolute", width: 6, height: 6, borderRadius: "50%",
        background: accent, opacity: 0.4, top: "30%", left: "20%",
      }} />
      <div style={{
        position: "absolute", width: 4, height: 4, borderRadius: "50%",
        background: accent, opacity: 0.3, top: "70%", right: "25%",
      }} />
    </div>
  );
};

export const CleanTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const bg = scene.bg || "#0a0a0a";
  const { opacity: op1, y: y1, blur: b1 } = useReveal(0);
  const { opacity: op2, y: y2, blur: b2 } = useReveal(14);
  const fontSize = autoFontSize(scene.text || "", 140, 56);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16, padding: "0 100px", textAlign: "center",
      }}>
        <div style={{
          fontSize, fontWeight: 900, fontFamily,
          letterSpacing: "-0.04em", lineHeight: 1.1, color: textColor(bg),
          opacity: op1, transform: `translateY(${y1}px)`, filter: `blur(${b1}px)`,
        }}>
          {scene.text}
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.32), fontWeight: 400,
            color: isLight(bg) ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)",
            fontFamily, letterSpacing: "-0.01em", lineHeight: 1.5,
            opacity: op2, transform: `translateY(${y2}px)`, filter: `blur(${b2}px)`,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const HighlightWordScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const bg = scene.bg || "#ffffff";
  const highlightW = interpolate(Math.max(0, frame - 20), [0, 24], [0, 100], {
    extrapolateRight: "clamp", easing: E_APPLE,
  });
  const words = (scene.text || "").split(" ");
  const highlightIndex = Math.floor(words.length / 2);
  const fontSize = autoFontSize(scene.text || "", 120, 56);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        padding: "0 100px", textAlign: "center", flexWrap: "wrap", gap: 12,
      }}>
        {words.map((word, i) => {
          const isHighlight = i === highlightIndex;
          const { opacity: wOp, y: wY, blur: wBl } = getRevealValues(frame, i * 6);
          return (
            <span key={i} style={{
              fontSize, fontWeight: 900, fontFamily, letterSpacing: "-0.04em", lineHeight: 1.2,
              color: textColor(bg), opacity: wOp, transform: `translateY(${wY}px)`,
              filter: `blur(${wBl}px)`, display: "inline-block", position: "relative",
            }}>
              {isHighlight && (
                <span style={{
                  position: "absolute", bottom: 4, left: 0, width: `${highlightW}%`,
                  height: Math.round(fontSize * 0.12),
                  background: `${safeAccent(scene.accentColor, bg)}44`,
                  borderRadius: 4, zIndex: -1,
                }} />
              )}
              {word}
            </span>
          );
        })}
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.06 : 0.4} />
    </AbsoluteFill>
  );
};


export const StatScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#0a0a0a";
  const target = scene.counterTo || 10000;
  const progress = interpolate(frame, [8, durationInFrames * 0.75], [0, 1], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.exp),
  });
  const current = Math.round(target * progress);
  const { opacity: op, y, blur: bl } = useReveal(0);
  const { opacity: op2, y: y2 } = useReveal(20);
  const { opacity: op3 } = useReveal(30);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 12, padding: "0 80px", textAlign: "center",
      }}>
        <div style={{
          fontSize: 160, fontWeight: 900, fontFamily, letterSpacing: "-0.06em", lineHeight: 1,
          color: safeAccent(scene.accentColor, bg),
          opacity: op, transform: `translateY(${y}px)`, filter: `blur(${bl}px)`,
        }}>
          {current >= 1000 ? `${(current / 1000).toFixed(1)}K` : current.toLocaleString("fr-FR")}
        </div>
        <div style={{
          fontSize: 28, fontWeight: 500,
          color: isLight(bg) ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)",
          fontFamily, letterSpacing: "-0.01em", opacity: op2, transform: `translateY(${y2}px)`,
        }}>
          {scene.text}
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: 18, fontWeight: 400,
            color: isLight(bg) ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)",
            fontFamily, opacity: op3,
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const CleanListScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const bg = scene.bg || "#ffffff";
  const items = (scene.text || "").split("|").map((s) => s.trim()).filter(Boolean);
  const { opacity: titleOp, y: titleY } = useReveal(0);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "flex-start",
        flexDirection: "column", gap: 20, padding: "80px 100px",
      }}>
        {scene.text2 && (
          <div style={{
            fontSize: 48, fontWeight: 900, fontFamily, letterSpacing: "-0.04em",
            color: textColor(bg), marginBottom: 8,
            opacity: titleOp, transform: `translateY(${titleY}px)`,
          }}>
            {scene.text2}
          </div>
        )}
        {items.map((item, i) => {
          const { opacity: op, y, blur: bl } = getRevealValues(frame, i * 10);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              opacity: op, transform: `translateY(${y}px)`, filter: `blur(${bl}px)`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: `${safeAccent(scene.accentColor, bg)}18`,
                border: `1.5px solid ${safeAccent(scene.accentColor, bg)}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: safeAccent(scene.accentColor, bg),
              }}>✓</div>
              <div style={{ fontSize: 26, fontWeight: 500, fontFamily, color: textColor(bg), letterSpacing: "-0.02em" }}>
                {item}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.06 : 0.4} />
    </AbsoluteFill>
  );
};

export const CleanQuoteScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const bg = scene.bg || "#ffffff";
  const { opacity: op, y, blur: bl } = useReveal(8);
  const { opacity: op2, y: y2 } = useReveal(28);
  const lineW = interpolate(Math.max(0, frame - 4), [0, 20], [0, 80], { extrapolateRight: "clamp", easing: E_APPLE });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "flex-start",
        padding: "0 120px", flexDirection: "column", gap: 20,
      }}>
        <div style={{
          width: lineW, height: 3, background: safeAccent(scene.accentColor, bg),
          borderRadius: 2, boxShadow: `0 0 12px ${safeAccent(scene.accentColor, bg)}44`,
        }} />
        <div style={{
          fontSize: 44, fontWeight: 700, fontFamily, letterSpacing: "-0.03em", lineHeight: 1.4,
          color: textColor(bg), fontStyle: "italic", maxWidth: 800,
          opacity: op, transform: `translateY(${y}px)`, filter: `blur(${bl}px)`,
        }}>
          &ldquo;{scene.text}&rdquo;
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: 22, fontWeight: 600,
            color: isLight(bg) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
            fontFamily, opacity: op2, transform: `translateY(${y2}px)`,
          }}>
            — {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={isLight(bg) ? 0.05 : 0.4} />
    </AbsoluteFill>
  );
};


export const UnderlineScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const bg = scene.bg || "#0a0a0a";
  const { opacity: op, y, blur: bl } = useReveal(0);
  const underlineW = interpolate(Math.max(0, frame - 24), [0, 20], [0, 100], {
    extrapolateRight: "clamp", easing: E_APPLE,
  });
  const fontSize = autoFontSize(scene.text || "", 140, 60);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 12, padding: "0 100px", textAlign: "center",
      }}>
        <div style={{
          position: "relative", display: "inline-block",
          opacity: op, transform: `translateY(${y}px)`, filter: `blur(${bl}px)`,
        }}>
          <div style={{
            fontSize, fontWeight: 900, fontFamily, letterSpacing: "-0.04em", lineHeight: 1.1,
            color: textColor(bg),
          }}>
            {scene.text}
          </div>
          <div style={{
            position: "absolute", bottom: -6, left: 0, width: `${underlineW}%`, height: 5,
            background: `linear-gradient(90deg, ${safeAccent(scene.accentColor, bg)}, ${safeAccent(scene.accentColor, bg)}88)`,
            borderRadius: 3, boxShadow: `0 0 12px ${safeAccent(scene.accentColor, bg)}66`,
          }} />
        </div>
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.28), fontWeight: 400,
            color: isLight(bg) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
            fontFamily, marginTop: 12,
            opacity: interpolate(Math.max(0, frame - 16), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_APPLE }),
          }}>
            {scene.text2}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export const SplitTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const bg = scene.bg || "#0a0a0a";
  const { opacity: op1, y: y1, blur: bl1 } = useReveal(0);
  const { opacity: op2, y: y2, blur: bl2 } = useReveal(12);
  const fontSize = autoFontSize(scene.text || "", 100, 48);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoBg bg={bg} accent={scene.accentColor || "#10B981"} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "row", gap: 0, padding: "0 80px",
      }}>
        <div style={{
          flex: 1, paddingRight: 40,
          borderRight: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        }}>
          <div style={{
            fontSize, fontWeight: 900, fontFamily, letterSpacing: "-0.04em", lineHeight: 1.1,
            color: textColor(bg), opacity: op1, transform: `translateY(${y1}px)`, filter: `blur(${bl1}px)`,
          }}>
            {scene.text}
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: 40 }}>
          <div style={{
            fontSize: Math.round(fontSize * 0.35), fontWeight: 400,
            color: isLight(bg) ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)",
            fontFamily, lineHeight: 1.6, letterSpacing: "-0.01em",
            opacity: op2, transform: `translateY(${y2}px)`, filter: `blur(${bl2}px)`,
          }}>
            {scene.text2 || "Une nouvelle façon de créer du contenu vidéo professionnel."}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// SYSTÈME APPLE STATE-DRIVEN — REMOTION
// ═══════════════════════════════════════════════════════

const E_APPLE = Easing.bezier(0.16, 1, 0.3, 1);
const E_APPLE_OUT = Easing.bezier(0.4, 0, 1, 1);

const useAppleReveal = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.6 },
    from: 0,
    to: 1,
  });

  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    scale: interpolate(progress, [0, 1], [0.82, 1]),
    blur: interpolate(progress, [0, 0.5, 1], [10, 3, 0]),
    y: interpolate(progress, [0, 1], [24, 0]),
    progress,
  };
};

const useAppleExit = (startAt: number) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const exitFrame = Math.max(0, frame - (durationInFrames - startAt));
  const progress = interpolate(exitFrame, [0, startAt], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_APPLE_OUT,
  });

  return {
    opacity: interpolate(progress, [0, 1], [1, 0]),
    scale: interpolate(progress, [0, 1], [1, 1.08]),
    blur: interpolate(progress, [0, 0.5, 1], [0, 3, 10]),
    y: interpolate(progress, [0, 1], [0, -20]),
  };
};

/** Fond minimaliste — aucune grille, aucune texture */
const CleanBg: React.FC<{ bg: string }> = ({ bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.015], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute", inset: 0,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      background: bg,
    }} />
  );
};

/** Combine entrée (scale 82%→100%) + sortie (100%→108%, fade out) — style tuto Apple */
const appleLayerStyle = (
  reveal: ReturnType<typeof useAppleReveal>,
  exit: ReturnType<typeof useAppleExit>,
  blurScale = 1,
) => {
  const opacity = Math.min(reveal.opacity, exit.opacity);
  const scale = reveal.progress < 0.99 ? reveal.scale : exit.scale;
  const blur = Math.max(reveal.blur, exit.blur) * blurScale;
  const y = reveal.y + exit.y;
  return {
    opacity,
    transform: `translateY(${y}px) scale(${scale})`,
    filter: `blur(${blur}px)`,
  };
};

const appleTitleStyle = (bg: string, fontSize: number): React.CSSProperties => ({
  fontSize,
  fontWeight: 600,
  fontFamily,
  letterSpacing: "-0.025em",
  lineHeight: 1.05,
  color: textColor(bg),
});

const appleText2Style = (bg: string, fontSize: number): React.CSSProperties => ({
  fontSize: Math.round(fontSize * 0.45),
  fontWeight: 400,
  fontFamily,
  letterSpacing: "-0.015em",
  lineHeight: 1.4,
  color: isLight(bg) ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)",
});

/** Texte mot par mot — stagger Apple (scale 70%→100%, sortie 100%→108%) */
const WordByWord: React.FC<{
  text: string;
  style: React.CSSProperties;
  delayPerWord?: number;
  initialDelay?: number;
  exitStartAt?: number;
}> = ({ text, style, delayPerWord = 6, initialDelay = 0, exitStartAt = 20 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.25em",
      lineHeight: style.lineHeight || 1.1,
    }}>
      {words.map((word, i) => {
        const wordDelay = initialDelay + i * delayPerWord;

        const enterProgress = spring({
          frame: Math.max(0, frame - wordDelay),
          fps,
          config: { damping: 200, stiffness: 120, mass: 0.6 },
          from: 0,
          to: 1,
        });

        const exitFrame = Math.max(0, frame - (durationInFrames - exitStartAt));
        const exitProgress = interpolate(exitFrame, [0, exitStartAt], [0, 1], {
          extrapolateRight: "clamp",
          easing: E_APPLE_OUT,
        });

        const opacity = Math.min(
          interpolate(enterProgress, [0, 1], [0, 1]),
          interpolate(exitProgress, [0, 1], [1, 0]),
        );
        const scaleVal = enterProgress < 0.99
          ? interpolate(enterProgress, [0, 1], [0.7, 1])
          : interpolate(exitProgress, [0, 1], [1, 1.08]);
        const blurVal = Math.max(
          interpolate(enterProgress, [0, 0.5, 1], [8, 2, 0]),
          interpolate(exitProgress, [0, 0.5, 1], [0, 2, 8]),
        );
        const yVal = interpolate(enterProgress, [0, 1], [20, 0])
          + interpolate(exitProgress, [0, 1], [0, -16]);

        return (
          <span key={i} style={{
            ...style,
            display: "inline-block",
            opacity,
            transform: `translateY(${yVal}px) scale(${scaleVal})`,
            filter: `blur(${blurVal}px)`,
            willChange: "transform, opacity, filter",
          }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const AppleTextScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const bg = scene.bg || "#ffffff";
  const fontSize = autoFontSize(scene.text || "", 130, 56);
  const mainWordCount = (scene.text || "").split(/\s+/).filter(Boolean).length;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <CleanBg bg={bg} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 14,
        padding: "0 120px", textAlign: "center",
      }}>
        <WordByWord
          text={scene.text || ""}
          initialDelay={0}
          delayPerWord={6}
          exitStartAt={20}
          style={appleTitleStyle(bg, fontSize)}
        />
        {scene.text2 && (
          <WordByWord
            text={scene.text2}
            initialDelay={mainWordCount * 6 + 4}
            delayPerWord={5}
            exitStartAt={18}
            style={appleText2Style(bg, fontSize)}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AppleAccentScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const bg = scene.bg || "#ffffff";
  const words = (scene.text || "").split(/\s+/).filter(Boolean);
  const fontSize = autoFontSize(scene.text || "", 110, 52);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <CleanBg bg={bg} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 14,
        padding: "0 100px", textAlign: "center",
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap",
          justifyContent: "center", alignItems: "center",
          gap: "0.25em",
        }}>
          {words.map((word, i) => (
            <WordByWord
              key={i}
              text={word}
              initialDelay={i * 6}
              delayPerWord={6}
              exitStartAt={20}
              style={{
                ...appleTitleStyle(bg, fontSize),
                color: i === 0
                  ? safeAccent(scene.accentColor, bg)
                  : textColor(bg),
              }}
            />
          ))}
        </div>
        {scene.text2 && (
          <WordByWord
            text={scene.text2}
            initialDelay={words.length * 6 + 4}
            delayPerWord={5}
            exitStartAt={18}
            style={appleText2Style(bg, fontSize)}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AppleNumberScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const target = scene.counterTo || 100;
  const countProgress = interpolate(frame, [6, durationInFrames * 0.7], [0, 1], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.exp),
  });
  const current = Math.round(target * countProgress);
  const front = useAppleReveal(0);
  const exit = useAppleExit(20);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <CleanBg bg={bg} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 8,
        padding: "0 80px", textAlign: "center",
      }}>
        <div style={appleLayerStyle(front, exit)}>
          <div style={{
            fontSize: 200, fontWeight: 600, fontFamily,
            letterSpacing: "-0.07em", lineHeight: 1,
            color: safeAccent(scene.accentColor, bg),
          }}>
            {current.toLocaleString("fr-FR")}
          </div>
        </div>
        {scene.text && (
          <WordByWord
            text={scene.text}
            initialDelay={12}
            delayPerWord={5}
            exitStartAt={20}
            style={{
              ...appleText2Style(bg, 52),
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ApplePhotoScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const photoUrl = scene.photoUrl || "";
  const imgReveal = useAppleReveal(16);
  const exit = useAppleExit(20);
  const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const fontSize = autoFontSize(scene.text || "", 96, 48);
  const mainWordCount = (scene.text || "").split(/\s+/).filter(Boolean).length;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <CleanBg bg={bg} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 32,
        padding: "60px 80px", textAlign: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <WordByWord
            text={scene.text || ""}
            initialDelay={0}
            delayPerWord={6}
            exitStartAt={20}
            style={appleTitleStyle(bg, fontSize)}
          />
          {scene.text2 && (
            <WordByWord
              text={scene.text2}
              initialDelay={mainWordCount * 6 + 4}
              delayPerWord={5}
              exitStartAt={18}
              style={appleText2Style(bg, fontSize)}
            />
          )}
        </div>
        {photoUrl && (
          <div style={{
            width: "78%", maxWidth: 580,
            aspectRatio: "16/9",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: isLight(bg)
              ? "0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)"
              : "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
            border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
            ...appleLayerStyle(imgReveal, exit),
          }}>
            <img
              src={scenePhotoSrc(photoUrl)}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                transform: `scale(${imgScale})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AppleIconScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);
  const iconReveal = useAppleReveal(0);
  const exit = useAppleExit(20);
  const floatY = Math.sin(frame * 0.025) * 4;
  const icons = ["⚡", "🎯", "💎", "🚀", "✨", "🔥", "💡", "🎬", "📱", "🌟"];
  const icon = icons[sceneIndex % icons.length];
  const fontSize = autoFontSize(scene.text || "", 96, 48);
  const mainWordCount = (scene.text || "").split(/\s+/).filter(Boolean).length;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <CleanBg bg={bg} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 24,
        padding: "0 100px", textAlign: "center",
      }}>
        <div style={{
          ...appleLayerStyle(iconReveal, exit),
          transform: `translateY(${iconReveal.y + exit.y + floatY}px) scale(${
            iconReveal.progress < 0.99 ? iconReveal.scale : exit.scale
          })`,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${accent}14`,
            border: `1px solid ${accent}28`,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 34,
            boxShadow: `0 8px 32px ${accent}18`,
            margin: "0 auto",
          }}>
            {icon}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <WordByWord
            text={scene.text || ""}
            initialDelay={8}
            delayPerWord={6}
            exitStartAt={20}
            style={appleTitleStyle(bg, fontSize)}
          />
          {scene.text2 && (
            <WordByWord
              text={scene.text2}
              initialDelay={8 + mainWordCount * 6 + 4}
              delayPerWord={5}
              exitStartAt={18}
              style={appleText2Style(bg, fontSize)}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AppleCTAScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const bg = scene.bg || scene.accentColor || "#0a0a0a";
  const fontSize = autoFontSize(scene.text || "", 110, 52);
  const btn = useAppleReveal(24);
  const exit = useAppleExit(20);
  const floatY = Math.sin(frame * 0.02) * 2;
  const mainWordCount = (scene.text || "").split(/\s+/).filter(Boolean).length;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <CleanBg bg={bg} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 20,
        padding: "0 80px", textAlign: "center",
      }}>
        <WordByWord
          text={scene.text || ""}
          initialDelay={0}
          delayPerWord={6}
          exitStartAt={20}
          style={appleTitleStyle(bg, fontSize)}
        />
        {scene.text2 && (
          <WordByWord
            text={scene.text2}
            initialDelay={mainWordCount * 6 + 4}
            delayPerWord={5}
            exitStartAt={18}
            style={appleText2Style(bg, fontSize)}
          />
        )}
        <div style={{
          ...appleLayerStyle(btn, exit),
          transform: `translateY(${btn.y + exit.y + floatY}px) scale(${
            btn.progress < 0.99 ? btn.scale : exit.scale
          })`,
        }}>
          <div style={{
            background: isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.10)",
            borderRadius: 100,
            padding: "12px 32px",
            border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)"}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>
            <span style={{
              fontSize: 18, fontWeight: 600, fontFamily,
              color: isLight(bg) ? "#0a0a0a" : "#ffffff",
              letterSpacing: "-0.02em",
            }}>
              Commencer gratuitement →
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Aliases — scènes legacy → Apple state-driven
export const PureTextScene = AppleTextScene;
export const AccentFirstWordScene = AppleAccentScene;
export const BigNumberScene = AppleNumberScene;
export const PhotoCardScene = ApplePhotoScene;
export const PhotoTextScene = ApplePhotoScene;
export const IconTextScene = AppleIconScene;
export const CleanCTAScene = AppleCTAScene;
