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
    | "pixeldissolve"
    | "lightsweep"
    | "notification"
    | "pulsebutton"
    | "uiprogress"
    | "quote"
    | "timeline"
    | "socialstats"
    | "checklist"
    | "audioviz"
    | "colorletters"
    | "gradient"
    | "hierarchytext"
    | "spotlight"
    | "noise"
    | "gradienttext"
    | "eraseletters"
    | "splitlines"
    | "bgnumber"
    | "twolines"
    | "iphone"
    | "macbook"
    | "doubledevice"
    | "browser"
    | "dashboard"
    | "chat"
    | "network"
    | "dataflow"
    | "worldmap"
    | "horizontaltimeline"
    | "weightreveal";
  text?: string;
  durationFrames?: number;
  url?: string;
  dashTitle?: string;
  messages?: Array<{ text: string; isUser: boolean }>;
  events?: Array<{ year: string; label: string }>;
  textAccent?: boolean;
  bg2?: string;
  color2?: string;
  bgNumber?: string;
  line1?: string;
  line2?: string;
  notifText?: string;
  notifTitle?: string;
  notifIcon?: string;
  buttonText?: string;
  author?: string;
  steps?: Array<{ number: string; label: string }> | string[];
  platform?: string;
  statLabel?: string;
  items?: string[];
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
  websiteUrl?: string;
  mockupContent?: string;
  mockupData?: {
    type?: string;
    color?: string;
    [key: string]: unknown;
  };
  aiUI?: {
    appName?: string;
    primaryColor?: string;
    bgColor?: string;
    textColor?: string;
    elements?: Array<Record<string, unknown>>;
  };
  geo?:
    | "dots"
    | "grid"
    | "diagonal"
    | "circles"
    | "perspective"
    | "hex"
    | "cross"
    | "lines"
    | "radial"
    | string;
  _duration?: number;
  _index?: number;
  [key: string]: unknown;
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
const isLight = (hex: string): boolean => {
  try {
    const h = hex.replace("#", "");
    if (h.length < 6) return true;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  } catch {
    return true;
  }
};

const textColor = (bg: string): string => (isLight(bg) ? "#000000" : "#ffffff");

const safeAccent = (accentColor: string | undefined, bg: string): string =>
  accentColor || (isLight(bg) ? "#000000" : "#ffffff");

const mainTextColor = (scene: SceneData, bg: string): string =>
  scene.textAccent ? safeAccent(scene.accentColor, bg) : textColor(bg);

const mainTextShadow = (bg: string): string =>
  isLight(bg) ? "0 2px 12px rgba(0,0,0,0.08)" : "0 2px 20px rgba(0,0,0,0.4)";

const safeFadeOut = (frame: number, durationInFrames: number, duration = 22) => {
  const start = Math.max(0, durationInFrames - duration);
  const end = Math.max(start + 1, durationInFrames);
  return interpolate(frame, [start, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_IN,
  });
};

const safeFadeIn = (frame: number, duration = 24) => {
  return interpolate(frame, [0, Math.max(1, duration)], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
};

const useAppleTiming = (enterDuration = 24, pauseRatio = 0.6) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const safeDuration = Math.max(2, durationInFrames);
  const fadeIn = interpolate(frame, [0, Math.max(1, enterDuration)], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });

  const exitStart = Math.max(enterDuration + 1, Math.floor(safeDuration * pauseRatio));
  const exitEnd = Math.max(exitStart + 1, safeDuration);

  const fadeOut = interpolate(frame, [exitStart, exitEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_IN,
  });

  return {
    opacity: Math.min(fadeIn, fadeOut),
    isEntering: frame < enterDuration,
    isExiting: frame > exitStart,
    progress: fadeIn,
  };
};

const useAppleMicroZoom = (intensity = 0.015) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [0, Math.max(1, durationInFrames)], [1.0, 1.0 + intensity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const MotionBlurWrapper: React.FC<{
  children: React.ReactNode;
  velocityX?: number;
  velocityY?: number;
  active?: boolean;
}> = ({ children, velocityX = 0, velocityY = 0, active = true }) => {
  if (!active) return <>{children}</>;

  const blurAmount = Math.min(8, Math.abs(velocityX) * 0.3 + Math.abs(velocityY) * 0.3);

  return (
    <div
      style={{
        filter: blurAmount > 0.5 ? `blur(${blurAmount * 0.4}px)` : "none",
      }}
    >
      {children}
    </div>
  );
};

export const DynamicVignette: React.FC<{
  strength?: number;
  dynamic?: boolean;
}> = ({ strength = 0.3, dynamic = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const dynamicStrength = dynamic
    ? (() => {
        const d = Math.max(2, durationInFrames);
        const range: number[] = [0];
        const push = (v: number) => {
          const next = Math.min(Math.max(v, range[range.length - 1] + 1), d);
          if (next > range[range.length - 1]) range.push(next);
        };
        push(Math.min(20, Math.floor(d * 0.4)));
        push(Math.floor(d * 0.5));
        push(Math.max(range[range.length - 1] + 1, d - 20));
        if (range[range.length - 1] < d) range.push(d);
        const output = range.map((_, i) => {
          if (i === 0) return 0;
          if (i === range.length - 1) return 0;
          if (i === Math.floor(range.length / 2)) return strength * 0.4;
          return strength * 0.8;
        });
        return interpolate(frame, range, output, {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
      })()
    : strength;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center,
        transparent 40%,
        rgba(0,0,0,${dynamicStrength}) 100%)`,
        zIndex: 10,
      }}
    />
  );
};

const SceneGeoBackground: React.FC<{
  bg: string;
  geo?: string;
  depthOfField?: boolean;
}> = ({ bg, geo, depthOfField = false }) => {
  const frame = useCurrentFrame();
  const depthBlur = depthOfField
    ? interpolate(frame, [0, 24], [6, 0], {
        extrapolateRight: "clamp",
        easing: E_OUT,
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter: depthBlur > 0 ? `blur(${depthBlur}px)` : undefined,
      }}
    >
      <GeoBackground bg={bg} geo={geo} />
    </div>
  );
};

const getUIProgressStepLabels = (scene: SceneData): string[] => {
  const raw = scene.steps;
  if (!Array.isArray(raw) || raw.length === 0) {
    return ["Étape 1", "Étape 2", "Étape 3"];
  }
  if (typeof raw[0] === "string") {
    return raw;
  }
  return raw.map((s) => s.label);
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

// ═══════════════════════════════════════════════════════
// FOND GÉOMÉTRIQUE DYNAMIQUE
// ═══════════════════════════════════════════════════════

const GeoBackground: React.FC<{ bg: string; geo?: string }> = ({ bg, geo }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = useAppleMicroZoom(0.015);
  const scale = zoom;

  const r = parseInt(bg.replace("#", "").slice(0, 2), 16) || 0;
  const g = parseInt(bg.replace("#", "").slice(2, 4), 16) || 0;
  const b = parseInt(bg.replace("#", "").slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  const patternColor =
    luminance > 0.5 ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)";

  const rotation = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const base: React.CSSProperties = {
    position: "absolute",
    inset: -10,
    background: bg,
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  };

  if (!geo || geo === "none") {
    return <div style={base} />;
  }

  if (geo === "circles") {
    return (
      <div style={base}>
        {[120, 240, 360, 480, 620, 760].map((radius, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: radius * 2,
              height: radius * 2,
              borderRadius: "50%",
              border: `1px solid ${patternColor}`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>
    );
  }

  if (geo === "perspective") {
    return (
      <div style={{ ...base, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: -400,
            backgroundImage: `
            linear-gradient(${patternColor} 1px, transparent 1px),
            linear-gradient(90deg, ${patternColor} 1px, transparent 1px)
          `,
            backgroundSize: "60px 60px",
            transform: `perspective(600px) rotateX(55deg) translateY(40%)`,
            transformOrigin: "center bottom",
          }}
        />
      </div>
    );
  }

  const patterns: Record<string, React.CSSProperties> = {
    dots: {
      ...base,
      backgroundImage: `radial-gradient(circle, ${patternColor} 1.5px, transparent 1.5px)`,
      backgroundSize: "40px 40px",
      transform: `scale(${scale}) rotate(${rotation}deg)`,
    },
    grid: {
      ...base,
      backgroundImage: `
        linear-gradient(${patternColor} 1px, transparent 1px),
        linear-gradient(90deg, ${patternColor} 1px, transparent 1px)
      `,
      backgroundSize: "56px 56px",
      transform: `scale(${scale}) rotate(${rotation}deg)`,
    },
    diagonal: {
      ...base,
      backgroundImage: `repeating-linear-gradient(
        45deg,
        ${patternColor} 0px, ${patternColor} 1px,
        transparent 1px, transparent 40px
      )`,
    },
    hex: {
      ...base,
      backgroundImage: `
        radial-gradient(circle, ${patternColor} 1.5px, transparent 1.5px),
        radial-gradient(circle, ${patternColor} 1.5px, transparent 1.5px)
      `,
      backgroundSize: "30px 52px",
      backgroundPosition: "0 0, 15px 26px",
    },
    cross: {
      ...base,
      backgroundImage: `
        linear-gradient(${patternColor} 2px, transparent 2px),
        linear-gradient(90deg, ${patternColor} 2px, transparent 2px),
        linear-gradient(${patternColor} 1px, transparent 1px),
        linear-gradient(90deg, ${patternColor} 1px, transparent 1px)
      `,
      backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
      backgroundPosition: "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
      transform: `scale(${scale}) rotate(${rotation}deg)`,
    },
    lines: {
      ...base,
      backgroundImage: `repeating-linear-gradient(
        0deg,
        ${patternColor} 0px, ${patternColor} 1px,
        transparent 1px, transparent 48px
      )`,
    },
    radial: {
      ...base,
      backgroundImage: `
        radial-gradient(ellipse 70% 60% at 50% 50%,
          ${luminance > 0.5 ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"} 0%,
          transparent 100%
        )
      `,
    },
  };

  return <div style={patterns[geo] || base} />;
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
  const { opacity: fadeOut } = useAppleTiming();

  const opacity = Math.min(fadeIn, fadeOut);
  const scale = interpolate(enter, [0, 1], [0.84, 1]);
  const blur = interpolate(enter, [0, 0.6, 1], [10, 2, 0]);
  const y = interpolate(enter, [0, 1], [30, 0]);

  const word = scene.text || "";
  const fontSize = autoFontSize(word, 180, 80);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
                color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  const x = interpolate(enter, [0, 1], [-180, 0]);
  const opacity = Math.min(fadeIn, fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);
  const velocity = interpolate(enter, [0, 0.3], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <MotionBlurWrapper velocityX={velocity * 40} active={frame < 20}>
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: mainTextColor(scene, bg),
              textShadow: mainTextShadow(bg),
              opacity,
              transform: `translateX(${x}px)`,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {scene.text}
          </div>
        </MotionBlurWrapper>
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
  const { opacity: fadeOut } = useAppleTiming();

  const scale = interpolate(progress, [0, 1], [1.35, 1]);
  const blur = interpolate(progress, [0, 0.6, 1], [18, 4, 0]);
  const opacity = Math.min(interpolate(progress, [0, 0.25], [0, 1]), fadeOut);

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const words = text.trim().split(/\s+/).filter(Boolean);
  const fontSize = autoFontSize(text, 160, 72);
  const { opacity: fadeOut } = useAppleTiming();
  const fadeUpWordStarts = words.reduce<number[]>((starts, word, wi) => {
    starts.push(wi === 0 ? 0 : starts[wi - 1] + words[wi - 1].length);
    return starts;
  }, []);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.3em", flexWrap: "wrap", justifyContent: "center", whiteSpace: "nowrap" }}>
          {words.map((word, wi) => (
              <span key={wi} style={{ display: "inline-flex" }}>
                {word.split("").map((letter, i) => {
                  const delay = (fadeUpWordStarts[wi] + i) * 4;
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
                        color: mainTextColor(scene, bg),
                        textShadow: mainTextShadow(bg),
                        display: "inline-block",
                        opacity: interpolate(enter, [0, 1], [0, 1]),
                        transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
                        filter: `blur(${interpolate(enter, [0, 0.5, 1], [6, 1, 0])}px)`,
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
          ))}
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
  const { opacity: fadeOut } = useAppleTiming();

  const blur = interpolate(progress, [0, 1], [40, 0]);
  const opacity = Math.min(interpolate(progress, [0, 0.2], [0, 1]), fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  const scale = interpolate(enter, [0, 1], [0.3, 1]);
  const opacity = Math.min(interpolate(enter, [0, 0.3], [0, 1]), fadeOut);
  const blur = interpolate(enter, [0, 0.5, 1], [12, 3, 0]);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  const y = interpolate(enter, [0, 1], [120, 0]);
  const opacity = Math.min(interpolate(enter, [0, 0.2], [0, 1]), fadeOut);
  const fontSize = autoFontSize(scene.text || "", 160, 72);
  const velocity = interpolate(enter, [0, 0.3], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <MotionBlurWrapper velocityY={velocity * 40} active={frame < 20}>
          <div
            style={{
              fontSize,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: mainTextColor(scene, bg),
              textShadow: mainTextShadow(bg),
              opacity,
              transform: `translateY(${y}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {scene.text}
          </div>
        </MotionBlurWrapper>
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
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
              color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.3em", whiteSpace: "nowrap", flexWrap: "wrap", justifyContent: "center" }}>
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
                  color: mainTextColor(scene, bg),
                  textShadow: mainTextShadow(bg),
                  display: "inline-block",
                  marginRight: "0.05em",
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

  const fadeIn = safeFadeIn(frame, 30);
  const fadeOut = safeFadeOut(frame, durationInFrames, 24);

  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const bg = scene.bg || "#ffffff";

  const tracking = interpolate(frame, [0, 40], [0.12, -0.03], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const scaleCompensate = interpolate(frame, [0, 40], [0.88, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const { opacity: appleOpacity } = useAppleTiming();
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: `${tracking}em`,
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
            opacity: Math.min(
              interpolate(frame, [0, 20], [0, 1], {
                extrapolateRight: "clamp",
                easing: E_OUT,
              }),
              appleOpacity,
            ),
            transform: `scale(${scaleCompensate})`,
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
  const { opacity: fadeOut } = useAppleTiming();

  const rotate = interpolate(enter, [0, 1], [-6, 0]);
  const opacity = Math.min(interpolate(enter, [0, 0.2], [0, 1]), fadeOut);
  const y = interpolate(enter, [0, 1], [30, 0]);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming(20);
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

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
      <SceneGeoBackground bg={bg} geo={scene.geo} depthOfField />
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
              color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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

  const { opacity: fadeOut } = useAppleTiming();

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
      <SceneGeoBackground bg={bg} geo={scene.geo} depthOfField />
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
              color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();
  const opacity = Math.min(fadeIn, fadeOut);

  const displayValue =
    current >= 1000
      ? `${(current / 1000).toFixed(current % 1000 === 0 ? 0 : 1)}K`
      : current.toLocaleString("fr-FR");

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();
  const opacity = Math.min(fadeIn, fadeOut);

  const barWidth = interpolate(frame, [8, Math.max(9, durationInFrames * 0.75)], [0, target], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 120px",
          flexDirection: "column",
          gap: 24,
          opacity,
          textAlign: "center",
        }}
      >
        {scene.text && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              fontFamily: FONT,
              letterSpacing: "-0.02em",
              color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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

  const { opacity: fadeOut } = useAppleTiming();

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
                  color: mainTextColor(scene, bg),
                  textShadow: mainTextShadow(bg),
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

  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", flexWrap: "wrap", justifyContent: "center" }}>
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
                  marginRight: "0.05em",
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
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
              color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

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
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 130, 60);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  const shapeScale = interpolate(enter, [0, 1], [0.4, 1]);
  const shapeOpacity = Math.min(interpolate(enter, [0, 0.3], [0, 1]), fadeOut);

  const fontSize = autoFontSize(scene.text || "", 100, 48);
  const shapeSize = 320;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 130, 60);

  const circles = [
    { delay: 0, maxSize: 600, opacity: 0.08 },
    { delay: 0.1, maxSize: 900, opacity: 0.05 },
    { delay: 0.2, maxSize: 1200, opacity: 0.03 },
  ];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 20)),
    [0, Math.max(1, 20)],
    [0, 100],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const textFade = interpolate(Math.max(0, frame - 16), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 18)),
    [0, Math.max(1, 18)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 8)),
    [0, Math.max(1, 8)],
    [0, 1],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const flashOpacity = Math.max(flashIn, flashOut);

  const textFade = interpolate(Math.max(0, frame - 6), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 18)),
    [0, Math.max(1, 18)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 16)),
    [0, Math.max(1, 16)],
    [0, 1],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const accentOpacity = Math.max(accentIn, accentOut);

  const textFade = interpolate(Math.max(0, frame - 12), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 18)),
    [0, Math.max(1, 18)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 28)),
    [0, Math.max(1, 28)],
    [0, 50],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const split = Math.max(splitIn > 0 ? 50 - splitIn : 0, splitOut);

  const textFade = interpolate(Math.max(0, frame - 24), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 24)),
    [0, Math.max(1, 18)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);
  const panelColor = isLight(bg) ? "#000000" : "#ffffff";

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 24)),
    [0, Math.max(1, 24)],
    [1, 0.1],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const scale = frame < durationInFrames - 24 ? scaleIn : scaleOut;

  const opacityIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const opacityOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 16)),
    [0, Math.max(1, 16)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 28)),
    [0, Math.max(1, 28)],
    [150, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const irisSize = Math.min(irisIn, irisOut) * 2;

  const textFade = interpolate(Math.max(0, frame - 20), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 22)),
    [0, Math.max(1, 22)],
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
        <GeoBackground bg={bg} geo={scene.geo} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 30)),
    [0, Math.max(1, 30)],
    [0, 50],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const curtain = frame < durationInFrames - 30 ? openIn : closeOut;

  const textFade = interpolate(Math.max(0, frame - 26), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 26)),
    [0, Math.max(1, 18)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 30)),
    [0, Math.max(1, 30)],
    [150, 450],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const wipePos = frame < durationInFrames - 30 ? wipeIn : wipeOut;

  const textFade = interpolate(Math.max(0, frame - 22), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 22)),
    [0, Math.max(1, 18)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const panelColor = isLight(bg) ? "#000000" : "#ffffff";
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    safeFadeOut(frame, durationInFrames, 10),
  );

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 28)),
    [0, Math.max(1, 28)],
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
    Math.max(0, frame - Math.max(0, durationInFrames - 20)),
    [0, Math.max(1, 20)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const p = frame < durationInFrames - 28 ? 1 - progress : exitProgress;
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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
    Math.max(0, frame - Math.max(0, durationInFrames - 22)),
    [0, Math.max(1, 22)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const lightColor = isLight(bg) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)";
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
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
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
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

// ═══════════════════════════════════════════════════════
// SCÈNES ÉLÉMENTS UI
// ═══════════════════════════════════════════════════════

// ─── 1. NOTIFICATION ──────────────────────────────────
export const NotificationScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = scene.accentColor || "#10B981";

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 100, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const slideOut = spring({
    frame: Math.max(0, frame - Math.max(0, durationInFrames - 36)),
    fps,
    config: { damping: 280, stiffness: 100, mass: 0.8 },
    from: 0,
    to: 1,
  });

  const y = interpolate(slideIn, [0, 1], [-200, 0]);
  const yOut = interpolate(slideOut, [0, 1], [0, -200]);
  const opacity = Math.min(
    interpolate(slideIn, [0, 0.2], [0, 1]),
    interpolate(slideOut, [0, 0.2], [1, 0]),
  );

  const textFade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const textFadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 22)),
    [0, Math.max(1, 22)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );
  const fontSize = autoFontSize(scene.text || "", 80, 40);
  const notifTitle = scene.notifTitle || "Motionr";
  const notifText = scene.notifText || "Notification";
  const notifIcon = scene.notifIcon || "🎬";

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 600,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
            whiteSpace: "nowrap",
            opacity: Math.min(textFade, textFadeOut),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: isLight(bg)
              ? "rgba(255,255,255,0.95)"
              : "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "85%",
            maxWidth: 460,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"}`,
            transform: `translateY(${y + yOut}px)`,
            opacity,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: accent,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            {notifIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: FONT,
                color: isLight(bg) ? "#000000" : "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              {notifTitle}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                fontFamily: FONT,
                color: isLight(bg) ? "#000000" : "#ffffff",
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notifText}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: isLight(bg) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
              fontFamily: FONT,
              flexShrink: 0,
            }}
          >
            maintenant
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 2. BOUTON PULSE ──────────────────────────────────
export const PulseButtonScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const enter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80, mass: 0.8 },
    from: 0,
    to: 1,
  });

  const pulse = 1 + Math.sin(frame * 0.12) * 0.04;
  const glowPulse = 0.3 + Math.sin(frame * 0.12) * 0.15;

  const fadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 22)),
    [0, Math.max(1, 22)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const scale = interpolate(enter, [0, 1], [0.7, 1]) * pulse;
  const opacity = Math.min(interpolate(enter, [0, 0.3], [0, 1]), fadeOut);

  const textFade = interpolate(Math.max(0, frame - 16), [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });

  const fontSize = autoFontSize(scene.text || "", 80, 40);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 40,
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
              color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
              whiteSpace: "nowrap",
              opacity: Math.min(textFade, fadeOut),
              transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
            }}
          >
            {scene.text}
          </div>
        )}

        <div
          style={{
            position: "relative",
            transform: `scale(${scale})`,
            opacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: 100,
              background: accent,
              filter: "blur(20px)",
              opacity: glowPulse * 0.3,
            }}
          />
          <div
            style={{
              position: "relative",
              background: accent,
              borderRadius: 100,
              padding: "18px 48px",
              boxShadow: `0 8px 32px ${accent}44`,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: FONT,
                letterSpacing: "-0.02em",
                color: isLight(accent) ? "#000000" : "#ffffff",
                whiteSpace: "nowrap",
              }}
            >
              {scene.buttonText || "Commencer →"}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 3. UI PROGRESS ───────────────────────────────────
export const UIProgressScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");

  const cardEnter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 70, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const fadeOut = interpolate(
    Math.max(0, frame - Math.max(0, durationInFrames - 22)),
    [0, Math.max(1, 22)],
    [1, 0],
    { extrapolateRight: "clamp", easing: E_IN },
  );

  const barProgress = interpolate(
    Math.max(0, frame - 20),
    [0, Math.max(1, durationInFrames * 0.6)],
    [0, 100],
    { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  const cardOpacity = Math.min(interpolate(cardEnter, [0, 1], [0, 1]), fadeOut);
  const cardY = interpolate(cardEnter, [0, 1], [40, 0]);
  const cardScale = interpolate(cardEnter, [0, 1], [0.94, 1]);
  const steps = getUIProgressStepLabels(scene);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", padding: "0 80px" }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: isLight(bg)
              ? "rgba(255,255,255,0.95)"
              : "rgba(20,20,20,0.95)",
            borderRadius: 24,
            padding: "32px",
            border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
            boxShadow: isLight(bg)
              ? "0 24px 60px rgba(0,0,0,0.08)"
              : "0 24px 60px rgba(0,0,0,0.4)",
            opacity: cardOpacity,
            transform: `translateY(${cardY}px) scale(${cardScale})`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: FONT,
                letterSpacing: "-0.03em",
                color: isLight(bg) ? "#000000" : "#ffffff",
              }}
            >
              {scene.text || "Génération vidéo"}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: FONT,
                color: accent,
              }}
            >
              {Math.round(barProgress)}%
            </div>
          </div>

          <div
            style={{
              height: 4,
              borderRadius: 100,
              background: isLight(bg)
                ? "rgba(0,0,0,0.08)"
                : "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barProgress}%`,
                height: "100%",
                background: accent,
                borderRadius: 100,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20,
              gap: 8,
            }}
          >
            {steps.map((step, i) => {
              const stepDone = barProgress > (i + 1) * (100 / steps.length);
              return (
                <div
                  key={step}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: stepDone ? 600 : 400,
                    fontFamily: FONT,
                    color: stepDone
                      ? accent
                      : isLight(bg)
                        ? "rgba(0,0,0,0.3)"
                        : "rgba(255,255,255,0.3)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {stepDone ? "✓ " : ""}
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCÈNES UNIVERSELLES
// ═══════════════════════════════════════════════════════════

const sceneOpacity = (
  frame: number,
  durationInFrames: number,
  enterDuration = 24,
  pauseRatio = 0.6,
): number => {
  const safeDuration = Math.max(2, durationInFrames);
  const fadeIn = interpolate(frame, [0, Math.max(1, enterDuration)], [0, 1], {
    extrapolateRight: "clamp",
    easing: E_OUT,
  });
  const exitStart = Math.max(enterDuration + 1, Math.floor(safeDuration * pauseRatio));
  const exitEnd = Math.max(exitStart + 1, safeDuration);
  const fadeOut = interpolate(frame, [exitStart, exitEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: E_IN,
  });
  return Math.min(fadeIn, fadeOut);
};

const PlatformIcon: React.FC<{ platform: string; size?: number }> = ({
  platform,
  size = 28,
}) => {
  const p = (platform || "instagram").toLowerCase();
  const common: React.CSSProperties = {
    width: size,
    height: size,
    display: "block",
  };
  if (p === "youtube") {
    return (
      <svg viewBox="0 0 24 24" style={common} fill="currentColor">
        <path d="M23 7.5a3 3 0 0 0-2.1-2.1C19.5 5 12 5 12 5s-7.5 0-8.9.4A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.5 3 3 0 0 0 3.1 18.6C4.5 19 12 19 12 19s7.5 0 8.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5z" />
        <path fill="#fff" d="M10 15.5v-7l6 3.5-6 3.5z" />
      </svg>
    );
  }
  if (p === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" style={common} fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    );
  }
  if (p === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" style={common} fill="currentColor">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45z" />
      </svg>
    );
  }
  if (p === "x" || p === "twitter") {
    return (
      <svg viewBox="0 0 24 24" style={common} fill="currentColor">
        <path d="M18.9 2.25h3.68l-8.04 9.19L24 21.75h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 2.25h7.59l5.24 6.93 6.07-6.93zm-1.29 17.52h2.04L6.51 4.24H4.32l13.29 15.53z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" style={common} fill="currentColor">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.87.35 4.1.63c-.78.3-1.44.7-2.1 1.36-.66.66-1.06 1.32-1.36 2.1-.28.77-.5 1.68-.56 2.95C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.28 2.18.56 2.95.3.78.7 1.44 1.36 2.1.66.66 1.32 1.06 2.1 1.36.77.28 1.68.5 2.95.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.18-.28 2.95-.56.78-.3 1.44-.7 2.1-1.36.66-.66 1.06-1.32 1.36-2.1.28-.77.5-1.68.56-2.95.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.28-2.18-.56-2.95-.3-.78-.7-1.44-1.36-2.1-.66-.66-1.32-1.06-2.1-1.36-.77-.28-1.68-.5-2.95-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a3.99 3.99 0 1 1 0-7.98 3.99 3.99 0 0 1 0 7.98zm6.41-11.55a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    </svg>
  );
};

export const QuoteScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#f5f5f7";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");
  const opacity = sceneOpacity(frame, durationInFrames);
  const quote = scene.text || "La simplicité est la sophistication suprême.";
  const author = scene.author || "";

  const lineH = spring({
    frame: frame - 4,
    fps,
    config: { damping: 200, stiffness: 120 },
    from: 0,
    to: 1,
  });

  const contentY = interpolate(
    spring({ frame, fps, config: { damping: 220, stiffness: 90 }, from: 0, to: 1 }),
    [0, 1],
    [24, 0],
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 100px",
          opacity,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 32,
            maxWidth: 900,
            transform: `translateY(${contentY}px)`,
          }}
        >
          <div
            style={{
              width: 4,
              borderRadius: 4,
              flexShrink: 0,
              background: accent,
              alignSelf: "stretch",
              transform: `scaleY(${lineH})`,
              transformOrigin: "top",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                fontSize: autoFontSize(quote, 52, 32),
                fontWeight: 500,
                fontFamily: FONT,
                letterSpacing: "-0.02em",
                lineHeight: 1.35,
                color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
              }}
            >
              &ldquo;{quote}&rdquo;
            </div>
            {author ? (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: FONT,
                  color: accent,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {author}
              </div>
            ) : null}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TimelineScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");
  const opacity = sceneOpacity(frame, durationInFrames);
  const steps = (() => {
    const raw = scene.steps;
    if (!Array.isArray(raw) || raw.length === 0) {
      return [
        { number: "01", label: "Découverte" },
        { number: "02", label: "Création" },
        { number: "03", label: "Livraison" },
      ];
    }
    if (typeof raw[0] === "string") {
      return raw.map((label, i) => ({
        number: String(i + 1).padStart(2, "0"),
        label,
      }));
    }
    return raw;
  })();

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 120px",
          opacity,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%", alignItems: "center" }}>
          {steps.map((step, i) => {
            const enter = spring({
              frame: frame - i * 10,
              fps,
              config: { damping: 200, stiffness: 90 },
              from: 0,
              to: 1,
            });
            const x = interpolate(enter, [0, 1], [-40, 0]);
            return (
              <div
                key={`${step.number}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  opacity: enter,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `2px solid ${accent}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: FONT,
                    color: accent,
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    fontFamily: FONT,
                    letterSpacing: "-0.02em",
                    color: mainTextColor(scene, bg),
                  textShadow: mainTextShadow(bg),
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SocialStatsScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");
  const opacity = sceneOpacity(frame, durationInFrames);
  const platform = scene.platform || "instagram";
  const target = scene.counterTo ?? 10000;
  const statLabel = scene.statLabel || "Abonnés";

  const progress = interpolate(
    frame,
    [12, Math.max(13, durationInFrames * 0.7)],
    [0, 1],
    { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  const current = Math.round(target * progress);
  const displayValue =
    current >= 1000000
      ? `${(current / 1000000).toFixed(current % 1000000 === 0 ? 0 : 1)}M`
      : current >= 1000
        ? `${(current / 1000).toFixed(current % 1000 === 0 ? 0 : 1)}K`
        : current.toLocaleString("fr-FR");

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 16,
          opacity,
        }}
      >
        <div style={{ color: accent, marginBottom: 8 }}>
          <PlatformIcon platform={platform} size={40} />
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.06em",
            color: mainTextColor(scene, bg),
            textShadow: mainTextShadow(bg),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayValue}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            fontFamily: FONT,
            color: isLight(bg) ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)",
            letterSpacing: "0.02em",
          }}
        >
          {statLabel}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ChecklistScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#34c759");
  const opacity = sceneOpacity(frame, durationInFrames);
  const items = scene.items?.length
    ? scene.items
    : ["Script validé", "Voix off", "Export 4K"];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 120px",
          opacity,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", width: "100%" }}>
          {items.map((item, i) => {
            const enter = spring({
              frame: frame - i * 8,
              fps,
              config: { damping: 200, stiffness: 100 },
              from: 0,
              to: 1,
            });
            const checked = enter > 0.85;
            return (
              <div
                key={`${item}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: enter,
                  transform: `translateX(${interpolate(enter, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `2px solid ${checked ? accent : isLight(bg) ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"}`,
                    background: checked ? accent : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: checked ? (isLight(accent) ? "#000" : "#fff") : "transparent",
                  }}
                >
                  {checked ? "✓" : ""}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                    fontFamily: FONT,
                    letterSpacing: "-0.02em",
                    color: mainTextColor(scene, bg),
                  textShadow: mainTextShadow(bg),
                  }}
                >
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AudioVizScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = scene.accentColor || (isLight(bg) ? "#000000" : "#ffffff");
  const opacity = sceneOpacity(frame, durationInFrames);
  const bars = 24;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            height: 200,
          }}
        >
          {Array.from({ length: bars }).map((_, i) => {
            const h =
              24 +
              Math.abs(
                Math.sin((frame / 8) * (1 + i * 0.15) + i * 0.5) *
                  Math.cos((frame / 14) + i * 0.3),
              ) *
                140;
            return (
              <div
                key={i}
                style={{
                  width: 8,
                  height: h,
                  borderRadius: 4,
                  background: accent,
                  opacity: 0.35 + (i / bars) * 0.65,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── COLOR LETTERS ────────────────────────────────────
export const ColorLettersScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);
  const words = (scene.text || "").trim().split(/\s+/).filter(Boolean);
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  const { opacity: fadeOut } = useAppleTiming();
  const colorWordStarts = words.reduce<number[]>((starts, word, wi) => {
    starts.push(wi === 0 ? 0 : starts[wi - 1] + words[wi - 1].length);
    return starts;
  }, []);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.3em", flexWrap: "wrap", justifyContent: "center", whiteSpace: "nowrap" }}>
          {words.map((word, wi) => (
              <span key={wi} style={{ display: "inline-flex" }}>
                {word.split("").map((letter, i) => {
                  const globalIndex = colorWordStarts[wi] + i;
                  const delay = globalIndex * 5;
                  const enter = spring({
                    frame: Math.max(0, frame - delay),
                    fps,
                    config: { damping: 280, stiffness: 100, mass: 0.7 },
                    from: 0,
                    to: 1,
                  });

                  const isColorLetter = globalIndex % 2 === 0;
                  const color = isColorLetter ? accent : textColor(bg);

                  return (
                    <span
                      key={i}
                      style={{
                        fontSize,
                        fontWeight: 700,
                        fontFamily: FONT,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        color,
                        display: "inline-block",
                        opacity: interpolate(enter, [0, 1], [0, 1]),
                        transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
                        filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
                        textShadow: mainTextShadow(bg),
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── GRADIENT ─────────────────────────────────────────
export const GradientScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg1 = scene.bg || "#000000";
  const bg2 = scene.bg2 || scene.accentColor || "#1a1a1a";

  const angle = interpolate(frame, [0, Math.max(1, durationInFrames)], [135, 165], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const enter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80 },
    from: 0,
    to: 1,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  const r1 = parseInt(bg1.replace("#", "").slice(0, 2), 16) || 0;
  const g1 = parseInt(bg1.replace("#", "").slice(2, 4), 16) || 0;
  const b1 = parseInt(bg1.replace("#", "").slice(4, 6), 16) || 0;
  const lum = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
  const tColor = lum > 0.5 ? "#000000" : "#ffffff";

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${bg1}, ${bg2})`,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: tColor,
            whiteSpace: "nowrap",
            opacity: Math.min(interpolate(enter, [0, 1], [0, 1]), fadeOut),
            transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])}) translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
            filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
            textShadow: "0 2px 20px rgba(0,0,0,0.15)",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── HIERARCHY TEXT ───────────────────────────────────
export const HierarchyTextScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);
  const words = (scene.text || "").split(" ");
  const { opacity: fadeOut } = useAppleTiming();

  const sizes = words.map((_, i) => {
    if (i === 0) return 160;
    if (i === 1) return 100;
    return 72;
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div style={{ display: "flex", gap: "0.3em", flexWrap: "wrap", justifyContent: "center", padding: "0 80px", textAlign: "center" }}>
          {words.map((word, i) => {
            const enter = spring({
              frame: Math.max(0, frame - i * 10),
              fps,
              config: { damping: 280, stiffness: 80, mass: 0.8 },
              from: 0,
              to: 1,
            });
            return (
              <span
                key={i}
                style={{
                  fontSize: sizes[i] || 72,
                  fontWeight: i === 0 ? 900 : 600,
                  fontFamily: FONT,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: i === 0 ? accent : textColor(bg),
                  display: "inline-block",
                  marginRight: "0.05em",
                  opacity: interpolate(enter, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
                  filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
                  textShadow: mainTextShadow(bg),
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

// ─── SPOTLIGHT ────────────────────────────────────────
export const SpotlightScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const enter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80 },
    from: 0,
    to: 1,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const spotSize = interpolate(enter, [0, 1], [0, 120]);
  const spotOpacity = interpolate(enter, [0, 0.3], [0, 1]);

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse ${spotSize}% ${spotSize * 0.6}% at 50% 45%,
          ${isLight(bg) ? "rgba(0,0,0,0.0)" : "rgba(255,255,255,0.08)"} 0%,
          transparent 100%)`,
          opacity: spotOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${spotSize * 0.8}%`,
          height: "55%",
          background: `linear-gradient(to bottom,
          ${isLight(bg) ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)"} 0%,
          transparent 100%)`,
          opacity: spotOpacity,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            whiteSpace: "nowrap",
            opacity: interpolate(enter, [0, 1], [0, 1]),
            transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])}) translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
            filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
            textShadow: isLight(bg)
              ? "0 2px 12px rgba(0,0,0,0.1)"
              : `0 0 40px ${safeAccent(scene.accentColor, bg)}44, 0 2px 20px rgba(0,0,0,0.5)`,
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── NOISE TEXTURE ────────────────────────────────────
export const NoiseScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";

  const enter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 140, 64);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: "url(#noise)",
          opacity: isLight(bg) ? 0.06 : 0.12,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(interpolate(enter, [0, 1], [0, 1]), fadeOut),
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])}) translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
            filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
            textShadow: mainTextShadow(bg),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── DÉGRADÉ DE TEXTE ─────────────────────────────────
export const GradientTextScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);

  const enter = spring({ frame, fps, config: { damping: 280, stiffness: 80, mass: 0.8 }, from: 0, to: 1 });
  const { opacity } = useAppleTiming();
  const fontSize = autoFontSize(scene.text || "", 140, 64);

  const revealW = interpolate(Math.max(0, frame - 8), [0, 36], [0, 100], {
    extrapolateRight: "clamp", easing: E_OUT,
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        opacity,
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            fontSize, fontWeight: 800, fontFamily: FONT,
            letterSpacing: "-0.04em", lineHeight: 1,
            color: isLight(bg) ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)",
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
          }}>
            {scene.text}
          </div>
          <div style={{
            position: "absolute", inset: 0,
            clipPath: `inset(0 ${Math.max(0, 100 - revealW)}% 0 0)`,
          }}>
            <div style={{
              fontSize, fontWeight: 800, fontFamily: FONT,
              letterSpacing: "-0.04em", lineHeight: 1,
              color: accent,
              whiteSpace: "nowrap",
              transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
            }}>
              {scene.text}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── EFFACE LETTRE PAR LETTRE ─────────────────────────
export const EraseLettersScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const words = (scene.text || "").trim().split(/\s+/).filter(Boolean);
  const letters = words.join("").split("");
  const fontSize = autoFontSize(scene.text || "", 160, 72);

  const globalEnter = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80 },
    from: 0,
    to: 1,
  });

  const eraseStart = Math.max(0, durationInFrames - 40);
  const eraseWordStarts = words.reduce<number[]>((starts, word, wi) => {
    starts.push(wi === 0 ? 0 : starts[wi - 1] + words[wi - 1].length);
    return starts;
  }, []);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: interpolate(globalEnter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ display: "flex", gap: "0.3em", flexWrap: "wrap", justifyContent: "center", whiteSpace: "nowrap" }}>
          {words.map((word, wi) => (
              <span key={wi} style={{ display: "inline-flex" }}>
                {word.split("").map((letter, i) => {
                  const globalIndex = eraseWordStarts[wi] + i;
                  const reverseIndex = letters.length - 1 - globalIndex;
                  const eraseDelay = eraseStart + reverseIndex * 3;
                  const eraseProgress = interpolate(
                    Math.max(0, frame - eraseDelay),
                    [0, 10],
                    [1, 0],
                    { extrapolateRight: "clamp", easing: E_IN },
                  );
                  const enterProgress = interpolate(globalEnter, [0, 1], [0, 1]);

                  return (
                    <span
                      key={i}
                      style={{
                        fontSize,
                        fontWeight: 700,
                        fontFamily: FONT,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        color: mainTextColor(scene, bg),
                        display: "inline-block",
                        opacity: Math.min(enterProgress, eraseProgress),
                        transform: `translateY(${interpolate(eraseProgress, [0, 1], [10, 0])}px)`,
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── LIGNES SÉPARÉES ──────────────────────────────────
export const SplitLinesScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);

  const lines = (scene.text || "")
    .split("|")
    .map((l) => l.trim())
    .filter(Boolean);
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(lines[0] || "", 120, 56);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 12,
          opacity: fadeOut,
          padding: "0 80px",
        }}
      >
        {lines.map((line, i) => {
          const delay = i * 14;
          const enter = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 280, stiffness: 80, mass: 0.8 },
            from: 0,
            to: 1,
          });
          const lineSize = i === 0 ? fontSize : Math.round(fontSize * 0.55);
          const lineWeight = i === 0 ? 800 : 400;
          const lineColor = i === 0 ? mainTextColor(scene, bg) : accent;

          return (
            <div
              key={i}
              style={{
                fontSize: lineSize,
                fontWeight: lineWeight,
                fontFamily: FONT,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: lineColor,
                whiteSpace: "nowrap",
                textAlign: "center",
                opacity: interpolate(enter, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
                filter: `blur(${interpolate(enter, [0, 0.5, 1], [8, 1, 0])}px)`,
                textShadow: mainTextShadow(bg),
              }}
            >
              {line}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── CHIFFRE GÉANT EN FOND ────────────────────────────
export const BgNumberScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const number = scene.bgNumber || "1";

  const bgNumEnter = spring({
    frame,
    fps,
    config: { damping: 300, stiffness: 60, mass: 1.2 },
    from: 0,
    to: 1,
  });
  const textEnter = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 280, stiffness: 80 },
    from: 0,
    to: 1,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize = autoFontSize(scene.text || "", 100, 48);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(interpolate(bgNumEnter, [0, 1], [0, 0.08]), fadeOut * 0.08),
        }}
      >
        <div
          style={{
            fontSize: 600,
            fontWeight: 900,
            fontFamily: FONT,
            letterSpacing: "-0.1em",
            lineHeight: 1,
            color: textColor(bg),
            userSelect: "none",
            transform: `scale(${interpolate(bgNumEnter, [0, 1], [1.3, 1])})`,
          }}
        >
          {number}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 700,
            fontFamily: FONT,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            whiteSpace: "nowrap",
            opacity: Math.min(interpolate(textEnter, [0, 1], [0, 1]), fadeOut),
            transform: `scale(${interpolate(textEnter, [0, 1], [0.92, 1])}) translateY(${interpolate(textEnter, [0, 1], [24, 0])}px)`,
            filter: `blur(${interpolate(textEnter, [0, 0.5, 1], [8, 1, 0])}px)`,
            textShadow: mainTextShadow(bg),
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── DEUX LIGNES TAILLES DIFFÉRENTES ──────────────────
export const TwoLinesScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);

  const line1 = scene.line1 || scene.text || "";
  const line2 = scene.line2 || "";

  const enter1 = spring({
    frame,
    fps,
    config: { damping: 280, stiffness: 80, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const enter2 = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 280, stiffness: 70, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const fontSize1 = autoFontSize(line1, 140, 64);
  const fontSize2 = Math.round(fontSize1 * 0.38);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 8,
          opacity: fadeOut,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: fontSize1,
            fontWeight: 800,
            fontFamily: FONT,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: mainTextColor(scene, bg),
            whiteSpace: "nowrap",
            textAlign: "center",
            opacity: interpolate(enter1, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(enter1, [0, 1], [30, 0])}px) scale(${interpolate(enter1, [0, 1], [0.92, 1])})`,
            filter: `blur(${interpolate(enter1, [0, 0.5, 1], [8, 1, 0])}px)`,
            textShadow: mainTextShadow(bg),
          }}
        >
          {line1}
        </div>

        {line2 && (
          <div
            style={{
              fontSize: fontSize2,
              fontWeight: 300,
              fontFamily: FONT,
              letterSpacing: "0.08em",
              lineHeight: 1,
              color: accent,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              textAlign: "center",
              opacity: interpolate(enter2, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(enter2, [0, 1], [16, 0])}px)`,
            }}
          >
            {line2}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ─── WEIGHT REVEAL ────────────────────────────────────
export const WeightRevealScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const bg = scene.bg || "#000000";
  const { opacity } = useAppleTiming();
  const words = (scene.text || "").split(" ");
  const fontSize = autoFontSize(scene.text || "", 130, 60);
  const weights = [800, 200, 700, 200, 900, 300, 800];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.3em",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 80px",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {words.map((word, i) => {
            const weight = weights[i % weights.length];
            return (
              <span
                key={i}
                style={{
                  fontSize,
                  fontWeight: weight,
                  fontFamily: FONT,
                  letterSpacing: weight > 600 ? "-0.04em" : "0.02em",
                  lineHeight: 1,
                  color: mainTextColor(scene, bg),
                  whiteSpace: "nowrap",
                  textShadow: mainTextShadow(bg),
                  textAlign: "center",
                  display: "inline-block",
                  marginRight: "0.05em",
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

// ═══════════════════════════════════════════════════════
// MOCKUPS & REPRÉSENTATIONS ANIMÉES
// ═══════════════════════════════════════════════════════

// ─── REPRODUCTIONS UI DE SITES/APPS CONNUS ───────────
const renderKnownUI = (siteName: string, accent: string, frame: number) => {
  const site = siteName.toLowerCase();

  if (site.includes("spotify")) {
    const progress = interpolate(Math.max(0, frame - 20), [0, 60], [0, 72], { extrapolateRight: "clamp" });
    return (
      <div style={{ width: "100%", height: "100%", background: "#121212", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: "#fff", letterSpacing: "0.08em" }}>EN COURS DE LECTURE</div>
        <div style={{ width: 80, height: 80, borderRadius: 8, background: "linear-gradient(135deg, #1DB954, #158a3e)", margin: "0 auto" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT, color: "#fff" }}>Top Hits 2025</div>
          <div style={{ fontSize: 9, fontFamily: FONT, color: "#aaa" }}>Playlist</div>
        </div>
        <div style={{ width: "100%", height: 3, background: "#333", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#1DB954", borderRadius: 2 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          {["⏮", "⏸", "⏭"].map((b, i) => (
            <div key={i} style={{ fontSize: i === 1 ? 20 : 12, color: i === 1 ? "#fff" : "#aaa" }}>{b}</div>
          ))}
        </div>
      </div>
    );
  }

  if (site.includes("netflix")) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#141414", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 900, fontFamily: FONT, color: "#E50914", letterSpacing: "-0.04em" }}>NETFLIX</div>
        <div style={{ width: "100%", height: 60, background: "linear-gradient(135deg, #333, #111)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)" }}>▶</div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: "#fff" }}>Continuer à regarder</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, height: 36, background: "#222", borderRadius: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  if (site.includes("instagram")) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#000", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, fontFamily: FONT, color: "#fff" }}>instagram</div>
          <div style={{ fontSize: 10, color: "#fff" }}>❤️ 💬</div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "hidden" }}>
          {[accent, "#E91E8C", "#FF5722"].map((c, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${c}, ${c}88)`,
              border: "2px solid #333", flexShrink: 0,
            }} />
          ))}
        </div>
        <div style={{ width: "100%", height: 80, background: "#111", borderRadius: 6 }} />
        <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#fff" }}>
          <span>❤️ 2.4K</span>
          <span>💬 142</span>
        </div>
      </div>
    );
  }

  if (site.includes("youtube")) {
    const playProgress = interpolate(Math.max(0, frame - 16), [0, 80], [0, 65], { extrapolateRight: "clamp" });
    return (
      <div style={{ width: "100%", height: "100%", background: "#0f0f0f", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 900, fontFamily: FONT, color: "#FF0000" }}>▶ YouTube</div>
        <div style={{ width: "100%", height: 70, background: "#222", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.8)" }}>▶</div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#333" }}>
            <div style={{ width: `${playProgress}%`, height: "100%", background: "#FF0000" }} />
          </div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: "#fff", lineHeight: 1.3 }}>Top 10 des moments incroyables</div>
        <div style={{ fontSize: 8, fontFamily: FONT, color: "#aaa" }}>2.4M vues · il y a 3 jours</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: 28, background: "#222", borderRadius: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  if (site.includes("airbnb")) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#fff", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 900, fontFamily: FONT, color: "#FF5A5F" }}>airbnb</div>
        <div style={{ width: "100%", height: 70, background: "#f0f0f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏠</div>
        <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: "#000" }}>Appartement Paris 11e</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, fontWeight: 800, fontFamily: FONT, color: "#000" }}>€120 / nuit</div>
          <div style={{ fontSize: 9, fontFamily: FONT, color: "#888" }}>⭐ 4.9</div>
        </div>
        <div style={{ background: "#FF5A5F", borderRadius: 8, padding: "5px", textAlign: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: "#fff" }}>Réserver</span>
        </div>
      </div>
    );
  }

  if (site.includes("notion")) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#fff", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 800, fontFamily: FONT, color: "#000" }}>📄 Mon Workspace</div>
        {["📌 Roadmap Q4", "✅ Tasks du jour", "📊 Analytics"].map((item, i) => (
          <div key={i} style={{
            padding: "5px 8px", borderRadius: 6,
            background: i === 0 ? "#f5f5f5" : "transparent",
            fontSize: 9, fontFamily: FONT, color: "#333",
          }}>
            {item}
          </div>
        ))}
        <div style={{ width: "70%", height: 4, background: "#f0f0f0", borderRadius: 2 }} />
        <div style={{ width: "50%", height: 4, background: "#f0f0f0", borderRadius: 2 }} />
      </div>
    );
  }

  if (site.includes("stripe")) {
    const barH = [60, 75, 45, 88, 72, 90, 68].map((h, i) =>
      interpolate(Math.max(0, frame - i * 4), [0, 20], [0, h], { extrapolateRight: "clamp" }),
    );
    return (
      <div style={{ width: "100%", height: "100%", background: "#0a2540", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, fontFamily: FONT, color: "#fff" }}>Stripe Dashboard</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: FONT, color: "#fff" }}>€24,521</div>
            <div style={{ fontSize: 8, fontFamily: FONT, color: "#635BFF" }}>+18.2% ce mois</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
          {barH.map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0",
              background: i === 5 ? "#635BFF" : "rgba(99,91,255,0.3)",
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (site.includes("uber") || site.includes("delivery") || site.includes("livraison")) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#000", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 900, fontFamily: FONT, color: "#fff" }}>Uber</div>
        <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "8px" }}>
          <div style={{ fontSize: 8, fontFamily: FONT, color: "#888", marginBottom: 4 }}>EN ROUTE</div>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: FONT, color: "#fff" }}>8 min</div>
          <div style={{ fontSize: 8, fontFamily: FONT, color: accent }}>● Votre chauffeur arrive</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["🚗", "🛵", "🚲"].map((icon, i) => (
            <div key={i} style={{
              flex: 1, background: i === 0 ? accent : "#1a1a1a",
              borderRadius: 8, padding: "6px", textAlign: "center", fontSize: 12,
            }}>{icon}</div>
          ))}
        </div>
      </div>
    );
  }

  if (site.includes("linear") || site.includes("saas") || site.includes("app")) {
    const barH = [50, 70, 40, 85, 65].map((h, i) =>
      interpolate(Math.max(0, frame - i * 5), [0, 20], [0, h], { extrapolateRight: "clamp" }),
    );
    return (
      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: "#fff" }}>Dashboard</div>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: accent }} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ label: "Users", val: "1.2K" }, { label: "MRR", val: "€8K" }].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "#1a1a1a", borderRadius: 6, padding: "6px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, fontFamily: FONT, color: i === 0 ? accent : "#fff" }}>{s.val}</div>
              <div style={{ fontSize: 7, fontFamily: FONT, color: "#555" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 36, marginTop: 4 }}>
          {barH.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0", background: i === 3 ? accent : `${accent}44` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ width: "60%", height: 8, borderRadius: 4, background: accent + "99" }} />
      <div style={{ width: "80%", height: 5, borderRadius: 3, background: "#222" }} />
      <div style={{ width: "70%", height: 5, borderRadius: 3, background: "#1a1a1a" }} />
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 40, borderRadius: 8, background: i === 1 ? accent + "22" : "#111", border: `1px solid ${i === 1 ? accent + "44" : "#222"}` }} />
        ))}
      </div>
      <div style={{ width: 80, height: 24, borderRadius: 6, background: accent, marginTop: 4 }} />
    </div>
  );
};

type AIUIElement = Record<string, unknown>;

const renderAIUI = (aiUI: SceneData["aiUI"], accent: string, frame: number) => {
  if (!aiUI?.elements?.length) return null;

  const bg = aiUI.bgColor || "#0a0a0a";
  const tc = aiUI.textColor || "#ffffff";
  const pc = aiUI.primaryColor || accent;

  return (
    <div style={{
      width: "100%", height: "100%",
      background: bg,
      padding: "12px 10px",
      display: "flex", flexDirection: "column", gap: 7,
      overflow: "hidden",
    }}>
      {aiUI.elements.map((el: AIUIElement, i: number) => {
        const elFade = interpolate(Math.max(0, frame - i * 6), [0, 16], [0, 1], {
          extrapolateRight: "clamp", easing: E_OUT,
        });

        if (el.type === "header") {
          const sizes: Record<string, number> = { bold: 13, normal: 10, small: 8 };
          const weights: Record<string, number> = { bold: 800, normal: 500, small: 400 };
          const style = String(el.style || "normal");
          return (
            <div key={i} style={{
              fontSize: sizes[style] || 11,
              fontWeight: weights[style] || 600,
              fontFamily: FONT,
              color: style === "bold" ? tc : pc,
              letterSpacing: "-0.02em",
              opacity: elFade,
            }}>
              {String(el.content || "")}
            </div>
          );
        }

        if (el.type === "metric") {
          return (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8, padding: "6px 8px",
              opacity: elFade,
            }}>
              <div style={{
                fontSize: 16, fontWeight: 800, fontFamily: FONT,
                color: pc, letterSpacing: "-0.04em",
              }}>
                {String(el.value || "")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 7, fontFamily: FONT, color: "rgba(255,255,255,0.4)" }}>{String(el.label || "")}</div>
                {el.trend ? (
                  <div style={{ fontSize: 7, fontFamily: FONT, color: "#30d158", fontWeight: 600 }}>{String(el.trend)}</div>
                ) : null}
              </div>
            </div>
          );
        }

        if (el.type === "bar") {
          const values = (el.values as number[]) || [60, 80, 45, 90, 70];
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, opacity: elFade }}>
              {values.map((v: number, j: number) => {
                const barH = interpolate(Math.max(0, frame - i * 6 - j * 3), [0, 18], [0, v], { extrapolateRight: "clamp" });
                return (
                  <div key={j} style={{
                    flex: 1, height: `${barH}%`,
                    borderRadius: "2px 2px 0 0",
                    background: j === values.length - 2 ? String(el.color || pc) : `${String(el.color || pc)}44`,
                  }} />
                );
              })}
            </div>
          );
        }

        if (el.type === "list") {
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, opacity: elFade }}>
              {((el.items as string[]) || []).map((item: string, j: number) => (
                <div key={j} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 6px",
                  background: j === 0 ? `${pc}18` : "transparent",
                  borderRadius: 6,
                  borderLeft: j === 0 ? `2px solid ${pc}` : "none",
                }}>
                  <div style={{ fontSize: 8, fontFamily: FONT, color: j === 0 ? tc : "rgba(255,255,255,0.5)" }}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (el.type === "button") {
          const btnColor = String(el.color || pc);
          return (
            <div key={i} style={{
              background: btnColor,
              borderRadius: 8, padding: "6px 10px",
              textAlign: "center", opacity: elFade,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: isLight(btnColor) ? "#000" : "#fff" }}>
                {String(el.text || "")}
              </span>
            </div>
          );
        }

        if (el.type === "progress") {
          const barW = interpolate(Math.max(0, frame - i * 6), [0, 30], [0, Number(el.value) || 75], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: elFade }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 7, fontFamily: FONT, color: "rgba(255,255,255,0.5)" }}>{String(el.label || "")}</div>
                <div style={{ fontSize: 7, fontFamily: FONT, color: pc, fontWeight: 700 }}>{Math.round(barW)}%</div>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${barW}%`, height: "100%", background: pc, borderRadius: 2 }} />
              </div>
            </div>
          );
        }

        if (el.type === "avatar") {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, opacity: elFade }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `${pc}33`, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0,
              }}>
                {String(el.emoji || "👤")}
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT, color: tc }}>{String(el.name || "")}</div>
                <div style={{ fontSize: 7, fontFamily: FONT, color: "rgba(255,255,255,0.4)" }}>{String(el.sub || "")}</div>
              </div>
            </div>
          );
        }

        if (el.type === "grid") {
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, opacity: elFade }}>
              {((el.items as string[]) || []).map((emoji: string, j: number) => (
                <div key={j} style={{
                  aspectRatio: "1", background: "rgba(255,255,255,0.06)",
                  borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>
                  {emoji}
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

const renderMockupScreen = (scene: SceneData, accent: string, frame: number) => {
  const aiUI = scene.aiUI;
  const photoUrl = scene.photoUrl || "";

  if (aiUI) {
    const aiScreen = renderAIUI(aiUI, accent, frame);
    if (aiScreen) return aiScreen;
  }

  if (photoUrl && !photoUrl.includes("pexels")) {
    return (
      <img
        src={photoUrl}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
      />
    );
  }

  const siteName = scene.websiteUrl || scene.url || scene.text || "";
  return renderKnownUI(siteName, accent, frame);
};

// ─── 1. IPHONE FLOTTANT ───────────────────────────────
export const IPhoneScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);
  const enter = spring({ frame, fps, config: { damping: 260, stiffness: 70, mass: 1 }, from: 0, to: 1 });
  const floatY = Math.sin(frame * 0.04) * 8;
  const floatR = Math.sin(frame * 0.03) * 2;
  const { opacity } = useAppleTiming();
  const screenOn = interpolate(Math.max(0, frame - 20), [0, 20], [0, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const fontSize = autoFontSize(scene.text || "", 72, 36);

  const renderScreen = () => renderMockupScreen(scene, accent, frame);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneGeoBackground bg={bg} geo={scene.geo} depthOfField />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 28, opacity,
      }}>
        <div style={{
          width: 160, aspectRatio: "9/19.5",
          background: isLight(bg) ? "#1a1a1a" : "#f0f0f0",
          borderRadius: 36,
          border: `6px solid ${isLight(bg) ? "#111" : "#ddd"}`,
          overflow: "hidden",
          transform: `translateY(${interpolate(enter, [0, 1], [80, 0]) + floatY}px) scale(${interpolate(enter, [0, 1], [0.7, 1])}) rotate(${floatR}deg)`,
          opacity: interpolate(enter, [0, 0.3], [0, 1]),
          boxShadow: isLight(bg)
            ? "0 40px 80px rgba(0,0,0,0.25)"
            : "0 40px 80px rgba(0,0,0,0.6)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: 56, height: 10,
            background: isLight(bg) ? "#000" : "#ddd",
            borderRadius: "0 0 14px 14px",
            zIndex: 3,
          }} />
          <div style={{ width: "100%", height: "100%", opacity: screenOn }}>
            {renderScreen()}
          </div>
        </div>

        {scene.text && (
          <div style={{
            fontSize, fontWeight: 600, fontFamily: FONT,
            letterSpacing: "-0.03em", lineHeight: 1,
            color: textColor(bg), whiteSpace: "nowrap",
            opacity: interpolate(enter, [0, 1], [0, 1]),
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 2. MACBOOK ───────────────────────────────────────
export const MacBookScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);
  const photoUrl = scene.photoUrl || "";

  // Ouverture du lid
  const lidAngle = interpolate(Math.max(0, frame - 4), [0, 36], [100, 0], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const screenOpacity = interpolate(Math.max(0, frame - 20), [0, 20], [0, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const enter = spring({ frame, fps, config: { damping: 280, stiffness: 60, mass: 1 }, from: 0, to: 1 });
  const fontSize = autoFontSize(scene.text || "", 72, 36);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneGeoBackground bg={bg} geo={scene.geo} depthOfField />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 24, opacity: fadeOut,
      }}>
        {/* MacBook */}
        <div style={{
          width: "76%", maxWidth: 520,
          opacity: interpolate(enter, [0, 0.3], [0, 1]),
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        }}>
          {/* Écran */}
          <div style={{
            background: "#1a1a1a",
            borderRadius: "16px 16px 0 0",
            border: "2px solid #333",
            overflow: "hidden",
            transformOrigin: "bottom center",
            transform: `perspective(800px) rotateX(${lidAngle}deg)`,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
          }}>
            {/* Barre navigateur */}
            <div style={{
              background: "#222", padding: "7px 12px",
              display: "flex", alignItems: "center", gap: 6,
              borderBottom: "1px solid #333",
            }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
              ))}
              <div style={{
                flex: 1, background: "#2a2a2a", borderRadius: 4,
                padding: "3px 10px", fontSize: 9,
                color: "#555", marginLeft: 8, textAlign: "center",
                fontFamily: FONT,
              }}>
                {scene.websiteUrl || scene.url || "motionr.app"}
              </div>
            </div>
            {/* Contenu écran */}
            <div style={{ height: 200, opacity: screenOpacity, overflow: "hidden" }}>
              {renderMockupScreen(scene, accent, frame)}
            </div>
          </div>
          {/* Base */}
          <div style={{
            background: "#2a2a2a", height: 12,
            borderRadius: "0 0 4px 4px",
            border: "2px solid #333", borderTop: "none",
          }} />
          {/* Pied */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "40%", height: 6, background: "#222", borderRadius: "0 0 6px 6px" }} />
          </div>
        </div>

        {/* Texte */}
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 600, fontFamily: FONT,
            letterSpacing: "-0.03em", lineHeight: 1,
            color: textColor(bg), whiteSpace: "nowrap",
            opacity: screenOpacity,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 3. DOUBLE DEVICE ─────────────────────────────────
export const DoubleDeviceScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);
  const photoUrl = scene.photoUrl || "";
  const mobilePhotoUrl = scene.photoUrl2 || photoUrl;

  const macEnter = spring({ frame, fps, config: { damping: 260, stiffness: 70, mass: 1 }, from: 0, to: 1 });
  const phoneEnter = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 260, stiffness: 80, mass: 0.8 }, from: 0, to: 1 });
  const textEnter = spring({ frame: Math.max(0, frame - 28), fps, config: { damping: 280, stiffness: 80 }, from: 0, to: 1 });
  const { opacity: fadeOut } = useAppleTiming();
  const floatY = Math.sin(frame * 0.04) * 5;
  const fontSize = autoFontSize(scene.text || "", 60, 32);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 24, opacity: fadeOut,
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
          {/* MacBook mini */}
          <div style={{
            width: 280,
            opacity: interpolate(macEnter, [0, 0.3], [0, 1]),
            transform: `translateY(${interpolate(macEnter, [0, 1], [40, 0]) + floatY * 0.5}px) scale(${interpolate(macEnter, [0, 1], [0.85, 1])})`,
          }}>
            <div style={{
              background: "#1a1a1a", borderRadius: "10px 10px 0 0",
              border: "2px solid #333", overflow: "hidden",
            }}>
              <div style={{
                background: "#222", padding: "5px 8px",
                display: "flex", gap: 4, alignItems: "center",
              }}>
                {["#ff5f56", "#ffbd2e", "#27c93f"].map((c, i) => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{ height: 110, background: "#0a0a0a", overflow: "hidden" }}>
                {renderMockupScreen(scene, accent, frame)}
              </div>
            </div>
            <div style={{ background: "#2a2a2a", height: 7, borderRadius: "0 0 3px 3px", border: "2px solid #333", borderTop: "none" }} />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "35%", height: 4, background: "#222", borderRadius: "0 0 4px 4px" }} />
            </div>
          </div>

          {/* iPhone mini */}
          <div style={{
            width: 80, aspectRatio: "9/19.5",
            background: "#1a1a1a", borderRadius: 20,
            border: "3px solid #333", overflow: "hidden",
            opacity: interpolate(phoneEnter, [0, 0.3], [0, 1]),
            transform: `translateY(${interpolate(phoneEnter, [0, 1], [60, 0]) + floatY}px) scale(${interpolate(phoneEnter, [0, 1], [0.8, 1])})`,
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 0, left: "50%",
              transform: "translateX(-50%)",
              width: 28, height: 6,
              background: "#000", borderRadius: "0 0 8px 8px",
              zIndex: 2,
            }} />
            {renderMockupScreen(
              { ...scene, photoUrl: mobilePhotoUrl || scene.photoUrl },
              accent,
              frame,
            )}
          </div>
        </div>

        {/* Texte */}
        {scene.text && (
          <div style={{
            fontSize, fontWeight: 600, fontFamily: FONT,
            letterSpacing: "-0.03em", lineHeight: 1,
            color: textColor(bg), whiteSpace: "nowrap",
            opacity: interpolate(textEnter, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(textEnter, [0, 1], [16, 0])}px)`,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 4. BROWSER MOCKUP ────────────────────────────────
export const BrowserScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);
  const photoUrl = scene.photoUrl || "";

  const enter = spring({ frame, fps, config: { damping: 260, stiffness: 70, mass: 1 }, from: 0, to: 1 });
  const contentFade = interpolate(Math.max(0, frame - 20), [0, 24], [0, 1], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const { opacity: fadeOut } = useAppleTiming();

  // Loading bar
  const loadW = interpolate(Math.max(0, frame - 4), [0, 28], [0, 100], {
    extrapolateRight: "clamp", easing: E_OUT,
  });

  const fontSize = autoFontSize(scene.text || "", 72, 36);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneGeoBackground bg={bg} geo={scene.geo} depthOfField />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 20, opacity: fadeOut,
        padding: "0 60px",
      }}>
        {/* Browser */}
        <div style={{
          width: "100%", maxWidth: 560,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
          boxShadow: isLight(bg) ? "0 24px 60px rgba(0,0,0,0.12)" : "0 24px 60px rgba(0,0,0,0.5)",
          opacity: interpolate(enter, [0, 0.3], [0, 1]),
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
        }}>
          {/* Toolbar */}
          <div style={{
            background: isLight(bg) ? "#f5f5f5" : "#1a1a1a",
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            borderBottom: `1px solid ${isLight(bg) ? "#e0e0e0" : "#2a2a2a"}`,
          }}>
            {["#ff5f56", "#ffbd2e", "#27c93f"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
            {/* Loading bar */}
            <div style={{
              flex: 1, height: 28, borderRadius: 6,
              background: isLight(bg) ? "#e8e8e8" : "#2a2a2a",
              overflow: "hidden", position: "relative",
              display: "flex", alignItems: "center",
              paddingLeft: 10,
            }}>
              <div style={{
                position: "absolute", left: 0, top: 0,
                width: `${loadW}%`, height: 2,
                background: accent,
                boxShadow: `0 0 8px ${accent}88`,
              }} />
              <span style={{
                fontSize: 10, color: isLight(bg) ? "#999" : "#555",
                fontFamily: FONT, zIndex: 1,
              }}>
                {scene.websiteUrl || scene.url || "motionr.app"}
              </span>
            </div>
          </div>

          {/* Contenu */}
          <div style={{ height: 220, opacity: contentFade, overflow: "hidden" }}>
            {renderMockupScreen(scene, accent, frame)}
          </div>
        </div>

        {scene.text && (
          <div style={{
            fontSize, fontWeight: 600, fontFamily: FONT,
            letterSpacing: "-0.03em", lineHeight: 1,
            color: textColor(bg), whiteSpace: "nowrap",
            opacity: contentFade,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 5. DASHBOARD ─────────────────────────────────────
export const DashboardScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);

  const enter = spring({ frame, fps, config: { damping: 260, stiffness: 70, mass: 1 }, from: 0, to: 1 });
  const { opacity: fadeOut } = useAppleTiming();

  const bars = [65, 82, 45, 90, 71, 55, 88];
  const fontSize = autoFontSize(scene.text || "", 60, 32);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <SceneGeoBackground bg={bg} geo={scene.geo} depthOfField />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 20, opacity: fadeOut,
        padding: "0 60px",
      }}>
        {/* Dashboard card */}
        <div style={{
          width: "100%", maxWidth: 520,
          background: isLight(bg) ? "#ffffff" : "#111111",
          borderRadius: 20,
          border: `1px solid ${isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"}`,
          padding: "24px",
          boxShadow: isLight(bg) ? "0 20px 60px rgba(0,0,0,0.1)" : "0 20px 60px rgba(0,0,0,0.4)",
          opacity: interpolate(enter, [0, 0.3], [0, 1]),
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20,
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700, fontFamily: FONT,
              color: isLight(bg) ? "#000" : "#fff",
              letterSpacing: "-0.02em",
            }}>
              {scene.dashTitle || "Analytics"}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, fontFamily: FONT,
              color: accent, padding: "3px 8px",
              background: accent + "18", borderRadius: 100,
            }}>
              +24%
            </div>
          </div>

          {/* Barres */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {bars.map((h, i) => {
              const barH = interpolate(
                Math.max(0, frame - i * 5),
                [0, 24], [0, h],
                { extrapolateRight: "clamp", easing: E_OUT }
              );
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: "4px 4px 0 0",
                  height: `${barH}%`,
                  background: i === 4 ? accent : isLight(bg) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
                  boxShadow: i === 4 ? `0 0 12px ${accent}66` : "none",
                }} />
              );
            })}
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 12, marginTop: 16,
          }}>
            {[
              { label: "Vues", value: "24.5K" },
              { label: "Clics", value: "8.2K" },
              { label: "Conv.", value: "12%" },
            ].map((s, i) => {
              const statEnter = interpolate(
                Math.max(0, frame - 24 - i * 8),
                [0, 18], [0, 1],
                { extrapolateRight: "clamp", easing: E_OUT }
              );
              return (
                <div key={i} style={{
                  flex: 1, padding: "8px",
                  background: isLight(bg) ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                  borderRadius: 8, opacity: statEnter,
                }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, fontFamily: FONT,
                    color: i === 0 ? accent : isLight(bg) ? "#000" : "#fff",
                    letterSpacing: "-0.03em",
                  }}>{s.value}</div>
                  <div style={{
                    fontSize: 10, fontFamily: FONT,
                    color: isLight(bg) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
                  }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {scene.text && (
          <div style={{
            fontSize, fontWeight: 600, fontFamily: FONT,
            letterSpacing: "-0.03em", lineHeight: 1,
            color: textColor(bg), whiteSpace: "nowrap",
            opacity: interpolate(enter, [0, 1], [0, 1]),
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 6. CHAT MESSAGES ─────────────────────────────────
export const ChatScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);

  const messages = scene.messages || [
    { text: "Comment ça marche ?", isUser: false },
    { text: "Décris ton idée.", isUser: true },
    { text: "Vidéo générée en 2 min.", isUser: true },
  ];

  const { opacity: fadeOut } = useAppleTiming();

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        padding: "0 60px", opacity: fadeOut,
      }}>
        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((msg, i) => {
            const msgEnter = spring({
              frame: Math.max(0, frame - i * 16), fps,
              config: { damping: 280, stiffness: 100, mass: 0.7 },
              from: 0, to: 1,
            });
            return (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.isUser ? "flex-end" : "flex-start",
                opacity: interpolate(msgEnter, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(msgEnter, [0, 1], [20, 0])}px) scale(${interpolate(msgEnter, [0, 1], [0.9, 1])})`,
              }}>
                <div style={{
                  maxWidth: "75%",
                  background: msg.isUser
                    ? accent
                    : isLight(bg) ? "#f0f0f0" : "#1a1a1a",
                  borderRadius: msg.isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "10px 14px",
                  boxShadow: msg.isUser ? `0 4px 12px ${accent}44` : "none",
                }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, fontFamily: FONT,
                    color: msg.isUser
                      ? (isLight(accent) ? "#000" : "#fff")
                      : textColor(bg),
                    letterSpacing: "-0.01em",
                    lineHeight: 1.4,
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 7. RÉSEAU DE CONNEXIONS ──────────────────────────
export const NetworkScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);

  const { opacity: fadeOut } = useAppleTiming();

  const nodes = [
    { x: 540, y: 500, size: 20, delay: 0, isCenter: true },
    { x: 280, y: 320, size: 10, delay: 8 },
    { x: 800, y: 280, size: 10, delay: 12 },
    { x: 200, y: 640, size: 8, delay: 16 },
    { x: 860, y: 620, size: 8, delay: 20 },
    { x: 400, y: 780, size: 8, delay: 14 },
    { x: 680, y: 760, size: 8, delay: 18 },
    { x: 160, y: 460, size: 6, delay: 22 },
    { x: 920, y: 440, size: 6, delay: 24 },
  ];

  const textEnter = spring({ frame: Math.max(0, frame - 32), fps, config: { damping: 280, stiffness: 80 }, from: 0, to: 1 });
  const fontSize = autoFontSize(scene.text || "", 72, 36);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <svg width="1080" height="900" style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)" }}>
          {/* Connexions */}
          {nodes.slice(1).map((node, i) => {
            const center = nodes[0];
            const lineEnter = interpolate(Math.max(0, frame - node.delay), [0, 20], [0, 1], {
              extrapolateRight: "clamp", easing: E_OUT,
            });
            return (
              <line key={i}
                x1={center.x} y1={center.y}
                x2={node.x} y2={node.y}
                stroke={accent}
                strokeWidth="1"
                strokeDasharray="300"
                strokeDashoffset={300 * (1 - lineEnter)}
                opacity={0.2 + lineEnter * 0.2}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map((node, i) => {
            const nodeEnter = spring({
              frame: Math.max(0, frame - node.delay), fps,
              config: { damping: 14, stiffness: 300, mass: 0.4 },
              from: 0, to: 1,
            });
            const pulse = node.isCenter ? 1 + Math.sin(frame * 0.08) * 0.15 : 1;
            return (
              <g key={i}>
                {node.isCenter && (
                  <circle cx={node.x} cy={node.y} r={node.size * 3}
                    fill={accent} opacity={0.08 + Math.sin(frame * 0.08) * 0.04} />
                )}
                <circle
                  cx={node.x} cy={node.y}
                  r={node.size * nodeEnter * pulse}
                  fill={node.isCenter ? accent : accent}
                  opacity={node.isCenter ? 1 : 0.6}
                  style={{ filter: node.isCenter ? `drop-shadow(0 0 8px ${accent})` : "none" }}
                />
              </g>
            );
          })}
        </svg>

        {scene.text && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
            <div style={{
              fontSize, fontWeight: 600, fontFamily: FONT,
              letterSpacing: "-0.03em", lineHeight: 1,
              color: textColor(bg), whiteSpace: "nowrap",
              opacity: interpolate(textEnter, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(textEnter, [0, 1], [16, 0])}px)`,
            }}>
              {scene.text}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 8. FLUX DE DONNÉES ───────────────────────────────
export const DataFlowScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);

  const fadeIn = safeFadeIn(frame, 20);
  const fadeOut = safeFadeOut(frame, durationInFrames, 20);

  const cols = 14;
  const chars = "01アイウエオカキクケコABCDEF0123456789";
  const fontSize = autoFontSize(scene.text || "", 72, 36);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />

      {/* Colonnes de data */}
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        <div style={{ display: "flex", height: "100%", justifyContent: "space-around", padding: "0 20px" }}>
          {Array.from({ length: cols }, (_, col) => {
            const speed = 0.8 + (col % 3) * 0.4;
            const offset = col * 137;
            return (
              <div key={col} style={{
                display: "flex", flexDirection: "column",
                gap: 4, overflow: "hidden", height: "100%",
                alignItems: "center",
                opacity: 0.15 + (col % 2) * 0.1,
              }}>
                {Array.from({ length: 20 }, (_, row) => {
                  const charIdx = Math.floor((frame * speed + row * 7 + offset) % chars.length);
                  const isAccent = (frame + row + col * 3) % 8 === 0;
                  return (
                    <div key={row} style={{
                      fontSize: 14, fontFamily: "monospace",
                      color: isAccent ? accent : textColor(bg),
                      lineHeight: 1.6,
                      opacity: isAccent ? 0.9 : 0.4,
                    }}>
                      {chars[charIdx]}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Overlay gradient centre */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 50% 40% at 50% 50%, ${bg} 0%, transparent 100%)`,
        }} />

        {/* Texte centré */}
        {scene.text && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{
              fontSize, fontWeight: 700, fontFamily: FONT,
              letterSpacing: "-0.03em", lineHeight: 1,
              color: textColor(bg), whiteSpace: "nowrap",
              textShadow: `0 0 30px ${bg}, 0 0 60px ${bg}`,
            }}>
              {scene.text}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 9. CARTE DU MONDE ────────────────────────────────
export const WorldMapScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#000000";
  const accent = safeAccent(scene.accentColor, bg);

  const { opacity: fadeOut } = useAppleTiming();

  const cities = [
    { x: 480, y: 280, name: "Paris", delay: 0 },
    { x: 220, y: 310, name: "NYC", delay: 8 },
    { x: 155, y: 380, name: "LA", delay: 14 },
    { x: 750, y: 290, name: "Dubaï", delay: 10 },
    { x: 850, y: 310, name: "Tokyo", delay: 16 },
    { x: 500, y: 430, name: "Lagos", delay: 12 },
    { x: 310, y: 500, name: "São Paulo", delay: 18 },
    { x: 820, y: 430, name: "Sydney", delay: 20 },
  ];

  const textEnter = spring({ frame: Math.max(0, frame - 28), fps, config: { damping: 280, stiffness: 80 }, from: 0, to: 1 });
  const fontSize = autoFontSize(scene.text || "", 72, 36);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo="dots" />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <svg width="1080" height="800" style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-52%)", opacity: 0.3 }}>
          {/* Continents simplifiés */}
          <ellipse cx="250" cy="350" rx="120" ry="80" fill={textColor(bg)} opacity="0.08" />
          <ellipse cx="200" cy="440" rx="90" ry="60" fill={textColor(bg)} opacity="0.08" />
          <ellipse cx="490" cy="300" rx="100" ry="70" fill={textColor(bg)} opacity="0.08" />
          <ellipse cx="490" cy="400" rx="60" ry="50" fill={textColor(bg)} opacity="0.06" />
          <ellipse cx="700" cy="320" rx="50" ry="40" fill={textColor(bg)} opacity="0.08" />
          <ellipse cx="850" cy="340" rx="80" ry="55" fill={textColor(bg)} opacity="0.08" />
          <ellipse cx="830" cy="450" rx="55" ry="45" fill={textColor(bg)} opacity="0.06" />
        </svg>

        {/* Points des villes */}
        <svg width="1080" height="800" style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-52%)" }}>
          {cities.map((city, i) => {
            const cityEnter = spring({
              frame: Math.max(0, frame - city.delay), fps,
              config: { damping: 14, stiffness: 300 },
              from: 0, to: 1,
            });
            const pulse = 1 + Math.sin(frame * 0.06 + i) * 0.3;
            return (
              <g key={i}>
                <circle cx={city.x} cy={city.y} r={8 * cityEnter * pulse}
                  fill={accent} opacity={0.15} />
                <circle cx={city.x} cy={city.y} r={4 * cityEnter}
                  fill={accent}
                  style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
                <text x={city.x + 8} y={city.y - 6}
                  fontSize="9" fontFamily={FONT}
                  fill={textColor(bg)} opacity={cityEnter * 0.6}>
                  {city.name}
                </text>
              </g>
            );
          })}
          {/* Lignes de connexion */}
          {cities.slice(1).map((city, i) => {
            const lineEnter = interpolate(
              Math.max(0, frame - city.delay - 4),
              [0, 16], [0, 1],
              { extrapolateRight: "clamp", easing: E_OUT }
            );
            return (
              <line key={i}
                x1={cities[0].x} y1={cities[0].y}
                x2={city.x} y2={city.y}
                stroke={accent}
                strokeWidth="0.5"
                strokeDasharray="200"
                strokeDashoffset={200 * (1 - lineEnter)}
                opacity={0.15}
              />
            );
          })}
        </svg>

        {scene.text && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
            <div style={{
              fontSize, fontWeight: 600, fontFamily: FONT,
              letterSpacing: "-0.03em", lineHeight: 1,
              color: textColor(bg), whiteSpace: "nowrap",
              opacity: interpolate(textEnter, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(textEnter, [0, 1], [16, 0])}px)`,
            }}>
              {scene.text}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 10. TIMELINE HORIZONTALE ─────────────────────────
export const HorizontalTimelineScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bg = scene.bg || "#ffffff";
  const accent = safeAccent(scene.accentColor, bg);

  const events = scene.events || [
    { year: "2022", label: "Lancement" },
    { year: "2023", label: "10K users" },
    { year: "2024", label: "Series A" },
    { year: "2025", label: "1M vidéos" },
  ];

  const lineW = interpolate(frame, [4, 40], [0, 100], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  const { opacity: fadeOut } = useAppleTiming();

  const textEnter = spring({ frame: Math.max(0, frame - 36), fps, config: { damping: 280, stiffness: 80 }, from: 0, to: 1 });
  const fontSize = autoFontSize(scene.text || "", 60, 32);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GeoBackground bg={bg} geo={scene.geo} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        flexDirection: "column", gap: 40, opacity: fadeOut,
        padding: "0 80px",
      }}>
        {/* Ligne + points */}
        <div style={{ width: "100%", position: "relative" }}>
          {/* Ligne principale */}
          <div style={{
            height: 2, borderRadius: 1,
            background: isLight(bg) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
            marginBottom: 0, position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0,
              height: "100%", width: `${lineW}%`,
              background: accent, borderRadius: 1,
              boxShadow: `0 0 8px ${accent}66`,
            }} />
          </div>

          {/* Points et labels */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: -8,
          }}>
            {events.map((event, i) => {
              const delay = 8 + i * 10;
              const dotEnter = spring({
                frame: Math.max(0, frame - delay), fps,
                config: { damping: 14, stiffness: 400 },
                from: 0, to: 1,
              });
              const labelEnter = spring({
                frame: Math.max(0, frame - delay - 6), fps,
                config: { damping: 280, stiffness: 100 },
                from: 0, to: 1,
              });
              const isActive = i === events.length - 1;

              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 12,
                }}>
                  {/* Point */}
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: isActive ? accent : isLight(bg) ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                    border: `2px solid ${isActive ? accent : "transparent"}`,
                    transform: `scale(${dotEnter})`,
                    boxShadow: isActive ? `0 0 12px ${accent}88` : "none",
                  }} />
                  {/* Labels */}
                  <div style={{
                    textAlign: "center",
                    opacity: interpolate(labelEnter, [0, 1], [0, 1]),
                    transform: `translateY(${interpolate(labelEnter, [0, 1], [10, 0])}px)`,
                  }}>
                    <div style={{
                      fontSize: 18, fontWeight: 800, fontFamily: FONT,
                      letterSpacing: "-0.03em",
                      color: isActive ? accent : textColor(bg),
                    }}>
                      {event.year}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 400, fontFamily: FONT,
                      color: isLight(bg) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
                      marginTop: 2,
                    }}>
                      {event.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {scene.text && (
          <div style={{
            fontSize, fontWeight: 600, fontFamily: FONT,
            letterSpacing: "-0.03em", lineHeight: 1,
            color: textColor(bg), whiteSpace: "nowrap",
            opacity: interpolate(textEnter, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(textEnter, [0, 1], [16, 0])}px)`,
          }}>
            {scene.text}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
