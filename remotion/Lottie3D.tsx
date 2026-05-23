import { Lottie } from "@remotion/lottie";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

const CHECKMARK_LOTTIE = {
  v: "5.5.7", fr: 60, ip: 0, op: 60, w: 200, h: 200,
  assets: [],
  layers: [{
    ddd: 0, ind: 1, ty: 4, nm: "check",
    sr: 1, ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      p: { a: 0, k: [100, 100, 0] },
      s: { a: 1, k: [{ i: { x: [0.5], y: [1.5] }, o: { x: [0.5], y: [0] }, t: 0, s: [0, 0, 100] }, { t: 30, s: [100, 100, 100] }] }
    },
    ao: 0, shapes: [{
      ty: "gr", it: [
        { ty: "sh", ks: { a: 0, k: { i: [[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0]], v: [[-30, 0],[-5, 25],[40,-25]], c: false } } },
        { ty: "st", c: { a: 0, k: [1,1,1,1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 8 }, lc: 2, lj: 2 },
        { ty: "tr", p: { a: 0, k: [0,0] }, s: { a: 0, k: [100,100] } }
      ]
    }], ip: 0, op: 60, st: 0, bm: 0
  }]
};

export const LottieIcon: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 200, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 15], [0.5, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{
      width: size, height: size,
      opacity, transform: `scale(${scale})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${interpolate(frame, [5, 40], [0, 283], { extrapolateRight: "clamp" })} 283`}
          strokeLinecap="round" transform="rotate(-90 50 50)" />
        <polyline
          points="28,52 42,66 72,36"
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${interpolate(frame, [20, 50], [0, 60], { extrapolateRight: "clamp" })} 60`}
        />
      </svg>
    </div>
  );
};

export const PulsingDot: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => {
  const frame = useCurrentFrame();
  const scale = 1 + Math.sin(frame * 0.2) * 0.3;
  const opacity = 0.6 + Math.sin(frame * 0.15) * 0.4;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, transform: `scale(${scale})`, opacity,
    }} />
  );
};

export const AnimatedArrow: React.FC<{ color: string; frame: number }> = ({ color, frame }) => {
  const progress = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });
  return (
    <svg width="120" height="60" viewBox="0 0 120 60">
      <line x1="0" y1="30" x2={100 * progress} y2="30"
        stroke={color} strokeWidth="3" strokeLinecap="round" />
      {progress > 0.8 && (
        <>
          <line x1="100" y1="30" x2="80" y2="15" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <line x1="100" y1="30" x2="80" y2="45" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};
