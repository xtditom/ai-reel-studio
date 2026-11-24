import { useCurrentFrame, useVideoConfig } from "remotion";
import { reveal } from "../reels/motion";
import type { CaptionPage, CaptionStyle } from "./types";
import "./captions.css";

type Props = {
  pages: readonly CaptionPage[];
  sceneFrom: number;
  style: CaptionStyle;
};

export const Captions = ({ pages, sceneFrom, style }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = ((sceneFrom + frame) * 1000) / fps;
  const page = pages.find(
    (item, index) =>
      time >= item.startMs - 18 &&
      time <
        Math.min(
          item.endMs + 155,
          (pages[index + 1]?.startMs ?? Infinity) - 18,
        ),
  );
  if (!page) return null;

  const enter = reveal(time, page.startMs - 26, 155);
  const animated = style === "minimal" || style === "kinetic";
  const words = style === "highlight" || style === "kinetic";
  return (
    <div
      className={`prod-captions prod-captions--${style}`}
      style={{
        opacity: animated ? 0.65 + 0.35 * enter : 1,
        translate: animated ? `0 ${(1 - enter) * 10}px` : undefined,
      }}
    >
      <div className="prod-caption-text">
        {words
          ? page.words.map((word, index) => {
              const active = time >= word.startMs && time < word.endMs + 15;
              const energy =
                active && style === "kinetic"
                  ? 1 + 0.16 * (1 - reveal(time, word.startMs, 180))
                  : 1;
              return (
                <span
                  className={active ? "caption-word current" : "caption-word"}
                  key={index}
                  style={{
                    scale: energy,
                    translate:
                      style === "kinetic"
                        ? `0 ${-63 * (energy - 1)}px`
                        : undefined,
                  }}
                >
                  {word.text}
                </span>
              );
            })
          : page.text}
      </div>
    </div>
  );
};
