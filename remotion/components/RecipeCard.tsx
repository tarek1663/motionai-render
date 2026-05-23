import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import React from "react";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export type RecipeCardProps = {
  title: string;
  emoji: string;
  ingredients?: string[];
  steps?: string[];
  duration?: string;
  servings?: string;
  difficulty?: "Facile" | "Moyen" | "Difficile";
  delay?: number;
  width?: number;
  accentColor?: string;
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  title,
  emoji,
  ingredients = [],
  steps = [],
  duration = "30 min",
  servings = "4 pers.",
  difficulty = "Facile",
  delay = 0,
  width = 700,
  accentColor = "#ff8c00",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 160 }, from: 0.8, to: 1 });
  const opacity = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const floatY = f > 30 ? Math.sin(f * 0.03) * 5 : 0;

  return (
    <div style={{
      width,
      transform: `scale(${s}) translateY(${floatY}px)`,
      opacity,
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
      background: "#ffffff",
    }}>
      {/* Header coloré */}
      <div style={{
        background: accentColor,
        padding: `${width * 0.04}px ${width * 0.05}px`,
        display: "flex",
        alignItems: "center",
        gap: width * 0.03,
      }}>
        <div style={{ fontSize: width * 0.1 }}>{emoji}</div>
        <div>
          <div style={{
            fontSize: width * 0.06,
            fontWeight: 800,
            color: "#fff",
            fontFamily,
            letterSpacing: "-0.02em",
          }}>{title}</div>
          <div style={{ display: "flex", gap: width * 0.02, marginTop: 6 }}>
            {[`⏱️ ${duration}`, `👥 ${servings}`, `📊 ${difficulty}`].map((item, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.25)",
                borderRadius: 20,
                padding: `${width * 0.006}px ${width * 0.015}px`,
                fontSize: width * 0.022,
                color: "#fff",
                fontFamily,
                opacity: interpolate(f, [8 + i * 4, 20 + i * 4], [0, 1], { extrapolateRight: "clamp" }),
              }}>{item}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: `${width * 0.035}px ${width * 0.045}px`, background: "#fff" }}>
        {ingredients.length > 0 && (
          <div style={{ marginBottom: width * 0.03 }}>
            <div style={{
              fontSize: width * 0.03,
              fontWeight: 700,
              color: "#333",
              fontFamily,
              marginBottom: width * 0.015,
              borderLeft: `4px solid ${accentColor}`,
              paddingLeft: 12,
            }}>Ingrédients</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ingredients.map((ing, i) => (
                <div key={i} style={{
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}33`,
                  borderRadius: 20,
                  padding: `${width * 0.005}px ${width * 0.015}px`,
                  fontSize: width * 0.022,
                  color: "#333",
                  fontFamily,
                  opacity: interpolate(f, [12 + i * 3, 22 + i * 3], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateY(${interpolate(f, [12 + i * 3, 22 + i * 3], [10, 0], { extrapolateRight: "clamp" })}px)`,
                }}>{ing}</div>
              ))}
            </div>
          </div>
        )}

        {steps.length > 0 && (
          <div>
            <div style={{
              fontSize: width * 0.03,
              fontWeight: 700,
              color: "#333",
              fontFamily,
              marginBottom: width * 0.015,
              borderLeft: `4px solid ${accentColor}`,
              paddingLeft: 12,
            }}>Préparation</div>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: "flex",
                gap: width * 0.02,
                marginBottom: width * 0.015,
                opacity: interpolate(f, [20 + i * 5, 32 + i * 5], [0, 1], { extrapolateRight: "clamp" }),
                transform: `translateX(${interpolate(f, [20 + i * 5, 32 + i * 5], [-20, 0], { extrapolateRight: "clamp" })}px)`,
              }}>
                <div style={{
                  width: width * 0.04,
                  height: width * 0.04,
                  borderRadius: "50%",
                  background: accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: width * 0.02,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily,
                  flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ fontSize: width * 0.024, color: "#555", fontFamily, lineHeight: 1.4, paddingTop: 2 }}>{step}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
