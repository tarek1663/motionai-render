import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Img,
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

export type ProductSlide = {
  type: "hero" | "feature" | "price" | "cta";
  headline: string;
  subline?: string;
  imageSrc?: string;
  price?: string;
  oldPrice?: string;
  ctaText?: string;
  bg: string;
  accent: string;
  duration: number;
  transition?: "fade" | "slide-up" | "wipe" | "slide-right";
  bgEffect?: "grid" | "dots" | "particles" | "none";
};

export type ProductSpotlightProps = { slides: ProductSlide[] };

const ProductSlideComp: React.FC<{ slide: ProductSlide }> = ({ slide }) => {
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

  const lineWidth = interpolate(frame, [12, 36], [0, 80], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  // Image animation
  const imgA = (() => {
    const f = Math.max(0, frame - 0);
    const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 140 }, from: 0.7, to: 1 });
    const floatY = f > 20 ? Math.sin(f * 0.04) * 8 : 0;
    return {
      scale: s,
      opacity: interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
      floatY,
    };
  })();

  const headlineWords = slide.headline.split(" ");
  const subA = whipIn(frame, fps, headlineWords.length * 5 + 10);
  const priceA = punch(frame, fps, 14);
  const ctaA = punch(frame, fps, 22);

  return (
    <AbsoluteFill style={{ background: slide.bg, transform: `scale(${bgScale})`, overflow: "hidden" }}>

      {slide.bgEffect && slide.bgEffect !== "none" && (
        <BgEffect type={slide.bgEffect} accent={slide.accent} frame={frame} />
      )}

      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", padding: "80px 60px",
        textAlign: "center", opacity: fadeOut, gap: 20,
        overflow: "hidden", maxWidth: "100%",
      }}>

        {/* Image produit */}
        {slide.imageSrc && (
          <div style={{
            width: 600, height: 600,
            transform: `scale(${imgA.scale}) translateY(${imgA.floatY}px)`,
            opacity: imgA.opacity,
            marginBottom: 8,
            filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.5))",
          }}>
            <img
              src={slide.imageSrc}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        )}

        {/* Headline */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
          {headlineWords.map((word, i) => {
            const a = slamSettle(frame, fps, i * 5);
            return (
              <span key={i} style={{
                fontSize: 110, fontWeight: 800, color: defaultColor, fontFamily,
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
          opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateRight: "clamp" }),
        }} />

        {/* Subline */}
        {slide.subline && (
          <div style={{
            fontSize: 36, fontWeight: 300, color: `${defaultColor}77`, fontFamily,
            transform: `translateX(${subA.x}px)`,
            opacity: subA.opacity,
            filter: `blur(${subA.blur}px)`,
          }}>
            {slide.subline}
          </div>
        )}

        {/* Prix */}
        {slide.price && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            {slide.oldPrice && (
              <span style={{
                fontSize: 60, fontWeight: 300,
                color: `${defaultColor}44`, fontFamily,
                letterSpacing: "-0.03em",
                textDecoration: "line-through",
                opacity: priceA.opacity,
              }}>
                {slide.oldPrice}
              </span>
            )}
            <span style={{
              fontSize: 120, fontWeight: 800,
              color: slide.accent, fontFamily,
              letterSpacing: "-0.04em",
              transform: `scale(${priceA.scale})`,
              opacity: priceA.opacity,
            }}>
              {slide.price}
            </span>
          </div>
        )}

        {/* CTA */}
        {slide.ctaText && (
          <div style={{
            background: slide.accent,
            borderRadius: 60, padding: "24px 64px",
            fontSize: 44, fontWeight: 800,
            color: isDark ? "#0a0a0a" : "#ffffff",
            fontFamily, letterSpacing: "-0.02em",
            transform: `scale(${ctaA.scale})`,
            opacity: ctaA.opacity,
            boxShadow: `0 12px 50px ${slide.accent}55`,
            position: "relative",
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


export const ProductSpotlight: React.FC<ProductSpotlightProps> = ({ slides }) => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {slides.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={Math.round(slide.duration * fps)}>
            <ProductSlideComp slide={slide} />
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
