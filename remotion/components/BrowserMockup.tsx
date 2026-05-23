import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

export type BrowserTab = {
  title: string;
  favicon?: string;
};

export type BrowserMockupProps = {
  url: string;
  tabs?: BrowserTab[];
  content?: React.ReactNode;
  screenshot?: string;
  scrollAmount?: number;   // 0 à 1 — combien on scroll
  delay?: number;
  width?: number;
  accentColor?: string;
  darkMode?: boolean;
};

export const BrowserMockup: React.FC<BrowserMockupProps> = ({
  url,
  tabs = [{ title: "MotionAI" }],
  content,
  screenshot,
  scrollAmount = 0.4,
  delay = 0,
  width = 900,
  accentColor = "#2997ff",
  darkMode = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const height = width * 0.65;
  const headerH = width * 0.055;
  const tabH = width * 0.038;

  // Entrée
  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 160 }, from: 0.85, to: 1 });
  const opacity = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(f, [0, 16], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const floatY = f > 30 ? Math.sin(f * 0.025) * 6 : 0;

  // Scroll animé
  const scrollY = interpolate(f, [20, 90], [0, scrollAmount * height * 0.8], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const bg = darkMode ? "#1e1e1e" : "#ffffff";
  const headerBg = darkMode ? "#2d2d2d" : "#f0f0f0";
  const tabBg = darkMode ? "#3a3a3a" : "#e0e0e0";
  const textColor = darkMode ? "#ffffff" : "#333333";
  const urlBarBg = darkMode ? "#3a3a3a" : "#ffffff";

  return (
    <div style={{
      width,
      transform: `scale(${s}) translateY(${y + floatY}px)`,
      opacity,
      borderRadius: width * 0.014,
      overflow: "hidden",
      boxShadow: "0 40px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
    }}>
      {/* Header avec onglets */}
      <div style={{
        background: headerBg,
        height: headerH,
        display: "flex",
        alignItems: "flex-end",
        paddingLeft: width * 0.01,
        gap: 2,
      }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 6, padding: "0 12px", alignItems: "center", height: "100%" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {/* Tabs */}
        {tabs.map((tab, i) => (
          <div key={i} style={{
            background: i === 0 ? bg : tabBg,
            height: tabH,
            padding: `0 ${width * 0.015}px`,
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: `${width * 0.006}px ${width * 0.006}px 0 0`,
            fontSize: width * 0.013,
            color: textColor,
            fontFamily,
            whiteSpace: "nowrap",
            opacity: i === 0 ? 1 : 0.6,
          }}>
            {tab.favicon && <span style={{ fontSize: width * 0.015 }}>{tab.favicon}</span>}
            {tab.title}
            <span style={{ color: "#888", fontSize: width * 0.012, marginLeft: 4 }}>×</span>
          </div>
        ))}
      </div>

      {/* URL bar */}
      <div style={{
        background: headerBg,
        padding: `${width * 0.008}px ${width * 0.012}px`,
        display: "flex",
        alignItems: "center",
        gap: width * 0.008,
        borderBottom: `1px solid ${darkMode ? "#444" : "#ddd"}`,
      }}>
        {/* Nav buttons */}
        {["←", "→", "↻"].map((icon, i) => (
          <div key={i} style={{
            width: width * 0.028,
            height: width * 0.028,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: width * 0.016,
            color: "#888",
            cursor: "pointer",
          }}>{icon}</div>
        ))}

        {/* URL bar */}
        <div style={{
          flex: 1,
          background: urlBarBg,
          borderRadius: width * 0.02,
          padding: `${width * 0.005}px ${width * 0.012}px`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: `1px solid ${darkMode ? "#555" : "#ddd"}`,
        }}>
          <span style={{ fontSize: width * 0.012, color: "#30d158" }}>🔒</span>
          <span style={{ fontSize: width * 0.013, color: textColor, fontFamily, opacity: 0.8 }}>{url}</span>
        </div>

        {/* Extensions */}
        <div style={{ color: "#888", fontSize: width * 0.018 }}>⋮</div>
      </div>

      {/* Contenu scrollable */}
      <div style={{
        height: height - headerH - width * 0.05,
        background: bg,
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          transform: `translateY(-${scrollY}px)`,
          transition: "none",
        }}>
          {screenshot ? (
            <img
              src={screenshot}
              style={{ width: "100%", display: "block" }}
            />
          ) : content ? (
            <div style={{ padding: width * 0.03 }}>{content}</div>
          ) : (
            // Contenu générique animé
            <div style={{ padding: width * 0.03 }}>
              {/* Nav minimaliste */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: width * 0.025,
                paddingBottom: width * 0.015,
                borderBottom: `1px solid ${darkMode ? "#333" : "#eee"}`,
              }}>
                {/* Logo */}
                <div style={{
                  width: width * 0.15,
                  height: width * 0.022,
                  background: accentColor,
                  borderRadius: 4,
                  opacity: interpolate(f, [5, 15], [0, 1], { extrapolateRight: "clamp" }),
                }} />
                {/* CTA seul */}
                <div style={{
                  background: accentColor,
                  borderRadius: 4,
                  padding: `${width * 0.005}px ${width * 0.018}px`,
                  fontSize: width * 0.013,
                  color: "#fff",
                  fontFamily,
                  fontWeight: 600,
                  opacity: interpolate(f, [8, 18], [0, 1], { extrapolateRight: "clamp" }),
                }}>
                  {url.replace("https://", "").split(".")[0]}
                </div>
              </div>

              {/* Hero minimaliste — juste titre + sous-titre */}
              <div style={{ textAlign: "center", padding: `${width * 0.04}px 0` }}>
                <div style={{
                  fontSize: width * 0.05,
                  fontWeight: 800,
                  color: darkMode ? "#fff" : "#111",
                  fontFamily,
                  lineHeight: 1.1,
                  marginBottom: width * 0.012,
                  letterSpacing: "-0.03em",
                  opacity: interpolate(f, [10, 22], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateY(${interpolate(f, [10, 22], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })}px)`,
                }}>
                  {url.replace("https://", "").replace("www.", "").split(".")[0].charAt(0).toUpperCase()
                    + url.replace("https://", "").replace("www.", "").split(".")[0].slice(1)}
                </div>
                <div style={{
                  width: "40%",
                  height: 3,
                  background: accentColor,
                  borderRadius: 2,
                  margin: "0 auto",
                  opacity: interpolate(f, [14, 24], [0, 1], { extrapolateRight: "clamp" }),
                }} />
              </div>

              {/* Cards minimalistes */}
              <div style={{ display: "flex", gap: width * 0.018, marginTop: width * 0.02 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    flex: 1,
                    background: darkMode ? "#2a2a2a" : "#f5f5f5",
                    borderRadius: 8,
                    height: width * 0.08,
                    border: `1px solid ${darkMode ? "#333" : "#eee"}`,
                    opacity: interpolate(f, [18 + i * 5, 28 + i * 5], [0, 1], { extrapolateRight: "clamp" }),
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Curseur animé */}
        <CursorAnimation frame={f} fps={fps} width={width} accentColor={accentColor} />
      </div>
    </div>
  );
};

// Curseur animé
const CursorAnimation: React.FC<{ frame: number; fps: number; width: number; accentColor: string }> = ({
  frame, fps, width, accentColor,
}) => {
  const opacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" });

  const cursorX = interpolate(frame, [15, 45, 65, 80], [width * 0.2, width * 0.6, width * 0.7, width * 0.55], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const cursorY = interpolate(frame, [15, 45, 65, 80], [width * 0.1, width * 0.15, width * 0.25, width * 0.3], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Click effect
  const clickScale = frame >= 55 && frame <= 65
    ? interpolate(frame, [55, 58, 65], [1, 0.85, 1], { extrapolateRight: "clamp" })
    : 1;

  const clickRipple = frame >= 55 && frame <= 70
    ? interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Ripple de click */}
      {clickRipple > 0 && (
        <div style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          width: 40 * clickRipple,
          height: 40 * clickRipple,
          borderRadius: "50%",
          border: `2px solid ${accentColor}`,
          opacity: 1 - clickRipple,
          transform: "translate(-50%, -50%)",
        }} />
      )}
      {/* Curseur */}
      <div style={{
        position: "absolute",
        left: cursorX,
        top: cursorY,
        transform: `translate(-2px, -2px) scale(${clickScale})`,
        opacity,
        fontSize: width * 0.022,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
      }}>
        🖱️
      </div>
    </div>
  );
};
