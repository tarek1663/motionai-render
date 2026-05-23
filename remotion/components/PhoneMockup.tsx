import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import { TypewriterText } from "./TypewriterText";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "700", "800"],
  subsets: ["latin"],
});

export type PhoneContent =
  | { type: "search"; query: string; }
  | { type: "youtube"; thumbnails: string[]; }
  | { type: "maps"; destination: string; }
  | { type: "browser"; url: string; screenshotSrc?: string; };

export type PhoneMockupProps = {
  content: PhoneContent;
  delay?: number;
  width?: number;
  accentColor?: string;
};

const SearchScreen: React.FC<{ query: string; accentColor: string; frame: number; fps: number; delay: number }> = ({
  query, accentColor, frame, fps, delay,
}) => {
  return (
    <div style={{ padding: "20px 16px", background: "#fff", height: "100%", fontFamily }}>
      {/* Google logo */}
      <div style={{
        textAlign: "center", fontSize: 28, fontWeight: 800,
        marginBottom: 16, marginTop: 20,
        opacity: interpolate(Math.max(0, frame - delay), [0, 10], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <span style={{ color: "#4285f4" }}>G</span>
        <span style={{ color: "#ea4335" }}>o</span>
        <span style={{ color: "#fbbc05" }}>o</span>
        <span style={{ color: "#4285f4" }}>g</span>
        <span style={{ color: "#34a853" }}>l</span>
        <span style={{ color: "#ea4335" }}>e</span>
      </div>
      {/* Search bar */}
      <div style={{
        border: "1.5px solid #ddd", borderRadius: 24,
        padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        background: "#fff",
        opacity: interpolate(Math.max(0, frame - delay - 5), [0, 10], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <TypewriterText
          text={query}
          fontSize={16}
          fontWeight={400}
          color="#333"
          delay={delay + 10}
          speed={3}
          showCursor
          cursorColor={accentColor}
        />
      </div>
    </div>
  );
};

const MapsScreen: React.FC<{ destination: string; accentColor: string; frame: number; delay: number }> = ({
  destination, accentColor, frame, delay,
}) => {
  const f = Math.max(0, frame - delay);
  const routeProgress = interpolate(f, [10, 50], [0, 1], { extrapolateRight: "clamp" });
  const pinScale = spring({ frame: Math.max(0, f - 45), fps: 60, config: { damping: 8, stiffness: 400 }, from: 0, to: 1 });

  return (
    <div style={{ position: "relative", height: "100%", background: "#e8f0e8", overflow: "hidden" }}>
      {/* Map grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
        `,
        backgroundSize: "30px 30px",
      }} />
      {/* Route SVG */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 300 500">
        <path
          d="M 150 450 Q 120 350 140 280 Q 160 200 130 150"
          fill="none"
          stroke={accentColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset={400 - 400 * routeProgress}
        />
      </svg>
      {/* Pin */}
      <div style={{
        position: "absolute", top: "28%", left: "42%",
        transform: `scale(${pinScale})`,
        fontSize: 28,
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
      }}>
        📍
      </div>
      {/* Destination chip */}
      <div style={{
        position: "absolute", bottom: 20, left: 16, right: 16,
        background: "#fff", borderRadius: 12, padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        opacity: interpolate(Math.max(0, f - 20), [0, 12], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", fontFamily }}>📍 {destination}</div>
        <div style={{ fontSize: 11, color: accentColor, fontFamily, marginTop: 2 }}>Itinéraire en cours...</div>
      </div>
    </div>
  );
};

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  content,
  delay = 0,
  width = 280,
  accentColor = "#4285f4",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const scale = spring({ frame: f, fps, config: { damping: 16, stiffness: 180 }, from: 0.7, to: 1 });
  const opacity = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const height = width * 2.1;

  return (
    <div style={{
      width, height,
      transform: `scale(${scale})`,
      opacity,
      position: "relative",
    }}>
      {/* Phone shell */}
      <div style={{
        width: "100%", height: "100%",
        background: "#1a1a1a",
        borderRadius: width * 0.12,
        padding: width * 0.04,
        boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px #333",
        overflow: "hidden",
      }}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: width * 0.04, left: "50%",
          transform: "translateX(-50%)",
          width: width * 0.3, height: width * 0.06,
          background: "#1a1a1a", borderRadius: 20, zIndex: 10,
        }} />
        {/* Screen */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: width * 0.09,
          overflow: "hidden",
          background: "#fff",
        }}>
          {content.type === "search" && (
            <SearchScreen query={content.query} accentColor={accentColor} frame={frame} fps={fps} delay={delay} />
          )}
          {content.type === "maps" && (
            <MapsScreen destination={content.destination} accentColor={accentColor} frame={frame} delay={delay} />
          )}
          {content.type === "browser" && content.screenshotSrc && (
            <img src={content.screenshotSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
      </div>
    </div>
  );
};
