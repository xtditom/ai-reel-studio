"""Small lossless speech, music and effects utilities for the production pipeline."""

import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy import signal

RATE = 48000


def level(samples):
    return 20 * np.log10(max(float(np.sqrt(np.mean(np.square(samples)))), 1e-12))


def pcm(path, samples, rate=RATE):
    channels = samples.shape[1] if samples.ndim == 2 else 1
    with wave.open(str(path), "wb") as wav:
        wav.setparams((channels, 2, rate, 0, "NONE", "not compressed"))
        wav.writeframes(np.rint(np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())


def decode(path, rate=RATE, channels=1):
    data = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-ar", str(rate), "-ac", str(channels),
        "-f", "f32le", "-",
    ])
    samples = np.frombuffer(data, dtype="<f4").copy()
    return samples if channels == 1 else samples.reshape(-1, channels)


def loudness(samples, rate=RATE):
    with tempfile.TemporaryDirectory() as temporary:
        path = Path(temporary) / "check.wav"
        pcm(path, samples, rate)
        command = ["ffmpeg", "-hide_banner", "-i", str(path), "-af",
                   "loudnorm=I=-18:TP=-2:LRA=7:print_format=json", "-f", "null", "-"]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
    return json.loads(result.stderr[result.stderr.rfind("{"):result.stderr.rfind("}") + 1])


def filter_band(samples, rate, cutoff, kind):
    return signal.sosfiltfilt(signal.butter(3, cutoff, kind, fs=rate, output="sos"), samples, axis=0)


def trim_speech(samples, rate):
    width = round(rate * 0.01)
    rms = np.sqrt(np.convolve(samples ** 2, np.ones(width) / width, mode="same"))
    active = np.flatnonzero(rms > max(0.0025, float(rms.max()) * 0.022))
    if not len(active):
        raise ValueError("The synthesizer returned silence.")
    start = max(0, int(active[0]) - round(rate * 0.025))
    end = min(len(samples), int(active[-1]) + round(rate * 0.070))
    trimmed = samples[start:end].copy()
    width = min(round(rate * 0.008), len(trimmed) // 2)
    trimmed[:width] *= np.linspace(0, 1, width)
    trimmed[-width:] *= np.linspace(1, 0, width)
    return trimmed


def process_dialogue(samples, rate, cleanup, target=-18.5):
    # One continuous gain per take. A limiter-style soft knee only touches peaks
    # that exceed the dialogue headroom. There is no gain riding in quiet syllables.
    clean = filter_band(samples, rate, 70, "highpass")
    if cleanup:
        clean = filter_band(clean, rate, 10200, "lowpass")
    details = loudness(clean, rate)
    gain = 10 ** ((target - float(details["input_i"])) / 20)
    clean *= gain
    knee, ceiling = 0.64, 10 ** (-2.9 / 20)
    magnitude = np.abs(clean)
    excess = np.maximum(0, (magnitude - knee) / (ceiling - knee))
    return np.sign(clean) * np.where(magnitude <= knee, magnitude, knee + (ceiling - knee) * np.tanh(excess))


def mix_stems(voice, scenes, rate=RATE):
    length = len(voice)
    times = np.arange(length) / rate
    ambience = np.zeros((length, 2))
    effects = np.zeros_like(ambience)

    def add(track, start, body, pan=0):
        begin = round(start * rate)
        count = min(len(body), length - begin)
        if count > 0:
            pans = np.sqrt([(1 - pan) / 2, (1 + pan) / 2])
            track[begin:begin + count] += body[:count, None] * pans

    chords = [(45, 52, 59, 60), (41, 48, 55, 57), (48, 55, 59, 62), (43, 50, 57, 59)]
    for index, start in enumerate(np.arange(0, times[-1], 4.2)):
        t = np.arange(round(rate * 5.6)) / rate
        envelope = np.sin(np.pi * t / 5.6) ** 1.45
        for note_index, midi in enumerate(chords[index % len(chords)]):
            frequency = 440 * 2 ** ((midi - 69) / 12)
            body = (np.sin(2 * np.pi * frequency * t) + 0.18 * np.sin(4 * np.pi * frequency * t))
            add(ambience, start, envelope * body * 0.022, (note_index - 1.5) * 0.36)
        t = np.arange(round(rate * 0.56)) / rate
        for offset in (0.22, 2.38):
            pulse = np.sin(2 * np.pi * 96 * t) * (1 - np.exp(-t * 34)) * np.exp(-t * 10)
            add(ambience, start + offset, 0.023 * pulse)

    ducking = np.ones(length)
    for scene in scenes:
        for beat in scene["beats"]:
            start, end = beat["startMs"] / 1000, beat["endMs"] / 1000
            attack = np.clip((times - (start - 0.13)) / 0.12, 0, 1)
            release = np.clip(((end + 0.43) - times) / 0.38, 0, 1)
            ducking = np.minimum(ducking, 1 - 0.58 * np.minimum(attack, release))

    sound = {
        "queue": (0.28, 186, 0.074, -0.34),
        "unlock": (0.43, 330, 0.080, 0.29),
        "partition": (0.30, 155, 0.068, 0),
        "switch": (0.24, 247, 0.052, 0.25),
    }
    for scene in scenes:
        for beat in scene["beats"]:
            if "effect" not in beat:
                continue
            key = beat["effect"]
            spread, frequency, amplitude, pan = sound[key]
            t = np.arange(round(rate * spread)) / rate
            phase = 2 * np.pi * frequency * (t - 0.38 * t * t / spread)
            body = np.sin(phase) + 0.25 * np.sin(phase * 2.06)
            envelope = (1 - np.exp(-t * 120)) * np.exp(-t * 17) * (1 - t / spread)
            at = beat["effectMs"] / 1000
            add(effects, at, envelope * body * amplitude, pan)
            if key == "queue":
                add(effects, at + 0.104, envelope * body * amplitude * 0.52, pan)

    fade = np.minimum(1, times / 0.17) * np.clip((times[-1] - times) / 0.63, 0, 1)
    music = ambience * ducking[:, None] * fade[:, None]
    mix = voice[:, None] * np.sqrt(0.5) + music + effects
    return mix, music, effects, ducking


def encode_flac(path, samples, rate=RATE):
    with tempfile.TemporaryDirectory() as temporary:
        wav = Path(temporary) / "stem.wav"
        pcm(wav, samples, rate)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), str(path)], check=True)
