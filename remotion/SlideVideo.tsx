import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface SlideVideoProps {
  slides: string[];
  audioSegments?: (string | null)[];
  slideDurations?: number[];
  durationPerSlide: number;
  transitionDuration: number;
}

export const SlideVideo: React.FC<SlideVideoProps> = ({
  slides,
  audioSegments,
  slideDurations,
  durationPerSlide,
  transitionDuration,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const transFrames = Math.round(transitionDuration * fps);

  if (slides.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0A0718",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#666", fontSize: 32, fontFamily: "sans-serif" }}>
          No slides captured
        </p>
      </AbsoluteFill>
    );
  }

  const perSlideFrames = slides.map((_, i) => {
    const dur = slideDurations?.[i] ?? durationPerSlide;
    return Math.round(dur * fps);
  });

  const slideStarts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < slides.length; i++) {
    slideStarts.push(cursor);
    cursor += perSlideFrames[i] - (i < slides.length - 1 ? transFrames : 0);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0718" }}>
      {slides.map((dataUrl, i) => {
        const showStart = slideStarts[i];
        const showEnd = showStart + perSlideFrames[i];

        if (frame < showStart - 1 || frame > showEnd + 1) return null;

        const fadeIn =
          i === 0
            ? 1
            : interpolate(
                frame,
                [showStart, showStart + transFrames],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

        const fadeOut =
          i === slides.length - 1
            ? 1
            : interpolate(
                frame,
                [showEnd - transFrames, showEnd],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

        const scale =
          i === 0
            ? 1
            : interpolate(
                frame,
                [showStart, showStart + transFrames],
                [1.02, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

        return (
          <AbsoluteFill
            key={`slide-${i}`}
            style={{
              opacity: fadeIn * fadeOut,
              transform: `scale(${scale})`,
            }}
          >
            <Img
              src={dataUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </AbsoluteFill>
        );
      })}

      {audioSegments?.map((audioSrc, i) => {
        if (!audioSrc) return null;
        const startFrame = slideStarts[i];
        return (
          <Sequence key={`audio-${i}`} from={startFrame}>
            <Audio src={audioSrc} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export function calculateTotalFrames(
  slideCount: number,
  durationPerSlide: number,
  transitionDuration: number,
  fps: number,
  slideDurations?: number[],
): number {
  if (slideCount <= 0) return fps;
  const transFrames = Math.round(transitionDuration * fps);

  if (slideDurations && slideDurations.length === slideCount) {
    let total = 0;
    for (let i = 0; i < slideCount; i++) {
      total += Math.round(slideDurations[i] * fps);
      if (i < slideCount - 1) total -= transFrames;
    }
    return Math.max(total, fps);
  }

  const slideFrames = Math.round(durationPerSlide * fps);
  return slideFrames * slideCount - transFrames * Math.max(0, slideCount - 1);
}
