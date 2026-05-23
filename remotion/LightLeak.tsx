import { AbsoluteFill, interpolate, useCurrentFrame, random } from "remotion";
import React from "react";

export const LightLeakTransition: React.FC<{
  color?: string;
  intensity?: number;
}> = ({ color = "#ffffff", intensity = 1 }) => {
  const frame = useCurrentFrame();

  const mainOpacity = interpolate(frame, [0, 4, 8, 12], [0, 0.9 * intensity, 0.6 * intensity, 0], {
    extrapolateRight: "clamp",
  });

  const streak1X = interpolate(frame, [0, 12], [-40, 140], { extrapolateRight: "clamp" });
  const streak2X = interpolate(frame, [2, 14], [-60, 160], { extrapolateRight: "clamp" });
  const streak3X = interpolate(frame, [1, 13], [-20, 120], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      {/* Main flash */}
      <AbsoluteFill style={{ background: color, opacity: mainOpacity }} />

      {/* Streak 1 */}
      <AbsoluteFill style={{
        background: `linear-gradient(100deg, transparent ${streak1X - 20}%, ${color}cc ${streak1X}%, ${color}44 ${streak1X + 15}%, transparent ${streak1X + 40}%)`,
        opacity: interpolate(frame, [0, 6, 10], [0, 0.8, 0], { extrapolateRight: "clamp" }),
      }} />

      {/* Streak 2 */}
      <AbsoluteFill style={{
        background: `linear-gradient(95deg, transparent ${streak2X - 15}%, ${color}99 ${streak2X}%, ${color}33 ${streak2X + 20}%, transparent ${streak2X + 50}%)`,
        opacity: interpolate(frame, [2, 8, 12], [0, 0.6, 0], { extrapolateRight: "clamp" }),
      }} />

      {/* Streak 3 - thinner */}
      <AbsoluteFill style={{
        background: `linear-gradient(105deg, transparent ${streak3X - 5}%, ${color}bb ${streak3X}%, ${color}22 ${streak3X + 8}%, transparent ${streak3X + 20}%)`,
        opacity: interpolate(frame, [1, 7, 11], [0, 0.7, 0], { extrapolateRight: "clamp" }),
      }} />

      {/* Lens flare dot */}
      <div style={{
        position: "absolute",
        top: "30%", left: `${streak1X}%`,
        width: 40, height: 40,
        borderRadius: "50%",
        background: color,
        filter: "blur(8px)",
        opacity: interpolate(frame, [0, 5, 9], [0, 0.9, 0], { extrapolateRight: "clamp" }),
        transform: "translate(-50%, -50%)",
      }} />
    </AbsoluteFill>
  );
};

export const ChromaticAberration: React.FC<{ intensity?: number }> = ({ intensity = 3 }) => {
  const frame = useCurrentFrame();
  const active = frame < 8;
  if (!active) return null;

  const offset = interpolate(frame, [0, 4, 8], [intensity, 0, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 99, mixBlendMode: "screen", opacity: 0.5 }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(255,0,0,0.3)",
        transform: `translateX(${-offset}px)`,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,255,0.3)",
        transform: `translateX(${offset}px)`,
      }} />
    </AbsoluteFill>
  );
};
