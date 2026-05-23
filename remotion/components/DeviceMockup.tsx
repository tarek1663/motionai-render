import {
  AbsoluteFill, interpolate, spring,
  useCurrentFrame, useVideoConfig, Easing, staticFile,
} from "remotion";
import React from "react";

const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
const easeInExpo  = Easing.bezier(0.7, 0, 0.84, 0);

// ── IPHONE MOCKUP ─────────────────────────────────────────────────────────
export const IphoneMockup: React.FC<{
  startFrame: number;
  duration: number;
  accentColor: string;
  content?: React.ReactNode;
  appName?: string;
  appIcon?: string;
}> = ({ startFrame, duration, accentColor, content, appName, appIcon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - startFrame;
  const exitF = duration - 40;

  // Entrée avec inertie physique
  const s = spring({ frame: lf, fps, config: { damping: 22, stiffness: 180, mass: 1.2 }, from: 0, to: 1 });
  const entryY = interpolate(lf, [0, 50], [80, 0], { extrapolateRight: "clamp", easing: easeOutExpo });
  const exitOp = interpolate(lf, [exitF, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInExpo });

  // Idle — flotte très doucement
  const idleY = s > 0.95 ? Math.sin(frame * 0.024) * 8 : 0;
  const idleRot = s > 0.95 ? Math.sin(frame * 0.016) * 1.5 : 0;
  const idleS = s > 0.95 ? 1 + Math.sin(frame * 0.02) * 0.008 : 1;

  // 3D tilt subtil
  const tiltX = Math.sin(frame * 0.018) * 2.5;
  const tiltY = Math.cos(frame * 0.014) * 1.8;

  // Entry blur
  const blur = interpolate(lf, [0, 24], [16, 0], { extrapolateRight: "clamp" });

  const W = 340, H = 736;
  const screenX = 18, screenY = 18, screenW = W - 36, screenH = H - 36;

  return (
    <div style={{
      width: W, height: H,
      position: "relative",
      transform: `scale(${s * idleS}) translateY(${entryY + idleY}px) rotate(${idleRot}deg) perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      opacity: s * exitOp,
      filter: `blur(${blur}px)`,
    }}>
      {/* Corps iPhone */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: 48,
        background: "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1), 0 20px 60px rgba(0,0,0,0.5), 0 60px 120px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}>
        {/* Bord métallique */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: 48,
          border: "1.5px solid rgba(255,255,255,0.12)",
          background: "transparent",
        }} />

        {/* Highlight haut gauche */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "45%", height: "35%",
          background: "radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.08) 0%, transparent 65%)",
          borderRadius: "48px 0 0 0",
        }} />

        {/* Écran */}
        <div style={{
          position: "absolute",
          left: screenX, top: screenY,
          width: screenW, height: screenH,
          borderRadius: 38,
          overflow: "hidden",
          background: "#000",
        }}>
          {/* Status bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 50, zIndex: 10,
            display: "flex", alignItems: "center",
            padding: "0 24px",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "system-ui" }}>9:41</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
                <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
                <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
                <rect x="9" y="0" width="3" height="12" rx="1"/>
                <rect x="14" y="1" width="3" height="10" rx="1" fill="none" stroke="white" strokeWidth="1"/>
                <rect x="14.5" y="3" width="2" height="6" rx="0.5"/>
              </svg>
            </div>
          </div>

          {/* Dynamic Island */}
          <div style={{
            position: "absolute", top: 10, left: "50%",
            transform: "translateX(-50%)",
            width: 120, height: 34, borderRadius: 17,
            background: "#000", zIndex: 20,
          }} />

          {/* Contenu app */}
          {content || <DefaultAppContent accentColor={accentColor} appName={appName} appIcon={appIcon} frame={frame} lf={lf} />}
        </div>

        {/* Boutons côté */}
        {/* Volume + */}
        <div style={{ position: "absolute", left: -3, top: 130, width: 3, height: 36, background: "#333", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: -3, top: 178, width: 3, height: 36, background: "#333", borderRadius: "2px 0 0 2px" }} />
        {/* Power */}
        <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 70, background: "#333", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
};

// Contenu app par défaut
const DefaultAppContent: React.FC<{
  accentColor: string;
  appName?: string;
  appIcon?: string;
  frame: number;
  lf: number;
}> = ({ accentColor, appName, appIcon, frame, lf }) => {
  const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

  const bars = [0.65, 0.45, 0.8, 0.55, 0.9, 0.7, 0.4, 0.75];

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
      padding: "60px 20px 20px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: interpolate(lf, [10, 24], [0, 1], { extrapolateRight: "clamp", easing: easeOut }),
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "system-ui", letterSpacing: "-0.5px" }}>
            {appName || "Dashboard"}
          </div>
          <div style={{ fontSize: 13, color: "#666", fontFamily: "system-ui", marginTop: 2 }}>Vue d'ensemble</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: accentColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: `0 4px 16px ${accentColor}55`,
        }}>
          {appIcon || "✦"}
        </div>
      </div>

      {/* Metric card principale */}
      <div style={{
        background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}0a)`,
        border: `1px solid ${accentColor}33`,
        borderRadius: 18, padding: "18px 20px",
        opacity: interpolate(lf, [14, 30], [0, 1], { extrapolateRight: "clamp", easing: easeOut }),
        transform: `translateY(${interpolate(lf, [14, 30], [14, 0], { extrapolateRight: "clamp", easing: easeOut })}px)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}>
        <div style={{ fontSize: 13, color: "#888", fontFamily: "system-ui", marginBottom: 6 }}>Revenue</div>
        <div style={{
          fontSize: 32, fontWeight: 800, color: accentColor,
          fontFamily: "system-ui", letterSpacing: "-1px",
          textShadow: `0 0 20px ${accentColor}44`,
        }}>
          ${(interpolate(lf, [14, 80], [0, 48293], { extrapolateRight: "clamp", easing: easeOut })).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>
        <div style={{ fontSize: 12, color: "#30d158", marginTop: 4, fontFamily: "system-ui" }}>↑ 23.4% ce mois</div>
      </div>

      {/* Mini chart */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "16px 16px 12px",
        opacity: interpolate(lf, [20, 38], [0, 1], { extrapolateRight: "clamp", easing: easeOut }),
      }}>
        <div style={{ fontSize: 12, color: "#666", fontFamily: "system-ui", marginBottom: 12 }}>7 derniers jours</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 50 }}>
          {bars.map((h, i) => {
            const barProgress = interpolate(lf, [20 + i * 4, 36 + i * 4], [0, 1], { extrapolateRight: "clamp", easing: easeOut });
            return (
              <div key={i} style={{
                flex: 1, height: `${h * 100 * barProgress}%`,
                background: i === bars.length - 1 ? accentColor : `${accentColor}66`,
                borderRadius: 3,
                boxShadow: i === bars.length - 1 ? `0 0 8px ${accentColor}55` : "none",
              }} />
            );
          })}
        </div>
      </div>

      {/* Liste transactions */}
      {[
        { name: "Stripe", amount: "+$1,240", time: "Il y a 2h", color: "#635BFF" },
        { name: "Shopify", amount: "+$890", time: "Il y a 5h", color: "#96BF48" },
        { name: "PayPal", amount: "+$340", time: "Hier", color: "#009CDE" },
      ].map((item, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0",
          borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
          opacity: interpolate(lf, [28 + i * 6, 42 + i * 6], [0, 1], { extrapolateRight: "clamp", easing: easeOut }),
          transform: `translateX(${interpolate(lf, [28 + i * 6, 42 + i * 6], [-10, 0], { extrapolateRight: "clamp", easing: easeOut })}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: item.color + "22",
              border: `1px solid ${item.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: item.color,
            }}>$</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "system-ui" }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "#555", fontFamily: "system-ui" }}>{item.time}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#30d158", fontFamily: "system-ui" }}>{item.amount}</div>
        </div>
      ))}
    </div>
  );
};

// ── MACBOOK MOCKUP ────────────────────────────────────────────────────────
export const MacbookMockup: React.FC<{
  startFrame: number;
  duration: number;
  accentColor: string;
  url?: string;
  headline?: string;
}> = ({ startFrame, duration, accentColor, url, headline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - startFrame;
  const exitF = duration - 40;

  const s = spring({ frame: lf, fps, config: { damping: 22, stiffness: 160, mass: 1.4 }, from: 0, to: 1 });
  const entryY = interpolate(lf, [0, 55], [70, 0], { extrapolateRight: "clamp", easing: easeOutExpo });
  const exitOp = interpolate(lf, [exitF, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInExpo });

  const idleY = s > 0.95 ? Math.sin(frame * 0.022) * 6 : 0;
  const tiltX = Math.sin(frame * 0.015) * 1.5;
  const tiltY = Math.cos(frame * 0.011) * 1.0;
  const blur = interpolate(lf, [0, 24], [12, 0], { extrapolateRight: "clamp" });

  const W = 900, H = 560;
  const screenX = 76, screenY = 25, screenW = W - 152, screenH = H * 0.83;

  const scrollY = interpolate(lf, [30, 110], [0, 160], { extrapolateRight: "clamp", easing: easeOutExpo });

  return (
    <div style={{
      width: W, height: H,
      position: "relative",
      transform: `scale(${s}) translateY(${entryY + idleY}px) perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      opacity: s * exitOp,
      filter: `blur(${blur}px)`,
    }}>
      {/* Lid */}
      <div style={{
        position: "absolute",
        left: 38, top: 0,
        width: W - 76, height: H * 0.88,
        borderRadius: "14px 14px 0 0",
        background: "linear-gradient(145deg, #2d2d2d 0%, #1c1c1c 50%, #141414 100%)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1), 0 20px 60px rgba(0,0,0,0.6), 0 60px 100px rgba(0,0,0,0.4)",
      }}>
        {/* Bezel */}
        <div style={{
          position: "absolute",
          left: 14, top: 12,
          width: screenW, height: screenH,
          borderRadius: 6,
          background: "#111",
          overflow: "hidden",
        }}>
          {/* Browser content */}
          <div style={{ transform: `translateY(-${scrollY}px)` }}>
            {/* URL bar */}
            <div style={{
              height: 36, background: "#1e1e1e",
              display: "flex", alignItems: "center",
              padding: "0 12px", gap: 8,
              borderBottom: "1px solid #2a2a2a",
            }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
              ))}
              <div style={{
                flex: 1, marginLeft: 8,
                background: "#2a2a2a", borderRadius: 14,
                padding: "3px 12px", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 9, color: "#30d158" }}>🔒</span>
                <span style={{ fontSize: 9, color: "#666", fontFamily: "system-ui" }}>{url || "https://example.com"}</span>
              </div>
            </div>

            {/* Page content */}
            <div style={{
              background: "#0a0a0a",
              padding: "20px 24px",
              minHeight: screenH,
            }}>
              {/* Nav */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 18, paddingBottom: 14,
                borderBottom: "1px solid #1a1a1a",
              }}>
                <div style={{ width: 90, height: 16, background: accentColor, borderRadius: 3 }} />
                <div style={{
                  background: accentColor, borderRadius: 4,
                  padding: "4px 14px", fontSize: 10, color: "#fff", fontFamily: "system-ui", fontWeight: 600,
                  boxShadow: `0 2px 12px ${accentColor}44`,
                }}>
                  {(url || "").replace("https://", "").split(".")[0] || "Démarrer"}
                </div>
              </div>

              {/* Hero */}
              <div style={{ textAlign: "center", marginBottom: 20, padding: "10px 0" }}>
                <div style={{
                  fontSize: 32, fontWeight: 800, color: "#fff",
                  fontFamily: "system-ui", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 10,
                  opacity: interpolate(lf, [14, 26], [0, 1], { extrapolateRight: "clamp" }),
                }}>
                  {headline || "Votre produit, amplifié."}
                </div>
                                <div style={{ width: "25%", height: 2, background: accentColor, borderRadius: 1, margin: "0 auto", boxShadow: `0 0 8px ${accentColor}66` }} />
              </div>

              {/* Cards */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { icon: "⚡", label: "Rapide" },
                  { icon: "🎯", label: "Précis" },
                  { icon: "✦", label: "Premium" },
                ].map((card, i) => (
                  <div key={i} style={{
                    flex: 1, background: "#141414",
                    borderRadius: 10, padding: "14px 12px",
                    border: "1px solid #1e1e1e",
                    opacity: interpolate(lf, [20 + i * 5, 32 + i * 5], [0, 1], { extrapolateRight: "clamp" }),
                    transform: `translateY(${interpolate(lf, [20 + i * 5, 32 + i * 5], [10, 0], { extrapolateRight: "clamp" })}px)`,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: "system-ui" }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div style={{
                display: "flex", gap: 10, marginTop: 10,
                opacity: interpolate(lf, [30, 45], [0, 1], { extrapolateRight: "clamp" }),
              }}>
                {[
                  { value: "98%", label: "Satisfaction", color: "#30d158" },
                  { value: "2min", label: "Setup", color: accentColor },
                ].map((stat, i) => (
                  <div key={i} style={{
                    flex: 1, background: "#0f0f0f",
                    borderRadius: 10, padding: "12px",
                    border: `1px solid ${stat.color}22`,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: "system-ui" }}>{stat.value}</div>
                    <div style={{ fontSize: 9, color: "#555", fontFamily: "system-ui", marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Highlight lid */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "rgba(255,255,255,0.12)", borderRadius: "14px 14px 0 0",
        }} />
      </div>

      {/* Base / keyboard */}
      <div style={{
        position: "absolute",
        left: 0, bottom: 0,
        width: W, height: H * 0.14,
        borderRadius: "0 0 8px 8px",
        background: "linear-gradient(180deg, #323232 0%, #282828 100%)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}>
        {/* Trackpad */}
        <div style={{
          position: "absolute",
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: 220, height: 40,
          background: "#2a2a2a",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.05)",
        }} />
        {/* Highlight base */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "rgba(255,255,255,0.08)",
        }} />
      </div>
    </div>
  );
};

// ── MULTI-DEVICE SCENE ────────────────────────────────────────────────────
// 2 iPhones côte à côte avec profondeur Z
export const MultiDeviceScene: React.FC<{
  startFrame: number;
  duration: number;
  accentColor: string;
}> = ({ startFrame, duration, accentColor }) => {
  const frame = useCurrentFrame();
  const lf = frame - startFrame;

  // Parallax entre les deux devices
  const leftParallax = Math.sin(frame * 0.02) * 10;
  const rightParallax = Math.sin(frame * 0.02 + Math.PI) * 10;

  const op = interpolate(lf, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: easeOutExpo })
    * interpolate(lf, [duration - 40, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInExpo });

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: -40,
      opacity: op,
    }}>
      {/* Device gauche — arrière plan, plus petit */}
      <div style={{
        transform: `scale(0.78) translateY(${leftParallax + 30}px) rotate(-6deg)`,
        opacity: 0.65,
        filter: "blur(1.5px)",
        zIndex: 1,
        marginRight: -20,
      }}>
        <IphoneMockup
          startFrame={startFrame}
          duration={duration}
          accentColor="#30d158"
          appName="Analytics"
          appIcon="📊"
        />
      </div>

      {/* Device central — foreground */}
      <div style={{
        transform: `scale(1) translateY(${-20 + Math.sin(frame * 0.025) * 6}px)`,
        zIndex: 3,
        filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6))",
      }}>
        <IphoneMockup
          startFrame={startFrame}
          duration={duration}
          accentColor={accentColor}
          appName="Dashboard"
          appIcon="✦"
        />
      </div>

      {/* Device droite — arrière plan */}
      <div style={{
        transform: `scale(0.78) translateY(${rightParallax + 30}px) rotate(6deg)`,
        opacity: 0.65,
        filter: "blur(1.5px)",
        zIndex: 1,
        marginLeft: -20,
      }}>
        <IphoneMockup
          startFrame={startFrame}
          duration={duration}
          accentColor="#ff6b35"
          appName="Payments"
          appIcon="💳"
        />
      </div>
    </div>
  );
};
