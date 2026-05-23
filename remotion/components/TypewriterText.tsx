import { interpolate, useCurrentFrame, spring, useVideoConfig, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

export type TypewriterProps = {
  text: string;
  fontSize?: number;
  fontWeight?: 300 | 400 | 700 | 800;
  color?: string;
  delay?: number;
  speed?: number; // frames par caractère
  showCursor?: boolean;
  cursorColor?: string;
};

export const TypewriterText: React.FC<TypewriterProps> = ({
  text,
  fontSize = 60,
  fontWeight = 700,
  color = "#ffffff",
  delay = 0,
  speed = 3,
  showCursor = true,
  cursorColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const visibleCount = Math.floor(f / speed);
  const displayText = text.slice(0, visibleCount);
  const isDone = visibleCount >= text.length;
  const cursorVisible = !isDone || Math.floor(f / 15) % 2 === 0;
  const opacity = interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{
      fontSize, fontWeight, color, fontFamily,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
      opacity,
      display: "inline",
    }}>
      {displayText}
      {showCursor && (
        <span style={{
          display: "inline-block",
          width: fontSize * 0.06,
          height: fontSize * 0.85,
          background: cursorColor,
          marginLeft: 4,
          verticalAlign: "middle",
          opacity: cursorVisible ? 1 : 0,
        }} />
      )}
    </div>
  );
};
