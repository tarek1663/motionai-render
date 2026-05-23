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

export type Feature = {
  icon: string;
  text: string;
  subtext?: string;
};

export type FeatureSlide = {
  headline: string;
  features: Feature[];
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe" | "slide-right";
  bgEffect?: "grid" | "dots" | "lines" | "none";
};

export type FeatureListProps = { slides: FeatureSlide[] };

const FeatureSlideComp: React.FC<{ slide: FeatureSlide }> = ({ slide }) => {
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

  const lineWidth = interpolate(frame, [10, 32], [0, 70], {
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
        opacity: fadeOut, gap: 16,
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Headline */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginBottom: 8 }}>
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
          marginBottom: 16,
          opacity: interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
          {slide.features.map((feature, i) => {
            const delay = headlineWords.length * 5 + 10 + i * 12;
            const a = whipIn(frame, fps, delay);
            const dotOpacity = interpolate(
              Math.max(0, frame - delay - 6),
              [0, 10], [0, 1],
              { extrapolateRight: "clamp" }
            );

            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 20,
                transform: `translateX(${a.x}px)`,
                opacity: a.opacity,
                filter: `blur(${a.blur}px)`,
              }}>
                {/* Dot accent */}
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: slide.accent, flexShrink: 0,
                  opacity: dotOpacity,
                  boxShadow: `0 0 12px ${slide.accent}88`,
                }} />

                {/* Icon */}
                <div style={{
                  fontSize: 48, width: 60, textAlign: "center", flexShrink: 0,
                }}>
                  {feature.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 40, fontWeight: 700,
                    color: defaultColor, fontFamily,
                    letterSpacing: "-0.02em", lineHeight: 1.2,
                  }}>
                    {feature.text}
                  </div>
                  {feature.subtext && (
                    <div style={{
                      fontSize: 28, fontWeight: 300,
                      color: `${defaultColor}66`, fontFamily,
                      marginTop: 4,
                    }}>
                      {feature.subtext}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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


export const FeatureList: React.FC<FeatureListProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <FeatureSlideComp slide={slide} />
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
