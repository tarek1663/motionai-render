import {
  AbsoluteFill,
  Audio,
  interpolate,
  Easing,
  useVideoConfig,
  useCurrentFrame,
  Sequence,
} from "remotion";
import React from "react";
import {
  SceneData,
  SingleWordScene,
  MaskRevealScene,
  SlideWordScene,
  ZoomWordScene,
  FadeUpLettersScene,
  BlurInScene,
  ScaleInScene,
  SlideUpScene,
  ClipTopScene,
  StaggerWordsScene,
  FadePureScene,
  TrackingScene,
  RotateInScene,
  GeoBgTestScene,
  PhotoRevealScene,
  PhotoCollageScene,
  CounterScene,
  ProgressBarScene,
  MultiStatsScene,
  AccentWordScene,
  UnderlineScene,
  ColorShiftScene,
  LineDrawScene,
  ShapeScene,
  ExpandingShapeScene,
  WipeScene,
  FlashScene,
  ColorFadeScene,
  SplitVerticalScene,
  ZoomTransitionScene,
  IrisScene,
  CurtainScene,
  DiagonalWipeScene,
  GlitchSwitchScene,
  PixelDissolveScene,
  LightSweepScene,
  NotificationScene,
  PulseButtonScene,
  UIProgressScene,
  QuoteScene,
  TimelineScene,
  SocialStatsScene,
  ChecklistScene,
  AudioVizScene,
  ColorLettersScene,
  GradientScene,
  HierarchyTextScene,
  SpotlightScene,
  NoiseScene,
  GradientTextScene,
  EraseLettersScene,
  SplitLinesScene,
  BgNumberScene,
  TwoLinesScene,
  IPhoneScene,
  MacBookScene,
  DoubleDeviceScene,
  BrowserScene,
  DashboardScene,
  ChatScene,
  NetworkScene,
  DataFlowScene,
  WorldMapScene,
  HorizontalTimelineScene,
  WeightRevealScene,
  BeatDropScene,
  ZoomBruteScene,
  StrobeScene,
  ExplodeScene,
  ParallaxScene,
  ShakeScene,
  DropTextScene,
  RepeatCutScene,
  DynamicVignette,
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

const MIN_SCENE_FRAMES = 120;
const CROSSFADE_FRAMES = 8;

const SceneCrossfade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, CROSSFADE_FRAMES], [1, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 99,
          background: "#000000",
          opacity: fade,
          pointerEvents: "none",
        }}
      />
      <DynamicVignette />
    </AbsoluteFill>
  );
};

const SceneRenderer: React.FC<{ scene: SceneData; index: number }> = ({
  scene,
  index,
}) => {
  const sceneWithIndex = { ...scene, _index: index };
  switch (scene.type) {
    case "singleword":
      return <SingleWordScene scene={sceneWithIndex} />;
    case "maskreveal":
      return <MaskRevealScene scene={sceneWithIndex} />;
    case "slideword":
      return <SlideWordScene scene={sceneWithIndex} />;
    case "zoomword":
      return <ZoomWordScene scene={sceneWithIndex} />;
    case "fadeupl":
      return <FadeUpLettersScene scene={sceneWithIndex} />;
    case "blurin":
      return <BlurInScene scene={sceneWithIndex} />;
    case "scalein":
      return <ScaleInScene scene={sceneWithIndex} />;
    case "slideup":
      return <SlideUpScene scene={sceneWithIndex} />;
    case "cliptop":
      return <ClipTopScene scene={sceneWithIndex} />;
    case "staggerwords":
      return <StaggerWordsScene scene={sceneWithIndex} />;
    case "fadepure":
      return <FadePureScene scene={sceneWithIndex} />;
    case "tracking":
      return <TrackingScene scene={sceneWithIndex} />;
    case "rotatein":
      return <RotateInScene scene={sceneWithIndex} />;
    case "geobgtest":
      return <GeoBgTestScene scene={sceneWithIndex} />;
    case "photoreveal":
      return <PhotoRevealScene scene={sceneWithIndex} />;
    case "photocollage":
      return <PhotoCollageScene scene={sceneWithIndex} />;
    case "counter":
      return <CounterScene scene={sceneWithIndex} />;
    case "progressbar":
      return <ProgressBarScene scene={sceneWithIndex} />;
    case "multistats":
      return <MultiStatsScene scene={sceneWithIndex} />;
    case "accentword":
      return <AccentWordScene scene={sceneWithIndex} />;
    case "underline":
      return <UnderlineScene scene={sceneWithIndex} />;
    case "colorshift":
      return <ColorShiftScene scene={sceneWithIndex} />;
    case "linedraw":
      return <LineDrawScene scene={sceneWithIndex} />;
    case "shape":
      return <ShapeScene scene={sceneWithIndex} />;
    case "expandingshape":
      return <ExpandingShapeScene scene={sceneWithIndex} />;
    case "wipe":
      return <WipeScene scene={sceneWithIndex} />;
    case "flash":
      return <FlashScene scene={sceneWithIndex} />;
    case "colorfade":
      return <ColorFadeScene scene={sceneWithIndex} />;
    case "splitvertical":
      return <SplitVerticalScene scene={sceneWithIndex} />;
    case "zoomtransition":
      return <ZoomTransitionScene scene={sceneWithIndex} />;
    case "iris":
      return <IrisScene scene={sceneWithIndex} />;
    case "curtain":
      return <CurtainScene scene={sceneWithIndex} />;
    case "diagonalwipe":
      return <DiagonalWipeScene scene={sceneWithIndex} />;
    case "glitchswitch":
      return <GlitchSwitchScene scene={sceneWithIndex} />;
    case "pixeldissolve":
      return <PixelDissolveScene scene={sceneWithIndex} />;
    case "lightsweep":
      return <LightSweepScene scene={sceneWithIndex} />;
    case "notification":
      return <NotificationScene scene={sceneWithIndex} />;
    case "pulsebutton":
      return <PulseButtonScene scene={sceneWithIndex} />;
    case "uiprogress":
      return <UIProgressScene scene={sceneWithIndex} />;
    case "quote":
      return <QuoteScene scene={sceneWithIndex} />;
    case "timeline":
      return <TimelineScene scene={sceneWithIndex} />;
    case "socialstats":
      return <SocialStatsScene scene={sceneWithIndex} />;
    case "checklist":
      return <ChecklistScene scene={sceneWithIndex} />;
    case "audioviz":
      return <AudioVizScene scene={sceneWithIndex} />;
    case "colorletters":
      return <ColorLettersScene scene={sceneWithIndex} />;
    case "gradient":
      return <GradientScene scene={sceneWithIndex} />;
    case "hierarchytext":
      return <HierarchyTextScene scene={sceneWithIndex} />;
    case "spotlight":
      return <SpotlightScene scene={sceneWithIndex} />;
    case "noise":
      return <NoiseScene scene={sceneWithIndex} />;
    case "gradienttext":
      return <GradientTextScene scene={sceneWithIndex} />;
    case "eraseletters":
      return <EraseLettersScene scene={sceneWithIndex} />;
    case "splitlines":
      return <SplitLinesScene scene={sceneWithIndex} />;
    case "bgnumber":
      return <BgNumberScene scene={sceneWithIndex} />;
    case "twolines":
      return <TwoLinesScene scene={sceneWithIndex} />;
    case "iphone":
      return <IPhoneScene scene={sceneWithIndex} />;
    case "macbook":
      return <MacBookScene scene={sceneWithIndex} />;
    case "doubledevice":
      return <DoubleDeviceScene scene={sceneWithIndex} />;
    case "browser":
      return <BrowserScene scene={sceneWithIndex} />;
    case "dashboard":
      return <DashboardScene scene={sceneWithIndex} />;
    case "chat":
      return <ChatScene scene={sceneWithIndex} />;
    case "network":
      return <NetworkScene scene={sceneWithIndex} />;
    case "dataflow":
      return <DataFlowScene scene={sceneWithIndex} />;
    case "worldmap":
      return <WorldMapScene scene={sceneWithIndex} />;
    case "horizontaltimeline":
      return <HorizontalTimelineScene scene={sceneWithIndex} />;
    case "weightreveal":
      return <WeightRevealScene scene={sceneWithIndex} />;
    case "beatdrop":
      return <BeatDropScene scene={sceneWithIndex} />;
    case "zoombrute":
      return <ZoomBruteScene scene={sceneWithIndex} />;
    case "strobe":
      return <StrobeScene scene={sceneWithIndex} />;
    case "explode":
      return <ExplodeScene scene={sceneWithIndex} />;
    case "parallax":
      return <ParallaxScene scene={sceneWithIndex} />;
    case "shake":
      return <ShakeScene scene={sceneWithIndex} />;
    case "droptext":
      return <DropTextScene scene={sceneWithIndex} />;
    case "repeatcut":
      return <RepeatCutScene scene={sceneWithIndex} />;
    default:
      return <SingleWordScene scene={sceneWithIndex} />;
  }
};

const MusicAudio: React.FC<{
  src: string;
  targetVolume: number;
  totalFrames: number;
  fadeFrames: number;
}> = ({ src, targetVolume, totalFrames, fadeFrames }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, targetVolume], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(
    frame,
    [totalFrames - fadeFrames, totalFrames],
    [targetVolume, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
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
    const duration =
      timing.durationFrames ?? (timing as { duration?: number }).duration ?? 0;

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

export const MotionVideo: React.FC<MotionVideoProps> = ({
  scenes,
  sceneDurations,
  totalFrames,
  audioSrc,
  musicSrc,
  musicVolume = 0.18,
  showWatermark,
}) => {
  const { durationInFrames } = useVideoConfig();
  const FADE_MUSIC = 30;
  const safeTotalFrames =
    Number.isFinite(totalFrames) && totalFrames > 0 ? totalFrames : 1800;
  const allScenes = scenes || [];
  const timings = sceneDurations || [];

  return (
    <AbsoluteFill>
      {audioSrc && <Audio src={audioSrc} volume={1} />}

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
        const fromTiming = getSceneTiming(
          timings,
          safeTotalFrames,
          allScenes.length,
          index,
        );
        const from =
          ts &&
          typeof ts !== "number" &&
          Number.isFinite(ts.startFrame)
            ? ts.startFrame!
            : fromTiming.from;
        const duration =
          ts &&
          typeof ts !== "number" &&
          Number.isFinite(ts.durationFrames) &&
          ts.durationFrames! > 0
            ? ts.durationFrames!
            : Math.max(MIN_SCENE_FRAMES, fromTiming.duration);

        if (!Number.isFinite(from) || !Number.isFinite(duration) || duration <= 0) {
          return null;
        }

        return (
          <Sequence
            key={index}
            from={Math.max(0, from - CROSSFADE_FRAMES)}
            durationInFrames={duration + CROSSFADE_FRAMES}
          >
            <SceneCrossfade>
              <SceneRenderer scene={scene} index={index} />
            </SceneCrossfade>
          </Sequence>
        );
      })}

      {showWatermark && (
        <AbsoluteFill style={{ pointerEvents: "none", zIndex: 9999 }}>
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              borderRadius: 8,
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              M
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.04em",
                fontFamily: "-apple-system, sans-serif",
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
