import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const input = process.argv[2] ?? "out/shared-vs-vps-v2.mp4";
const target = process.argv[3] ?? "out/previews";
const { fps, scenes } = JSON.parse(
  readFileSync("src/reels/hosting-v2/timing.json", "utf8"),
);
const shared = scenes.find(({ id }) => id === "shared");
const vps = scenes.find(({ id }) => id === "vps");
const rush = shared.beats.find(({ id }) => id === "traffic").effectMs / 1000;
const cta = scenes.find(({ id }) => id === "cta");

mkdirSync(target, { recursive: true });
for (const [name, start, length] of [
  ["opening", 0, 4],
  ["contention-to-isolation", rush - 0.45, vps.from / fps - rush + 4.85],
  ["closing-question", cta.from / fps, cta.duration / fps],
]) {
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(start),
      "-i",
      input,
      "-t",
      String(length),
      "-vf",
      "scale=540:960",
      "-c:v",
      "libx264",
      "-crf",
      "20",
      "-threads",
      "2",
      "-c:a",
      "aac",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      `${target}/${name}.mp4`,
    ],
    { stdio: "inherit" },
  );
}
