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
    x: spring({ frame: f, fps, config: { damping: 20, stiffness: 500 }, from: -120, to: 0 }),
    opacity: interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }),
    blur: interpolate(f, [0, 6], [6, 0], { extrapolateRight: "clamp" }),
  };
}

function punch(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  return {
    scale: spring({ frame: f, fps, config: { damping: 10, stiffness: 600 }, from: 0, to: 1 }),
    opacity: interpolate(f, [0, 3], [0, 1], { extrapolateRight: "clamp" }),
  };
}

const BgEffect: React.FC<{ type: string; accent: string; frame: number }> = ({ type, accent, frame }) => {
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  if (type === "grid") return (
    <div style={{
      position: "absolute", inset: 0, opacity: opacity * 0.08,
      backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
      backgroundSize: "80px 80px", pointerEvents: "none",
    }} />
  );
  if (type === "dots") return (
    <div style={{
      position: "absolute", inset: 0, opacity: opacity * 0.12,
      backgroundImage: `radial-gradient(circle, ${accent} 1.5px, transparent 1.5px)`,
      backgroundSize: "50px 50px", pointerEvents: "none",
    }} />
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

// ── TIMER UNIT ─────────────────────────────────────────────────────────────
const TimerUnit: React.FC<{
  value: number;
  label: string;
  accent: string;
  defaultColor: string;
  frame: number;
  fps: number;
  delay: number;
}> = ({ value, label, accent, defaultColor, frame, fps, delay }) => {
  const a = punch(frame, fps, delay);
  const pulse = 1 + Math.sin(frame * 0.08) * 0.02;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      transform: `scale(${a.scale * pulse})`,
      opacity: a.opacity,
    }}>
      <div style={{
        background: `${accent}22`,
        border: `2px solid ${accent}44`,
        borderRadius: 20, padding: "20px 28px",
        minWidth: 160,
      }}>
        <div style={{
          fontSize: 100, fontWeight: 900,
          color: accent, fontFamily,
          letterSpacing: "-0.05em", lineHeight: 1,
          textAlign: "center",
        }}>
          {String(value).padStart(2, "0")}
        </div>
      </div>
      <div style={{
        fontSize: 24, fontWeight: 400,
        color: `${defaultColor}66`, fontFamily,
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        {label}
      </div>
    </div>
  );
};

// ── TYPES ──────────────────────────────────────────────────────────────────
export type CDSlide = {
  type: "urgency" | "timer" | "offer" | "cta";
  headline: string;
  subline?: string;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  offerText?: string;
  ctaText?: string;
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe";
  bgEffect?: "grid" | "dots" | "particles" | "none";
};

export type CountdownCTAProps = { slides: CDSlide[] };

const CDSlideComp: React.FC<{ slide: CDSlide }> = ({ slide }) => {
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

  const headlineWords = slide.headline.split(" ");
  const subA = whipIn(frame, fps, headlineWords.length * 5 + 10);
  const ctaA = punch(frame, fps, headlineWords.length * 5 + 20);
  const lineWidth = interpolate(frame, [10, 32], [0, 70], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  // Timer qui décompte en live
  const elapsed = frame / fps;
  const totalSeconds = (slide.days ?? 0) * 86400 + (slide.hours ?? 0) * 3600 + (slide.minutes ?? 0) * 60 + (slide.seconds ?? 0);
  const remaining = Math.max(0, totalSeconds - elapsed);
  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = Math.floor(remaining % 60);

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "80px 60px",
        opacity: fadeOut, gap: 20, textAlign: "center",
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Headline */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
          {headlineWords.map((word, i) => {
            const a = slamSettle(frame, fps, i * 5);
            return (
              <span key={i} style={{
                fontSize: 100, fontWeight: 800, color: defaultColor, fontFamily,
                letterSpacing: "-0.035em", lineHeight: 1,
                display: "inline-block",
                transform: `scale(${a.scale}) translateY(${a.y}px)`,
                opacity: a.opacity,
              }}>
                {word}
              </span>
            );
          })}
        </div>

        {/* Accent line */}
        <div style={{
          width: lineWidth, height: 3,
          background: slide.accent, borderRadius: 2,
          opacity: interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Timer */}
        {slide.type === "timer" && (
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 8 }}>
            {slide.days !== undefined && (
              <>
                <TimerUnit value={d} label="Jours" accent={slide.accent} defaultColor={defaultColor} frame={frame} fps={fps} delay={10} />
                <div style={{ fontSize: 80, fontWeight: 800, color: `${slide.accent}66`, marginBottom: 32 }}>:</div>
              </>
            )}
            <TimerUnit value={h} label="Heures" accent={slide.accent} defaultColor={defaultColor} frame={frame} fps={fps} delay={14} />
            <div style={{ fontSize: 80, fontWeight: 800, color: `${slide.accent}66`, marginBottom: 32 }}>:</div>
            <TimerUnit value={m} label="Min" accent={slide.accent} defaultColor={defaultColor} frame={frame} fps={fps} delay={18} />
            <div style={{ fontSize: 80, fontWeight: 800, color: `${slide.accent}66`, marginBottom: 32 }}>:</div>
            <TimerUnit value={s} label="Sec" accent={slide.accent} defaultColor={defaultColor} frame={frame} fps={fps} delay={22} />
          </div>
        )}

        {/* Offer */}
        {slide.offerText && (
          <div style={{
            background: `${slide.accent}22`,
            border: `2px solid ${slide.accent}`,
            borderRadius: 20, padding: "20px 40px",
            fontSize: 44, fontWeight: 700,
            color: slide.accent, fontFamily,
            letterSpacing: "-0.02em",
            transform: `translateX(${subA.x}px)`,
            opacity: subA.opacity,
          }}>
            {slide.offerText}
          </div>
        )}

        {/* Subline */}
        {slide.subline && !slide.offerText && (
          <div style={{
            fontSize: 38, fontWeight: 300,
            color: `${defaultColor}66`, fontFamily,
            transform: `translateX(${subA.x}px)`,
            opacity: subA.opacity,
            filter: `blur(${subA.blur}px)`,
          }}>
            {slide.subline}
          </div>
        )}

        {/* CTA */}
        {slide.ctaText && (
          <div style={{
            background: slide.accent, borderRadius: 60,
            padding: "24px 64px",
            fontSize: 44, fontWeight: 800,
            color: "#0a0a0a", fontFamily,
            letterSpacing: "-0.02em",
            transform: `scale(${ctaA.scale})`,
            opacity: ctaA.opacity,
            boxShadow: `0 12px 50px ${slide.accent}55`,
            marginTop: 8, position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: -10,
              background: slide.accent, borderRadius: 70,
              filter: "blur(20px)",
              opacity: 0.3 + Math.sin(frame * 0.1) * 0.15,
            }} />
            <span style={{ position: "relative" }}>{slide.ctaText}</span>
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


export const CountdownCTA: React.FC<CountdownCTAProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <CDSlideComp slide={slide} />
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
