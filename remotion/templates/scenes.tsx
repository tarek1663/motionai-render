import {
  AbsoluteFill, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import { IconComponent, detectIcon, type IconType } from "./icons";

const { fontFamily } = loadFont("normal", {
  weights: ["200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

/** Chiffres alignés style SF Pro */
const tabularNums = { fontVariantNumeric: "tabular-nums" as const };

const E_OUT  = Easing.bezier(0.16, 1, 0.3, 1);
const E_IN   = Easing.bezier(0.7, 0, 0.84, 0);
const E_IO   = Easing.bezier(0.76, 0, 0.24, 1);

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
    | "photo" | "mockup" | "reconstructed" | "generatedui";
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
  accent: string;
  sceneIndex?: number;
}> = ({ color, accent, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const d = useDrift();

  const kb = interpolate(frame, [0, durationInFrames], [1.0, 1.06], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const patternOp = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });

  const ambX = 50 + Math.sin(frame * 0.008) * 15;
  const ambY = 45 + Math.cos(frame * 0.006) * 10;
  const ambS = 1 + Math.sin(frame * 0.022) * 0.06;
  const light = isLight(color);

  return (
    <>
      {/* Fond base + Ken Burns */}
      <div style={{
        position: "absolute", inset: "-8%",
        background: color,
        transform: `scale(${d.s * kb}) translate(${d.x}px, ${d.y}px) rotate(${d.r}deg)`,
      }}>
        {!light && (
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse 60% 50% at ${ambX}% ${ambY}%, ${accent}14 0%, transparent 55%)`,
            transform: `scale(${ambS})`,
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: light
            ? "radial-gradient(ellipse 90% 90% at center, transparent 40%, rgba(0,0,0,0.06) 100%)"
            : "radial-gradient(ellipse 90% 90% at center, transparent 38%, rgba(0,0,0,0.5) 100%)",
        }} />
      </div>

      {/* Pattern TOUJOURS visible — opacité forcée */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: patternOp,
        overflow: "hidden",
        zIndex: 1,
      }}>
        {light ? (
          <div style={{
            position: "absolute", inset: "-15%",
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }} />
        ) : (
          <BgPattern patternIndex={sceneIndex} frame={frame} bg={color} />
        )}
      </div>
    </>
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

// FADE — plus rapide
const useFade = (inDur = 14, outDur = 14) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeIn  = interpolate(frame, [0, inDur], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const fadeOut = interpolate(frame, [durationInFrames - outDur, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_IN,
  });
  return Math.min(fadeIn, fadeOut);
};

// FONT SIZE — conservative (évite texte coupé)
const autoFontSize = (text: string, base = 180, min = 60): number => {
  const len = (text || "").replace(/\s+/g, " ").trim().length;
  if (len <= 3)  return base;
  if (len <= 6)  return Math.round(base * 0.85);
  if (len <= 10) return Math.round(base * 0.70);
  if (len <= 16) return Math.round(base * 0.55);
  if (len <= 24) return Math.round(base * 0.44);
  if (len <= 35) return Math.round(base * 0.36);
  return Math.max(min, Math.round(base * 0.30));
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
  const light = isLight(bg);
  const fontSize = autoFontSize(scene.text || "", 220);
  const useGradient = !light && sceneIndex % 2 === 0;

  const blur = interpolate(frame, [0, 20], [28, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const s    = spring({ frame, fps, config: { damping: 32, stiffness: 260 }, from: 0.9, to: 1 });
  const idle = Math.sin(frame * 0.022) * 2;

  const push = scene.text2
    ? interpolate(Math.max(0, frame - 8), [0, 18], [0, -28], { extrapolateRight: "clamp", easing: E_OUT })
    : 0;

  const sub2Op = interpolate(Math.max(0, frame - 12), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const sub2Y  = interpolate(Math.max(0, frame - 12), [0, 16], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 14,
        opacity: fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 900,
          lineHeight: autoLineHeight(fontSize),
          letterSpacing: autoTracking(fontSize),
          filter: `blur(${blur}px)`,
          transform: `scale(${s}) translateY(${idle + push}px)`,
          ...(useGradient && !isLight(bg) ? {
            background: `linear-gradient(145deg, #ffffff 0%, ${scene.accentColor} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          } : {
            color: textColor(bg),
          }),
        }}>
          {scene.text}
        </div>

        <AccentLine accent={scene.accentColor} delay={6} />

        {scene.text2 && (
          <div style={{
            fontSize: Math.max(36, Math.round(fontSize * 0.25)),
            fontWeight: 200, color: light ? "#6e6e73" : "#666",
            fontFamily, letterSpacing: "-0.02em",
            opacity: sub2Op, transform: `translateY(${sub2Y}px)`,
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
// 2. REVEAL SCENE — texte qui sort de derrière un masque
// ---------------------------------------------------------
export const RevealScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainColor = getMainColor(bg);
  const subColor = subTextColor(bg);
  const fontSize = autoFontSize(scene.text || "", 185);

  // Mask reveal de bas en haut — signature Apple
  const revealProgress = spring({ frame, fps, config: { damping: 32, stiffness: 180 }, from: 0, to: 1 });
  const clipY = interpolate(revealProgress, [0, 1], [100, 0], { easing: E_OUT });

  // Scale subtil
  const s = interpolate(frame, [0, 40], [0.95, 1], { extrapolateRight: "clamp", easing: E_OUT });

  // Ligne 2 qui arrive après
  const l2op = interpolate(Math.max(0, frame - 18), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const l2y  = interpolate(Math.max(0, frame - 18), [0, 20], [20, 0], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 16,
        opacity: fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        {/* Masque reveal */}
        <div style={{ overflow: "hidden" }}>
          <div style={{
            fontSize, fontWeight: 800, color: mainColor,
            overflow: "visible",
            fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.95,
            transform: `translateY(${clipY}%) scale(${s})`,
          }}>
            {scene.text}
          </div>
        </div>
        <AccentLine accent={scene.accentColor} delay={20} />
        {scene.text2 && (
          <div style={{
            fontSize: Math.round(fontSize * 0.32), fontWeight: 200,
            color: subColor,
            overflow: "visible",
            fontFamily, letterSpacing: autoTracking(Math.round(fontSize * 0.32)),
            opacity: l2op, transform: `translateY(${l2y}px)`,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainCol = getMainColor(bg);
  const words = (scene.text || "").split(" ");
  const fontSize = 64;
  const stagger = Math.max(3, Math.floor((durationInFrames * 0.35) / Math.max(words.length, 1)));

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
            const f   = Math.max(0, frame - i * stagger);
            const op  = interpolate(f, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
            const y   = interpolate(f, [0, 20], [36, 0], { extrapolateRight: "clamp", easing: E_OUT });
            const bl  = interpolate(f, [0, 14], [12, 0], { extrapolateRight: "clamp" });
            const isAccent = i === 0;
            const isBold   = i % 3 === 0;
            return (
              <span key={i} style={{
                fontSize, fontWeight: isBold ? 900 : 200,
                letterSpacing: autoTracking(fontSize),
                lineHeight: autoLineHeight(fontSize),
                color: isAccent ? safeAccent(scene.accentColor, bg) : mainCol,
                fontFamily, display: "inline-block",
                opacity: op, transform: `translateY(${y}px)`,
                filter: `blur(${bl}px)`,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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

  const s     = spring({ frame, fps, config: { damping: 26, stiffness: 200, mass: 1.1 }, from: 0, to: 1 });
  const entY  = interpolate(frame, [0, 40], [60, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const bl    = interpolate(frame, [0, 22], [14, 0], { extrapolateRight: "clamp" });
  const idleY = s > 0.95 ? Math.sin(frame * 0.022) * 4 : 0;
  const tiltX = Math.sin(frame * 0.014) * 1.5;
  const tiltY = Math.cos(frame * 0.010) * 1;

  const lightX = interpolate(frame, [0, 100], [-30, 130], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const metricOp = interpolate(Math.max(0, frame - 6), [0, 18], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const titleOp  = interpolate(Math.max(0, frame - 14), [0, 16], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const lineW    = interpolate(Math.max(0, frame - 10), [0, 20], [0, 60], { extrapolateRight: "clamp", easing: E_OUT });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: s * fade }}>
        <div style={{
          width: 1560, position: "relative", overflow: "hidden",
          background: "linear-gradient(145deg, rgba(22,22,22,0.98), rgba(10,10,10,0.98))",
          borderRadius: 28, padding: "48px 56px",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 30px 80px rgba(0,0,0,0.5), 0 80px 140px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
          transform: `scale(${s}) translateY(${entY + idleY}px) perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
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
              fontSize: 42, fontWeight: 700, color: "#f5f5f0",
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
export const CTAScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const lum = getLuminance(bg);
  const mainCol = getMainColor(bg);
  const fontSize = autoFontSize(scene.text || "", 120, 72);

  const s      = spring({ frame, fps, config: { damping: 30, stiffness: 240 }, from: 0.88, to: 1 });
  const textOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const textBl = interpolate(frame, [0, 18], [20, 0], { extrapolateRight: "clamp" });
  const textY  = interpolate(frame, [0, 22], [24, 0], { extrapolateRight: "clamp", easing: E_OUT });
  const btnS   = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 22, stiffness: 280 }, from: 0, to: 1 });
  const btnOp  = interpolate(Math.max(0, frame - 18), [0, 14], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const glow   = 0.45 + Math.sin(frame * 0.07) * 0.2;
  const lineW  = interpolate(Math.max(0, frame - 10), [0, 20], [0, 80], { extrapolateRight: "clamp", easing: E_OUT });

  const btnBg   = lum > 0.3 ? "#0a0a0a" : "#ffffff";
  const btnText = lum > 0.3 ? "#ffffff" : "#0a0a0a";

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <DepthRings accent={scene.accentColor} intensity={0.7} />
      <Grain />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, ${lum > 0.3 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"} 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
        opacity: interpolate(frame, [0, 28], [0, 0.7], { extrapolateRight: "clamp" }),
      }} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 20,
        opacity: fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        <div style={{
          opacity: textOp,
          transform: `scale(${s}) translateY(${textY}px)`,
          filter: `blur(${textBl}px)`,
        }}>
          <div style={{
            fontSize, fontWeight: 900, color: mainCol,
            fontFamily, letterSpacing: autoTracking(fontSize),
            lineHeight: autoLineHeight(fontSize),
          }}>
            {scene.text}
          </div>
        </div>

        <div style={{
          width: lineW, height: 3,
          background: `linear-gradient(90deg, ${safeAccent(scene.accentColor, bg)}66, ${safeAccent(scene.accentColor, bg)}, ${safeAccent(scene.accentColor, bg)}66)`,
          borderRadius: 2,
          boxShadow: `0 0 20px ${safeAccent(scene.accentColor, bg)}`,
        }} />

        <div style={{ transform: `scale(${btnS})`, opacity: btnOp, position: "relative", marginTop: 8 }}>
          <div style={{
            position: "absolute", inset: -24,
            background: btnBg, borderRadius: 80,
            filter: "blur(36px)", opacity: glow * 0.4,
          }} />
          <div style={{
            background: btnBg, borderRadius: 64, padding: "28px 80px",
            fontSize: 40, fontWeight: 900, color: btnText,
            fontFamily, letterSpacing: "-0.03em", position: "relative",
            boxShadow: `0 32px 90px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}>
            {scene.text2 || "Découvrir →"}
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={light ? 0.1 : 0.65} />
    </AbsoluteFill>
  );
};
// ---------------------------------------------------------
// 10. KINETIC SCENE — mots qui s'enchaînent en rafale
// Chaque mot occupe tout l'écran une fraction de seconde
// ---------------------------------------------------------
export const KineticScene: React.FC<{ scene: SceneData; sceneIndex?: number }> = ({ scene, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade();
  const bg = scene.bg || "#0a0a0a";
  const light = isLight(bg);
  const mainColor = getMainColor(bg);
  const subColor = subTextColor(bg);

  const words = (scene.text || "").split(" ");
  const framesPerWord = Math.floor(durationInFrames / (words.length + 1));

  const currentWordIndex = Math.floor(frame / framesPerWord);
  const localFrame = frame % framesPerWord;

  // Directions alternées pour chaque mot
  const directions = ["up", "down", "left", "right", "scale", "up", "scale", "down"];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />

      {words.map((word, i) => {
        if (i !== currentWordIndex) return null;

        const dir = directions[i % directions.length];
        const entryProgress = interpolate(localFrame, [0, Math.min(12, framesPerWord * 0.4)], [0, 1], {
          extrapolateRight: "clamp", easing: E_OUT,
        });
        const exitProgress = interpolate(localFrame, [framesPerWord - 12, framesPerWord], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_IN,
        });

        const opacity = entryProgress * (1 - exitProgress);

        let transform = "";
        if (dir === "up") {
          const y = interpolate(entryProgress, [0, 1], [80, 0], { easing: E_OUT });
          const ey = interpolate(exitProgress, [0, 1], [0, -80], { easing: E_IN });
          transform = `translateY(${y + ey}px)`;
        } else if (dir === "down") {
          const y = interpolate(entryProgress, [0, 1], [-80, 0], { easing: E_OUT });
          const ey = interpolate(exitProgress, [0, 1], [0, 80], { easing: E_IN });
          transform = `translateY(${y + ey}px)`;
        } else if (dir === "left") {
          const x = interpolate(entryProgress, [0, 1], [120, 0], { easing: E_OUT });
          const ex = interpolate(exitProgress, [0, 1], [0, -120], { easing: E_IN });
          transform = `translateX(${x + ex}px)`;
        } else if (dir === "right") {
          const x = interpolate(entryProgress, [0, 1], [-120, 0], { easing: E_OUT });
          const ex = interpolate(exitProgress, [0, 1], [0, 120], { easing: E_IN });
          transform = `translateX(${x + ex}px)`;
        } else if (dir === "scale") {
          const s = interpolate(entryProgress, [0, 1], [2.5, 1], { easing: E_OUT });
          const es = interpolate(exitProgress, [0, 1], [1, 0.3], { easing: E_IN });
          transform = `scale(${s * es})`;
        }

        const isAccent = i % 3 === 1;
        const fontSize = autoFontSize(word, 200, 100);
        const blur = interpolate(entryProgress, [0, 1], [12, 0], { easing: E_OUT });

        return (
          <AbsoluteFill key={i} style={{
            justifyContent: "center", alignItems: "center",
            opacity: opacity * fade,
          }}>
            <div style={{
              fontSize, fontWeight: 800,
              ...(isAccent ? {
                background: `linear-gradient(135deg, ${safeAccent(scene.accentColor, bg)}, #ffffff)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              } : { color: mainColor }),
              fontFamily, letterSpacing: autoTracking(fontSize), lineHeight: 0.9,
              transform, filter: `blur(${blur}px)`,
              padding: "60px 120px", textAlign: "center" as const,
            }}>
              {word}
            </div>
          </AbsoluteFill>
        );
      })}

      <Vignette strength={0.5} />
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
            fontSize, fontWeight: 800, color: "#ff0000",
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
            fontSize, fontWeight: 800, color: "#0000ff",
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
          fontSize, fontWeight: 800,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
                  fontSize: i === 1 ? 72 : 58, fontWeight: 800,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
          fontSize, fontWeight: 800,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
          fontSize, fontWeight: 800, color: mainCol,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
                    fontSize: 36, fontWeight: 800, color: safeAccent(scene.accentColor, bg),
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

  const phraseOp = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const phraseY = interpolate(frame, [0, 28], [30, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const fontSize = 68;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity: phraseOp * fade,
        padding: "60px 120px",
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap",
          justifyContent: "center", alignItems: "baseline",
          gap: `${fontSize * 0.2}px`,
          transform: `translateY(${phraseY}px)`,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
                  fontWeight: 800, color: safeAccent(scene.accentColor, bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
            fontSize, fontWeight: 800, color: mainCol,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
          fontWeight: 800, color: getMainColor(bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 40,
        opacity: op * fade, padding: "60px 120px",
      }}>
        {/* Texte principal */}
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 800, color: getMainColor(bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
                  fontSize: 36, fontWeight: 800,
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

  const s   = spring({ frame, fps, config: { damping: 24, stiffness: 180, mass: 1.1 }, from: 0, to: 1 });
  const op  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const entY = interpolate(frame, [0, 36], [50, 0], { extrapolateRight: "clamp", easing: E_OUT });

  const wordsOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const authorOp = interpolate(Math.max(0, frame - 28), [0, 20], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
  const authorY  = interpolate(Math.max(0, frame - 28), [0, 20], [16, 0], { extrapolateRight: "clamp", easing: E_OUT });

  // Guillemets animés
  const quoteScale = spring({ frame, fps, config: { damping: 20, stiffness: 300 }, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
          transform: `scale(${s}) translateY(${entY}px)`,
          boxShadow: light
            ? "0 8px 40px rgba(0,0,0,0.06)"
            : `0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
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
  const framesPerNum = Math.floor(durationInFrames / (startNum + 1));
  const currentNum = Math.max(0, startNum - Math.floor(frame / framesPerNum));
  const localFrame = frame % framesPerNum;

  // Animation pour chaque chiffre
  const scaleIn = spring({ frame: localFrame, fps, config: { damping: 8, stiffness: 400, mass: 0.8 }, from: 3, to: 1 });
  const numOp   = interpolate(localFrame, [0, 8, framesPerNum - 12, framesPerNum], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const blurNum = interpolate(localFrame, [0, 12], [20, 0], { extrapolateRight: "clamp" });

  // Cercle de progression
  const circleProgress = (localFrame / framesPerNum);
  const circumference = 2 * Math.PI * 400;
  const strokeOffset = circumference * (1 - circleProgress);

  const isZero = currentNum === 0;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
          fontWeight: 800,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
      <Grain />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column",
        opacity: op * fade, padding: "60px 120px", textAlign: "center" as const,
      }}>
        {/* Texte principal */}
        <div style={{
          ...MAIN_TEXT_BOX,
          fontSize, fontWeight: 800, color: getMainColor(bg),
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
          fontSize, fontWeight: 800, color: getMainColor(bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />

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
          fontSize, fontWeight: 800, color: getMainColor(bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />

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
          fontSize, fontWeight: 800, color: getMainColor(bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
          fontSize, fontWeight: 800, color: getMainColor(bg),
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
              fontSize, fontWeight: 800,
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
            fontSize, fontWeight: 800, color: getMainColor(bg),
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
    <AbsoluteFill style={{ overflow: "hidden", opacity: fade, background: "#0a0a0a" }}>
      <Grain />
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
                fontSize, fontWeight: 800, color: panelText,
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
              fontSize, fontWeight: 800, color: textColor(bg),
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
              src={staticFile(scene.photoUrl.replace(/^\//, ""))}
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
              fontSize, fontWeight: 800, color: textColor(bg),
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
      src={staticFile(imageUrl.replace(/^\//, ""))}
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
      <Bg color={bg} accent={scene.accentColor} sceneIndex={sceneIndex} />
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
                    fontWeight: 700, lineHeight: 1,
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
              fontWeight: 800, color: textColor(bg),
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
            fontSize: 14, fontWeight: 800, color: accent,
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
              borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff",
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
                    fontSize: 13, fontWeight: 700, color: uiText,
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
                            fontSize: 20, fontWeight: 800,
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
                      fontSize: 22, fontWeight: 800, color: uiText,
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
                          fontSize: 11, fontWeight: 700,
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
                              fontSize: 10, fontWeight: 700,
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
      <Bg color={bg} accent={accent} sceneIndex={sceneIndex} />
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
              src={staticFile(photoUrl.replace(/^\//, ""))}
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
      <Bg color={bg} accent={accent} sceneIndex={sceneIndex} />
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
              fontWeight: 800, color: textColor(bg),
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
