import {
  AbsoluteFill,
  Audio, interpolate, Easing, useVideoConfig, useCurrentFrame,
} from "remotion";
import {
  linearTiming,
  TransitionSeries,
  TransitionPresentation,
  type TransitionPresentationComponentProps,
} from "@remotion/transitions";

type TransitionProps = Record<string, unknown>;
type TransitionComponentProps = TransitionPresentationComponentProps<TransitionProps>;
import { fade } from "@remotion/transitions/fade";
import React from "react";

const E_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const E_IN  = Easing.bezier(0.7, 0, 0.84, 0);
import {
  SceneData,
  WordScene, RevealScene, SplitScene, SentenceScene,
  CounterScene, ChartScene, CardScene, CTAScene,
  KineticScene, GlitchScene, FloatingStatsScene, ZoomPunchScene,
  ParticlesScene, TimelineScene, HighlightScene, NumbersScene, IconScene,
  WorldMapScene, WaveformScene, ProgressBarsScene, QuoteScene,
  CountdownScene, MirrorScene, DataScrollScene, BurstScene,
  MorphShapesScene, Text3DScene, SplitScreenScene, PhotoScene, MockupScene,
  ReconstructedUIScene, GeneratedUIScene,
} from "./templates/scenes";

export type MotionVideoProps = {
  scenes: SceneData[];
  sceneDurations: number[];
  totalFrames: number;
  audioSrc?: string | null;
  musicSrc?: string | null;
  musicVolume?: number;
  format?: string;
};

// ─────────────────────────────────────────────────────────
// 8 TRANSITIONS PREMIUM — jamais 2x la même famille
// ─────────────────────────────────────────────────────────

const transitionFade = (): TransitionPresentation<TransitionProps> => fade();

const transitionScaleFade = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const scale = entering
      ? interpolate(presentationProgress, [0, 1], [1.06, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0.96], { easing: E_IN });
    const opacity = entering
      ? interpolate(presentationProgress, [0, 1], [0, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0], { easing: E_IN });
    return (
      <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
        {children}
      </AbsoluteFill>
    );
  },
  props: {},
});

const transitionBlurFade = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const blur = entering
      ? interpolate(presentationProgress, [0, 1], [16, 0], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [0, 16], { easing: E_IN });
    const opacity = entering
      ? interpolate(presentationProgress, [0, 1], [0, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0], { easing: E_IN });
    return (
      <AbsoluteFill style={{ opacity, filter: `blur(${blur}px)` }}>
        {children}
      </AbsoluteFill>
    );
  },
  props: {},
});

const transitionScaleDown = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const scale = entering
      ? interpolate(presentationProgress, [0, 1], [0.94, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 1.04], { easing: E_IN });
    const opacity = entering
      ? interpolate(presentationProgress, [0, 1], [0, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0], { easing: E_IN });
    return (
      <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
        {children}
      </AbsoluteFill>
    );
  },
  props: {},
});

const transitionDarkFlash = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const opacity = entering
      ? interpolate(presentationProgress, [0, 1], [0, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0], { easing: E_IN });
    const overlayOp = entering
      ? interpolate(presentationProgress, [0, 0.4, 1], [0.8, 0.2, 0], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 0.6, 1], [0, 0.2, 0.8], { easing: E_IN });
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
        <AbsoluteFill style={{
          background: "#000000", opacity: overlayOp, pointerEvents: "none",
        }} />
      </AbsoluteFill>
    );
  },
  props: {},
});

const transitionWhiteFlash = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const opacity = entering
      ? interpolate(presentationProgress, [0, 1], [0, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0], { easing: E_IN });
    const overlayOp = entering
      ? interpolate(presentationProgress, [0, 0.3, 1], [0.6, 0.1, 0], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 0.7, 1], [0, 0.1, 0.6], { easing: E_IN });
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
        <AbsoluteFill style={{
          background: "#ffffff", opacity: overlayOp, pointerEvents: "none",
        }} />
      </AbsoluteFill>
    );
  },
  props: {},
});

const transitionZoomPunch = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const scale = entering
      ? interpolate(presentationProgress, [0, 1], [1.4, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [1, 0.7], { easing: E_IN });
    const opacity = entering
      ? interpolate(presentationProgress, [0, 0.3, 1], [0, 1, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 0.7, 1], [1, 1, 0], { easing: E_IN });
    const blur = entering
      ? interpolate(presentationProgress, [0, 1], [8, 0], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [0, 8], { easing: E_IN });
    return (
      <AbsoluteFill style={{
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }}>
        {children}
      </AbsoluteFill>
    );
  },
  props: {},
});

const transitionSlideUp = (): TransitionPresentation<TransitionProps> => ({
  component: ({ children, presentationDirection, presentationProgress }: TransitionComponentProps) => {
    const entering = presentationDirection === "entering";
    const y = entering
      ? interpolate(presentationProgress, [0, 1], [60, 0], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 1], [0, -40], { easing: E_IN });
    const opacity = entering
      ? interpolate(presentationProgress, [0, 0.3, 1], [0, 1, 1], { easing: E_OUT })
      : interpolate(presentationProgress, [0, 0.7, 1], [1, 1, 0], { easing: E_IN });
    return (
      <AbsoluteFill style={{
        opacity, transform: `translateY(${y}px)`,
      }}>
        {children}
      </AbsoluteFill>
    );
  },
  props: {},
});

type TransitionFamily = "fade" | "scale" | "blur" | "scaleDown" | "dark" | "white" | "zoom" | "slideUp";

let lastFamily: TransitionFamily = "fade";

const getTransition = (
  fromScene: SceneData,
  toScene: SceneData,
  index: number
): {
  presentation: TransitionPresentation<TransitionProps>;
  timing: ReturnType<typeof linearTiming>;
} => {
  const toType   = toScene?.type;
  const fromType = fromScene?.type;

  let duration = 22;
  if (toType === "glitch" || fromType === "glitch")           duration = 10;
  else if (toType === "zoompunch" || toType === "text3d")     duration = 32;
  else if (toType === "quote" || fromType === "quote")        duration = 30;
  else if (toType === "burst" || toType === "particles")      duration = 14;
  else if (toType === "kinetic" || fromType === "kinetic")    duration = 16;
  else if (toType === "cta")                                  duration = 28;
  else if (toType === "photo" || fromType === "photo")        duration = 26;
  else if (toType === "mockup" || toType === "generatedui")   duration = 30;
  else if (toType === "timeline")                             duration = 24;

  if (toType === "glitch" || fromType === "glitch") {
    lastFamily = "dark";
    return { presentation: transitionDarkFlash(), timing: linearTiming({ durationInFrames: duration }) };
  }
  if (toType === "zoompunch" || toType === "text3d") {
    lastFamily = "zoom";
    return { presentation: transitionZoomPunch(), timing: linearTiming({ durationInFrames: duration }) };
  }
  if (toType === "kinetic" || fromType === "kinetic") {
    lastFamily = "scaleDown";
    return { presentation: transitionScaleDown(), timing: linearTiming({ durationInFrames: duration }) };
  }
  if (toType === "mockup" || toType === "generatedui") {
    lastFamily = "blur";
    return { presentation: transitionBlurFade(), timing: linearTiming({ durationInFrames: duration }) };
  }

  const allFamilies: { family: TransitionFamily; fn: () => TransitionPresentation<TransitionProps> }[] = [
    { family: "fade",      fn: transitionFade },
    { family: "scale",     fn: transitionScaleFade },
    { family: "blur",      fn: transitionBlurFade },
    { family: "scaleDown", fn: transitionScaleDown },
    { family: "dark",      fn: transitionDarkFlash },
    { family: "white",     fn: transitionWhiteFlash },
    { family: "zoom",      fn: transitionZoomPunch },
    { family: "slideUp",   fn: transitionSlideUp },
  ];

  const available = allFamilies.filter((t) => t.family !== lastFamily);
  const chosen = available[index % available.length];
  lastFamily = chosen.family;

  return {
    presentation: chosen.fn(),
    timing: linearTiming({ durationInFrames: duration }),
  };
};

// ─────────────────────────────────────────────────────────
// SCENE RENDERER
// ─────────────────────────────────────────────────────────
const SceneRenderer: React.FC<{ scene: SceneData; index: number }> = ({ scene, index }) => {
  const s = { ...scene, _index: index };
  switch (scene.type) {
    case "word":         return <WordScene          scene={s} sceneIndex={index} />;
    case "reveal":       return <RevealScene         scene={s} sceneIndex={index} />;
    case "split":        return <SplitScene          scene={s} sceneIndex={index} />;
    case "sentence":     return <SentenceScene       scene={s} sceneIndex={index} />;
    case "counter":      return <CounterScene        scene={s} sceneIndex={index} />;
    case "chart":        return <ChartScene          scene={s} sceneIndex={index} />;
    case "card":         return <CardScene           scene={s} sceneIndex={index} />;
    case "cta":          return <CTAScene            scene={s} sceneIndex={index} />;
    case "kinetic":      return <KineticScene        scene={s} sceneIndex={index} />;
    case "glitch":       return <GlitchScene         scene={s} sceneIndex={index} />;
    case "floatstats":   return <FloatingStatsScene   scene={s} sceneIndex={index} />;
    case "zoompunch":    return <ZoomPunchScene       scene={s} sceneIndex={index} />;
    case "particles":    return <ParticlesScene      scene={s} sceneIndex={index} />;
    case "timeline":     return <TimelineScene       scene={s} sceneIndex={index} />;
    case "highlight":    return <HighlightScene      scene={s} sceneIndex={index} />;
    case "numbers":      return <NumbersScene        scene={s} sceneIndex={index} />;
    case "icon":         return <IconScene           scene={s} sceneIndex={index} />;
    case "worldmap":     return <WorldMapScene       scene={s} sceneIndex={index} />;
    case "waveform":     return <WaveformScene       scene={s} sceneIndex={index} />;
    case "progressbars": return <ProgressBarsScene   scene={s} sceneIndex={index} />;
    case "quote":        return <QuoteScene          scene={s} sceneIndex={index} />;
    case "countdown":    return <CountdownScene      scene={s} sceneIndex={index} />;
    case "mirror":       return <MirrorScene         scene={s} sceneIndex={index} />;
    case "datascroll":   return <DataScrollScene     scene={s} sceneIndex={index} />;
    case "burst":        return <BurstScene          scene={s} sceneIndex={index} />;
    case "morphshapes":  return <MorphShapesScene    scene={s} sceneIndex={index} />;
    case "text3d":       return <Text3DScene         scene={s} sceneIndex={index} />;
    case "splitscreen":  return <SplitScreenScene    scene={s} sceneIndex={index} />;
    case "photo":        return <PhotoScene          scene={s} sceneIndex={index} />;
    case "mockup":           return <MockupScene           scene={s} sceneIndex={index} />;
    case "reconstructed": return <ReconstructedUIScene scene={s} sceneIndex={index} />;
    case "generatedui":   return <GeneratedUIScene       scene={s} sceneIndex={index} />;
    default:              return <WordScene                scene={s} sceneIndex={index} />;
  }
};

const MusicAudio: React.FC<{
  src: string;
  targetVolume: number;
  totalFrames: number;
  fadeFrames: number;
}> = ({ src, targetVolume, totalFrames, fadeFrames }) => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [0, fadeFrames], [0, targetVolume], {
    extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(frame, [totalFrames - fadeFrames, totalFrames], [targetVolume, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic),
  });
  const volume = Math.min(fadeIn, fadeOut);
  return <Audio src={src} volume={volume} />;
};

// ─────────────────────────────────────────────────────────
// MOTION VIDEO
// ─────────────────────────────────────────────────────────
export const MotionVideo: React.FC<MotionVideoProps> = ({
  scenes, sceneDurations, totalFrames, audioSrc, musicSrc, musicVolume = 0.18,
}) => {
  const { durationInFrames } = useVideoConfig();
  const FADE_MUSIC = 30;

  return (
    <AbsoluteFill>
      {audioSrc && (
        <Audio
          src={audioSrc}
          volume={1}
        />
      )}

      {musicSrc && (
        <MusicAudio
          src={musicSrc}
          targetVolume={musicVolume}
          totalFrames={durationInFrames}
          fadeFrames={FADE_MUSIC}
        />
      )}

      <TransitionSeries>
        {scenes.map((scene, i) => {
          const dur = sceneDurations?.[i] || 120;
          const nextScene = scenes[i + 1];
          const transition = i < scenes.length - 1
            ? getTransition(scene, nextScene, i)
            : null;

          return (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={dur}>
                <SceneRenderer scene={scene} index={i} />
              </TransitionSeries.Sequence>
              {transition && (
                <TransitionSeries.Transition
                  presentation={transition.presentation}
                  timing={transition.timing}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
