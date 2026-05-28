import {
  AbsoluteFill,
  Audio, interpolate, Easing, useVideoConfig, useCurrentFrame, Sequence,
} from "remotion";
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
  TerminalScene, ToggleScene, FinancialChartScene, InstagramProfileScene,
  NetflixRevealScene, TimerScene, GithubStarsScene, SquiggleTextScene,
  MCPAnimationScene, GlowTextScene, ASCIIScene, PriceTagScene,
  MusicVisualizerScene, SplitRevealScene, CounterPunchScene,
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
  showWatermark?: boolean;
};

const MIN_SCENE_FRAMES = 90;

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
    case "terminal":          return <TerminalScene scene={s} sceneIndex={index} />;
    case "toggle":            return <ToggleScene scene={s} sceneIndex={index} />;
    case "financialchart":    return <FinancialChartScene scene={s} sceneIndex={index} />;
    case "instagramprofile":  return <InstagramProfileScene scene={s} sceneIndex={index} />;
    case "netflixreveal":     return <NetflixRevealScene scene={s} sceneIndex={index} />;
    case "timer":             return <TimerScene scene={s} sceneIndex={index} />;
    case "githubstars":       return <GithubStarsScene scene={s} sceneIndex={index} />;
    case "squiggletext":      return <SquiggleTextScene scene={s} sceneIndex={index} />;
    case "mcpanimation":      return <MCPAnimationScene scene={s} sceneIndex={index} />;
    case "glowtext":          return <GlowTextScene scene={s} sceneIndex={index} />;
    case "ascii":             return <ASCIIScene scene={s} sceneIndex={index} />;
    case "pricetag":          return <PriceTagScene scene={s} sceneIndex={index} />;
    case "musicvisualizer":   return <MusicVisualizerScene scene={s} sceneIndex={index} />;
    case "splitreveal":       return <SplitRevealScene scene={s} sceneIndex={index} />;
    case "counterpunch":      return <CounterPunchScene scene={s} sceneIndex={index} />;
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

const getSceneTiming = (
  timings: MotionVideoProps["sceneDurations"],
  totalFrames: number,
  scenesCount: number,
  index: number,
): { from: number; duration: number } => {
  const timing = timings[index];

  if (timing && typeof timing !== "number") {
    const from = timing.startFrame ?? (timing as { from?: number }).from ?? 0;
    const duration = timing.durationFrames ?? (timing as { duration?: number }).duration ?? 0;

    if (Number.isFinite(from) && Number.isFinite(duration) && duration > 0) {
      return { from, duration };
    }
  }

  const safeScenesCount = Math.max(scenesCount, 1);
  const uniformDuration = Math.max(1, Math.floor(totalFrames / safeScenesCount));

  return {
    from: index * uniformDuration,
    duration: uniformDuration,
  };
};

// ─────────────────────────────────────────────────────────
// MOTION VIDEO
// ─────────────────────────────────────────────────────────
export const MotionVideo: React.FC<MotionVideoProps> = ({
  scenes, sceneDurations, totalFrames, audioSrc, musicSrc, musicVolume = 0.18,
  showWatermark,
}) => {
  const { durationInFrames } = useVideoConfig();
  const FADE_MUSIC = 30;
  const safeTotalFrames = Number.isFinite(totalFrames) && totalFrames > 0 ? totalFrames : 1800;
  const allScenes = scenes || [];
  const timings = sceneDurations || [];

  const CROSSFADE_OVERLAP = 8;

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

      {allScenes.map((scene, index) => {
        const ts = timings[index];
        const fromTiming = getSceneTiming(timings, safeTotalFrames, allScenes.length, index);
        const from = ts && typeof ts !== "number" && Number.isFinite(ts.startFrame)
          ? ts.startFrame!
          : fromTiming.from;
        const duration = ts && typeof ts !== "number" && Number.isFinite(ts.durationFrames) && ts.durationFrames! > 0
          ? ts.durationFrames!
          : Math.max(MIN_SCENE_FRAMES, fromTiming.duration);

        if (!Number.isFinite(from) || !Number.isFinite(duration) || duration <= 0) {
          return null;
        }

        return (
          <Sequence
            key={index}
            from={Math.max(0, from)}
            durationInFrames={duration + CROSSFADE_OVERLAP}
          >
            <SceneRenderer scene={scene} index={index} />
          </Sequence>
        );
      })}

      {showWatermark && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              borderRadius: 8,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 7,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              M
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
              }}
            >
              Motionr
            </span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
