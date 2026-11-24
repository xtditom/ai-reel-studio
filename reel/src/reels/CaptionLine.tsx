import type { Caption } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { reveal } from "./motion";

export const CaptionLine = ({ captions }: { captions: readonly Caption[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const milliseconds = (frame * 1000) / fps;
  const cue = captions.find(
    ({ startMs, endMs }, index) =>
      milliseconds >= startMs &&
      milliseconds <
        Math.min(endMs + 275, captions[index + 1]?.startMs ?? Infinity),
  );
  if (!cue) return null;

  const entrance = reveal(milliseconds, cue.startMs - 24, 155);
  return (
    <div
      className="reel-captions"
      style={{
        opacity: 0.8 + entrance * 0.2,
        translate: `0 ${12 * (1 - entrance)}px`,
      }}
    >
      {cue.text}
    </div>
  );
};
