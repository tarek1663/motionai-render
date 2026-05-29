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
    | "morphweight"
    | "fadepure"
    | "tracking"
    | "rotatein";
  text?: string;
  bg?: string;
  accentColor?: string;
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

// ─── 11. MORPH WEIGHT ─────────────────────────────────
export const MorphWeightScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
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

  const fontWeight = Math.round(interpolate(progress, [0, 1], [100, 700]));
  const opacity = Math.min(interpolate(progress, [0, 0.15], [0, 1]), fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <PureBg bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight,
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
