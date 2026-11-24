"""Align the approved script to Zipformer wordpieces from the recorded waveform."""

from difflib import SequenceMatcher
from math import gcd
import re

import sherpa_onnx
from scipy.signal import resample_poly


def recognizer(model):
    files = {part: str(model / f"{part}-epoch-99-avg-1.int8.onnx")
             for part in ("encoder", "decoder", "joiner")}
    return sherpa_onnx.OfflineRecognizer.from_transducer(
        **files, tokens=str(model / "tokens.txt"), num_threads=2,
    )


def caption(text, start, end, confidence=None):
    return {"text": text, "startMs": round(start), "endMs": round(end),
            "timestampMs": None, "confidence": confidence}


def letters(text):
    return re.sub(r"[^a-z0-9]", "", text.lower())


def align_words(asr, text, samples, rate, offset_ms):
    divisor = gcd(rate, 16000)
    stream = asr.create_stream()
    stream.accept_waveform(16000, resample_poly(samples, 16000 // divisor, rate // divisor))
    asr.decode_stream(stream)
    result = stream.result
    observed = ""
    times = []
    for token, timestamp in zip(result.tokens, result.timestamps, strict=True):
        piece = letters(token)
        observed += piece
        times.extend([timestamp * 1000] * len(piece))

    script_words = text.split()
    expected = [letters(word) for word in script_words]
    match = SequenceMatcher(None, "".join(expected), observed, autojunk=False)
    mapping = {a + delta: b + delta
               for a, b, size in match.get_matching_blocks() for delta in range(size)}
    starts = []
    position = 0
    for word in expected:
        matches = [mapping[i] for i in range(position, position + len(word)) if i in mapping]
        starts.append([max(0, times[matches[0]]) if matches else None,
                       round(len(matches) / max(1, len(word)), 2)])
        position += len(word)

    final = len(samples) / rate * 1000
    for index, (time, confidence) in enumerate(starts):
        if time is None:
            left = starts[index - 1][0] if index else 0
            next_index = next((i for i in range(index + 1, len(starts)) if starts[i][0] is not None), len(starts))
            right = starts[next_index][0] if next_index < len(starts) else final
            starts[index] = [left + (right - left) / (next_index - index + 1), confidence]
    for index in range(1, len(starts)):
        starts[index][0] = max(starts[index - 1][0] + 22, starts[index][0])
    if not starts or starts[-1][0] >= final:
        raise ValueError(f"Unusable alignment for {text!r}: {result.text}")

    words = [
        caption(word if index == 0 else " " + word, offset_ms + start,
                offset_ms + (starts[index + 1][0] if index + 1 < len(starts) else final), confidence)
        for index, (word, (start, confidence)) in enumerate(zip(script_words, starts, strict=True))
    ]
    return words, {"asr": result.text, "caption": text, "characterAgreement": round(match.ratio(), 3),
                   "reviewWords": [word["text"].strip() for word in words if word["confidence"] < 0.7]}


def caption_pages(words):
    pages = []
    current = []
    for index, word in enumerate(words):
        current.append(word)
        text = "".join(item["text"] for item in current).strip()
        following = words[index + 1]["text"] if index + 1 < len(words) else ""
        clause = text.endswith((".", "?", "!", ",", ":")) and len(current) >= 2
        if not following or clause or len(text + following) > 37 or len(current) >= 7:
            pages.append({**caption(text, current[0]["startMs"], current[-1]["endMs"]), "words": current})
            # The leading space separates words within a page only.
            if index + 1 < len(words):
                words[index + 1] = {**words[index + 1], "text": words[index + 1]["text"].lstrip()}
            current = []
    return pages
