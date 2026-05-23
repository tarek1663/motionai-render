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

function fadeUp(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  return {
    y: interpolate(f, [0, 20], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
    opacity: interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" }),
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
  return null;
};

// ── STARS ──────────────────────────────────────────────────────────────────
const Stars: React.FC<{ count: number; accent: string; frame: number; fps: number }> = ({ count, accent, frame, fps }) => {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => {
        const f = Math.max(0, frame - i * 4);
        const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 400 }, from: 0, to: 1 });
        const op = interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" });
        return (
          <span key={i} style={{
            fontSize: 48, color: accent,
            display: "inline-block",
            transform: `scale(${s})`,
            opacity: op,
          }}>★</span>
        );
      })}
    </div>
  );
};

// ── TYPES ──────────────────────────────────────────────────────────────────
export type TestimonialSlide = {
  quote: string;
  name: string;
  title?: string;
  company?: string;
  avatarSrc?: string;
  stars?: number;
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe" | "slide-right";
  bgEffect?: "grid" | "dots" | "none";
};

export type TestimonialProps = { slides: TestimonialSlide[] };

// ── SLIDE ──────────────────────────────────────────────────────────────────
const TestimonialSlideComp: React.FC<{ slide: TestimonialSlide }> = ({ slide }) => {
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

  // Animations
  const quoteWords = slide.quote.split(" ");
  const avatarA = (() => {
    const f = Math.max(0, frame);
    const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 200 }, from: 0.5, to: 1 });
    return {
      scale: s,
      opacity: interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
    };
  })();

  const nameA = whipIn(frame, fps, quoteWords.length * 4 + 10);
  const titleA = fadeUp(frame, fps, quoteWords.length * 4 + 20);

  const lineWidth = interpolate(frame, [8, 30], [0, 60], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "80px 70px",
        textAlign: "center", opacity: fadeOut, gap: 24,
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Stars */}
        {slide.stars && (
          <Stars count={slide.stars} accent={slide.accent} frame={frame} fps={fps} />
        )}

        {/* Quote mark */}
        <div style={{
          fontSize: 120, fontWeight: 800,
          color: `${slide.accent}44`,
          fontFamily, lineHeight: 0.5,
          opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" }),
          alignSelf: "flex-start",
          marginBottom: -20,
        }}>
          "
        </div>

        {/* Quote — mot par mot */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          {quoteWords.map((word, i) => {
            const a = slamSettle(frame, fps, i * 4);
            return (
              <span key={i} style={{
                fontSize: 80, fontWeight: 700,
                color: defaultColor, fontFamily,
                letterSpacing: "-0.03em", lineHeight: 1.1,
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
          opacity: interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Avatar + Nom */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {slide.avatarSrc && (
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              overflow: "hidden", border: `3px solid ${slide.accent}`,
              transform: `scale(${avatarA.scale})`,
              opacity: avatarA.opacity,
              flexShrink: 0,
            }}>
              <img src={slide.avatarSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: 36, fontWeight: 700,
              color: defaultColor, fontFamily,
              letterSpacing: "-0.02em",
              transform: `translateX(${nameA.x}px)`,
              opacity: nameA.opacity,
              filter: `blur(${nameA.blur}px)`,
            }}>
              {slide.name}
            </div>
            {(slide.title || slide.company) && (
              <div style={{
                fontSize: 28, fontWeight: 300,
                color: `${defaultColor}66`, fontFamily,
                transform: `translateY(${titleA.y}px)`,
                opacity: titleA.opacity,
              }}>
                {slide.title}{slide.title && slide.company ? " · " : ""}{slide.company}
              </div>
            )}
          </div>
        </div>

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


export const Testimonial: React.FC<TestimonialProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <TestimonialSlideComp slide={slide} />
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
