import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from "remotion";

const E_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// ─────────────────────────────────────────────────────────
// HELPER — tracé SVG animé
// ─────────────────────────────────────────────────────────
const AnimatedPath: React.FC<{
  d: string;
  color: string;
  strokeWidth?: number;
  delay?: number;
  totalLength?: number;
  fill?: string;
}> = ({ d, color, strokeWidth = 2.5, delay = 0, totalLength = 200, fill = "none" }) => {
  const frame = useCurrentFrame();
  const revealed = interpolate(Math.max(0, frame - delay), [0, 40], [0, totalLength], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  return (
    <path d={d} fill={fill} stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={totalLength} strokeDashoffset={totalLength - revealed}
    />
  );
};

// ─────────────────────────────────────────────────────────
// ICÔNES PAR CATÉGORIE
// ─────────────────────────────────────────────────────────

// 🔍 Recherche
export const IconSearch: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const circleOffset = interpolate(Math.max(0, frame - delay), [0, 35], [50, 0], {
    extrapolateRight: "clamp", easing: E_OUT,
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath d="M21 21l-4.35-4.35" color={color} strokeWidth={2} delay={delay} totalLength={60} />
      <circle cx="11" cy="11" r="8" fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={50} strokeDashoffset={circleOffset}
      />
    </svg>
  );
};

// ⚡ Énergie / Vitesse
export const IconLightning: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <AnimatedPath d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" color={color} strokeWidth={2} delay={delay} totalLength={80} />
  </svg>
);

// 🌍 Globe / Monde
export const IconGlobe: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={1.5}
        strokeDasharray={63} strokeDashoffset={interpolate(Math.max(0, frame - delay), [0, 40], [63, 0], { extrapolateRight: "clamp", easing: E_OUT })}
      />
      <AnimatedPath d="M2 12h20" color={color} strokeWidth={1.5} delay={delay + 8} totalLength={22} />
      <AnimatedPath d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" color={color} strokeWidth={1.5} delay={delay + 12} totalLength={80} />
    </svg>
  );
};

// 🚀 Rocket / Startup / Croissance
export const IconRocket: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const floatY = Math.sin(frame * 0.04) * 4;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${floatY}px)` }}>
      <AnimatedPath d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" color={color} strokeWidth={1.8} delay={delay} totalLength={50} />
      <AnimatedPath d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" color={color} strokeWidth={1.8} delay={delay + 5} totalLength={80} />
      <AnimatedPath d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" color={color} strokeWidth={1.8} delay={delay + 10} totalLength={40} />
      <AnimatedPath d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" color={color} strokeWidth={1.8} delay={delay + 14} totalLength={40} />
    </svg>
  );
};

// 💡 Idée / Innovation
export const IconBulb: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const glow = 0.5 + Math.sin(frame * 0.06) * 0.3;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" fill={color} fillOpacity={0.06 * glow} />
      <AnimatedPath d="M9 21h6" color={color} strokeWidth={2} delay={delay} totalLength={20} />
      <AnimatedPath d="M12 3a6 6 0 0 1 6 6c0 3-2 4.5-3 6H9c-1-1.5-3-3-3-6a6 6 0 0 1 6-6z" color={color} strokeWidth={2} delay={delay + 5} totalLength={80} />
      <AnimatedPath d="M9 17h6" color={color} strokeWidth={2} delay={delay + 15} totalLength={20} />
    </svg>
  );
};

// 📈 Croissance / Finance
export const IconTrendUp: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <AnimatedPath d="M23 6l-9.5 9.5-5-5L1 18" color={color} strokeWidth={2.5} delay={delay} totalLength={60} />
    <AnimatedPath d="M17 6h6v6" color={color} strokeWidth={2.5} delay={delay + 20} totalLength={30} />
  </svg>
);

// 🏆 Trophée / N°1 / Champion
export const IconTrophy: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <AnimatedPath d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" color={color} strokeWidth={2} delay={delay} totalLength={30} />
    <AnimatedPath d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" color={color} strokeWidth={2} delay={delay + 4} totalLength={30} />
    <AnimatedPath d="M4 22h16" color={color} strokeWidth={2} delay={delay + 8} totalLength={20} />
    <AnimatedPath d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" color={color} strokeWidth={2} delay={delay + 12} totalLength={40} />
    <AnimatedPath d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" color={color} strokeWidth={2} delay={delay + 16} totalLength={40} />
    <AnimatedPath d="M18 2H6v7a6 6 0 0 0 12 0V2z" color={color} strokeWidth={2} delay={delay + 20} totalLength={70} />
  </svg>
);

// 🔗 Connexion / Réseau / IA
export const IconNetwork: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = [
    { cx: 12, cy: 12, r: 3 },
    { cx: 4,  cy: 6,  r: 2 },
    { cx: 20, cy: 6,  r: 2 },
    { cx: 4,  cy: 18, r: 2 },
    { cx: 20, cy: 18, r: 2 },
  ];
  const lines = [
    { x1: 12, y1: 12, x2: 4,  y2: 6  },
    { x1: 12, y1: 12, x2: 20, y2: 6  },
    { x1: 12, y1: 12, x2: 4,  y2: 18 },
    { x1: 12, y1: 12, x2: 20, y2: 18 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {lines.map((l, i) => {
        const progress = interpolate(Math.max(0, frame - delay - i * 4), [0, 24], [0, 1], { extrapolateRight: "clamp", easing: E_OUT });
        const x2 = l.x1 + (l.x2 - l.x1) * progress;
        const y2 = l.y1 + (l.y2 - l.y1) * progress;
        return <line key={i} x1={l.x1} y1={l.y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} />;
      })}
      {nodes.map((n, i) => {
        const s = spring({ frame: Math.max(0, frame - delay - i * 5), fps, config: { damping: 20, stiffness: 300 }, from: 0, to: 1 });
        return (
          <circle key={i} cx={n.cx} cy={n.cy} r={n.r * s} fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        );
      })}
    </svg>
  );
};

// 🎵 Musique
export const IconMusic: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const bounce = Math.sin(frame * 0.08) * 3;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${bounce}px)` }}>
      <AnimatedPath d="M9 18V5l12-2v13" color={color} strokeWidth={2} delay={delay} totalLength={60} />
      <circle cx="6" cy="18" r="3" fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={19} strokeDashoffset={interpolate(Math.max(0, frame - delay - 15), [0, 20], [19, 0], { extrapolateRight: "clamp", easing: E_OUT })}
      />
      <circle cx="18" cy="16" r="3" fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={19} strokeDashoffset={interpolate(Math.max(0, frame - delay - 20), [0, 20], [19, 0], { extrapolateRight: "clamp", easing: E_OUT })}
      />
    </svg>
  );
};

// 🌱 Nature / Écologie
export const IconLeaf: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <AnimatedPath d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" color={color} strokeWidth={2} delay={delay} totalLength={80} />
    <AnimatedPath d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" color={color} strokeWidth={2} delay={delay + 20} totalLength={40} />
  </svg>
);

// 🏃 Sport / Mouvement
export const IconRun: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const lean = Math.sin(frame * 0.05) * 3;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${lean}deg)` }}>
      <circle cx="13" cy="4" r="2" fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={13} strokeDashoffset={interpolate(Math.max(0, frame - delay), [0, 20], [13, 0], { extrapolateRight: "clamp", easing: E_OUT })}
      />
      <AnimatedPath d="m6 17 3.5-3.5 2.5 2.5L15 13l2 4" color={color} strokeWidth={2} delay={delay + 5} totalLength={50} />
      <AnimatedPath d="M6 8.5C7 6 9 5 11 5.5l2.5 1L17 4" color={color} strokeWidth={2} delay={delay + 10} totalLength={50} />
    </svg>
  );
};

// 🧠 IA / Cerveau / Intelligence
export const IconBrain: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.06) * 0.04;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `scale(${pulse})` }}>
      <AnimatedPath d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16A2.5 2.5 0 0 1 9.5 2z" color={color} strokeWidth={1.8} delay={delay} totalLength={120} />
      <AnimatedPath d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16A2.5 2.5 0 0 0 14.5 2z" color={color} strokeWidth={1.8} delay={delay + 10} totalLength={120} />
    </svg>
  );
};

// 💰 Finance / Argent
export const IconMoney: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <AnimatedPath d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" color={color} strokeWidth={2} delay={delay} totalLength={80} />
  </svg>
);

// 🎯 Objectif / Cible
export const IconTarget: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[10, 7, 4].map((r, i) => (
        <circle key={i} cx="12" cy="12" r={r} fill="none" stroke={color}
          strokeWidth={i === 2 ? 2.5 : 1.5}
          strokeOpacity={i === 2 ? 1 : 0.5}
          strokeDasharray={r * 6.28}
          strokeDashoffset={interpolate(Math.max(0, frame - delay - i * 6), [0, 30], [r * 6.28, 0], { extrapolateRight: "clamp", easing: E_OUT })}
        />
      ))}
      <AnimatedPath d="M22 12h-4" color={color} strokeWidth={2} delay={delay + 20} totalLength={10} />
      <AnimatedPath d="M6 12H2" color={color} strokeWidth={2} delay={delay + 22} totalLength={10} />
      <AnimatedPath d="M12 6V2" color={color} strokeWidth={2} delay={delay + 24} totalLength={10} />
      <AnimatedPath d="M12 22v-4" color={color} strokeWidth={2} delay={delay + 26} totalLength={10} />
    </svg>
  );
};

// 🌟 Étoile / Excellence
export const IconStar: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const spin = interpolate(frame, [0, 120], [0, 10], { extrapolateRight: "clamp", easing: E_OUT });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ transform: `rotate(${spin}deg)`, transformOrigin: "center" }}>
      <AnimatedPath
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        color={color} strokeWidth={2} delay={delay} totalLength={100}
      />
    </svg>
  );
};

// 📱 Mobile / App
export const IconPhone: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <AnimatedPath d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4z" color={color} strokeWidth={2} delay={delay} totalLength={80} />
    <AnimatedPath d="M12 18h.01" color={color} strokeWidth={2.5} delay={delay + 20} totalLength={5} />
  </svg>
);

// 🔥 Feu / Viral / Hot
export const IconFire: React.FC<{ color: string; size?: number; delay?: number }> = ({ color, size = 120, delay = 0 }) => {
  const frame = useCurrentFrame();
  const flicker = Math.sin(frame * 0.12) * 2;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${flicker}px)` }}>
      <AnimatedPath
        d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.16-.81-2.17-1.95-2.41C10.1 11.84 9 10.78 9 9.5 9 8.12 10.12 7 11.5 7c1.12 0 2.07.73 2.4 1.73M12 22c3.31 0 6-2.69 6-6 0-1.17-.33-2.26-.9-3.19C16.46 14.22 15 14.68 15 14c0-.98.42-1.85 1.09-2.46.14-.13.23-.3.23-.5 0-.55-.67-.87-1.12-.52C13.55 11.93 12.5 13.15 12.5 14.5c0 .28.03.55.09.8C12.12 15.09 12 15.05 12 15c0-.47.17-.9.45-1.24C11.34 13.15 10.5 11.93 10.5 10.5c0-.83.34-1.58.88-2.12C9.41 9.55 8 11.64 8 14c0 4.42 3.58 8 8 8z"
        color={color} strokeWidth={1.8} delay={delay} totalLength={120}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────
// MAPPING AUTOMATIQUE — sujet → icône
// ─────────────────────────────────────────────────────────
export type IconType =
  | "search" | "lightning" | "globe" | "rocket" | "bulb"
  | "trendUp" | "trophy" | "network" | "music" | "leaf"
  | "run" | "brain" | "money" | "target" | "star"
  | "phone" | "fire";

export const IconComponent: React.FC<{
  type: IconType;
  color: string;
  size?: number;
  delay?: number;
}> = ({ type, color, size = 120, delay = 0 }) => {
  switch (type) {
    case "search":    return <IconSearch    color={color} size={size} delay={delay} />;
    case "lightning": return <IconLightning color={color} size={size} delay={delay} />;
    case "globe":     return <IconGlobe     color={color} size={size} delay={delay} />;
    case "rocket":    return <IconRocket    color={color} size={size} delay={delay} />;
    case "bulb":      return <IconBulb      color={color} size={size} delay={delay} />;
    case "trendUp":   return <IconTrendUp   color={color} size={size} delay={delay} />;
    case "trophy":    return <IconTrophy    color={color} size={size} delay={delay} />;
    case "network":   return <IconNetwork   color={color} size={size} delay={delay} />;
    case "music":     return <IconMusic     color={color} size={size} delay={delay} />;
    case "leaf":      return <IconLeaf      color={color} size={size} delay={delay} />;
    case "run":       return <IconRun       color={color} size={size} delay={delay} />;
    case "brain":     return <IconBrain     color={color} size={size} delay={delay} />;
    case "money":     return <IconMoney     color={color} size={size} delay={delay} />;
    case "target":    return <IconTarget    color={color} size={size} delay={delay} />;
    case "star":      return <IconStar      color={color} size={size} delay={delay} />;
    case "phone":     return <IconPhone     color={color} size={size} delay={delay} />;
    case "fire":      return <IconFire      color={color} size={size} delay={delay} />;
    default:          return <IconStar      color={color} size={size} delay={delay} />;
  }
};

export function detectIcon(text: string): IconType {
  const t = text.toLowerCase();
  if (t.match(/recherche|search|google|find/))        return "search";
  if (t.match(/énergie|vitesse|rapide|fast|power/))   return "lightning";
  if (t.match(/monde|global|international|pays/))     return "globe";
  if (t.match(/startup|lancement|launch|croissance/)) return "rocket";
  if (t.match(/idée|innovation|créat|inventi/))       return "bulb";
  if (t.match(/hausse|profit|revenue|finance|bourse/))return "trendUp";
  if (t.match(/champion|victoire|trophée|n°1|winner/))return "trophy";
  if (t.match(/réseau|network|connexion|ia|neural/))  return "network";
  if (t.match(/musique|music|chanson|concert|son/))   return "music";
  if (t.match(/nature|écologie|vert|plante|earth/))   return "leaf";
  if (t.match(/sport|course|run|fitness|gym/))        return "run";
  if (t.match(/cerveau|intelligence|cogni|mental/))   return "brain";
  if (t.match(/argent|money|dollar|€|\$|finance/))    return "money";
  if (t.match(/objectif|cible|but|goal|target/))      return "target";
  if (t.match(/excel|n°1|meilleur|best|top/))         return "star";
  if (t.match(/mobile|app|phone|téléphone/))          return "phone";
  if (t.match(/viral|feu|fire|buzz|hot/))             return "fire";
  return "star";
}
