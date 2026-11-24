import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = process.argv[2] ?? "out/shared-vs-vps-v2.mp4";
const data = "src/reels/hosting-v2";
const timingPath = resolve(data, "timing.json");
const timing = JSON.parse(readFileSync(timingPath, "utf8"));
const config = JSON.parse(
  readFileSync(resolve(data, "production.json"), "utf8"),
);
const check = JSON.parse(
  readFileSync("public/hosting-v2/audio-check.json", "utf8"),
);
const { fps, durationFrames, scenes } = timing;
const seconds = durationFrames / fps;

assert.ok(
  seconds >= config.targetSeconds[0] && seconds <= config.targetSeconds[1],
);
assert.equal(scenes.length, config.scenes.length);
let boundary = 0;
let words = 0;
let previousCaptionEnd = 0;
for (const [index, scene] of scenes.entries()) {
  assert.equal(scene.id, config.scenes[index].id);
  assert.equal(scene.from, boundary);
  boundary += scene.duration;
  assert.equal(config.scenes[index].beats.length, scene.beats.length);
  for (const [beatIndex, beat] of scene.beats.entries()) {
    const script = config.scenes[index].beats[beatIndex];
    assert.equal(beat.id, script.id);
    assert.equal(beat.captions.map((page) => page.text).join(" "), script.text);
    assert.ok(beat.startMs >= Math.floor((scene.from * 1000) / fps) - 34);
    assert.ok(beat.endMs <= (boundary * 1000) / fps);
    for (const page of beat.captions) {
      assert.ok(page.startMs >= previousCaptionEnd);
      assert.ok(page.startMs < page.endMs && page.endMs <= beat.endMs + 1);
      assert.equal(
        page.text,
        page.words
          .map((word) => word.text)
          .join("")
          .trim(),
      );
      let last = page.startMs;
      for (const word of page.words) {
        assert.ok(word.startMs >= last && word.endMs > word.startMs);
        last = word.endMs;
        words++;
      }
      previousCaptionEnd = page.endMs;
    }
  }
}
assert.equal(boundary, durationFrames);
assert.equal(words, check.wordCount);
assert.ok(check.maximumMusicDuckingDb <= -6);
assert.ok(check.alignment.every((row) => row.characterAgreement >= 0.94));
assert.ok(check.alignment.every((row) => row.reviewWords.length === 0));

const metadata = JSON.parse(
  execFileSync(
    process.execPath,
    ["scripts/verify-render.mjs", file, timingPath],
    { encoding: "utf8" },
  ),
);
const decoded = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-xerror",
    "-i",
    file,
    "-map",
    "0:a",
    "-af",
    "silencedetect=n=-50dB:d=0.5,loudnorm=print_format=json",
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf8" },
);
assert.equal(decoded.status, 0, decoded.stderr);
const report = JSON.parse(
  decoded.stderr.slice(
    decoded.stderr.lastIndexOf("{"),
    decoded.stderr.lastIndexOf("}") + 1,
  ),
);
const clipping = Number(report.input_tp);
const loudness = Number(report.input_i);
assert.ok(clipping < -0.5, `True peak ${clipping} dBTP`);
assert.ok(
  loudness >= -23 && loudness <= -12,
  `Integrated loudness ${loudness} LUFS`,
);
const silence = [
  ...decoded.stderr.matchAll(
    /silence_end: ([\d.]+)\s+\| silence_duration: ([\d.]+)/g,
  ),
].map(([, end, duration]) => ({
  end: Number(end),
  duration: Number(duration),
}));
assert.ok(
  silence.every(({ end, duration }) => duration < 0.95 || end > seconds - 0.12),
  "An unexpected long silence fell inside the edit",
);
console.log(
  JSON.stringify(
    {
      metadata,
      audio: { loudness, clipping, silence },
      captionWords: words,
      alignment: check.alignment,
    },
    null,
    2,
  ),
);
