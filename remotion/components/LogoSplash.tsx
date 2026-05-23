import { spring, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import React from "react";

export type LogoSplashProps = {
  src: string;
  size?: number;
  delay?: number;
  animation?: "scaleUp" | "dropIn" | "popBounce";
  glowColor?: string;
  showGlow?: boolean;
};

export const LogoSplash: React.FC<LogoSplashProps> = ({
  src,
  size = 200,
  delay = 0,
  animation = "scaleUp",
  glowColor = "#ffffff",
  showGlow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  let transform = "";
  let opacity = 1;

  if (animation === "scaleUp") {
    const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 200 }, from: 0, to: 1 });
    opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
    transform = `scale(${s})`;
  } else if (animation === "dropIn") {
    const y = spring({ frame: f, fps, config: { damping: 16, stiffness: 300 }, from: -100, to: 0 });
    const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 200 }, from: 0.8, to: 1 });
    opacity = interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" });
    transform = `translateY(${y}px) scale(${s})`;
  } else if (animation === "popBounce") {
    const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 400 }, from: 0, to: 1 });
    opacity = interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
    transform = `scale(${s})`;
  }

  const glowPulse = showGlow ? 0.3 + Math.sin(f * 0.06) * 0.15 : 0;
  const floatY = f > 30 ? Math.sin(f * 0.04) * 6 : 0;

  return (
    <div style={{
      width: size, height: size,
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: `${transform} translateY(${floatY}px)`,
      opacity,
    }}>
      {showGlow && (
        <div style={{
          position: "absolute", inset: -size * 0.2,
          background: glowColor,
          borderRadius: "50%",
          filter: `blur(${size * 0.3}px)`,
          opacity: glowPulse,
          zIndex: 0,
        }} />
      )}
      <img
        src={src}
        style={{
          width: "100%", height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.5))",
          position: "relative", zIndex: 1,
        }}
      />
    </div>
  );
};
