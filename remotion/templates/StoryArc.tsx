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

function punch(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  return {
    scale: spring({ frame: f, fps, config: { damping: 10, stiffness: 600 }, from: 0, to: 1 }),
    opacity: interpolate(f, [0, 3], [0, 1], { extrapolateRight: "clamp" }),
  };
}

export type ActType = "problem" | "agitation" | "solution" | "cta";

export type StorySlide = {
  act: ActType;
  actLabel: string;
  lines: {
    text: string;
    weight?: 300 | 400 | 600 | 700 | 800;
    size?: number;
    highlight?: boolean;
    preset?: "slamSettle" | "whipIn" | "punch";
    delay?: number;
    letterStagger?: boolean;
  }[][];
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe" | "slide-right";
  bgEffect?: "grid" | "dots" | "lines" | "particles" | "none";
};

export type StoryArcProps = { slides: StorySlide[] };

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

const StorySlideComp: React.FC<{ slide: StorySlide }> = ({ slide }) => {
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

  const actOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const actY = interpolate(frame, [0, 14], [12, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const lineWidth = interpolate(frame, [12, 36], [0, 80], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  let wordIndex = 0;

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {/* Progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `${slide.accent}22` }}>
        <div style={{
          height: "100%",
          width: `${interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: "clamp" })}%`,
          background: slide.accent, borderRadius: 2,
        }} />
      </div>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "80px 60px",
        textAlign: "center", opacity: fadeOut, gap: 12,
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Act label */}
        <div style={{
          fontSize: 26, fontWeight: 400, color: `${slide.accent}88`,
          fontFamily, letterSpacing: "0.06em", textTransform: "uppercase",
          marginBottom: 24, opacity: actOpacity,
          transform: `translateY(${actY}px)`,
        }}>
          {slide.actLabel}
        </div>

        {/* Lines */}
        {slide.lines.map((line, li) => (
          <div key={li} style={{
            display: "flex", flexWrap: "wrap",
            justifyContent: "center", alignItems: "center",
            gap: 14,
          }}>
            {line.map((word, wi) => {
              const idx = wordIndex++;
              const delay = word.delay ?? idx * 5;
              const preset = word.preset ?? "slamSettle";
              const color = word.highlight ? slide.accent : defaultColor;
              const fontSize = word.size ?? 100;
              const fontWeight = word.weight ?? (word.highlight ? 800 : 700);

              let transform = "";
              let opacity = 1;
              let filter = "";

              if (preset === "slamSettle") {
                const a = slamSettle(frame, fps, delay);
                transform = `scale(${a.scale}) translateY(${a.y}px)`;
                opacity = a.opacity;
              } else if (preset === "whipIn") {
                const a = whipIn(frame, fps, delay);
                transform = `translateX(${a.x}px)`;
                opacity = a.opacity;
                filter = `blur(${a.blur}px)`;
              } else if (preset === "punch") {
                const a = punch(frame, fps, delay);
                transform = `scale(${a.scale})`;
                opacity = a.opacity;
              }

              if (word.letterStagger) {
                return (
                  <span key={wi} style={{ display: "inline-flex" }}>
                    {word.text.split("").map((char, ci) => {
                      const cf = Math.max(0, frame - delay - ci * 2);
                      const cs = spring({ frame: cf, fps, config: { damping: 14, stiffness: 500 }, from: 0, to: 1 });
                      const co = interpolate(cf, [0, 5], [0, 1], { extrapolateRight: "clamp" });
                      const cy = interpolate(cf, [0, 8], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
                      return (
                        <span key={ci} style={{
                          fontSize: Math.min(fontSize, 110), fontWeight, color, fontFamily,
                          letterSpacing: "-0.035em", lineHeight: 1,
                          display: "inline-block",
                          transform: `scale(${cs}) translateY(${cy}px)`,
                          opacity: co,
                          whiteSpace: char === " " ? "pre" : "normal",
                        }}>
                          {char === " " ? "\u00A0" : char}
                        </span>
                      );
                    })}
                  </span>
                );
              }

              return (
                <span key={wi} style={{
                  fontSize: Math.min(fontSize, 110), fontWeight, color, fontFamily,
                  letterSpacing: "-0.035em", lineHeight: 1,
                  display: "inline-block", transform, opacity, filter,
                }}>
                  {word.text}
                </span>
              );
            })}
          </div>
        ))}

        {/* Accent line */}
        <div style={{
          width: lineWidth, height: 3,
          background: slide.accent, borderRadius: 2, marginTop: 20,
          opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateRight: "clamp" }),
        }} />

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


export const StoryArc: React.FC<StoryArcProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <StorySlideComp slide={slide} />
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
