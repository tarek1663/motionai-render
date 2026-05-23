import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { getSharedSceneTransition } from "./scene-transitions";
import React from "react";

import {
  Counter,
  TypewriterText,
  LogoSplash,
  PhoneMockup,
  IconFan,
  NetworkNodes,
  SplitPanel,
  LottieEl,
  BrowserMockup,
  RecipeCard,
  StatCard,
} from "./components";
import { SFXLayer, type SFXCue } from "./SFX";

// Optimisation typographie Apple-like
const globalStyle = `
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  }
`;

// ── TYPES ──────────────────────────────────────────────────────────────────
export type BgStyle = {
  color: string;
  pattern?: "dots" | "grid" | "squares" | "circles" | "lines" | "particles" | "none";
  gradient?: string;
};

export type TextElement = {
  type: "headline" | "subtext" | "label" | "metric";
  content: string;
  fontSize?: number;
  fontWeight?: 300 | 400 | 700 | 800;
  color?: string;
  delay?: number;
  animation?: "slamSettle" | "whipIn" | "punch" | "fadeUp" | "scaleIn";
  highlight?: boolean;
  letterStagger?: boolean;
};

export type VisualElement =
  | { kind: "counter"; from: number; to: number; prefix?: string; suffix?: string; fontSize?: number; color?: string; delay?: number; format?: "number" | "compact" | "currency" }
  | { kind: "typewriter"; text: string; fontSize?: number; color?: string; delay?: number; cursorColor?: string }
  | { kind: "logo"; src: string; size?: number; delay?: number; animation?: "scaleUp" | "dropIn" | "popBounce"; glowColor?: string }
  | { kind: "phone"; content: any; delay?: number; width?: number; accentColor?: string }
  | { kind: "iconFan"; icons: any[]; delay?: number; iconSize?: number; radius?: number; accentColor?: string }
  | { kind: "network"; nodeCount?: number; color?: string; delay?: number; pulseColor?: string }
  | { kind: "splitPanel"; left: any; right: any; delay?: number }
  | { kind: "image"; src: string; width?: number; height?: number; delay?: number; borderRadius?: number; animation?: "float" | "slam" | "pop" }
  | { kind: "lottie"; id: string; width?: number; height?: number; delay?: number; speed?: number; loop?: boolean }
  | { kind: "browser"; url: string; screenshot?: string; scrollAmount?: number; delay?: number; width?: number; accentColor?: string; darkMode?: boolean }
  | { kind: "recipe"; title: string; emoji: string; ingredients?: string[]; steps?: string[]; duration?: string; servings?: string; delay?: number; width?: number; accentColor?: string }
  | { kind: "statCard"; value: string; label: string; icon?: string; trend?: number; delay?: number; width?: number; accentColor?: string };

export type SceneDef = {
  id: string;
  duration: number;        // secondes
  bg: BgStyle;
  texts?: TextElement[];
  visuals?: VisualElement[];
  layout?: "center" | "top" | "bottom" | "fullscreen";
  transition?: "fade" | "slide-up" | "slide-right" | "wipe" | "flip";
  accentColor?: string;
  sfxCues?: SFXCue[];
};

export type Props = {
  scenes: SceneDef[];
  audioSrc?: string;
};

// ── FONT ───────────────────────────────────────────────────────────────────
const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

// ── BG PATTERN ─────────────────────────────────────────────────────────────
const BgPattern: React.FC<{ style: BgStyle; accent: string; frame: number }> = ({ style, accent, frame }) => {
  const op = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  if (style.pattern === "dots") return (
    <div style={{
      position: "absolute", inset: 0, opacity: op * 0.18,
      backgroundImage: `radial-gradient(circle, ${accent} 1.5px, transparent 1.5px)`,
      backgroundSize: "48px 48px", pointerEvents: "none",
    }} />
  );
  if (style.pattern === "grid") return (
    <div style={{
      position: "absolute", inset: 0, opacity: op * 0.1,
      backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
      backgroundSize: "72px 72px", pointerEvents: "none",
    }} />
  );
  if (style.pattern === "squares") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[{ x: 8, y: 12, s: 80, r: 15 }, { x: 72, y: 8, s: 50, r: -20 }, { x: 85, y: 65, s: 70, r: 35 }, { x: 5, y: 75, s: 60, r: -10 }].map((sq, i) => {
        const floatY = Math.sin(frame * 0.03 + i) * 8;
        const sop = interpolate(frame, [i * 4, i * 4 + 16], [0, op * 0.12], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: `${sq.x}%`, top: `${sq.y}%`,
            width: sq.s, height: sq.s,
            border: `2px solid ${accent}`, borderRadius: 6,
            transform: `translate(-50%,-50%) rotate(${sq.r}deg) translateY(${floatY}px)`,
            opacity: sop,
          }} />
        );
      })}
    </div>
  );
  if (style.pattern === "circles") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[{ x: 15, y: 20, r: 60 }, { x: 80, y: 15, r: 40 }, { x: 85, y: 70, r: 80 }, { x: 10, y: 80, r: 50 }].map((c, i) => {
        const pulse = 1 + Math.sin(frame * 0.04 + i * 1.5) * 0.08;
        const cop = interpolate(frame, [i * 5, i * 5 + 18], [0, op * 0.1], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: `${c.x}%`, top: `${c.y}%`,
            width: c.r * 2, height: c.r * 2,
            border: `1.5px solid ${accent}`, borderRadius: "50%",
            transform: `translate(-50%,-50%) scale(${pulse})`,
            opacity: cop,
          }} />
        );
      })}
    </div>
  );
  if (style.pattern === "lines") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[0.2, 0.5, 0.8].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", left: `${pos * 100}%`, top: 0, bottom: 0, width: 1,
          background: accent,
          opacity: interpolate(frame, [i * 6, i * 6 + 18], [0, op * 0.12], { extrapolateRight: "clamp" }),
        }} />
      ))}
    </div>
  );
  if (style.pattern === "particles") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 48 }, (_, i) => {
        const x = ((i * 17 + 23) % 100);
        const y = ((i * 31 + 11) % 100);
        const wobble = Math.sin(frame * 0.04 + i * 0.7) * 3;
        const pop = interpolate(frame, [(i % 8) * 2, (i % 8) * 2 + 14], [0, op * 0.35], { extrapolateRight: "clamp" });
        const size = 2 + (i % 3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: accent,
              opacity: pop,
              transform: `translate(-50%, calc(-50% + ${wobble}px))`,
            }}
          />
        );
      })}
    </div>
  );
  return null;
};

// ── TEXT ELEMENT ───────────────────────────────────────────────────────────
const TextEl: React.FC<{ el: TextElement; frame: number; fps: number; accentColor: string }> = ({ el, frame, fps, accentColor }) => {
  const delay = el.delay ?? 0;
  const f = Math.max(0, frame - delay);
  const color = el.highlight ? accentColor : (el.color ?? "#f5f5f7");
  const fontSize = el.fontSize ?? (el.type === "headline" ? 110 : el.type === "metric" ? 150 : el.type === "label" ? 28 : 40);
  const fontWeight = el.fontWeight ?? (el.type === "headline" || el.type === "metric" ? 800 : 300);

  let transform = "";
  let opacity = 1;
  let filter = "";

  if (el.animation === "slamSettle" || !el.animation) {
    const y = spring({ frame: f, fps, config: { damping: 18, stiffness: 400 }, from: -60, to: 0 });
    const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 350 }, from: 0.92, to: 1 });
    opacity = interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" });
    transform = `scale(${s}) translateY(${y}px)`;
  } else if (el.animation === "whipIn") {
    const x = spring({ frame: f, fps, config: { damping: 20, stiffness: 500 }, from: -100, to: 0 });
    opacity = interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
    filter = `blur(${interpolate(f, [0, 6], [6, 0], { extrapolateRight: "clamp" })}px)`;
    transform = `translateX(${x}px)`;
  } else if (el.animation === "punch") {
    const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 600 }, from: 0, to: 1 });
    opacity = interpolate(f, [0, 3], [0, 1], { extrapolateRight: "clamp" });
    transform = `scale(${s})`;
  } else if (el.animation === "fadeUp") {
    opacity = interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" });
    transform = `translateY(${interpolate(f, [0, 18], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })}px)`;
  } else if (el.animation === "scaleIn") {
    const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 280 }, from: 0.3, to: 1 });
    opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
    transform = `scale(${s})`;
  }

  if (el.letterStagger) {
    return (
      <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", gap: 2 }}>
        {el.content.split("").map((char, i) => {
          const cf = Math.max(0, f - i * 2);
          const cs = spring({ frame: cf, fps, config: { damping: 14, stiffness: 500 }, from: 0, to: 1 });
          const co = interpolate(cf, [0, 5], [0, 1], { extrapolateRight: "clamp" });
          return (
            <span key={i} style={{
              fontSize, fontWeight, color, fontFamily,
              letterSpacing: "-0.035em", lineHeight: 1,
              display: "inline-block",
              transform: `scale(${cs}) translateY(${interpolate(cf, [0, 8], [20, 0], { extrapolateRight: "clamp" })}px)`,
              opacity: co,
              whiteSpace: char === " " ? "pre" : "normal",
            }}>
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      fontSize, fontWeight, color, fontFamily,
      letterSpacing: el.type === "label" ? "0.1em" : "-0.03em",
      lineHeight: 1,
      textTransform: el.type === "label" ? "uppercase" : "none",
      transform, opacity, filter,
      textShadow: el.highlight ? `0 0 40px ${accentColor}88` : "none",
    }}>
      {el.content}
    </div>
  );
};

// ── VISUAL ELEMENT ─────────────────────────────────────────────────────────
const VisualEl: React.FC<{ el: VisualElement; frame: number; fps: number; accentColor: string }> = ({ el, frame, fps, accentColor }) => {
  if (el.kind === "counter") {
    return <Counter from={el.from} to={el.to} prefix={el.prefix} suffix={el.suffix} fontSize={el.fontSize ?? 160} color={el.color ?? accentColor} delay={el.delay} format={el.format} />;
  }
  if (el.kind === "typewriter") {
    return <TypewriterText text={el.text} fontSize={el.fontSize} color={el.color ?? "#fff"} delay={el.delay} cursorColor={el.cursorColor ?? accentColor} />;
  }
  if (el.kind === "logo") {
    return <LogoSplash src={el.src} size={el.size} delay={el.delay} animation={el.animation} glowColor={el.glowColor ?? accentColor} />;
  }
  if (el.kind === "phone") {
    return <PhoneMockup content={el.content} delay={el.delay} width={el.width} accentColor={el.accentColor ?? accentColor} />;
  }
  if (el.kind === "iconFan") {
    return <IconFan icons={el.icons} delay={el.delay} iconSize={el.iconSize} radius={el.radius} accentColor={el.accentColor ?? accentColor} />;
  }
  if (el.kind === "network") {
    return <NetworkNodes nodeCount={el.nodeCount} color={el.color ?? accentColor} delay={el.delay} pulseColor={el.pulseColor ?? accentColor} />;
  }
  if (el.kind === "image") {
    const f = Math.max(0, frame - (el.delay ?? 0));
    const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 180 }, from: 0.7, to: 1 });
    const op = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
    const floatY = f > 20 ? Math.sin(f * 0.03) * 6 : 0;
    return (
      <div style={{
        width: el.width ?? 320, height: el.height ?? 320,
        transform: `scale(${s}) translateY(${floatY}px)`,
        opacity: op,
        filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.6))",
      }}>
        <img src={el.src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    );
  }
  if (el.kind === "lottie") {
    return <LottieEl id={el.id} width={el.width} height={el.height} delay={el.delay} speed={el.speed} loop={el.loop} />;
  }
  if (el.kind === "browser") {
    return <BrowserMockup url={el.url} screenshot={el.screenshot} scrollAmount={el.scrollAmount} delay={el.delay} width={el.width ?? 800} accentColor={el.accentColor ?? accentColor} darkMode={el.darkMode} />;
  }
  if (el.kind === "recipe") {
    return <RecipeCard title={el.title} emoji={el.emoji} ingredients={el.ingredients} steps={el.steps} duration={el.duration} servings={el.servings} delay={el.delay} width={el.width ?? 700} accentColor={el.accentColor ?? accentColor} />;
  }
  if (el.kind === "statCard") {
    return <StatCard value={el.value} label={el.label} icon={el.icon} trend={el.trend} delay={el.delay} width={el.width ?? 300} accentColor={el.accentColor ?? accentColor} />;
  }
  return null;
};

// ── SCENE ──────────────────────────────────────────────────────────────────
const SceneComp: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const accent = scene.accentColor ?? "#ffffff";

  const bgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const layoutStyle: React.CSSProperties =
    scene.layout === "top" ? { justifyContent: "flex-start", paddingTop: 120 } :
    scene.layout === "bottom" ? { justifyContent: "flex-end", paddingBottom: 120 } :
    scene.layout === "fullscreen" ? { justifyContent: "center", padding: 0 } :
    { justifyContent: "center" };

  return (
    <AbsoluteFill style={{
      background: scene.bg.gradient || scene.bg.color,
      transform: `scale(${bgScale})`,
      overflow: "hidden",
    }}>
      {/* Pattern */}
      <BgPattern style={scene.bg} accent={accent} frame={frame} />
      {/* SFX */}
      {scene.sfxCues && <SFXLayer cues={scene.sfxCues} />}

      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: accent,
        opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
      }} />

      {/* Content */}
      <AbsoluteFill style={{
        ...layoutStyle,
        alignItems: "center",
        flexDirection: "column",
        padding: scene.layout === "fullscreen" ? "0" : "80px 60px",
        gap: 16,
        opacity: fadeOut,
        textAlign: "center",
      }}>
        {/* Text elements */}
        {scene.texts?.map((el, i) => (
          <TextEl key={i} el={el} frame={frame} fps={fps} accentColor={accent} />
        ))}

        {/* Accent line after texts */}
        {scene.texts && scene.texts.length > 0 && (
          <div style={{
            width: interpolate(frame, [8, 30], [0, 70], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
            height: 3, background: accent, borderRadius: 2,
            opacity: interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" }),
          }} />
        )}

        {/* Visual elements */}
        {scene.visuals?.map((el, i) => (
          <VisualEl key={i} el={el} frame={frame} fps={fps} accentColor={accent} />
        ))}
      </AbsoluteFill>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 90% 90% at center, transparent 35%, rgba(0,0,0,0.45) 100%)",
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};

// ── TRANSITIONS ────────────────────────────────────────────────────────────
const getTiming = (type: SceneDef["transition"] = "fade") => {
  if (type === "flip") return springTiming({ config: { damping: 14, stiffness: 180 } });
  if (type === "slide-up" || type === "slide-right") return linearTiming({ durationInFrames: 14 });
  if (type === "wipe") return linearTiming({ durationInFrames: 12 });
  return linearTiming({ durationInFrames: 20 });
};

// ── EXPORT ─────────────────────────────────────────────────────────────────
export const SceneRenderer: React.FC<Props> = ({ scenes }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyle }} />
      <TransitionSeries>
      {scenes.map((scene, i) => (
        <React.Fragment key={scene.id}>
          <TransitionSeries.Sequence durationInFrames={Math.round(scene.duration * fps)}>
            <SceneComp scene={scene} />
          </TransitionSeries.Sequence>
          {i < scenes.length - 1 && (
            <TransitionSeries.Transition
              presentation={getSharedSceneTransition(scenes[i + 1]?.transition)}
              timing={getTiming(scenes[i + 1]?.transition)}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
    </>
  );
};
