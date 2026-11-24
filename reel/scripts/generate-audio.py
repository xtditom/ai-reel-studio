"""Regenerate the committed narration, caption timing, and original music bed."""

import argparse
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
import sherpa_onnx

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/reels/hosting"
PUBLIC = ROOT / "public/hosting"
SAMPLE_RATE = 48000
VOICE = 3  # af_heart from the Kokoro v1.0 voice table.
PRONUNCIATIONS = """apps ˈ æ p s
allocated ˈ æ l ə k ˌ A ɾ ᵻ d
gets ɡ ɛ t s
here's h ˈ ɪ ɹ z
resources ɹ ˈ i s ˌ ɔ ɹ s ᵻ z
workloads w ˈ ɜ ɹ k l ˌ O d z
"""


def make_narrator(model_dir, lexicon):
    model = sherpa_onnx.OfflineTtsKokoroModelConfig(
        model=str(model_dir / "model.int8.onnx"),
        voices=str(model_dir / "voices.bin"),
        tokens=str(model_dir / "tokens.txt"),
        lexicon=str(lexicon),
        data_dir=str(model_dir / "espeak-ng-data"),
        lang="en-us",
    )
    return sherpa_onnx.OfflineTts(
        sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(kokoro=model, num_threads=2)
        )
    )


def trim_speech(samples, rate):
    active = np.flatnonzero(np.abs(samples) > 0.009)
    if active.size == 0:
        raise ValueError("Speech synthesis returned silence")
    start = max(0, active[0] - round(rate * 0.025))
    end = min(len(samples), active[-1] + round(rate * 0.048))
    result = samples[start:end].copy()
    edge = round(rate * 0.009)
    result[:edge] *= np.linspace(0, 1, edge)
    result[-edge:] *= np.linspace(1, 0, edge)
    return result


def write_wave(path, samples, rate):
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1 if samples.ndim == 1 else samples.shape[1])
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes((np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())


def encode(samples, rate, destination, filters, bitrate):
    with tempfile.TemporaryDirectory() as temporary:
        wav = Path(temporary) / "source.wav"
        write_wave(wav, samples, rate)
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
             "-af", filters, "-ar", str(SAMPLE_RATE), "-b:a", bitrate, str(destination)],
            check=True,
        )


def make_narration(narrator, scenes):
    rate = narrator.sample_rate
    captions = {}
    for scene in scenes:
        length = round(rate * scene["duration"])
        output = np.zeros(length, dtype=np.float32)
        lead = round(rate * 0.12)
        gap = round(rate * 0.08)
        tail = round(rate * 0.14)
        voice_speed = 1.0
        while True:
            spoken_lines = []
            for line in scene["lines"]:
                spoken = line.replace("VPS", "vee pee ess").replace("’", "'")
                generated = narrator.generate(spoken, sid=VOICE, speed=voice_speed)
                spoken_lines.append(trim_speech(np.asarray(generated.samples), rate))
            total = sum(len(line) for line in spoken_lines) + gap * (len(spoken_lines) - 1)
            if lead + total + tail <= length:
                break
            voice_speed += 0.05
            if voice_speed > 1.4:
                raise ValueError(f"Rewrite narration to fit the {scene['id']} scene")

        position = lead
        captions[scene["id"]] = []
        for line, samples in zip(scene["lines"], spoken_lines, strict=True):
            end = position + len(samples)
            output[position:end] = samples
            captions[scene["id"]].append({
                "text": line,
                "startMs": round(position / rate * 1000),
                "endMs": round(end / rate * 1000),
                "timestampMs": None,
                "confidence": None,
            })
            position = end + gap
        encode(output, rate, PUBLIC / f"{scene['id']}.mp3",
               "highpass=f=75,acompressor=threshold=0.16:ratio=2:attack=10:release=95,loudnorm=I=-18:TP=-2:LRA=5",
               "128k")
        print(scene["id"], f"{position / rate:.2f}s", f"speed {voice_speed:.2f}", flush=True)
    (SOURCE / "captions.json").write_text(json.dumps(captions, indent=2, ensure_ascii=False) + "\n")


def make_music(duration):
    rng = np.random.default_rng(71)
    music = np.zeros((round(duration * SAMPLE_RATE), 2))
    beat = 60 / 96
    chords = [(45, 52, 55, 59, 60), (41, 48, 52, 55, 57),
              (48, 55, 59, 62, 64), (43, 50, 53, 57, 59)]

    def mix(start, signal, pan=0):
        offset = round(start * SAMPLE_RATE)
        count = min(len(signal), len(music) - offset)
        if count > 0:
            music[offset:offset + count, 0] += signal[:count] * np.sqrt((1 - pan) / 2)
            music[offset:offset + count, 1] += signal[:count] * np.sqrt((1 + pan) / 2)

    def tone(note, length, kind):
        time = np.arange(round(length * SAMPLE_RATE)) / SAMPLE_RATE
        phase = 2 * np.pi * 440 * 2 ** ((note - 69) / 12) * time
        if kind == "pad":
            envelope = np.sin(np.pi * time / length) ** 1.4
            return envelope * (np.sin(phase) + 0.22 * np.sin(phase * 1.003) + 0.10 * np.sin(phase * 2))
        envelope = (1 - np.exp(-time * 160)) * np.exp(-time * 6) * (1 - time / length)
        return envelope * (np.sin(phase) + 0.22 * np.sin(phase * 2.006))

    for bar in range(int(duration / (4 * beat)) + 1):
        root, *upper = chords[bar % len(chords)]
        start = bar * 4 * beat
        for index, note in enumerate(upper):
            mix(start, 0.088 * tone(note, 4.8 * beat, "pad"), (index - 1.5) * 0.44)
        for index, note in enumerate((upper[0], upper[2], upper[3], upper[1])):
            time = start + (0.5 + index) * beat
            pan = 0.48 if index % 2 else -0.48
            mix(time, 0.17 * tone(note + 12, 1.25, "pluck"), pan)
            mix(time + 0.75 * beat, 0.049 * tone(note + 12, 0.9, "pluck"), -pan)
        for step in (0, 2):
            time = np.arange(round(0.22 * SAMPLE_RATE)) / SAMPLE_RATE
            phase = 2 * np.pi * (45 * time + 29 * (1 - np.exp(-27 * time)) / 27)
            kick = np.sin(phase) * (1 - np.exp(-time * 260)) * np.exp(-time * 26)
            mix(start + step * beat, 0.29 * kick)
            mix(start + (step + 0.13) * beat, 0.20 * tone(root - 12, 0.82, "pluck"))
        for step in (0.5, 1.5, 2.5, 3.5):
            time = np.arange(round(0.09 * SAMPLE_RATE)) / SAMPLE_RATE
            noise = np.diff(rng.standard_normal(len(time) + 1))
            hat = noise * np.exp(-time * 70) * np.minimum(1, time * 900)
            mix(start + step * beat, 0.026 * hat, 0.37)

    time = np.arange(len(music)) / SAMPLE_RATE
    fade = np.minimum(1, time / 0.28) * np.clip((duration - time) / 0.85, 0, 1)
    encode(music * fade[:, None], SAMPLE_RATE, PUBLIC / "music.mp3", "anull", "192k")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model_dir", type=Path)
    args = parser.parse_args()
    scenes = json.loads((SOURCE / "narration-script.json").read_text())
    with tempfile.TemporaryDirectory() as temporary:
        lexicon = Path(temporary) / "lexicon-us-en.txt"
        original = (args.model_dir / lexicon.name).read_text()
        lexicon.write_text(original.rstrip() + "\n" + PRONUNCIATIONS)
        make_narration(make_narrator(args.model_dir, lexicon), scenes)
    make_music(sum(scene["duration"] for scene in scenes))


if __name__ == "__main__":
    main()
