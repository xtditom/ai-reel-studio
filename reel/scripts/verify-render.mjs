import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "out/shared-vs-vps.mp4";
const timing = process.argv[3]
  ? JSON.parse(readFileSync(process.argv[3], "utf8"))
  : { fps: 30, durationFrames: 900 };
const expectedDuration = timing.durationFrames / timing.fps;
const metadata = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=format_name,duration:stream=codec_type,codec_name,width,height,pix_fmt,color_range,r_frame_rate,avg_frame_rate,nb_frames,duration,sample_rate,channels",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  ),
);

const video = metadata.streams.find(({ codec_type }) => codec_type === "video");
const audio = metadata.streams.find(({ codec_type }) => codec_type === "audio");
assert.ok(video, "Missing video stream");
assert.ok(audio, "Missing audio stream");
assert.ok(metadata.format.format_name.split(",").includes("mp4"));
assert.equal(video.codec_name, "h264");
// Some FFprobe versions label full-range 4:2:0 as yuvj420p.
assert.ok(
  ["yuv420p", "yuvj420p"].includes(video.pix_fmt),
  `Expected 8-bit 4:2:0 video, got ${video.pix_fmt}`,
);
assert.deepEqual([video.width, video.height], [1080, 1920]);
assert.equal(video.r_frame_rate, `${timing.fps}/1`);
assert.equal(video.avg_frame_rate, `${timing.fps}/1`);
assert.equal(Number(video.nb_frames), timing.durationFrames);
assert.ok(Math.abs(Number(video.duration) - expectedDuration) < 0.00001);
assert.ok(
  Math.abs(Number(metadata.format.duration) - expectedDuration) <=
    1 / timing.fps,
);
assert.equal(audio.codec_name, "aac");
assert.equal(Number(audio.sample_rate), 48000);
assert.equal(audio.channels, 2);
assert.ok(
  Math.abs(Number(audio.duration) - expectedDuration) <= 1 / timing.fps,
  "Audio should span the reel",
);

console.log(JSON.stringify(metadata, null, 2));
