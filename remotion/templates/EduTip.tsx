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
  if (type === "lines") return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[0.2, 0.5, 0.8].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", left: `${pos * 100}%`, top: 0, bottom: 0,
          width: 1, background: accent,
          opacity: interpolate(frame, [i * 6, i * 6 + 18], [0, 0.1], { extrapolateRight: "clamp" }),
        }} />
      ))}
    </div>
  );
  return null;
};

export type EduSlide = {
  type: "hook" | "tip" | "step" | "recap" | "cta";
  number?: number;
  totalSteps?: number;
  headline: string;
  body?: string;
  emoji?: string;
  source?: string;
  ctaText?: string;
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe" | "slide-right";
  bgEffect?: "grid" | "dots" | "lines" | "none";
};

export type EduTipProps = { slides: EduSlide[] };

const EduSlideComp: React.FC<{ slide: EduSlide }> = ({ slide }) => {
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
  const bodyA = whipIn(frame, fps, headlineWords.length * 5 + 12);
  const sourceA = whipIn(frame, fps, headlineWords.length * 5 + 24);
  const ctaA = punch(frame, fps, headlineWords.length * 5 + 20);
  const emojiA = punch(frame, fps, 0);

  const lineWidth = interpolate(frame, [10, 32], [0, 70], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      {/* Step progress */}
      {slide.number && slide.totalSteps && (
        <div style={{
          position: "absolute", top: 60, left: 70, right: 70,
          display: "flex", gap: 8, zIndex: 5,
        }}>
          {Array.from({ length: slide.totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < slide.number! ? slide.accent : `${slide.accent}33`,
              opacity: interpolate(frame, [i * 4, i * 4 + 12], [0, 1], { extrapolateRight: "clamp" }),
              transition: "none",
            }} />
          ))}
        </div>
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "120px 70px 80px",
        opacity: fadeOut, gap: 20, textAlign: "center",
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Emoji */}
        {slide.emoji && (
          <div style={{
            fontSize: 100,
            transform: `scale(${emojiA.scale})`,
            opacity: emojiA.opacity,
            marginBottom: 4,
          }}>
            {slide.emoji}
          </div>
        )}

        {/* Step number */}
        {slide.number && (
          <div style={{
            fontSize: 26, fontWeight: 400,
            color: `${slide.accent}99`, fontFamily,
            letterSpacing: "0.1em", textTransform: "uppercase",
            opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            Étape {slide.number}
          </div>
        )}

        {/* Headline */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
          {headlineWords.map((word, i) => {
            const a = slamSettle(frame, fps, (slide.emoji ? 8 : 0) + i * 5);
            return (
              <span key={i} style={{
                fontSize: slide.type === "hook" ? 110 : 90,
                fontWeight: 800, color: defaultColor, fontFamily,
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

        {/* Body */}
        {slide.body && (
          <div style={{
            fontSize: 40, fontWeight: 400,
            color: `${defaultColor}88`, fontFamily,
            lineHeight: 1.4, maxWidth: 860,
            transform: `translateX(${bodyA.x}px)`,
            opacity: bodyA.opacity,
            filter: `blur(${bodyA.blur}px)`,
          }}>
            {slide.body}
          </div>
        )}

        {/* Source */}
        {slide.source && (
          <div style={{
            fontSize: 26, fontWeight: 300,
            color: `${defaultColor}44`, fontFamily,
            letterSpacing: "0.04em",
            transform: `translateX(${sourceA.x}px)`,
            opacity: sourceA.opacity,
          }}>
            — {slide.source}
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


export const EduTip: React.FC<EduTipProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <EduSlideComp slide={slide} />
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
