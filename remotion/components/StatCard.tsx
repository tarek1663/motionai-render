import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

export type StatCardProps = {
  value: string | number;
  label: string;
  icon?: string;
  trend?: number; // % de croissance
  delay?: number;
  width?: number;
  accentColor?: string;
  darkMode?: boolean;
};

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  trend,
  delay = 0,
  width = 320,
  accentColor = "#2997ff",
  darkMode = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 300 }, from: 0, to: 1 });
  const opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const floatY = f > 20 ? Math.sin(f * 0.035 + delay * 0.1) * 5 : 0;

  const bg = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const border = darkMode ? `1px solid ${accentColor}33` : `1px solid ${accentColor}44`;
  const textColor = darkMode ? "#f5f5f7" : "#111";

  return (
    <div style={{
      width,
      transform: `scale(${s}) translateY(${floatY}px)`,
      opacity,
      borderRadius: 20,
      background: bg,
      border,
      padding: `${width * 0.06}px ${width * 0.07}px`,
      boxShadow: `0 16px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
      position: "relative",
      overflow: "hidden",
    }}>
      {icon && (
        <div style={{ fontSize: width * 0.14, marginBottom: width * 0.03 }}>{icon}</div>
      )}

      <div style={{
        fontSize: width * 0.22,
        fontWeight: 800,
        color: accentColor,
        fontFamily,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        marginBottom: width * 0.02,
      }}>
        {value}
      </div>

      {trend !== undefined && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: trend >= 0 ? "#30d15822" : "#ff2d5522",
          borderRadius: 20,
          padding: `${width * 0.015}px ${width * 0.035}px`,
          fontSize: width * 0.05,
          fontWeight: 700,
          color: trend >= 0 ? "#30d158" : "#ff2d55",
          fontFamily,
          marginBottom: width * 0.02,
          opacity: interpolate(f, [10, 22], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}

      <div style={{
        fontSize: width * 0.075,
        fontWeight: 700,
        color: textColor,
        fontFamily,
        letterSpacing: "-0.02em",
        opacity: interpolate(f, [8, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        {label}
      </div>

      <div style={{
        position: "absolute",
        bottom: -20, left: "50%",
        transform: "translateX(-50%)",
        width: width * 0.6, height: 40,
        background: accentColor,
        filter: "blur(20px)",
        opacity: 0.12 + Math.sin(f * 0.05) * 0.04,
        pointerEvents: "none",
      }} />
    </div>
  );
};
