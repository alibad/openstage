import React from "react";
import { Composition } from "remotion";
import {
  SlideVideo,
  calculateTotalFrames,
  type SlideVideoProps,
} from "./SlideVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SlideVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={SlideVideo as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          slides: [],
          durationPerSlide: 5,
          transitionDuration: 0.5,
        }}
        calculateMetadata={async ({ props }) => {
          const p = props as unknown as SlideVideoProps;
          return {
            durationInFrames: calculateTotalFrames(
              Math.max(p.slides.length, 1),
              p.durationPerSlide,
              p.transitionDuration,
              30,
              p.slideDurations,
            ),
          };
        }}
      />
    </>
  );
};
