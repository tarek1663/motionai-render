import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { getSharedSceneTransition } from "../scene-transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

// ── PRESETS ────────────────────────────────────────────────────────────────
function snapIn(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 500 }, from: 0, to: 1 });
  return { scale: s, opacity: interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }), y: 0 };
}

function punch(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 600 }, from: 0, to: 1 });
  return { scale: s, opacity: interpolate(f, [0, 3], [0, 1], { extrapolateRight: "clamp" }), y: 0 };
}

function slamSettle(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  const y = spring({ frame: f, fps, config: { damping: 18, stiffness: 400 }, from: -60, to: 0 });
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 350 }, from: 0.92, to: 1 });
  return { scale: s, opacity: interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" }), y };
}

function whipIn(frame: number, fps: number, delay = 0) {
  const f = Math.max(0, frame - delay);
  const x = spring({ frame: f, fps, config: { damping: 20, stiffness: 500 }, from: -80, to: 0 });
  return { x, opacity: interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }), blur: interpolate(f, [0, 6], [6, 0], { extrapolateRight: "clamp" }) };
}

// ── TYPES ──────────────────────────────────────────────────────────────────
export type ImpactWord = {
  text: string;
  weight?: 300 | 400 | 600 | 700 | 800;
  color?: string;
  size?: number;
  highlight?: boolean;
  preset?: "snapIn" | "punch" | "slamSettle" | "whipIn";
  delay?: number;
  letterStagger?: boolean;
};

export type FloatingImage = {
  src: string;
  x: number;      // % left
  y: number;      // % top  
  width: number;  // px
  delay: number;  // frames
  rotation?: number;
  animation?: "float" | "slam" | "whip" | "pop";
};

export type ImpactSlide = {
  lines: ImpactWord[][];
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "slide-right" | "wipe";
  bgEffect?: "grid" | "dots" | "lines" | "particles" | "none";
  eyebrow?: string;
  footnote?: string;
  images?: FloatingImage[];
};

export type ImpactStatementProps = {
  slides: ImpactSlide[];
  accentGlobal?: string;
};

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

// ── WORD ───────────────────────────────────────────────────────────────────
const Word: React.FC<{
  word: ImpactWord; frame: number; fps: number;
  defaultColor: string; accent: string;
  letterIndex: number;
}> = ({ word, frame, fps, defaultColor, accent, letterIndex }) => {
  const preset = word.preset ?? "slamSettle";
  const delay = word.delay ?? letterIndex * 5;
  const color = word.highlight ? accent : (word.color ?? defaultColor);
  const defaultSize = 100;
  const fontSize = word.size ? Math.min(word.size, 120) : Math.min(defaultSize, 120);
  const fontWeight = word.weight ?? (word.highlight ? 800 : 700);

  let transform = "";
  let opacity = 1;
  let filter = "";

  if (preset === "snapIn") {
    const a = snapIn(frame, fps, delay);
    transform = `scale(${a.scale})`;
    opacity = a.opacity;
  } else if (preset === "punch") {
    const a = punch(frame, fps, delay);
    transform = `scale(${a.scale})`;
    opacity = a.opacity;
  } else if (preset === "slamSettle") {
    const a = slamSettle(frame, fps, delay);
    transform = `scale(${a.scale}) translateY(${a.y}px)`;
    opacity = a.opacity;
  } else if (preset === "whipIn") {
    const a = whipIn(frame, fps, delay);
    transform = `translateX(${a.x}px)`;
    opacity = a.opacity;
    filter = `blur(${a.blur}px)`;
  }

  if (word.letterStagger) {
    return (
      <span style={{ display: "inline-flex" }}>
        {word.text.split("").map((char, ci) => {
          const cf = Math.max(0, frame - delay - ci * 2);
          const cs = spring({ frame: cf, fps, config: { damping: 14, stiffness: 500 }, from: 0, to: 1 });
          const co = interpolate(cf, [0, 5], [0, 1], { extrapolateRight: "clamp" });
          const cy = interpolate(cf, [0, 8], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return (
            <span key={ci} style={{
              fontSize, fontWeight, color, fontFamily,
              letterSpacing: "-0.035em", lineHeight: 1, display: "inline-block",
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
    <span style={{
      fontSize, fontWeight, color, fontFamily,
      letterSpacing: "-0.035em", lineHeight: 1, display: "inline-block",
      transform, opacity, filter,
    }}>
      {word.text}
    </span>
  );
};

// ── FLOATING IMAGE ─────────────────────────────────────────────────────────
const FloatingImageComp: React.FC<{ image: FloatingImage; frame: number; fps: number }> = ({ image, frame, fps }) => {
  const f = Math.max(0, frame - image.delay);

  const getAnim = () => {
    if (image.animation === "slam") {
      const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 300 }, from: 0.5, to: 1 });
      const y = spring({ frame: f, fps, config: { damping: 18, stiffness: 400 }, from: -80, to: 0 });
      const op = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
      const floatY = f > 20 ? Math.sin(f * 0.04) * 8 : 0;
      return { transform: `translate(-50%, -50%) scale(${s}) translateY(${y + floatY}px) rotate(${image.rotation ?? 0}deg)`, opacity: op };
    }
    if (image.animation === "whip") {
      const x = spring({ frame: f, fps, config: { damping: 20, stiffness: 500 }, from: -150, to: 0 });
      const op = interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" });
      const blur = interpolate(f, [0, 8], [8, 0], { extrapolateRight: "clamp" });
      const floatY = f > 15 ? Math.sin(f * 0.04) * 6 : 0;
      return { transform: `translate(-50%, -50%) translateX(${x}px) translateY(${floatY}px) rotate(${image.rotation ?? 0}deg)`, opacity: op, filter: `blur(${blur}px) drop-shadow(0 20px 60px rgba(0,0,0,0.6))` };
    }
    if (image.animation === "pop") {
      const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 500 }, from: 0, to: 1 });
      const op = interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
      const floatY = f > 10 ? Math.sin(f * 0.05) * 10 : 0;
      return { transform: `translate(-50%, -50%) scale(${s}) translateY(${floatY}px) rotate(${image.rotation ?? 0}deg)`, opacity: op };
    }
    // float default
    const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 140 }, from: 0.7, to: 1 });
    const floatY = f > 15 ? Math.sin(f * 0.04) * 8 : 0;
    const floatX = f > 15 ? Math.sin(f * 0.03 + 1) * 4 : 0;
    const op = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" });
    return { transform: `translate(-50%, -50%) scale(${s}) translateY(${floatY}px) translateX(${floatX}px) rotate(${image.rotation ?? 0}deg)`, opacity: op };
  };

  const anim = getAnim();

  return (
    <div style={{
      position: "absolute",
      left: `${image.x}%`,
      top: `${image.y}%`,
      width: image.width,
      zIndex: 4,
      filter: anim.filter ?? "drop-shadow(0 20px 60px rgba(0,0,0,0.5))",
      ...anim,
    }}>
      <img src={image.src} style={{ width: "100%", display: "block" }} />
    </div>
  );
};

// ── SLIDE ──────────────────────────────────────────────────────────────────
const ImpactSlideComp: React.FC<{ slide: ImpactSlide }> = ({ slide }) => {
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

  const eyebrowOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const eyebrowY = interpolate(frame, [0, 16], [12, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const footnoteOpacity = interpolate(frame, [30, 44], [0, 1], { extrapolateRight: "clamp" });

  let wordIndex = 0;

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      {/* PNG Images */}
      {slide.images?.map((img, i) => (
        <FloatingImageComp key={i} image={img} frame={frame} fps={fps} />
      ))}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "80px 60px",
        textAlign: "center", opacity: fadeOut, gap: 12,
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Eyebrow */}
        {slide.eyebrow && (
          <div style={{
            fontSize: 28, fontWeight: 600, color: slide.accent,
            fontFamily, letterSpacing: "0.12em", textTransform: "uppercase",
            marginBottom: 16,
            opacity: eyebrowOpacity,
            transform: `translateY(${eyebrowY}px)`,
          }}>
            {slide.eyebrow}
          </div>
        )}

        {/* Lines */}
        {slide.lines.map((line, li) => (
          <div key={li} style={{
            display: "flex", flexWrap: "wrap",
            justifyContent: "center", alignItems: "center",
            gap: 16,
          }}>
            {line.map((word, wi) => {
              const idx = wordIndex++;
              return (
                <Word
                  key={wi}
                  word={word}
                  frame={frame}
                  fps={fps}
                  defaultColor={defaultColor}
                  accent={slide.accent}
                  letterIndex={idx}
                />
              );
            })}
          </div>
        ))}

        {/* Accent line */}
        <div style={{
          width: interpolate(frame, [12, 36], [0, 80], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
          height: 3, background: slide.accent, borderRadius: 2, marginTop: 24,
          opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Footnote */}
        {slide.footnote && (
          <div style={{
            fontSize: 28, fontWeight: 400, color: `${defaultColor}66`,
            fontFamily, marginTop: 8, opacity: footnoteOpacity,
          }}>
            {slide.footnote}
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

const getTiming = (type: ImpactSlide["transition"] = "fade") => {
  if (type === "slide-up" || type === "slide-right") return linearTiming({ durationInFrames: 16 });
  if (type === "wipe") return linearTiming({ durationInFrames: 14 });
  return linearTiming({ durationInFrames: 22 });
};

// ── EXPORT ─────────────────────────────────────────────────────────────────
export const ImpactStatement: React.FC<ImpactStatementProps> = ({ slides }) => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <ImpactSlideComp slide={slide} />
          </TransitionSeries.Sequence>
          {i < slides.length - 1 && (
            <TransitionSeries.Transition
              presentation={getSharedSceneTransition(slides[i + 1]?.transition)}
              timing={getTiming(slides[i + 1]?.transition)}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};
