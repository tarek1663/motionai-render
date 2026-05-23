import { useCurrentFrame, interpolate, Easing } from "remotion";
import React from "react";

export type PieSlice = { label: string; value: number; color: string };

export const AnimatedPieChart: React.FC<{
  data: PieSlice[];
  size?: number;
}> = ({ data, size = 400 }) => {
  const frame = useCurrentFrame();
  const total = data.reduce((s, d) => s + d.value, 0);

  const progress = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  let cumulative = 0;
  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * 360;
    const sliceAngle = (d.value / total) * 360 * progress;
    cumulative += d.value;
    return { ...d, startAngle, sliceAngle };
  });

  const cx = size / 2, cy = size / 2, r = size * 0.38;

  const polarToCartesian = (angle: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });

  const labelOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size}>
        {slices.map((slice, i) => {
          if (slice.sliceAngle < 0.1) return null;
          const start = polarToCartesian(slice.startAngle);
          const end = polarToCartesian(slice.startAngle + slice.sliceAngle);
          const largeArc = slice.sliceAngle > 180 ? 1 : 0;
          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                fill={slice.color}
                opacity={0.9}
              />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#050510" />
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#fff" fontSize="32" fontWeight="800" fontFamily="system-ui">
          {Math.round(progress * 100)}%
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="18" fontFamily="system-ui">
          complet
        </text>
      </svg>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", opacity: labelOpacity }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: d.color }} />
            <span style={{ color: "#fff", fontSize: 22, fontFamily: "system-ui" }}>{d.label} {d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnimatedLineChart: React.FC<{
  points: { x: number; y: number; label: string }[];
  color: string;
  width?: number;
  height?: number;
}> = ({ points, color, width = 800, height = 300 }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, 50], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const maxY = Math.max(...points.map(p => p.y));
  const minY = Math.min(...points.map(p => p.y));
  const pad = 40;

  const toSvg = (p: { x: number; y: number }) => ({
    x: pad + (p.x / (points.length - 1)) * (width - pad * 2),
    y: pad + (1 - (p.y - minY) / (maxY - minY)) * (height - pad * 2),
  });

  const svgPoints = points.map(toSvg);
  const visibleCount = Math.floor(progress * (svgPoints.length - 1)) + 1;
  const visiblePoints = svgPoints.slice(0, visibleCount);

  const pathD = visiblePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg width={width} height={height}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad + t * (height - pad * 2);
        return <line key={i} x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {/* Area fill */}
      {visiblePoints.length > 1 && (
        <path
          d={`${pathD} L ${visiblePoints[visiblePoints.length - 1].x} ${height - pad} L ${svgPoints[0].x} ${height - pad} Z`}
          fill={color} opacity={0.12}
        />
      )}
      {/* Line */}
      {visiblePoints.length > 1 && (
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {/* Points */}
      {visiblePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6" fill={color} />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const sp = toSvg(p);
        const labelOpacity = interpolate(frame, [i * 8, i * 8 + 10], [0, 1], { extrapolateRight: "clamp" });
        return (
          <text key={i} x={sp.x} y={height - 8} textAnchor="middle"
            fill="rgba(255,255,255,0.5)" fontSize="18" fontFamily="system-ui" opacity={labelOpacity}>
            {p.label}
          </text>
        );
      })}
    </svg>
  );
};
