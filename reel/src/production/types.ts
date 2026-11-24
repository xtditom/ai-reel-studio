import type { Caption } from "@remotion/captions";

export type CaptionStyle = "clean" | "highlight" | "kinetic" | "minimal";
export type ReelTheme = "midnight" | "ink";
export type CutStyle = "match" | "fade" | "cut";

export type CaptionPage = Caption & {
  words: Caption[];
};

export type Beat = {
  id: string;
  startMs: number;
  endMs: number;
  effectMs?: number;
  captions: CaptionPage[];
};

export type SceneTiming = {
  id: string;
  from: number;
  duration: number;
  beats: Beat[];
};

export type Look = {
  theme: ReelTheme;
  captionStyle: CaptionStyle;
  cutStyle: CutStyle;
};
