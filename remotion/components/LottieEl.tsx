import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { staticFile, useVideoConfig, interpolate } from "remotion";
import React, { useState, useEffect } from "react";

export type LottieElProps = {
  id: string;           // ex: "icons/rocket"
  width?: number;
  height?: number;
  delay?: number;       // frames
  speed?: number;       // 1 = normal, 2 = 2x plus rapide
  loop?: boolean;
  opacity?: number;
};

export const LottieEl: React.FC<LottieElProps> = ({
  id,
  width = 200,
  height = 200,
  delay = 0,
  speed: _speed = 1,
  loop = true,
  opacity = 1,
}) => {
  void _speed;
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const { fps } = useVideoConfig();

  useEffect(() => {
    fetch(staticFile(`lottie/${id}.json`))
      .then(r => r.json())
      .then(setAnimationData)
      .catch(console.error);
  }, [id]);

  if (!animationData) return null;

  return (
    <div style={{ width, height, opacity }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
