import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const file = process.argv[2] ?? "out/shared-vs-vps.mp4";
const metadata = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=format_name,duration:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames,duration,sample_rate,channels",
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
assert.equal(video.pix_fmt, "yuv420p");
assert.deepEqual([video.width, video.height], [1080, 1920]);
assert.equal(video.r_frame_rate, "30/1");
assert.equal(video.avg_frame_rate, "30/1");
assert.equal(Number(video.nb_frames), 900);
assert.equal(Number(video.duration), 30);
assert.ok(Math.abs(Number(metadata.format.duration) - 30) <= 1 / 30);
assert.equal(audio.codec_name, "aac");
assert.equal(Number(audio.sample_rate), 48000);
assert.equal(audio.channels, 2);
assert.ok(
  Math.abs(Number(audio.duration) - 30) <= 1 / 30,
  "Audio should span the reel",
);

console.log(JSON.stringify(metadata, null, 2));
