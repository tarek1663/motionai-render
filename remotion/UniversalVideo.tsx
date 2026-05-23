import React from "react";
import { Series, useVideoConfig } from "remotion";
import { BrandIntro } from "./templates/BrandIntro";
import { StoryArc } from "./templates/StoryArc";
import { BigNumbers } from "./templates/BigNumbers";
import { FeatureList } from "./templates/FeatureList";
import { ImpactStatement } from "./templates/ImpactStatement";

const SLIDE_TRANSITION_FRAMES = 16;

function slidesDurationInFrames(
  slides: { duration: number }[] | undefined,
  fps: number
): number {
  if (!slides?.length) return 1;
  const body = slides.reduce((acc, s) => acc + Math.round(s.duration * fps), 0);
  const transitions = Math.max(0, slides.length - 1) * SLIDE_TRANSITION_FRAMES;
  return body + transitions;
}

export type UniversalBlock = {
  template: string;
  props: Record<string, unknown>;
};

export type UniversalVideoProps = {
  blocks: UniversalBlock[];
};

const Block: React.FC<{ block: UniversalBlock }> = ({ block }) => {
  switch (block.template) {
    case "BrandIntro":
      return <BrandIntro {...(block.props as React.ComponentProps<typeof BrandIntro>)} />;
    case "StoryArc":
      return <StoryArc {...(block.props as React.ComponentProps<typeof StoryArc>)} />;
    case "BigNumbers":
      return <BigNumbers {...(block.props as React.ComponentProps<typeof BigNumbers>)} />;
    case "FeatureList":
      return <FeatureList {...(block.props as React.ComponentProps<typeof FeatureList>)} />;
    case "ImpactStatement":
      return <ImpactStatement {...(block.props as React.ComponentProps<typeof ImpactStatement>)} />;
    default:
      return null;
  }
};

export const UniversalVideo: React.FC<UniversalVideoProps> = ({ blocks }) => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      {blocks.map((block, i) => (
        <Series.Sequence
          key={i}
          durationInFrames={slidesDurationInFrames(
            (block.props as { slides?: { duration: number }[] }).slides,
            fps
          )}
        >
          <Block block={block} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
