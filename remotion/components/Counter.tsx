import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

export type CounterProps = {
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  duration?: number; // frames
  delay?: number;    // frames
  format?: "number" | "compact" | "currency";
};

function formatValue(value: number, format: string, prefix: string, suffix: string): string {
  let formatted = "";
  if (format === "compact") {
    if (value >= 1_000_000_000) formatted = (value / 1_000_000_000).toFixed(1).replace(".", ",") + " Mds";
    else if (value >= 1_000_000) formatted = (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
    else if (value >= 1_000) formatted = (value / 1_000).toFixed(0) + " K";
    else formatted = Math.round(value).toString();
  } else {
    formatted = Math.round(value).toLocaleString("fr-FR");
  }
  return `${prefix}${formatted}${suffix}`;
}

export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  prefix = "",
  suffix = "",
  fontSize = 160,
  color = "#ffffff",
  duration = 90,
  delay = 0,
  format = "compact",
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const progress = interpolate(f, [0, duration], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const value = from + (to - from) * progress;
  const opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(f, [0, 12], [0.85, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  return (
    <div style={{
      fontSize,
      fontWeight: 800,
      color,
      fontFamily,
      letterSpacing: "-0.04em",
      lineHeight: 1,
      display: "inline-block",
      transform: `scale(${scale})`,
      opacity,
    }}>
      {formatValue(value, format, prefix, suffix)}
    </div>
  );
};
