import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

export type NetworkNodesProps = {
  nodeCount?: number;
  color?: string;
  delay?: number;
  pulseColor?: string;
  width?: number;
  height?: number;
};

export const NetworkNodes: React.FC<NetworkNodesProps> = ({
  nodeCount = 12,
  color = "#ffffff",
  delay = 0,
  pulseColor,
  width = 900,
  height = 900,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const pc = pulseColor || color;

  // Positions fixes des noeuds
  const nodes = React.useMemo(() => {
    const pts = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const r = 0.25 + (i % 3) * 0.12;
      pts.push({
        x: 0.5 + Math.cos(angle) * r,
        y: 0.5 + Math.sin(angle) * r,
        size: 4 + (i % 3) * 3,
      });
    }
    pts.push({ x: 0.5, y: 0.5, size: 10 }); // centre
    return pts;
  }, [nodeCount]);

  // Connexions
  const connections = React.useMemo(() => {
    const conns = [];
    const center = nodes.length - 1;
    for (let i = 0; i < center; i++) {
      conns.push([center, i]);
      if (i < center - 1) conns.push([i, i + 1]);
    }
    return conns;
  }, [nodes]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Connections */}
      {connections.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        const lineDelay = i * 3;
        const lf = Math.max(0, f - lineDelay);
        const progress = interpolate(lf, [0, 30], [0, 1], { extrapolateRight: "clamp" });
        const x1 = na.x * width, y1 = na.y * height;
        const x2 = nb.x * width, y2 = nb.y * height;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        return (
          <line key={i}
            x1={x1} y1={y1}
            x2={x1 + (x2 - x1) * progress}
            y2={y1 + (y2 - y1) * progress}
            stroke={color} strokeWidth="1.5"
            strokeOpacity={0.25}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const nf = Math.max(0, f - i * 4);
        const s = spring({ frame: nf, fps, config: { damping: 10, stiffness: 300 }, from: 0, to: 1 });
        const op = interpolate(nf, [0, 8], [0, 1], { extrapolateRight: "clamp" });
        const pulse = node.size > 8 ? 1 + Math.sin(f * 0.06) * 0.3 : 1;
        const isCenter = i === nodes.length - 1;

        return (
          <g key={i}>
            {isCenter && (
              <circle
                cx={node.x * width} cy={node.y * height}
                r={node.size * 3 * pulse * s}
                fill={pc} opacity={0.08 * op}
              />
            )}
            <circle
              cx={node.x * width} cy={node.y * height}
              r={node.size * s}
              fill={isCenter ? pc : color}
              opacity={op}
            />
          </g>
        );
      })}
    </svg>
  );
};
