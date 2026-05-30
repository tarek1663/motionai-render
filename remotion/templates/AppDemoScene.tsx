import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const E_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const E_IN = Easing.bezier(0.4, 0, 1, 1);
const FONT =
  "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', sans-serif";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeStr = (val: unknown): string => {
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    const nested =
      obj.text ?? obj.label ?? obj.name ?? obj.title ?? obj.value ?? obj.desc;
    if (typeof nested === "string") return nested;
    if (typeof nested === "number") return String(nested);
    return JSON.stringify(val);
  }
  return "";
};

type MousePoint = { x: number; y: number; frame: number; action: string };

const MouseCursor: React.FC<{
  path: MousePoint[];
  containerW: number;
  containerH: number;
}> = ({ path, containerW, containerH }) => {
  const frame = useCurrentFrame();

  if (!path || path.length < 2) return null;

  let currentX = path[0].x;
  let currentY = path[0].y;
  let isClicking = false;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    if (frame >= from.frame && frame <= to.frame) {
      const t = (frame - from.frame) / Math.max(1, to.frame - from.frame);
      const ease = E_OUT(t);
      currentX = from.x + (to.x - from.x) * ease;
      currentY = from.y + (to.y - from.y) * ease;
      isClicking = to.action === "click" && t > 0.8;
      break;
    }
    if (frame > to.frame) {
      currentX = to.x;
      currentY = to.y;
      isClicking = to.action === "click";
    }
  }

  const x = (currentX / 100) * containerW;
  const y = (currentY / 100) * containerH;
  const clickScale = isClicking ? 0.85 : 1;
  const rippleOpacity = isClicking
    ? interpolate(frame % 10, [0, 10], [0.6, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <g>
      {isClicking && (
        <circle
          cx={x}
          cy={y}
          r={20 + (frame % 10) * 2}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
          opacity={rippleOpacity}
        />
      )}
      <path
        d={`M ${x + 2} ${y + 2} L ${x + 2} ${y + 24} L ${x + 8} ${y + 18} L ${x + 14} ${y + 28} L ${x + 16} ${y + 27} L ${x + 10} ${y + 17} L ${x + 18} ${y + 17} Z`}
        fill="rgba(0,0,0,0.3)"
      />
      <path
        d={`M ${x} ${y} L ${x} ${y + 22} L ${x + 6} ${y + 16} L ${x + 12} ${y + 26} L ${x + 14} ${y + 25} L ${x + 8} ${y + 15} L ${x + 16} ${y + 15} Z`}
        fill="white"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="0.5"
        transform={`scale(${clickScale} ${clickScale}) translate(${x * (1 - clickScale)} ${y * (1 - clickScale)})`}
      />
    </g>
  );
};

const Annotation: React.FC<{
  text: string;
  x: number;
  y: number;
  arrowDirection: string;
  startFrame: number;
  containerW: number;
  containerH: number;
  accent: string;
}> = ({
  text,
  x,
  y,
  arrowDirection,
  startFrame,
  containerW,
  containerH,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const label = safeStr(text);

  const enter = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 280, stiffness: 100 },
    from: 0,
    to: 1,
  });

  const px = (x / 100) * containerW;
  const py = (y / 100) * containerH;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.8, 1]);

  const arrowOffsets: Record<string, [number, number]> = {
    up: [0, -30],
    down: [0, 30],
    left: [-30, 0],
    right: [30, 0],
  };
  const [ax, ay] = arrowOffsets[arrowDirection] || [0, -30];

  return (
    <g
      opacity={opacity}
      transform={`scale(${scale}) translate(${px * (1 - scale)} ${py * (1 - scale)})`}
    >
      <line
        x1={px}
        y1={py}
        x2={px + ax}
        y2={py + ay}
        stroke={accent}
        strokeWidth="1.5"
        strokeDasharray="4,3"
        opacity={0.8}
      />
      <circle cx={px} cy={py} r={3} fill={accent} />
      <rect
        x={px + ax - label.length * 4}
        y={py + ay - 14}
        width={label.length * 8}
        height={22}
        rx={6}
        fill="rgba(0,0,0,0.75)"
        stroke={accent}
        strokeWidth="0.5"
      />
      <text
        x={px + ax}
        y={py + ay + 2}
        textAnchor="middle"
        fontSize={10}
        fontFamily={FONT}
        fontWeight={600}
        fill="white"
        letterSpacing="-0.3"
      >
        {label}
      </text>
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderElement = (el: any, accent: string, frame: number, key: string) => {
  const elFade = interpolate(Math.max(0, frame - 10), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });

  switch (el.type) {
    case "navbar":
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 48,
            background: el.bgColor || "rgba(255,255,255,0.95)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            backdropFilter: "blur(20px)",
            opacity: elFade,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              fontFamily: FONT,
              color: el.textColor || "#000",
              letterSpacing: "-0.04em",
            }}
          >
            {safeStr(el.logo)}
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {(el.links || []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (link: any, i: number) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: FONT,
                  color: "rgba(0,0,0,0.5)",
                  fontWeight: 500,
                }}
              >
                {safeStr(link)}
              </div>
            ),
            )}
          </div>
          <div
            style={{
              background: accent,
              color: "#fff",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: FONT,
            }}
          >
            {safeStr(el.ctaText) || "Get Started"}
          </div>
        </div>
      );

    case "hero":
      return (
        <div
          key={key}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            gap: 16,
            textAlign: "center",
            opacity: elFade,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: FONT,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              color: el.textColor || "#000",
              maxWidth: 500,
            }}
          >
            {safeStr(el.headline)}
          </div>
          <div
            style={{
              fontSize: 16,
              fontFamily: FONT,
              color: "rgba(0,0,0,0.5)",
              maxWidth: 400,
            }}
          >
            {safeStr(el.subline)}
          </div>
          <div
            style={{
              background: accent,
              color: "#fff",
              borderRadius: 12,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: FONT,
              boxShadow: `0 8px 24px ${accent}44`,
            }}
          >
            {safeStr(el.ctaText) || "Commencer gratuitement"}
          </div>
        </div>
      );

    case "features":
      return (
        <div
          key={key}
          style={{
            display: "flex",
            gap: 12,
            padding: "0 24px",
            opacity: elFade,
          }}
        >
          {(el.items || []).slice(0, 3).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any, i: number) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: 12,
                  padding: "16px",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{safeStr(item.icon)}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONT,
                    color: "#000",
                    marginBottom: 4,
                  }}
                >
                  {safeStr(item.title)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: FONT,
                    color: "rgba(0,0,0,0.4)",
                    lineHeight: 1.4,
                  }}
                >
                  {safeStr(item.desc)}
                </div>
              </div>
            ),
          )}
        </div>
      );

    case "sidebar":
      return (
        <div
          key={key}
          style={{
            width: 180,
            height: "100%",
            background: "rgba(0,0,0,0.03)",
            borderRight: "1px solid rgba(0,0,0,0.06)",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            opacity: elFade,
          }}
        >
          {(el.items || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any, i: number) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background:
                  i === (el.activeIndex || 0) ? `${accent}18` : "transparent",
                color: i === (el.activeIndex || 0) ? accent : "rgba(0,0,0,0.5)",
                fontSize: 12,
                fontFamily: FONT,
                fontWeight: i === (el.activeIndex || 0) ? 600 : 400,
                borderLeft:
                  i === (el.activeIndex || 0)
                    ? `2px solid ${accent}`
                    : "2px solid transparent",
              }}
            >
              {safeStr(item)}
            </div>
          ),
          )}
        </div>
      );

    case "card":
      return (
        <div
          key={key}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "16px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            opacity: elFade,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: FONT,
              color: "rgba(0,0,0,0.4)",
              marginBottom: 6,
            }}
          >
            {safeStr(el.title)}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: FONT,
              color: el.color || accent,
              letterSpacing: "-0.04em",
            }}
          >
            {safeStr(el.value)}
          </div>
        </div>
      );

    case "chart":
      return (
        <div key={key} style={{ padding: "0 24px", opacity: elFade }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              height: 60,
            }}
          >
            {(el.values || []).map((v: number, i: number) => {
              const h = interpolate(
                Math.max(0, frame - i * 4),
                [0, 20],
                [0, v],
                { extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: "3px 3px 0 0",
                    background:
                      i === (el.values?.length || 0) - 1
                        ? el.color || accent
                        : `${el.color || accent}44`,
                  }}
                />
              );
            })}
          </div>
        </div>
      );

    case "table":
      return (
        <div key={key} style={{ padding: "0 24px", opacity: elFade }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${(el.headers || []).length}, 1fr)`,
              gap: 1,
              background: "rgba(0,0,0,0.06)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {(el.headers || []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (h: any, i: number) => (
              <div
                key={i}
                style={{
                  background: "#f5f5f5",
                  padding: "8px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: FONT,
                  color: "rgba(0,0,0,0.5)",
                }}
              >
                {safeStr(h)}
              </div>
            ),
            )}
            {(el.rows || []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (row: any, ri: number) => {
              const cells = Array.isArray(row) ? row : [];
              return cells.map((cell: unknown, ci: number) => (
                <div
                  key={`${ri}-${ci}`}
                  style={{
                    background: "#fff",
                    padding: "8px 12px",
                    fontSize: 11,
                    fontFamily: FONT,
                    color: "#000",
                  }}
                >
                  {safeStr(cell)}
                </div>
              ));
            },
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export const AppDemoScene: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  screen: any;
  format: "desktop" | "mobile";
  accent: string;
  appName: string;
  bgColor: string;
}> = ({ screen, format, accent, appName, bgColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const isMobile = format === "mobile";
  const deviceW = isMobile ? 280 : 520;
  const deviceH = isMobile ? 560 : 320;
  const contentW = isMobile ? 268 : 508;
  const contentH = isMobile ? 548 : 308;

  const enter = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 20)),
    [0, 20],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const mousePath: MousePoint[] = screen.mousePath || [];

  const deviceContent = (
    <>
      {(screen.elements || []).map((el: unknown, idx: number) =>
        renderElement(el, accent, frame, `el-${idx}`),
      )}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <MouseCursor path={mousePath} containerW={contentW} containerH={contentH} />
        {(screen.annotations || []).map(
          (
            ann: {
              text: string;
              x: number;
              y: number;
              arrowDirection: string;
              frame: number;
            },
            i: number,
          ) => (
            <Annotation
              key={i}
              {...ann}
              startFrame={ann.frame || 30}
              containerW={contentW}
              containerH={contentH}
              accent={accent}
            />
          ),
        )}
      </svg>
    </>
  );

  return (
    <AbsoluteFill
      style={{
        background: bgColor || "#f5f5f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        style={{
          opacity: Math.min(enter, fadeOut),
          transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])}) translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
          filter: `blur(${interpolate(enter, [0, 1], [8, 0])}px)`,
          position: "relative",
        }}
      >
        {isMobile ? (
          <div
            style={{
              width: deviceW,
              height: deviceH,
              background: "#1a1a1a",
              borderRadius: 44,
              border: "6px solid #333",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 80,
                height: 12,
                background: "#000",
                borderRadius: "0 0 16px 16px",
                zIndex: 10,
              }}
            />
            <div
              style={{
                width: "100%",
                height: "100%",
                background: screen.bgColor || "#fff",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {deviceContent}
            </div>
          </div>
        ) : (
          <div style={{ width: deviceW }}>
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: "14px 14px 0 0",
                border: "2px solid #333",
                overflow: "hidden",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  background: "#222",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderBottom: "1px solid #333",
                }}
              >
                {["#ff5f56", "#ffbd2e", "#27c93f"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c,
                    }}
                  />
                ))}
                <div
                  style={{
                    flex: 1,
                    background: "#2a2a2a",
                    borderRadius: 4,
                    padding: "3px 10px",
                    fontSize: 9,
                    color: "#555",
                    marginLeft: 8,
                    textAlign: "center",
                    fontFamily: FONT,
                  }}
                >
                  {screen.url ||
                    `${(appName || "app").toLowerCase().replace(/\s/g, "")}.app`}
                </div>
              </div>
              <div
                style={{
                  height: contentH,
                  background: screen.bgColor || "#fff",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {deviceContent}
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#2a2a2a",
                height: 12,
                borderRadius: "0 0 4px 4px",
                border: "2px solid #333",
                borderTop: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: "35%",
                  height: 6,
                  background: "#222",
                  borderRadius: "0 0 6px 6px",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
