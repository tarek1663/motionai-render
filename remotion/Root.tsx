import { registerRoot, Composition } from "remotion";
import { MotionVideo, MotionVideoProps } from "./MotionVideo";

const fps = 60;

const defaultProps: MotionVideoProps = {
  scenes: [
    {
      type: "counter",
      text: "vidéos générées",
      bg: "#ffffff",
      counterTo: 12400,
    },
    {
      type: "counter",
      text: "utilisateurs actifs",
      bg: "#000000",
      counterTo: 8500,
      suffix: "+",
    },
    {
      type: "progressbar",
      text: "Satisfaction client",
      bg: "#ffffff",
      accentColor: "#000000",
      counterTo: 98,
    },
    {
      type: "progressbar",
      text: "Taux de complétion",
      bg: "#000000",
      accentColor: "#ffffff",
      counterTo: 76,
    },
    {
      type: "multistats",
      bg: "#ffffff",
      stats: [
        { value: 12400, label: "vidéos créées", suffix: "+" },
        { value: 72, label: "animations", suffix: "" },
        { value: 98, label: "satisfaction", suffix: "%" },
      ],
    },
    {
      type: "multistats",
      bg: "#000000",
      stats: [
        { value: 8500, label: "utilisateurs", suffix: "+" },
        { value: 4, label: "jours gratuits", suffix: "" },
        { value: 1080, label: "résolution", suffix: "p" },
      ],
    },
  ] as MotionVideoProps["scenes"],
  sceneDurations: Array.from({ length: 6 }, (_, i) => ({
    startFrame: i * 150,
    durationFrames: 150,
  })),
  totalFrames: 900,
  audioSrc: null,
  musicSrc: null,
};

const RemotionRoot = () => (
  <Composition
    id="MotionVideo"
    component={MotionVideo}
    durationInFrames={defaultProps.totalFrames}
    fps={fps}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
    calculateMetadata={async ({ props }) => {
      const p = props as MotionVideoProps;
      const sceneDurationsAdjusted = (p.sceneDurations || []).map((d) => {
        if (typeof d === "number") return Math.max(120, d);
        return {
          ...d,
          durationFrames: Math.max(120, d.durationFrames || 120),
        };
      });

      const total =
        Number.isFinite(p.totalFrames) && p.totalFrames > 0 ? p.totalFrames : 900;

      const fmt = (p as MotionVideoProps & { format?: string }).format || "9:16";
      const w = fmt === "16:9" ? 1920 : 1080;
      const h = fmt === "16:9" ? 1080 : fmt === "1:1" ? 1080 : 1920;

      return {
        durationInFrames: total,
        fps: 60,
        width: w,
        height: h,
        props: {
          ...p,
          sceneDurations: sceneDurationsAdjusted.length
            ? sceneDurationsAdjusted
            : p.sceneDurations,
        },
      };
    }}
  />
);

registerRoot(RemotionRoot);
