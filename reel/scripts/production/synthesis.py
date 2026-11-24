"""Locally installed model adapters. Network access is not used for synthesis."""

import os
import re

import numpy as np

os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("ONNX_NUM_THREADS", "2")


def pronounce(text, dictionary):
    for word, spoken in dictionary.items():
        text = re.sub(r"\b" + re.escape(word) + r"\b", lambda _: spoken, text)
    return text.replace("’", "'")


def narrator(config, models):
    engine = config["engine"]
    if engine == "kokoro-onnx":
        import onnxruntime
        from kokoro_onnx import Kokoro
        from misaki import en, espeak

        options = onnxruntime.SessionOptions()
        options.intra_op_num_threads = 2
        options.inter_op_num_threads = 1
        session = onnxruntime.InferenceSession(
            str(models / "kokoro-v1.0.onnx"), options, providers=["CPUExecutionProvider"],
        )
        model = Kokoro.from_session(session, str(models / "voices-v1.0.bin"))
        british = config.get("language", "en-us") == "en-gb"
        g2p = en.G2P(trf=False, british=british, fallback=espeak.EspeakFallback(british=british))

        def generate(text, voice, speed):
            phonemes, _ = g2p(text)
            if "❓" in phonemes:
                raise ValueError(f"Unresolved pronunciation in {text!r}: {phonemes}")
            return model.create(phonemes, voice, speed=speed, is_phonemes=True)
        return generate

    if engine in {"chatterbox", "chatterbox-turbo", "chatterbox-nano"}:
        import torch

        torch.set_num_threads(2)
        if engine == "chatterbox":
            from chatterbox.tts import ChatterboxTTS
            model = ChatterboxTTS.from_local(models, device="cpu")
        else:
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            model = ChatterboxTurboTTS.from_local(models, device="cpu", nano=engine.endswith("nano"))

        def generate(text, voice, speed):
            if speed != 1.0:
                raise ValueError("This Chatterbox adapter supports native delivery speed.")
            kwargs = {} if voice == "default" else {"audio_prompt_path": voice}
            return np.asarray(model.generate(text, **kwargs).squeeze().cpu()), model.sr
        return generate

    raise ValueError(f"Unsupported narration engine: {engine}")
