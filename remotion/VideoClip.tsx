import { AbsoluteFill, OffthreadVideo, interpolate, useCurrentFrame } from "remotion";
import React from "react";

export const VideoBackground: React.FC<{
  src: string;
  opacity?: number;
  overlayColor?: string;
  overlayOpacity?: number;
}> = ({ src, opacity = 1, overlayColor = "#000", overlayOpacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, opacity], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <OffthreadVideo
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill style={{ background: overlayColor, opacity: overlayOpacity }} />
    </AbsoluteFill>
  );
};

export const GifOverlay: React.FC<{
  src: string;
  x?: number;
  y?: number;
  width?: number;
  frame: number;
  delay?: number;
}> = ({ src, x = 50, y = 50, width = 300, frame, delay = 0 }) => {
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(f, [0, 15], [0.5, 1], {
    extrapolateRight: "clamp",
    easing: (t) => --t * t * t + 1,
  });

  return (
    <div style={{
      position: "absolute",
      left: `${x}%`, top: `${y}%`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity, zIndex: 10,
    }}>
      <img src={src} style={{ width, borderRadius: 16 }} />
    </div>
  );
};
