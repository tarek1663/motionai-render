import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import React from "react";

const E_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const E_IN = Easing.bezier(0.4, 0, 1, 1);
const FONT =
  "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', sans-serif";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
export type SceneData = {
  type:
    | "singleword"
    | "maskreveal"
    | "slideword"
    | "zoomword"
    | "fadeupl"
    | "blurin"
    | "scalein"
    | "slideup"
    | "cliptop"
    | "staggerwords"
    | "fadepure"
    | "tracking"
    | "rotatein"
    | "geobgtest"
    | "photoreveal"
    | "photocollage"
    | "counter"
    | "progressbar"
    | "multistats"
    | "accentword"
    | "underline"
    | "colorshift"
    | "linedraw"
    | "shape"
    | "expandingshape"
    | "wipe"
    | "flash"
    | "colorfade"
    | "splitvertical"
    | "zoomtransition"
    | "iris"
    | "curtain"
    | "diagonalwipe"
    | "glitchswitch"
    | "venetian"
    | "scalewipe"
    | "pixeldissolve"
    | "lightsweep";
  text?: string;
  shape?: "circle" | "square";
  bg?: string;
  accentColor?: string;
  accentIndex?: number;
  fromBg?: string;
  toBg?: string;
  counterTo?: number;
  suffix?: string;
  prefix?: string;
  stats?: Array<{ value: number; label: string; suffix?: string }>;
  photoUrl?: string;
  photoUrl2?: string;
  photoUrl3?: string;
  photoQuery?: string;
  geo?:
    | "dots"
    | "grid"
    | "diagonal"
    | "circles"
    | "perspective"
    | "hex"
    | "cross"
    | "lines"
    | "radial";
  _duration?: number;
  _index?: number;
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
const isLight = (bg: string) =>
  bg === "#f5f5f7" || bg === "#ffffff" || bg === "#eeeeee" || bg === "#f5f5f5";

const getLuminance = (hex: string): number => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const textColor = (bg: string): string => {
  if (isLight(bg)) return "#1d1d1f";
  const lum = getLuminance(bg);
  return lum > 0.4 ? "#1d1d1f" : "#f5f5f0";
};

const autoFontSize = (text: string, max = 160, min = 60): number => {
  const len = (text || "").replace(/\s+/g, " ").trim().length;
  if (len <= 4) return max;
  if (len <= 8) return Math.round(max * 0.85);
  if (len <= 12) return Math.round(max * 0.7);
  if (len <= 20) return Math.round(max * 0.55);
  if (len <= 30) return Math.round(max * 0.45);
  return Math.max(min, Math.round(max * 0.35));
};

// ═══════════════════════════════════════════════════════
// FONDS GÉOMÉTRIQUES SOBRES — À SÉLECTIONNER
// ═══════════════════════════════════════════════════════

const GeoDots: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const dot = light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `radial-gradient(circle, ${dot} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />
  );
};

const GeoGrid: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const line = light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }}
    />
  );
};

const GeoDiagonal: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const line = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `repeating-linear-gradient(45deg, ${line} 0px, ${line} 1px, transparent 1px, transparent 40px)`,
      }}
    />
  );
};

const GeoCircles: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const c = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }}>
      {[200, 350, 500, 650, 800, 950].map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: `1px solid ${c}`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
};

const GeoPerspective: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const line = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: "perspective(600px) rotateX(55deg) translateY(30%)",
          transformOrigin: "center bottom",
        }}
      />
    </div>
  );
};

const GeoHex: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const c = light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `
        radial-gradient(circle farthest-side at 0% 50%, ${bg} 23.5%, transparent 0) 21px 30px,
        radial-gradient(circle farthest-side at 0% 50%, ${c} 24%, transparent 0) 19px 30px,
        linear-gradient(${bg} 14%, transparent 0, transparent 85%, ${bg} 0) 0 0,
        linear-gradient(150deg, ${bg} 24%, ${c} 0, ${c} 26%, transparent 0, transparent 74%, ${c} 0, ${c} 76%, ${bg} 0) 0 0,
        linear-gradient(30deg, ${bg} 24%, ${c} 0, ${c} 26%, transparent 0, transparent 74%, ${c} 0, ${c} 76%, ${bg} 0) 0 0,
        linear-gradient(90deg, ${c} 2%, ${bg} 0, ${bg} 98%, ${c} 0) 0 0
      `,
        backgroundSize: "40px 70px",
      }}
    />
  );
};

const GeoCross: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const c = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `
        linear-gradient(${c} 2px, transparent 2px),
        linear-gradient(90deg, ${c} 2px, transparent 2px),
        linear-gradient(${c} 1px, transparent 1px),
        linear-gradient(90deg, ${c} 1px, transparent 1px)
      `,
        backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
        backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
      }}
    />
  );
};

const GeoLines: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const c = light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `repeating-linear-gradient(0deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 48px)`,
      }}
    />
  );
};

const GeoRadial: React.FC<{ bg: string }> = ({ bg }) => {
  const light = isLight(bg);
  const glow = light ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.04)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 50%, ${glow} 0%, transparent 100%)`,
      }}
    />
  );
};

const GEO_MAP: Record<string, React.FC<{ bg: string }>> = {
  dots: GeoDots,
  grid: GeoGrid,
  diagonal: GeoDiagonal,
  circles: GeoCircles,
  perspective: GeoPerspective,
  hex: GeoHex,
  cross: GeoCross,
  lines: GeoLines,
  radial: GeoRadial,
};

// Fond pur avec micro zoom
const PureBg: React.FC<{ bg: string }> = ({ bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.012], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        transform: `scale(${scale})`,
      }}
    />
  );
};

// ─── SINGLEWORD ───────────────────────────────────────
export const SingleWordScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const enter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80, mass: 0.8 },
    from: 0,
    to: 1,
  });

  const fadeIn = interpolate(frame, [0, 28], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const opacity = Math.min(fadeIn, fadeOut);
  const scale = interpolate(enter, [0, 1], [0.84, 1]);
  const blur = interpolate(enter, [0, 0.6, 1], [10, 2, 0]);
  const y = interpolate(enter, [0, 1], [30, 0]);

  const word = scene.text || "";
  const fontSize = autoFontSize(word, 180, 80);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            transform: `translateY(${y}px) scale(${scale})`,
            filter: `blur(${blur}px)`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {word}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── MASKREVEAL ───────────────────────────────────────
export const MaskRevealScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const reveal = interpolate(frame, [0, 40], [0, 102], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {scene.text}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${Math.max(0, 100 - reveal)}% 0 0)`,
            }}
          >
            <div
              style={{
                fontSize,
                fontWeight: 600,
                fontFamily: FONT,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: textColor(bg),
                whiteSpace: "nowrap",
              }}
            >
              {scene.text}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SLIDEWORD ────────────────────────────────────────
export const SlideWordScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const enter = spring({
    frame,
    fps,
    config: { damping: 260, stiffness: 70, mass: 0.9 },
    from: 0,
    to: 1,
  });

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const x = interpolate(enter, [0, 1], [-180, 0]);
  const opacity = Math.min(fadeIn, fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            transform: `translateX(${x}px)`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── ZOOMWORD ─────────────────────────────────────────
export const ZoomWordScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const progress = interpolate(frame, [0, 40], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const scale = interpolate(progress, [0, 1], [1.35, 1]);
  const blur = interpolate(progress, [0, 0.6, 1], [18, 4, 0]);
  const opacity = Math.min(interpolate(progress, [0, 0.25], [0, 1]), fadeOut);

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            transform: `scale(${scale})`,
            filter: `blur(${blur}px)`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 5. FADE UP LETTERS ───────────────────────────────
export const FadeUpLettersScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const text = scene.text || "";
  const letters = text.split("");
  const fontSize = autoFontSize(text, 160, 72);
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", whiteSpace: "nowrap" }}>
          {letters.map((letter, i) => {
            const delay = i * 4;
            const enter = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 280, stiffness: 90, mass: 0.7 },
              from: 0,
              to: 1,
            });
            return (
              <span
                key={i}
                style={{
                  fontSize,
                  fontWeight: 600,
                  fontFamily: FONT,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: textColor(bg),
                  display: "inline-block",
                  opacity: interpolate(enter, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
                  filter: `blur(${interpolate(enter, [0, 0.5, 1], [6, 1, 0])}px)`,
                }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 6. BLUR IN CENTER ────────────────────────────────
export const BlurInScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const progress = interpolate(frame, [0, 35], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const blur = interpolate(progress, [0, 1], [40, 0]);
  const opacity = Math.min(interpolate(progress, [0, 0.2], [0, 1]), fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            filter: `blur(${blur}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 7. SCALE FROM NOTHING ────────────────────────────
export const ScaleInScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const enter = spring({
    frame,
    fps,
    config: { damping: 300, stiffness: 60, mass: 1 },
    from: 0,
    to: 1,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const scale = interpolate(enter, [0, 1], [0.3, 1]);
  const opacity = Math.min(interpolate(enter, [0, 0.3], [0, 1]), fadeOut);
  const blur = interpolate(enter, [0, 0.5, 1], [12, 3, 0]);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            transform: `scale(${scale})`,
            filter: `blur(${blur}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 8. SLIDE FROM BOTTOM ─────────────────────────────
export const SlideUpScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const enter = spring({
    frame,
    fps,
    config: { damping: 260, stiffness: 70, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const y = interpolate(enter, [0, 1], [120, 0]);
  const opacity = Math.min(interpolate(enter, [0, 0.2], [0, 1]), fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            transform: `translateY(${y}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 9. CLIP FROM TOP ─────────────────────────────────
export const ClipTopScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const clipProgress = interpolate(frame, [0, 36], [0, 100], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div
          style={{
            clipPath: `inset(0 0 ${Math.max(0, 100 - clipProgress)}% 0)`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: textColor(bg),
              whiteSpace: "nowrap",
            }}
          >
            {scene.text}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 10. STAGGER WORDS ────────────────────────────────
export const StaggerWordsScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const words = (scene.text || "").split(" ");
  const fontSize = autoFontSize(scene.text || "", 130, 60);
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.28em", whiteSpace: "nowrap" }}>
          {words.map((word, i) => {
            const delay = i * 10;
            const enter = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 280, stiffness: 80, mass: 0.8 },
              from: 0,
              to: 1,
            });
            return (
              <span
                key={i}
                style={{
                  fontSize,
                  fontWeight: 600,
                  fontFamily: FONT,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: textColor(bg),
                  display: "inline-block",
                  opacity: interpolate(enter, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(enter, [0, 1], [50, 0])}px) rotate(${interpolate(enter, [0, 1], [4, 0])}deg)`,
                  filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 12. FADE CROSS ───────────────────────────────────
export const FadePureScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 24, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(fadeIn, fadeOut),
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 13. TRACKING EXPAND ──────────────────────────────
export const TrackingScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const progress = interpolate(frame, [0, 40], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const tracking = interpolate(progress, [0, 1], [-0.15, -0.025]);
  const opacity = Math.min(interpolate(progress, [0, 0.2], [0, 1]), fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: `${tracking}em`,
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 14. ROTATE IN ────────────────────────────────────
export const RotateInScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const enter = spring({
    frame,
    fps,
    config: { damping: 300, stiffness: 70, mass: 1 },
    from: 0,
    to: 1,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const rotate = interpolate(enter, [0, 1], [-6, 0]);
  const opacity = Math.min(interpolate(enter, [0, 0.2], [0, 1]), fadeOut);
  const y = interpolate(enter, [0, 1], [30, 0]);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            transform: `translateY(${y}px) rotate(${rotate}deg)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── GEO BG TEST ────────────────────────────────────────
export const GeoBgTestScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const geoType = scene.geo || "dots";

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const GeoComponent = GEO_MAP[geoType] || GeoDots;
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <GeoComponent bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// SCÈNES IMAGES — PHOTOS PEXELS
// ═══════════════════════════════════════════════════════

// ─── PHOTO REVEAL ─────────────────────────────────────
export const PhotoRevealScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const photoUrl = scene.photoUrl || "";

  const reveal = interpolate(frame, [0, 44], [0, 100], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const textFadeIn = interpolate(Math.max(0, frame - 36), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textY = interpolate(Math.max(0, frame - 36), [0, 24], [20, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });

  const fontSize = autoFontSize(scene.text || "", 96, 48);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 32,
          padding: "60px 80px",
          opacity: fadeOut,
        }}
      >
        {scene.text && (
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: textColor(bg),
              opacity: textFadeIn,
              transform: `translateY(${textY}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {scene.text}
          </div>
        )}

        {photoUrl && (
          <div
            style={{
              width: "78%",
              maxWidth: 560,
              aspectRatio: "16/9",
              borderRadius: 16,
              overflow: "hidden",
              clipPath: `inset(0 ${Math.max(0, 100 - reveal)}% 0 0 round 16px)`,
              boxShadow: isLight(bg)
                ? "0 24px 64px rgba(0,0,0,0.12)"
                : "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <img
              src={photoUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── PHOTO COLLAGE ────────────────────────────────────
export const PhotoCollageScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const photos = [scene.photoUrl, scene.photoUrl2, scene.photoUrl3].filter(
    Boolean,
  ) as string[];

  const count = photos.length || 2;

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const textEnter = spring({
    frame: Math.max(0, frame - count * 10 + 10),
    fps,
    config: { damping: 280, stiffness: 80 },
    from: 0,
    to: 1,
  });

  const fontSize = autoFontSize(scene.text || "", 80, 40);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 24,
          padding: "60px 60px",
          opacity: fadeOut,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {(photos.length > 0 ? photos : ["", ""]).map((photo, i) => {
            const enter = spring({
              frame: Math.max(0, frame - i * 10),
              fps,
              config: { damping: 280, stiffness: 70, mass: 0.9 },
              from: 0,
              to: 1,
            });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  maxWidth: count === 3 ? 220 : 320,
                  aspectRatio: "4/5",
                  borderRadius: 14,
                  overflow: "hidden",
                  opacity: interpolate(enter, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
                  filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
                  boxShadow: isLight(bg)
                    ? "0 16px 40px rgba(0,0,0,0.10)"
                    : "0 16px 40px rgba(0,0,0,0.4)",
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: isLight(bg)
                        ? "rgba(0,0,0,0.06)"
                        : "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      color: isLight(bg)
                        ? "rgba(0,0,0,0.15)"
                        : "rgba(255,255,255,0.15)",
                    }}
                  >
                    ▶
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {scene.text && (
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: textColor(bg),
              opacity: interpolate(textEnter, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(textEnter, [0, 1], [20, 0])}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// SCÈNES CHIFFRES & STATS
// ═══════════════════════════════════════════════════════

// ─── COMPTEUR ─────────────────────────────────────────
export const CounterScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const target = scene.counterTo ?? 1000;
  const suffix = scene.suffix || "";
  const prefix = scene.prefix || "";

  const progress = interpolate(frame, [0, Math.max(1, durationInFrames * 0.75)], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const current = Math.round(target * progress);

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const displayValue =
    current >= 1000
      ? `${(current / 1000).toFixed(current % 1000 === 0 ? 0 : 1)}K`
      : current.toLocaleString("fr-FR");

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 8,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.07em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {prefix}
          {displayValue}
          {suffix}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── PROGRESS BAR ─────────────────────────────────────
export const ProgressBarScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const target = scene.counterTo ?? 75;
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const progress = interpolate(frame, [8, Math.max(9, durationInFrames * 0.75)], [0, target], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const barWidth = interpolate(frame, [8, Math.max(9, durationInFrames * 0.75)], [0, target], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 120px",
          flexDirection: "column",
          gap: 24,
          opacity,
        }}
      >
        {scene.text && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.02em",
              color: textColor(bg),
            }}
          >
            {scene.text}
          </div>
        )}

        <div
          style={{
            width: "100%",
            height: 6,
            background: isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
            borderRadius: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              background: accent,
              borderRadius: 100,
              boxShadow: `0 0 16px ${accent}66`,
            }}
          />
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: accent,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(progress)}%
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── MULTI STATS ──────────────────────────────────────
export const MultiStatsScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const stats = scene.stats || [
    { value: 10000, label: "utilisateurs", suffix: "+" },
    { value: 72, label: "animations", suffix: "" },
    { value: 98, label: "satisfaction", suffix: "%" },
  ];

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 0,
          padding: "0 100px",
          opacity: fadeOut,
        }}
      >
        {stats.map((stat, i) => {
          const delay = i * 18;
          const enter = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 280, stiffness: 80, mass: 0.8 },
            from: 0,
            to: 1,
          });

          const countProgress = interpolate(
            Math.max(0, frame - delay),
            [0, Math.max(1, 50)],
            [0, 1],
            { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
          );
          const current = Math.round(stat.value * countProgress);

          const isLast = i === stats.length - 1;
          const borderColor = isLight(bg)
            ? "rgba(0,0,0,0.06)"
            : "rgba(255,255,255,0.06)";

          return (
            <div
              key={i}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: isLast ? 0 : 24,
                marginBottom: isLast ? 0 : 24,
                borderBottom: isLast ? "none" : `1px solid ${borderColor}`,
                opacity: interpolate(enter, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
                filter: `blur(${interpolate(enter, [0, 0.5, 1], [6, 1, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 80,
                  fontWeight: 700,
                  fontFamily: FONT,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                  color: textColor(bg),
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {current >= 1000 ? `${(current / 1000).toFixed(0)}K` : current}
                {stat.suffix}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// SCÈNES COULEURS & ACCENT
// ═══════════════════════════════════════════════════════

// ─── MOT EN COULEUR ACCENT ────────────────────────────
export const AccentWordScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");
  const words = (scene.text || "").split(" ");
  const accentIndex = scene.accentIndex ?? 0;

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap" }}>
          {words.map((word, i) => {
            const delay = i * 8;
            const enter = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 280, stiffness: 80, mass: 0.8 },
              from: 0,
              to: 1,
            });
            const isAccent = i === accentIndex;
            return (
              <span
                key={i}
                style={{
                  fontSize,
                  fontWeight: 600,
                  fontFamily: FONT,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: isAccent ? accent : textColor(bg),
                  display: "inline-block",
                  opacity: interpolate(enter, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px) scale(${interpolate(enter, [0, 1], [0.88, 1])})`,
                  filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── UNDERLINE ANIMÉ ──────────────────────────────────
export const UnderlineScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const textFade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textY = interpolate(frame, [0, 28], [30, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const underlineW = interpolate(Math.max(0, frame - 20), [0, 28], [0, 100], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(textFade, fadeOut),
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: textColor(bg),
              transform: `translateY(${textY}px)`,
              whiteSpace: "nowrap",
              paddingBottom: 12,
            }}
          >
            {scene.text}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: `${underlineW}%`,
              height: Math.max(3, Math.round(fontSize * 0.025)),
              background: accent,
              borderRadius: 100,
              boxShadow: `0 0 12px ${accent}44`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── COLOR SHIFT ──────────────────────────────────────
export const ColorShiftScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fromBg = scene.fromBg || "#ffffff";
  const toBg = scene.toBg || "#000000";

  const progress = interpolate(
    frame,
    [0, Math.max(1, durationInFrames * 0.7)],
    [0, 1],
    {
      extrapolateRight: "clamp",
      easing: E_OUT,
    },
  );

  const r1 = parseInt(fromBg.slice(1, 3), 16);
  const g1 = parseInt(fromBg.slice(3, 5), 16);
  const b1 = parseInt(fromBg.slice(5, 7), 16);
  const r2 = parseInt(toBg.slice(1, 3), 16);
  const g2 = parseInt(toBg.slice(3, 5), 16);
  const b2 = parseInt(toBg.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  const bg = `rgb(${r},${g},${b})`;

  const textFade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);
  const textProgress = progress > 0.5 ? 1 : 0;
  const textColor2 =
    textProgress === 0
      ? r1 + g1 + b1 > 380
        ? "#000000"
        : "#ffffff"
      : r2 + g2 + b2 > 380
        ? "#000000"
        : "#ffffff";

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(textFade, fadeOut),
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor2,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// SCÈNES FORMES & LIGNES
// ═══════════════════════════════════════════════════════

// ─── LIGNE QUI SE TRACE ───────────────────────────────
export const LineDrawScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || textColor(bg);

  const lineW = interpolate(frame, [0, 32], [0, 100], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFade = interpolate(Math.max(0, frame - 28), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textY = interpolate(Math.max(0, frame - 28), [0, 24], [20, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 130, 60);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 24,
          opacity: fadeOut,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity: textFade,
            transform: `translateY(${textY}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>

        <div
          style={{
            width: `${lineW}%`,
            maxWidth: 400,
            height: 2,
            background: accent,
            borderRadius: 100,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── CERCLE / CARRÉ ───────────────────────────────────
export const ShapeScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = scene.accentColor || textColor(bg);
  const shape = scene.shape || "circle";

  const enter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 70, mass: 1 },
    from: 0,
    to: 1,
  });
  const textEnter = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 280, stiffness: 80, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const shapeScale = interpolate(enter, [0, 1], [0.4, 1]);
  const shapeOpacity = Math.min(interpolate(enter, [0, 0.3], [0, 1]), fadeOut);

  const fontSize = autoFontSize(scene.text || "", 100, 48);
  const shapeSize = 320;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: shapeSize,
            height: shapeSize,
            borderRadius: shape === "circle" ? "50%" : shape === "square" ? 20 : "50%",
            border: `1.5px solid ${accent}`,
            opacity: shapeOpacity * 0.4,
            transform: `scale(${shapeScale})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: shapeSize * 0.7,
            height: shapeSize * 0.7,
            borderRadius: shape === "circle" ? "50%" : shape === "square" ? 14 : "50%",
            border: `1px solid ${accent}`,
            opacity: shapeOpacity * 0.2,
            transform: `scale(${shapeScale * 1.1})`,
          }}
        />

        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity: Math.min(interpolate(textEnter, [0, 1], [0, 1]), fadeOut),
            transform: `scale(${interpolate(textEnter, [0, 1], [0.92, 1])})`,
            filter: `blur(${interpolate(textEnter, [0, 0.5, 1], [6, 1, 0])}px)`,
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── EXPANDING SHAPE ──────────────────────────────────
export const ExpandingShapeScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || textColor(bg);

  const expand = interpolate(
    frame,
    [0, Math.max(1, durationInFrames * 0.8)],
    [0, 1],
    {
      extrapolateRight: "clamp",
      easing: E_OUT,
    },
  );
  const textEnter = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 280, stiffness: 80, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E_IN,
    },
  );

  const fontSize = autoFontSize(scene.text || "", 130, 60);

  const circles = [
    { delay: 0, maxSize: 600, opacity: 0.08 },
    { delay: 0.1, maxSize: 900, opacity: 0.05 },
    { delay: 0.2, maxSize: 1200, opacity: 0.03 },
  ];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />

      {circles.map((c, i) => {
        const localExpand = Math.max(0, expand - c.delay);
        const size = localExpand * c.maxSize;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1px solid ${accent}`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: c.opacity * fadeOut,
            }}
          />
        );
      })}

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity: Math.min(interpolate(textEnter, [0, 1], [0, 1]), fadeOut),
            transform: `scale(${interpolate(textEnter, [0, 1], [0.92, 1])})`,
            filter: `blur(${interpolate(textEnter, [0, 0.5, 1], [6, 1, 0])}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// TRANSITIONS ENTRE SCÈNES
// ═══════════════════════════════════════════════════════

// ─── WIPE ─────────────────────────────────────────────
export const WipeScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const wipeColor = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const wipeIn = interpolate(frame, [0, 20], [100, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const wipeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 20)),
    [0, 20],
    [0, 100],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const textFade = interpolate(Math.max(0, frame - 16), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 18)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />

      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${wipeIn}%`,
          background: wipeColor,
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: `${wipeOut}%`,
          background: wipeColor,
          zIndex: 2,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity: Math.min(textFade, textFadeOut),
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── FLASH ────────────────────────────────────────────
export const FlashScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const flashColor = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const flashIn = interpolate(frame, [0, 8], [1, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const flashOut = interpolate(
    Math.max(0, frame - (durationInFrames - 8)),
    [0, 8],
    [0, 1],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const flashOpacity = Math.max(flashIn, flashOut);

  const textFade = interpolate(Math.max(0, frame - 6), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 18)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: flashColor,
          opacity: flashOpacity,
          zIndex: 2,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity: Math.min(textFade, textFadeOut),
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── FONDU COULEUR ────────────────────────────────────
export const ColorFadeScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const accentIn = interpolate(frame, [0, 16], [1, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const accentOut = interpolate(
    Math.max(0, frame - (durationInFrames - 16)),
    [0, 16],
    [0, 1],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const accentOpacity = Math.max(accentIn, accentOut);

  const textFade = interpolate(Math.max(0, frame - 12), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 18)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accent,
          opacity: accentOpacity,
          zIndex: 2,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            opacity: Math.min(textFade, textFadeOut),
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════
// 10 NOUVELLES TRANSITIONS
// ═══════════════════════════════════════════════════════

// ─── SPLIT VERTICAL ───────────────────────────────────
export const SplitVerticalScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const splitIn = interpolate(frame, [0, 28], [50, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const splitOut = interpolate(
    Math.max(0, frame - (durationInFrames - 28)),
    [0, 28],
    [0, 50],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const split = Math.max(splitIn > 0 ? 50 - splitIn : 0, splitOut);

  const textFade = interpolate(Math.max(0, frame - 24), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 24)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);
  const panelColor = isLight(bg) ? "#000000" : "#ffffff";

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${split}%`,
          background: panelColor,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${split}%`,
          background: panelColor,
          zIndex: 2,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── ZOOM TRANSITION ──────────────────────────────────
export const ZoomTransitionScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const scaleIn = interpolate(frame, [0, 30], [3, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const scaleOut = interpolate(
    Math.max(0, frame - (durationInFrames - 24)),
    [0, 24],
    [1, 0.1],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const scale = frame < durationInFrames - 24 ? scaleIn : scaleOut;

  const opacityIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const opacityOut = interpolate(
    Math.max(0, frame - (durationInFrames - 16)),
    [0, 16],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(opacityIn, opacityOut),
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── IRIS ─────────────────────────────────────────────
export const IrisScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const irisIn = interpolate(frame, [0, 32], [0, 150], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const irisOut = interpolate(
    Math.max(0, frame - (durationInFrames - 28)),
    [0, 28],
    [150, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const irisSize = Math.min(irisIn, irisOut) * 2;

  const textFade = interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 22)),
    [0, 22],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLight(bg) ? "#000000" : "#ffffff",
          clipPath: `circle(${irisSize}% at 50% 50%)`,
        }}
      >
        <PureBg bg={bg} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── CURTAIN ──────────────────────────────────────────
export const CurtainScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const curtainColor = isLight(bg) ? "#000000" : "#ffffff";

  const openIn = interpolate(frame, [0, 30], [50, 0], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const closeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 30)),
    [0, 30],
    [0, 50],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const curtain = frame < durationInFrames - 30 ? openIn : closeOut;

  const textFade = interpolate(Math.max(0, frame - 26), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 26)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${curtain}%`,
          background: curtainColor,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: `${curtain}%`,
          background: curtainColor,
          zIndex: 2,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── DIAGONAL WIPE ────────────────────────────────────
export const DiagonalWipeScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const wipeIn = interpolate(frame, [0, 30], [-150, 150], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const wipeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 30)),
    [0, 30],
    [150, 450],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const wipePos = frame < durationInFrames - 30 ? wipeIn : wipeOut;

  const textFade = interpolate(Math.max(0, frame - 22), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 22)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const panelColor = isLight(bg) ? "#000000" : "#ffffff";
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <div
        style={{
          position: "absolute",
          inset: -200,
          background: panelColor,
          transform: `translateX(${wipePos}%) rotate(-15deg)`,
          zIndex: 2,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── GLITCH SWITCH ────────────────────────────────────
export const GlitchSwitchScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const glitchIn = frame < 12;
  const glitchOut = frame > durationInFrames - 12;
  const isGlitch = glitchIn || glitchOut;

  const glitchX = isGlitch ? Math.sin(frame * 17) * 8 : 0;
  const glitchY = isGlitch ? Math.cos(frame * 13) * 4 : 0;

  const opacity = Math.min(
    interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity,
            transform: `translate(${glitchX}px, ${glitchY}px)`,
          }}
        >
          {scene.text}
        </div>
        {isGlitch && (
          <div
            style={{
              position: "absolute",
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: scene.accentColor || "#10B981",
              whiteSpace: "nowrap",
              opacity: 0.4,
              transform: `translate(${-glitchX * 1.5}px, ${glitchY}px)`,
              mixBlendMode: "screen",
            }}
          >
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── VENETIAN BLIND ───────────────────────────────────
export const VenetianScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const progress = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const exitProgress = interpolate(
    Math.max(0, frame - (durationInFrames - 30)),
    [0, 30],
    [0, 1],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const stripeCount = 8;
  const stripeH = 100 / stripeCount;
  const panelColor = isLight(bg) ? "#000000" : "#ffffff";

  const textFade = interpolate(Math.max(0, frame - 26), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 26)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);
  const p = frame < durationInFrames - 30 ? 1 - progress : exitProgress;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      {Array.from({ length: stripeCount }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${i * stripeH}%`,
            height: `${stripeH * p}%`,
            background: panelColor,
            zIndex: 2,
          }}
        />
      ))}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── SCALE WIPE ───────────────────────────────────────
export const ScaleWipeScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const scaleIn = interpolate(frame, [0, 28], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const scaleOut = interpolate(
    Math.max(0, frame - (durationInFrames - 24)),
    [0, 24],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const scale = frame < durationInFrames - 24 ? scaleIn : scaleOut;

  const textFade = interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 20)),
    [0, 18],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill
      style={{
        background: isLight(bg) ? "#000000" : "#ffffff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bg,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <PureBg bg={bg} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── PIXEL DISSOLVE ───────────────────────────────────
export const PixelDissolveScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";

  const progress = interpolate(frame, [0, 35], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const exitProgress = interpolate(
    Math.max(0, frame - (durationInFrames - 28)),
    [0, 28],
    [0, 1],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const cols = 12;
  const rows = 20;
  const panelColor = isLight(bg) ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)";

  const textFade = interpolate(Math.max(0, frame - 28), [0, 16], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 20)),
    [0, 20],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const p = frame < durationInFrames - 28 ? 1 - progress : exitProgress;
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          zIndex: 2,
        }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const seed = (i * 2654435761) % (cols * rows);
          const threshold = seed / (cols * rows);
          const visible = p > threshold;
          return (
            <div
              key={i}
              style={{
                background: visible ? panelColor : "transparent",
              }}
            />
          );
        })}
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 1 }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── LIGHT SWEEP ──────────────────────────────────────
export const LightSweepScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const sweepX = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [-20, 120],
    {
      extrapolateRight: "clamp",
      easing: Easing.linear,
    },
  );

  const textFade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - (durationInFrames - 22)),
    [0, 22],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const lightColor = isLight(bg) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)";
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, transparent ${sweepX - 15}%, ${lightColor} ${sweepX}%, transparent ${sweepX + 15}%)`,
          zIndex: 1,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 2 }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
