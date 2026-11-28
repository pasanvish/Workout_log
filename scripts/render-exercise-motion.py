#!/usr/bin/env python3
"""Render exercise loops with Practical-RIFE (MIT), Pillow, ONNX Runtime and FFmpeg.

Install numpy, onnxruntime and Pillow. Download rife49.onnx from
https://huggingface.co/edgetools/rife/tree/321b593c5f36c26f5b08fa2838dcf5eece382fa0
and run: python scripts/render-exercise-motion.py --model /path/to/rife49.onnx

The model is only needed to render clips. Review the motion before adding any
new exercise to exerciseMotion.json.
"""

import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FPS = 24
MAX_SIDE = 320


def load_frame(path, size):
    with Image.open(path) as source:
        rgb = np.asarray(source.convert("RGB").resize(size, Image.Resampling.LANCZOS))
    height, width = rgb.shape[:2]
    padded = np.pad(rgb, ((0, -height % 32), (0, -width % 32), (0, 0)), mode="edge")
    return rgb.tobytes(), np.ascontiguousarray(padded.transpose(2, 0, 1)[None], dtype=np.float32) / 255


def inbetween(session, start, end, fraction, size):
    frame, = session.run(None, {
        "img0": start,
        "img1": end,
        "timestep": np.array([fraction], dtype=np.float32),
    })
    width, height = size
    rgb = frame[0, :, :height, :width].transpose(1, 2, 0)
    return np.clip(rgb * 255 + 0.5, 0, 255).astype(np.uint8).tobytes()


def render(session, slug, visual, target):
    scale = MAX_SIDE / max(visual["width"], visual["height"])
    size = tuple(round(visual[dimension] * scale / 2) * 2 for dimension in ("width", "height"))
    source = ROOT / "public/exercise-visuals"
    keyframes = [load_frame(source / f"{slug}-{pose}.webp", size) for pose in visual["frames"]]
    segments = len(keyframes) - 1
    frames = [keyframes[0][0]]
    for step in range(1, FPS):
        # Slow down at the ends of a rep while keeping a steady cadence through the middle.
        progress = segments * (1 - math.cos(math.pi * step / FPS)) / 2
        segment = int(progress)
        fraction = progress - segment
        if abs(fraction) < 1e-7:
            frames.append(keyframes[segment][0])
        else:
            frames.append(inbetween(session, keyframes[segment][1], keyframes[segment + 1][1], fraction, size))
    frames.append(keyframes[-1][0])
    loop = [frames[0]] * 4 + frames + [frames[-1]] * 5 + frames[-2:0:-1]
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{size[0]}x{size[1]}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(target / f"{slug}.mp4"),
    ], input=b"".join(loop), check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "public/exercise-motion")
    parser.add_argument("ids", nargs="*", help="Artwork IDs to preview, or omit to use exerciseMotion.json")
    args = parser.parse_args()
    visuals = {item["id"]: item for item in json.loads((ROOT / "exerciseVisuals.json").read_text()).values()}
    slugs = args.ids or json.loads((ROOT / "exerciseMotion.json").read_text())
    for slug in slugs:
        if slug not in visuals or len(visuals[slug]["frames"]) < 2:
            parser.error(f"{slug} must have at least two illustrated poses")
    options = ort.SessionOptions()
    options.intra_op_num_threads = 3
    session = ort.InferenceSession(str(args.model), sess_options=options, providers=["CPUExecutionProvider"])
    args.output.mkdir(parents=True, exist_ok=True)
    for slug in slugs:
        render(session, slug, visuals[slug], args.output)
        print(slug, flush=True)


if __name__ == "__main__":
    main()
