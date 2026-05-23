import { Audio, useCurrentFrame } from "remotion";
import React from "react";

export type SFXType = "boom" | "whoosh" | "pop" | "swoosh" | "tick";

export type SFXCue = {
  type: SFXType;
  frame: number;
  volume?: number;
};

// Générateur de sons synthétiques via Web Audio API (pas de fichiers externes)
const SFXComponent: React.FC<{ type: SFXType; volume: number; startFrame: number }> = ({ type, volume, startFrame }) => {
  // On utilise des sons inline encodés en base64 ultra-courts
  // Pour l'instant on désactive le SFX pour éviter les erreurs de rendu
  return null;
};

export const SFXLayer: React.FC<{ cues: SFXCue[] }> = ({ cues }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {cues.map((cue, i) => (
        <SFXComponent
          key={i}
          type={cue.type}
          volume={cue.volume ?? 0.6}
          startFrame={cue.frame}
        />
      ))}
    </>
  );
};
