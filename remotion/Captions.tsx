import { useCurrentFrame, interpolate } from "remotion";
import React from "react";

export type Caption = {
  text: string;
  startFrame: number;
  endFrame: number;
};

export const AutoCaptions: React.FC<{
  captions: Caption[];
  accentColor: string;
}> = ({ captions, accentColor }) => {
  const frame = useCurrentFrame();

  const activeCaption = captions.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  if (!activeCaption) return null;

  const localFrame = frame - activeCaption.startFrame;
  const duration = activeCaption.endFrame - activeCaption.startFrame;

  const opacity = interpolate(localFrame, [0, 6, duration - 6, duration], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  const y = interpolate(localFrame, [0, 8], [20, 0], { extrapolateRight: "clamp" });

  const words = activeCaption.text.split(" ");

  return (
    <div style={{
      position: "absolute",
      bottom: 180,
      left: 60, right: 60,
      textAlign: "center",
      opacity,
      transform: `translateY(${y}px)`,
      zIndex: 10,
    }}>
      <div style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        padding: "16px 24px",
        borderRadius: 16,
        borderLeft: `4px solid ${accentColor}`,
      }}>
        {words.map((word, i) => {
          const wordProgress = interpolate(
            localFrame,
            [i * 3, i * 3 + 6],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          return (
            <span key={i} style={{
              fontSize: 36,
              fontWeight: 700,
              color: wordProgress > 0.5 ? "#ffffff" : "rgba(255,255,255,0.4)",
              fontFamily: "system-ui",
              transition: "color 0.1s",
            }}>
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
