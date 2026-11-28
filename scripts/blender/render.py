"""Render offline exercise animations in headless Blender and encode them with FFmpeg."""

import argparse
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from poses import MOTIONS
import chest_back
import legs
import upper
import core
import mobility
from rig import build_body, color
from stage import Stage, box


FPS = 24
ROOT = Path(__file__).resolve().parents[2]


def setup_scene(view, target, scale, size):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = size
    scene.render.resolution_y = round(size * 0.76 / 2) * 2 if target[2] < 0.70 else size
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.render.image_settings.file_format = "PNG"
    scene.display.render_aa = "5"
    shade = scene.display.shading
    shade.light = "STUDIO"
    shade.studio_light = "paint.sl"
    shade.color_type = "MATERIAL"
    shade.show_shadows = True
    shade.show_cavity = True
    shade.cavity_type = "BOTH"
    shade.cavity_ridge_factor = 0.35
    shade.cavity_valley_factor = 0.48
    shade.curvature_ridge_factor = 0.30
    shade.curvature_valley_factor = 0.45
    shade.background_type = "WORLD"
    scene.world = bpy.data.worlds.new("Studio world")
    scene.world.color = (0.018, 0.027, 0.040)
    box("Studio floor", (0, 0, -0.035), (200, 200, 0.06), color("Dark floor", (0.033, 0.043, 0.058)))

    camera_target = Vector(target)
    angles = {
        "side": (3.65, -1.73, 0.82),
        "profile": (3.95, 0.75, 0.69),
        "bench": (2.25, -3.50, 1.12),
        "three-quarter": (2.31, -3.44, 0.95),
    }
    angle = Vector(angles[view])
    camera = bpy.data.objects.new("Studio camera", bpy.data.cameras.new("Studio camera"))
    bpy.context.collection.objects.link(camera)
    camera.location = camera_target + angle
    camera.rotation_euler = (-angle).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = scale
    scene.camera = camera


ONE_WAY = {"medicine-ball-chest-pass", "medicine-ball-slam", "original-barbell-walking-lunge",
           "original-cross-body-crunch", "original-kettlebell-halo", "original-monster-walk",
           "original-push-up-to-side-plank"}
FORWARD_SECONDS = {"turkish-get-up": 5, "original-push-up-to-side-plank": 5,
                   "original-cross-body-crunch": 2, "original-barbell-walking-lunge": 2,
                   "original-step-up-with-knee-raise": 2, "jump-squat": 1.5, "medicine-ball-slam": 1.5}


def encode(path, forward, layout, name):
    # A held position is shown longer. Throws and steps reset at the end of the clip.
    pause = FPS * 2 if "hold" in layout else 8 if name in ONE_WAY else 4
    order = [forward[0]] * 4 + forward + [forward[-1]] * pause
    if name not in ONE_WAY:
        order += forward[-2:0:-1]
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-profile:v", "baseline", "-crf", "20", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(path),
    ], input=b"".join(p.read_bytes() for p in order), check=True)


def export_artwork(destination, name, layout, forward):
    peak = {"original-push-up-to-side-plank": .66, "original-cross-body-crunch": .34,
            "original-kettlebell-halo": .50}.get(name, 1)
    positions = {"start": forward[0], "mid": forward[len(forward) // 2], "end": forward[round((len(forward) - 1) * peak)],
                 "pose": forward[len(forward) // 2], "hold": forward[-1]}
    for label in (*layout, "thumb"):
        source = positions[layout[0]] if label == "thumb" else positions[label]
        sizing = ["-resize", "176", "0"] if label == "thumb" else []
        subprocess.run([
            "cwebp", "-quiet", "-q", "82", *sizing, str(source), "-o", str(destination / f"3d-{name}-{label}.webp"),
        ], check=True)


def render_rep(pose, folder, name):
    scene = bpy.context.scene
    scene.frame_start = 1
    frame_count = int(FPS * FORWARD_SECONDS.get(name, 1))
    scene.frame_end = frame_count + 1
    scene.render.filepath = f"{folder}/"

    def position(current_scene):
        time = (current_scene.frame_current - 1) / frame_count
        pose((1 - math.cos(math.pi * time)) / 2)

    bpy.app.handlers.frame_change_pre.append(position)
    try:
        bpy.ops.render.render(animation=True)
    finally:
        bpy.app.handlers.frame_change_pre.remove(position)
    return [Path(folder) / f"{i:04}.png" for i in range(1, frame_count + 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mesh", required=True, type=Path)
    parser.add_argument("--out", type=Path, default=ROOT / "public/exercise-motion")
    parser.add_argument("--artwork", type=Path, default=ROOT / "public/exercise-visuals")
    parser.add_argument("--size", type=int, default=352)
    parser.add_argument("--stills", action="store_true", help="Render four review frames instead of MP4s")
    parser.add_argument("ids", nargs="*")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    manifest = json.loads((ROOT / "exerciseMotion.json").read_text())
    layouts = {entry["id"]: entry["frames"] for entry in json.loads((ROOT / "exerciseVisuals.json").read_text()).values()}
    names = args.ids or (sorted(MOTIONS) if args.stills else
                         [slug for slug, source in manifest.items() if source == "blender"])
    unknown = set(names) - MOTIONS.keys()
    if unknown:
        parser.error(f"Unknown exercise IDs: {', '.join(sorted(unknown))}")
    args.out.mkdir(parents=True, exist_ok=True)
    if not args.stills:
        args.artwork.mkdir(parents=True, exist_ok=True)
    for name in names:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        rig = build_body(args.mesh)
        function, view, center, scale = MOTIONS[name]
        pose = function(rig, Stage(), name)
        setup_scene(view, center, scale, args.size)
        if args.stills:
            for i, amount in enumerate((0, 0.33, 0.67, 1)):
                pose(amount)
                bpy.context.scene.render.filepath = str(args.out / f"{name}-{i}.png")
                bpy.ops.render.render(write_still=True)
        else:
            with tempfile.TemporaryDirectory(prefix="gymlogger-blender-") as temp:
                frames = render_rep(pose, temp, name)
                encode(args.out / f"3d-{name}.mp4", frames, layouts[name], name)
                export_artwork(args.artwork, name, layouts[name], frames)
        print(f"Rendered {name}", flush=True)


if __name__ == "__main__":
    main()
