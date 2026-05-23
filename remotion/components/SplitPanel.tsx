import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill, Easing } from "remotion";
import React from "react";

export type PanelContent = {
  bg: string;
  children: React.ReactNode;
  label?: string;
  metric?: string;
  accentColor?: string;
};

export type SplitPanelProps = {
  left: PanelContent;
  right: PanelContent;
  delay?: number;
  direction?: "horizontal" | "vertical";
};

export const SplitPanel: React.FC<SplitPanelProps> = ({
  left,
  right,
  delay = 0,
  direction = "horizontal",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const splitProgress = spring({
    frame: f, fps,
    config: { damping: 18, stiffness: 200 },
    from: 0, to: 1,
  });

  const leftWidth = direction === "horizontal" ? `${50 * splitProgress}%` : "100%";
  const rightWidth = direction === "horizontal" ? `${50 * splitProgress}%` : "100%";
  const leftHeight = direction === "vertical" ? `${50 * splitProgress}%` : "100%";
  const rightHeight = direction === "vertical" ? `${50 * splitProgress}%` : "100%";

  const metricOpacity = interpolate(f, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const metricY = interpolate(f, [20, 35], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{
      flexDirection: direction === "horizontal" ? "row" : "column",
      overflow: "hidden",
    }}>
      {/* Left panel */}
      <div style={{
        width: leftWidth,
        height: leftHeight,
        background: left.bg,
        overflow: "hidden",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        {left.children}
        {left.metric && (
          <div style={{
            position: "absolute", bottom: 40, left: 16, right: 16,
            textAlign: "center",
            transform: `translateY(${metricY}px)`,
            opacity: metricOpacity,
          }}>
            <div style={{
              fontSize: 32, fontWeight: 800, color: left.accentColor || "#ffffff",
              fontFamily: "system-ui", letterSpacing: "-0.03em",
            }}>
              {left.metric}
            </div>
            {left.label && (
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", fontFamily: "system-ui", marginTop: 4 }}>
                {left.label}
              </div>
            )}
          </div>
        )}
        {/* Divider */}
        {direction === "horizontal" && (
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0,
            width: 2, background: "rgba(255,255,255,0.15)",
          }} />
        )}
      </div>

      {/* Right panel */}
      <div style={{
        width: rightWidth,
        height: rightHeight,
        background: right.bg,
        overflow: "hidden",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        {right.children}
        {right.metric && (
          <div style={{
            position: "absolute", bottom: 40, left: 16, right: 16,
            textAlign: "center",
            transform: `translateY(${metricY}px)`,
            opacity: metricOpacity,
          }}>
            <div style={{
              fontSize: 32, fontWeight: 800, color: right.accentColor || "#ffffff",
              fontFamily: "system-ui", letterSpacing: "-0.03em",
            }}>
              {right.metric}
            </div>
            {right.label && (
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", fontFamily: "system-ui", marginTop: 4 }}>
                {right.label}
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
