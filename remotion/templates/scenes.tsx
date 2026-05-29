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
    | "multistats";
  text?: string;
  bg?: string;
  accentColor?: string;
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
