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

## Version 2 production

Open **HostingExplainedV2** to see the apartment and shared-kitchen story.
**HostingExplained** remains the original cut. The same workflow can render
either version. Pull requests render Version 2. Once the workflow reaches the
default branch, use the version selector for manual runs.

```sh
cd reel
npm ci
npm run render:v2
npm run verify:v2
npm run previews:v2
```

The Version 2 GitHub Actions artifact contains the MP4, three short excerpts,
a narration-only WAV, four voice auditions, the isolated Version 1 diagnostic
clips, and the Version 2 music and effects stems. It also includes the timing
and audio checks. The narration, music, and effects are lossless before the
final AAC encode.

### Produce a new episode

Work in the order recorded in [AGENTS.md](AGENTS.md). Copy
`reel/src/reels/hosting-v2/production.json` to the new episode folder and
edit the scene intents and beats after writing the script. The first and
last scenes are the hook and CTA. The voice settings select an engine,
voice, language, native rate, and optional top-end cleanup. Per-beat
pronunciation, speed and pause settings shape the read. Keep the target
duration as a review range.

The generator runs an audition pass and then measures the spoken beats. It
writes `timing.json` and the stems. Zipformer aligns the actual waveform
to the approved words and flags low-agreement words for review. Use the
measured beats as editorial and sound-effect cues. The rendering workflow
uses the committed assets and does not fetch speech or alignment models.

```sh
# Optional audio regeneration from reel/ with a Python 3.12 virtualenv.
# Install the CPU torch wheel before the Misaki extras on a CPU machine.
python -m pip install 'torch==2.6.0+cpu' \
  --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple
python -m pip install -r scripts/production/requirements.txt
python scripts/production/produce.py src/reels/hosting-v2/production.json \
  --models /path/to/kokoro-model-files \
  --align-model /path/to/sherpa-onnx-zipformer-en-2023-06-26 \
  --public public/hosting-v2
```

Use `--mode audition` to regenerate auditions on their own. Place
`kokoro-v1.0.onnx` and `voices-v1.0.bin` together in the model directory.
The resulting narration and reports identify each take and its native
speed. [Kokoro model files](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0),
[Kokoro model and license](https://huggingface.co/hexgrad/Kokoro-82M),
[Zipformer release archive](https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-en-2023-06-26.tar.bz2).

Version 2 uses full-precision Kokoro-82M with Misaki English pronunciation
and the measured Michael voice. Chatterbox English, Turbo and Nano local
adapters take predownloaded model directories. They require a compatible
installation from upstream. Their official weight endpoints returned HTTP
403 in this environment, so their sound and inference speed remain
unverified here. The sources require `huggingface.co` and the storage
hosts its weight download redirects request, such as
`cas-bridge.xethub.hf.co` or `cdn-lfs.huggingface.co`. [Chatterbox source and license](https://github.com/resemble-ai/chatterbox).

The Version 1 audit isolated the dialogue from the background music and
measured the 6.5–10.5 kHz band. The shared-hosting dialogue was about
29 dB stronger in that band during speech than away from speech. One
recreated Version 1 excerpt already contained the high-band energy
at synthesis, and the old processing chain raised it by 7.6 dB. The
isolated music at mix level was much quieter in that band. Version 2
uses fixed loudness gain across the full narration, a mild top-end rolloff
and soft peak control. The designed music duck reaches about 7.5 dB during
dialogue. At nearly identical integrated loudness, the Version 2
narration measured 3.9 dB lower in that band during speech. The two
edits use different lines and voices, so the comparison cannot isolate
the contribution of the voice, model or EQ. The measurements help
locate the noise and check headroom.
A listener should still assess the voice and any remaining hiss on the
delivery device.

### Configure the look

The reusable caption component ships with these `captionStyle` values.

| Style | Treatment |
| --- | --- |
| `clean` | Stable professional subtitles |
| `highlight` | One highlighted word at a time |
| `kinetic` | A short scale accent on the current word |
| `minimal` | A light entrance with an underline |

The renderer accepts `theme` (`midnight` or `ink`) and `cutStyle`
(`match`, `fade` or `cut`). You can override the caption-safe position for
another frame size using `--caption-top`, `--caption-left` and
`--caption-right`. Pass settings as Remotion input props when auditioning.

```sh
npm run render:v2 -- --props='{"captionStyle":"minimal","theme":"ink","cutStyle":"fade"}'
```
