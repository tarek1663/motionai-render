import { spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export type IconItem = {
  src?: string;
  emoji?: string;
  label?: string;
  color?: string;
};

export type IconFanProps = {
  icons: IconItem[];
  delay?: number;
  iconSize?: number;
  radius?: number;
  accentColor?: string;
};

export const IconFan: React.FC<IconFanProps> = ({
  icons,
  delay = 0,
  iconSize = 80,
  radius = 280,
  accentColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const totalAngle = 240;
  const startAngle = -120;

  return (
    <div style={{ position: "relative", width: radius * 2 + iconSize, height: radius * 2 + iconSize }}>
      {icons.map((icon, i) => {
        const iconDelay = i * 4;
        const icf = Math.max(0, f - iconDelay);
        const progress = spring({ frame: icf, fps, config: { damping: 12, stiffness: 300 }, from: 0, to: 1 });
        const angle = startAngle + (totalAngle / (icons.length - 1)) * i;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius * progress;
        const y = Math.sin(rad) * radius * progress;
        const opacity = interpolate(icf, [0, 8], [0, 1], { extrapolateRight: "clamp" });
        const scale = spring({ frame: icf, fps, config: { damping: 10, stiffness: 400 }, from: 0, to: 1 });
        const floatY = icf > 20 ? Math.sin(icf * 0.04 + i * 0.8) * 5 : 0;

        return (
          <div key={i} style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px) translateY(${floatY}px) scale(${scale})`,
            opacity,
          }}>
            <div style={{
              width: iconSize, height: iconSize,
              background: icon.color ? `${icon.color}22` : "rgba(255,255,255,0.1)",
              borderRadius: iconSize * 0.22,
              border: `1.5px solid ${icon.color || accentColor}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
              boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
            }}>
              {icon.src ? (
                <img src={icon.src} style={{ width: "70%", height: "70%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: iconSize * 0.5 }}>{icon.emoji}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
