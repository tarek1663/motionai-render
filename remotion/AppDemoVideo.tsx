import React from "react";
import { AbsoluteFill, Audio, Sequence } from "remotion";
import { AppDemoScene } from "./templates/AppDemoScene";

export type AppDemoScreen = {
  id?: string;
  name?: string;
  duration?: number;
  bgColor?: string;
  url?: string;
  elements?: unknown[];
  mousePath?: Array<{ x: number; y: number; frame: number; action: string }>;
  annotations?: Array<{
    text: string;
    x: number;
    y: number;
    arrowDirection: string;
    frame: number;
  }>;
};

export type AppDemoVideoProps = {
  screens: AppDemoScreen[];
  screenDurations: Array<{ startFrame: number; durationFrames: number }>;
  format: "desktop" | "mobile";
  accent: string;
  appName: string;
  bgColor: string;
  totalFrames: number;
  audioSrc?: string | null;
  musicSrc?: string | null;
  musicVolume?: number;
};

export const AppDemoVideo: React.FC<AppDemoVideoProps> = ({
  screens,
  screenDurations,
  format,
  accent,
  appName,
  bgColor,
  audioSrc,
  musicSrc,
  musicVolume = 0.05,
}) => {
  return (
    <AbsoluteFill>
      {audioSrc && <Audio src={audioSrc} volume={1} />}
      {musicSrc && <Audio src={musicSrc} volume={musicVolume} />}
      {screens.map((screen, i) => {
        const timing = screenDurations[i];
        if (!timing) return null;
        return (
          <Sequence
            key={screen.id || `screen-${i}`}
            from={timing.startFrame}
            durationInFrames={timing.durationFrames}
          >
            <AppDemoScene
              screen={screen}
              format={format}
              accent={accent}
              appName={appName}
              bgColor={bgColor}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
