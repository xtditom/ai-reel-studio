"""Isolate the original stems and measure speech-correlated high-band energy."""

import argparse
import json
import runpy
import tempfile
from pathlib import Path

import numpy as np

from audio import decode, filter_band, level, loudness, pcm


def bands(samples, rate):
    count = (len(samples) // (rate // 50)) * (rate // 50)
    frames = samples[:count].reshape(-1, rate // 50)
    high = filter_band(samples, rate, (6500, 10500), "bandpass")[:count].reshape(frames.shape)
    energies = np.sqrt(np.mean(frames**2, axis=1))
    active = energies > 0.011
    return {
        "activeFrames": int(active.sum()),
        "totalFrames": len(frames),
        "highBandActiveDbfs": round(level(high[active]), 1) if active.any() else None,
        "highBandOtherDbfs": round(level(high[~active]), 1) if (~active).any() else None,
        "highBandOverallDbfs": round(level(high), 1),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("v1_model", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--v2-narration", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    root = Path(__file__).resolve().parents[2]
    assets = root / "public/hosting"
    rate = 24000
    voice = decode(assets / "shared.mp3", rate=rate)
    music = decode(assets / "music.mp3", rate=rate)[3 * rate:10 * rate] * 0.20
    pcm(args.output / "v1-narration.wav", voice, rate)
    pcm(args.output / "v1-music-at-mix-level.wav", music, rate)

    v1 = runpy.run_path(str(root / "scripts/generate-audio.py"))
    with tempfile.TemporaryDirectory() as temporary:
        temp = Path(temporary)
        lexicon = temp / "lexicon.txt"
        lexicon.write_text((args.v1_model / "lexicon-us-en.txt").read_text().rstrip()
                           + "\n" + v1["PRONUNCIATIONS"])
        source = v1["make_narrator"](args.v1_model, lexicon)
        excerpt = source.generate("many sites run on one server.", sid=3, speed=1.0)
        raw = v1["trim_speech"](np.asarray(excerpt.samples), rate)
        old = temp / "old.mp3"
        v1["encode"](raw, rate, old,
                     "highpass=f=75,acompressor=threshold=0.16:ratio=2:attack=10:release=95,loudnorm=I=-18:TP=-2:LRA=5",
                     "128k")
        processed = decode(old, rate=rate)

    before = bands(raw, rate)
    after = bands(processed, rate)
    results = {
        "bandHz": [6500, 10500],
        "method": "20 ms RMS frames, active threshold 0.011, measured after decode at 24 kHz",
        "v1Narration": bands(voice, rate),
        "v1MusicAtMixLevel": {"highBandOverallDbfs": bands(music, rate)["highBandOverallDbfs"]},
        "v1Effects": "No separate effects track.",
        "resynthesizedExcerpt": {
            "text": "many sites run on one server.",
            "raw": {**before, "integratedLufs": loudness(raw, rate)["input_i"]},
            "processed": {**after, "integratedLufs": loudness(processed, rate)["input_i"]},
            "highBandGainDb": round(after["highBandOverallDbfs"] - before["highBandOverallDbfs"], 1),
        },
        "interpretation": "This measures high-band energy and correlation, not a perceptual test of hiss.",
    }
    if args.v2_narration:
        revised = decode(args.v2_narration, rate=rate)
        v1_details = loudness(voice, rate)
        v2_details = loudness(revised, rate)
        v2_bands = bands(revised, rate)
        results["comparison"] = {
            "v1ExcerptLufs": v1_details["input_i"],
            "v2NarrationLufs": v2_details["input_i"],
            "v2Narration": v2_bands,
            "v2MinusV1ActiveBandDb": round(v2_bands["highBandActiveDbfs"]
                                        - results["v1Narration"]["highBandActiveDbfs"], 1),
            "comparisonScope": "The versions use different scripts and voice presets.",
        }
    (args.output / "v1-audio-audit.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
