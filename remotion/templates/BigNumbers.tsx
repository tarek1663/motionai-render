import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { getSharedSceneTransition } from "../scene-transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

function slamSettle(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  return {
    y: spring({ frame: f, fps, config: { damping: 18, stiffness: 400 }, from: -60, to: 0 }),
    scale: spring({ frame: f, fps, config: { damping: 14, stiffness: 350 }, from: 0.92, to: 1 }),
    opacity: interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" }),
  };
}

function whipIn(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  return {
    x: spring({ frame: f, fps, config: { damping: 20, stiffness: 500 }, from: -100, to: 0 }),
    opacity: interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }),
    blur: interpolate(f, [0, 6], [6, 0], { extrapolateRight: "clamp" }),
  };
}

// ── ANIMATED COUNTER ───────────────────────────────────────────────────────
const Counter: React.FC<{
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
  frame: number;
  fps: number;
  fontSize: number;
  color: string;
  delay?: number;
}> = ({ from, to, prefix = "", suffix = "", frame, fps, fontSize, color, delay = 0 }) => {
  const f = Math.max(0, frame - delay);
  const progress = interpolate(f, [0, fps * 1.8], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = Math.round(from + (to - from) * progress);
  const a = slamSettle(frame, fps, delay);

  const formatted = value >= 1000000
    ? (value / 1000000).toFixed(1).replace(".", ",") + "M"
    : value >= 1000
    ? (value / 1000).toFixed(0) + "K"
    : value.toString();

  return (
    <span style={{
      fontSize, fontWeight: 800, color, fontFamily,
      letterSpacing: "-0.04em", lineHeight: 1,
      display: "inline-block",
      transform: `scale(${a.scale}) translateY(${a.y}px)`,
      opacity: a.opacity,
    }}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

// ── TYPES ──────────────────────────────────────────────────────────────────
export type StatSlide = {
  label: string;
  number?: number;
  numberFrom?: number;
  prefix?: string;
  suffix?: string;
  staticValue?: string;
  sublabel?: string;
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe" | "slide-right";
  bgEffect?: "grid" | "dots" | "lines" | "particles" | "none";
};

export type BigNumbersProps = { slides: StatSlide[] };

// ── BG EFFECT ──────────────────────────────────────────────────────────────
const BgEffect: React.FC<{ type: string; accent: string; frame: number }> = ({ type, accent, frame }) => {
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  if (type === "grid") return (
    <div style={{
      position: "absolute", inset: 0, opacity: opacity * 0.1,
      backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
      backgroundSize: "80px 80px", pointerEvents: "none",
    }} />
  );
  if (type === "dots") return (
    <div style={{
      position: "absolute", inset: 0, opacity: opacity * 0.15,
      backgroundImage: `radial-gradient(circle, ${accent} 1.5px, transparent 1.5px)`,
      backgroundSize: "50px 50px", pointerEvents: "none",
    }} />
  );
  if (type === "lines") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[0.2, 0.5, 0.8].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", left: `${pos * 100}%`, top: 0, bottom: 0,
          width: 1, background: accent,
          opacity: interpolate(frame, [i * 6, i * 6 + 18], [0, 0.12], { extrapolateRight: "clamp" }),
        }} />
      ))}
    </div>
  );
  if (type === "particles") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const x = (i * 73.1) % 100;
        const speed = 0.25 + (i * 0.11) % 0.5;
        const size = 2 + (i * 1.3) % 5;
        const y = 110 - ((frame * speed + i * 25) % 130);
        const pOpacity = Math.max(0, Math.min(0.45, (y - 5) / 20, (110 - y) / 20));
        return (
          <div key={i} style={{
            position: "absolute", left: `${x}%`, top: `${y}%`,
            width: size, height: size, borderRadius: "50%",
            background: accent, opacity: pOpacity,
          }} />
        );
      })}
    </div>
  );
  return null;
};

// ── SLIDE ──────────────────────────────────────────────────────────────────
const StatSlideComp: React.FC<{ slide: StatSlide }> = ({ slide }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const isDark = slide.bg === "#000000" || slide.bg === "#0a0a0a" || slide.bg.startsWith("#0") || slide.bg.startsWith("#1");
  const defaultColor = isDark ? "#f5f5f7" : "#0a0a0a";

  const bgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const labelA = whipIn(frame, fps, 0);
  const sublabelA = whipIn(frame, fps, 28);

  const lineWidth = interpolate(frame, [12, 36], [0, 80], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "80px 60px",
        textAlign: "center", opacity: fadeOut, gap: 8,
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Label */}
        <div style={{
          fontSize: 32, fontWeight: 400,
          color: `${defaultColor}77`,
          fontFamily, letterSpacing: "0.06em",
          textTransform: "uppercase",
          transform: `translateX(${labelA.x}px)`,
          opacity: labelA.opacity,
          filter: `blur(${labelA.blur}px)`,
          marginBottom: 8,
        }}>
          {slide.label}
        </div>

        {/* Number */}
        {slide.staticValue ? (
          (() => {
            const a = slamSettle(frame, fps, 8);
            return (
              <span style={{
                fontSize: 160, fontWeight: 800,
                color: slide.accent, fontFamily,
                letterSpacing: "-0.04em", lineHeight: 1,
                display: "inline-block",
                transform: `scale(${a.scale}) translateY(${a.y}px)`,
                opacity: a.opacity,
              }}>
                {slide.staticValue}
              </span>
            );
          })()
        ) : (
          <Counter
            from={slide.numberFrom ?? 0}
            to={slide.number ?? 0}
            prefix={slide.prefix}
            suffix={slide.suffix}
            frame={frame}
            fps={fps}
            fontSize={160}
            color={slide.accent}
            delay={8}
          />
        )}

        {/* Accent line */}
        <div style={{
          width: lineWidth, height: 3,
          background: slide.accent, borderRadius: 2, marginTop: 16,
          opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Sublabel */}
        {slide.sublabel && (
          <div style={{
            fontSize: 36, fontWeight: 300,
            color: `${defaultColor}66`,
            fontFamily, marginTop: 8,
            transform: `translateX(${sublabelA.x}px)`,
            opacity: sublabelA.opacity,
          }}>
            {slide.sublabel}
          </div>
        )}

      </AbsoluteFill>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 90% 90% at center, transparent 35%, rgba(0,0,0,0.4) 100%)",
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};

// ── TRANSITIONS ────────────────────────────────────────────────────────────

// ── EXPORT ─────────────────────────────────────────────────────────────────
export const BigNumbers: React.FC<BigNumbersProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <StatSlideComp slide={slide} />
          </TransitionSeries.Sequence>
          {i < slides.length - 1 && (
            <TransitionSeries.Transition
              presentation={getSharedSceneTransition(slides[i + 1]?.transition)}
              timing={linearTiming({ durationInFrames: 16 })}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};
