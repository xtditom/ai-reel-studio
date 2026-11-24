"""Generate narration, measured timing, captions and lossless audio stems."""

import argparse
import json
from math import ceil, gcd
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

from align import align_words, caption_pages, recognizer
from audio import RATE, encode_flac, loudness, mix_stems, pcm, process_dialogue, trim_speech
from synthesis import narrator, pronounce

EFFECT_WORDS = {"queue": "rush", "unlock": "apartment", "partition": "operating", "switch": "vps"}


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def voice_samples(config, model, asr, output):
    output.mkdir(parents=True, exist_ok=True)
    audition = config["audition"]
    spoken = pronounce(audition["text"], config.get("pronunciations", {}))
    summary = []
    for take in audition["takes"]:
        source, rate = model(spoken, take["voice"], take["speed"])
        raw = trim_speech(source, rate)
        clean = process_dialogue(raw, rate, config["voice"].get("tameTopEnd", True))
        pcm(output / f'{take["id"]}.wav', clean, rate)
        _, checks = align_words(asr, audition["text"], clean, rate, 0)
        summary.append({**take, "seconds": round(len(clean) / rate, 3), "alignment": checks,
                        "raw": loudness(raw, rate), "processed": loudness(clean, rate)})
    write_json(output / "auditions.json", summary)
    print(*(f'{item["id"]}: {item["alignment"]["asr"]}' for item in summary), sep="\n", flush=True)


def production(config, model, asr, output, timeline_path):
    output.mkdir(parents=True, exist_ok=True)
    fps = config["fps"]
    voice_config = config["voice"]
    cursor = round(config["leadIn"] * RATE)
    recordings, scenes, alignment = [], [], []
    for index, scene in enumerate(config["scenes"]):
        scene_from = scenes[-1]["from"] + scenes[-1]["duration"] if scenes else 0
        beats = []
        for beat in scene["beats"]:
            spoken = pronounce(beat.get("spoken", beat["text"]), config.get("pronunciations", {}))
            values, native_rate = model(spoken, voice_config["voice"], beat.get("speed", voice_config["speed"]))
            raw = trim_speech(values, native_rate)
            start_ms = 1000 * cursor / RATE
            words, checks = align_words(asr, beat["text"], raw, native_rate, start_ms)
            alignment.append({"id": beat["id"], **checks})
            divisor = gcd(RATE, native_rate)
            samples = resample_poly(raw, RATE // divisor, native_rate // divisor)
            recordings.append((cursor, samples))
            cursor += len(samples)
            measured = {"id": beat["id"], "startMs": round(start_ms),
                        "endMs": round(1000 * cursor / RATE), "captions": caption_pages(words)}
            if "effect" in beat:
                effect = beat["effect"]
                word = EFFECT_WORDS.get(effect)
                measured["effect"] = effect
                measured["effectMs"] = next((item["startMs"] for item in words
                                              if item["text"].strip(" .,?!").lower() == word),
                                             round(start_ms + 100))
            beats.append(measured)
            cursor += round(beat["pauseAfter"] * RATE)
        if index == len(config["scenes"]) - 1:
            cursor += round(config["endHold"] * RATE)
        boundary = ceil(cursor * fps / RATE)
        scenes.append({"id": scene["id"], "from": scene_from, "duration": boundary - scene_from, "beats": beats})
        print(f'{scene["id"]}: {scene_from / fps:.2f}–{boundary / fps:.2f}s', flush=True)

    duration_frames = scenes[-1]["from"] + scenes[-1]["duration"]
    length = ceil(duration_frames / fps * RATE)
    dry = np.zeros(length)
    for start, recording in recordings:
        dry[start:start + len(recording)] = recording

    dialogue = process_dialogue(dry, RATE, voice_config.get("tameTopEnd", True))
    mix, music, effects, duck = mix_stems(dialogue, scenes)
    pcm(output / "mix.wav", mix)
    pcm(output / "narration.wav", dialogue)
    encode_flac(output / "music-ducked.flac", music)
    encode_flac(output / "effects.flac", effects)
    write_json(timeline_path, {"fps": fps, "durationFrames": duration_frames, "scenes": scenes})
    write_json(output / "audio-check.json", {
        "durationSeconds": duration_frames / fps,
        "targetSeconds": config["targetSeconds"],
        "speechSeconds": round(sum(len(item) for _, item in recordings) / RATE, 3),
        "wordCount": sum(len(beat["text"].split()) for scene in config["scenes"] for beat in scene["beats"]),
        "maximumMusicDuckingDb": round(float(20 * np.log10(duck.min())), 2),
        "dry": loudness(dry), "narration": loudness(dialogue), "mix": loudness(mix),
        "alignment": alignment,
    })
    if not config["targetSeconds"][0] <= duration_frames / fps <= config["targetSeconds"][1]:
        print("Review the cut against the target duration without retiming the voice.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path)
    parser.add_argument("--models", required=True, type=Path)
    parser.add_argument("--align-model", required=True, type=Path)
    parser.add_argument("--public", required=True, type=Path)
    parser.add_argument("--mode", choices=("all", "audition", "production"), default="all")
    args = parser.parse_args()
    config = json.loads(args.config.read_text())
    model = narrator(config["voice"], args.models)
    asr = recognizer(args.align_model)
    if args.mode in ("all", "audition"):
        voice_samples(config, model, asr, args.public / "auditions")
    if args.mode in ("all", "production"):
        production(config, model, asr, args.public, args.config.with_name("timing.json"))


if __name__ == "__main__":
    main()
