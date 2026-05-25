import {
  AbsoluteFill,
  Audio, interpolate, Easing, useVideoConfig, useCurrentFrame, Sequence,
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
  TypewriterScene, ScrambleTextScene, NeonGlowScene, StampScene,
  WaveTextScene, OutlineFillScene, OdometerScene, ProgressRingScene,
  GaugeScene, BubbleChartScene, NotificationScene, SuccessCheckScene,
  FeatureHighlightScene, LikeExplosionScene, FollowerCounterScene,
  StarfieldScene, AuroraScene, MatrixRainScene, CountdownRingScene,
  XPBarScene, FlightBoardScene, StockChartScene, HologramScene,
  MoneyRainScene, TitleCardScene,
  MagneticTextScene, GradientSlideScene, CascadeScene, BlurFocusScene,
  ParticleRainScene, FireParticlesScene, SnowFallScene, SunRayScene,
  FunnelScene, ComparisonBarsScene, ROIScene,
  AchievementScene, CircuitBoardScene, GlitchScreenScene,
  PollResultsScene, CommentThreadScene,
  EndCreditsScene, WipeTransitionScene, DollyZoomScene,
  StepsScene, CompareScene, QuoteRevealScene, BenefitsScene,
  MoodBoardScene, MinimalistScene, GradientBgScene, PriceRevealScene,
  LogoRevealScene, BrandIntroScene, ColorPaletteScene,
  PropertyScene, ScoreboardScene, PlayerStatScene,
  MenuItemScene, HeartbeatScene,
  GeometricScene, LiquidScene, MorphShapeScene, DNAScene,
  SwipeScene, ClickScene, LoadingScene,
  AudioWaveformScene, VinylScene,
  MagazineCoverScene, PullQuoteScene, InfographicScene,
} from "./templates/scenes";

export type MotionVideoProps = {
  scenes: SceneData[];
  sceneDurations: Array<
    number | { startFrame?: number; endFrame?: number; durationFrames?: number }
  >;
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
    case "typewriter":      return <TypewriterScene scene={s} sceneIndex={index} />;
    case "scramble":        return <ScrambleTextScene scene={s} sceneIndex={index} />;
    case "neonglow":        return <NeonGlowScene scene={s} sceneIndex={index} />;
    case "stamp":           return <StampScene scene={s} sceneIndex={index} />;
    case "wavetext":        return <WaveTextScene scene={s} sceneIndex={index} />;
    case "outlinefill":     return <OutlineFillScene scene={s} sceneIndex={index} />;
    case "odometer":        return <OdometerScene scene={s} sceneIndex={index} />;
    case "progressring":    return <ProgressRingScene scene={s} sceneIndex={index} />;
    case "gauge":           return <GaugeScene scene={s} sceneIndex={index} />;
    case "bubblechart":     return <BubbleChartScene scene={s} sceneIndex={index} />;
    case "notification":    return <NotificationScene scene={s} sceneIndex={index} />;
    case "successcheck":    return <SuccessCheckScene scene={s} sceneIndex={index} />;
    case "featurehighlight":return <FeatureHighlightScene scene={s} sceneIndex={index} />;
    case "likeexplosion":   return <LikeExplosionScene scene={s} sceneIndex={index} />;
    case "followercounter": return <FollowerCounterScene scene={s} sceneIndex={index} />;
    case "starfield":       return <StarfieldScene scene={s} sceneIndex={index} />;
    case "aurora":          return <AuroraScene scene={s} sceneIndex={index} />;
    case "matrix":          return <MatrixRainScene scene={s} sceneIndex={index} />;
    case "countdownring":   return <CountdownRingScene scene={s} sceneIndex={index} />;
    case "xpbar":           return <XPBarScene scene={s} sceneIndex={index} />;
    case "flightboard":     return <FlightBoardScene scene={s} sceneIndex={index} />;
    case "stockchart":      return <StockChartScene scene={s} sceneIndex={index} />;
    case "hologram":        return <HologramScene scene={s} sceneIndex={index} />;
    case "moneyrain":       return <MoneyRainScene scene={s} sceneIndex={index} />;
    case "titlecard":       return <TitleCardScene scene={s} sceneIndex={index} />;
    case "magnetic":        return <MagneticTextScene scene={s} sceneIndex={index} />;
    case "gradientslide":   return <GradientSlideScene scene={s} sceneIndex={index} />;
    case "cascade":         return <CascadeScene scene={s} sceneIndex={index} />;
    case "blurfocus":       return <BlurFocusScene scene={s} sceneIndex={index} />;
    case "particlerain":    return <ParticleRainScene scene={s} sceneIndex={index} />;
    case "fire":            return <FireParticlesScene scene={s} sceneIndex={index} />;
    case "snow":            return <SnowFallScene scene={s} sceneIndex={index} />;
    case "sunray":          return <SunRayScene scene={s} sceneIndex={index} />;
    case "funnel":          return <FunnelScene scene={s} sceneIndex={index} />;
    case "comparisonbars":  return <ComparisonBarsScene scene={s} sceneIndex={index} />;
    case "roi":             return <ROIScene scene={s} sceneIndex={index} />;
    case "achievement":     return <AchievementScene scene={s} sceneIndex={index} />;
    case "circuit":         return <CircuitBoardScene scene={s} sceneIndex={index} />;
    case "glitchscreen":    return <GlitchScreenScene scene={s} sceneIndex={index} />;
    case "pollresults":     return <PollResultsScene scene={s} sceneIndex={index} />;
    case "commentthread":   return <CommentThreadScene scene={s} sceneIndex={index} />;
    case "endcredits":      return <EndCreditsScene scene={s} sceneIndex={index} />;
    case "wipe":            return <WipeTransitionScene scene={s} sceneIndex={index} />;
    case "dollyzoom":       return <DollyZoomScene scene={s} sceneIndex={index} />;
    case "steps":           return <StepsScene scene={s} sceneIndex={index} />;
    case "compare":         return <CompareScene scene={s} sceneIndex={index} />;
    case "quotereveal":     return <QuoteRevealScene scene={s} sceneIndex={index} />;
    case "benefits":        return <BenefitsScene scene={s} sceneIndex={index} />;
    case "moodboard":       return <MoodBoardScene scene={s} sceneIndex={index} />;
    case "minimalist":      return <MinimalistScene scene={s} sceneIndex={index} />;
    case "gradientbg":      return <GradientBgScene scene={s} sceneIndex={index} />;
    case "pricereveal":     return <PriceRevealScene scene={s} sceneIndex={index} />;
    case "logoreveal":      return <LogoRevealScene scene={s} sceneIndex={index} />;
    case "brandintro":      return <BrandIntroScene scene={s} sceneIndex={index} />;
    case "colorpalette":    return <ColorPaletteScene scene={s} sceneIndex={index} />;
    case "property":        return <PropertyScene scene={s} sceneIndex={index} />;
    case "scoreboard":      return <ScoreboardScene scene={s} sceneIndex={index} />;
    case "playerstat":      return <PlayerStatScene scene={s} sceneIndex={index} />;
    case "menuitem":        return <MenuItemScene scene={s} sceneIndex={index} />;
    case "heartbeat":       return <HeartbeatScene scene={s} sceneIndex={index} />;
    case "geometric":       return <GeometricScene scene={s} sceneIndex={index} />;
    case "liquid":          return <LiquidScene scene={s} sceneIndex={index} />;
    case "morphshape":      return <MorphShapeScene scene={s} sceneIndex={index} />;
    case "dna":             return <DNAScene scene={s} sceneIndex={index} />;
    case "swipe":           return <SwipeScene scene={s} sceneIndex={index} />;
    case "click":           return <ClickScene scene={s} sceneIndex={index} />;
    case "loading":         return <LoadingScene scene={s} sceneIndex={index} />;
    case "audiowaveform":   return <AudioWaveformScene scene={s} sceneIndex={index} />;
    case "vinyl":           return <VinylScene scene={s} sceneIndex={index} />;
    case "magazinecover":   return <MagazineCoverScene scene={s} sceneIndex={index} />;
    case "pullquote":       return <PullQuoteScene scene={s} sceneIndex={index} />;
    case "infographic":     return <InfographicScene scene={s} sceneIndex={index} />;
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

const getTimingValue = (
  timing: number | { startFrame?: number; endFrame?: number; durationFrames?: number } | undefined,
): number => {
  if (typeof timing === "number") return timing;
  if (!timing) return 90;
  if (typeof timing.durationFrames === "number") return timing.durationFrames;
  if (typeof timing.startFrame === "number" && typeof timing.endFrame === "number") {
    return timing.endFrame - timing.startFrame;
  }
  return 90;
};

const getSceneStartFrame = (
  timings: MotionVideoProps["sceneDurations"],
  index: number,
): number => {
  const timing = timings?.[index];
  if (timing && typeof timing !== "number" && typeof timing.startFrame === "number") {
    return timing.startFrame;
  }

  return (timings || []).slice(0, index).reduce((acc, entry) => acc + getTimingValue(entry), 0);
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

      {scenes.map((scene, index) => {
        const startFrame = getSceneStartFrame(sceneDurations, index);
        const duration = Math.max(1, getTimingValue(sceneDurations?.[index]));

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={duration}
          >
            <SceneRenderer scene={scene} index={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
