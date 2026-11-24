# ai-reel-studio

A Remotion studio for vertical motion graphics. The first Reel, **Shared Hosting
vs VPS Hosting**, explains the two hosting models and how to choose between
them in 30 seconds.

## Preview and render

Use Node.js 24 and npm. Install FFmpeg to get FFprobe for export verification.

```sh
cd reel
npm ci
npm run dev
```

Open **Instagram Reels → HostingExplained** in Remotion Studio. The timeline
contains five named scenes, each with its narration and captions, and a
separate music track.

```sh
npm run lint
npm run render
npm run verify
```

The export is `reel/out/shared-vs-vps.mp4`, a 1080 × 1920 H.264 video at 30 fps
with stereo AAC. Remotion downloads a compatible browser on its first render.
For an environment that already has Chromium but blocks that download, pass
its executable explicitly.

```sh
npm run render -- --browser-executable=/usr/bin/chromium
```

Run **Actions → Render Instagram Reel → Run workflow** on GitHub to render on
demand once the workflow is present on the default branch. The workflow also
validates pull requests that change the Reel or its render workflow. Download
the MP4 and FFprobe report from the run’s **shared-vs-vps-reel** artifact.

## Make the next Reel

1. Add a composition to `reel/src/Root.tsx`. Use the existing composition as a
   template for the vertical canvas, named scene boundaries, and audio track.
2. Give the new Reel its own folder in `reel/src/reels/` and its own assets in
   `reel/public/`. Reuse `CaptionLine.tsx` and the frame-driven easing in
   `motion.ts` when they suit the design.
3. Keep primary text clear of the right edge and bottom Reel controls. The
   first Reel reserves 98 px on the left and 150 px on the right, and keeps its
   last caption at least 400 px from the bottom.
4. Preview, render by composition ID, and update the export check and workflow
   when adding a new output.

## Audio and agent skills

The English voice-over uses Kokoro v1.0’s `af_heart` voice through the local
Sherpa-ONNX runtime. The music bed was composed and synthesized for the Reel.
The repository includes the generated audio and the cue timings so Studio and
CI can render from local assets without downloading a speech model. To revise
the narration, edit `reel/src/reels/hosting/narration-script.json` and regenerate
the audio and captions from `reel/`.

```sh
python3 -m pip install 'sherpa-onnx==2.0.3' numpy
python3 scripts/generate-audio.py /path/to/kokoro-int8-multi-lang-v1_0
```

Use the [Kokoro model archive](https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-int8-multi-lang-v1_0.tar.bz2).
See the [Kokoro model card and Apache 2.0 license](https://huggingface.co/hexgrad/Kokoro-82M).
The fonts are Space Grotesk and Plus Jakarta Sans, distributed through
Fontsource under the SIL Open Font License.

The project uses the [official Remotion agent skills](https://github.com/remotion-dev/skills).
Install the project-local copies for Codex from the repository root.

```sh
npx skills add remotion-dev/skills -a codex -y
```
