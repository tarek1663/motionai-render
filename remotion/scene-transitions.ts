import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import type { TransitionPresentation } from "@remotion/transitions";

export type SharedTransitionType =
  | "fade"
  | "slide-up"
  | "slide-right"
  | "wipe"
  | "flip"
  | undefined;

export type SharedTransitionPresentation = TransitionPresentation<
  Record<string, unknown>
>;

export function getSharedSceneTransition(
  type: SharedTransitionType = "fade"
): SharedTransitionPresentation {
  switch (type) {
    case "slide-up":
      return slide({ direction: "from-bottom" }) as SharedTransitionPresentation;
    case "slide-right":
      return slide({ direction: "from-right" }) as SharedTransitionPresentation;
    case "wipe":
      return wipe({ direction: "from-left" }) as SharedTransitionPresentation;
    case "flip":
      return flip({ direction: "from-right" }) as SharedTransitionPresentation;
    default:
      return fade() as SharedTransitionPresentation;
  }
}
