"""Equipment shared by the exercise motion families."""
import math

import bpy
from mathutils import Vector

from rig import FRONT, SIDES, UP, color
from stage import box, cylinder, place


def midpoint(first, second):
    return (first + second) / 2


def beam(name, material, radius=0.02):
    mesh = cylinder(name, 1, radius, material)

    def update(first, second):
        first, second = Vector(first), Vector(second)
        axis = second - first
        mesh.scale.z = max(axis.length, 0.001)
        place(mesh, midpoint(first, second), axis if axis.length else UP)
    return update


def cable(stage, anchor, band=False, tower=True, label=None):
    anchor = Vector(anchor)
    if not band and tower:
        box("Cable tower", (anchor.x, anchor.y, 1.03), (0.105, 0.14, 2.06), stage.frame)
        box("Tower base", (anchor.x, anchor.y, 0.035), (0.51, 0.38, 0.07), stage.frame)
    if not band:
        wheel = cylinder("Pulley", 0.034, 0.057, stage.rubber)
        place(wheel, anchor, (1, 0, 0))
    line = beam(label or ("Resistance band" if band else "Cable"),
                color("Band rubber", (0.23, 0.44, 0.43)) if band else stage.steel, 0.010 if band else 0.005)

    def update(end, start=None):
        line(anchor if start is None else start, end)
    return update


def ball(stage, radius=0.14, name="Medicine ball"):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=radius)
    item = bpy.context.object
    item.name = name
    item.data.materials.append(color(name, (0.216, 0.30, 0.36)))
    for face in item.data.polygons:
        face.use_smooth = True
    return item


def kettlebells(stage, sides=SIDES, drop=0.115):
    handles = {side: [beam("Handle", stage.steel, 0.014) for _ in range(3)] for side in sides}
    weights = {side: ball(stage, 0.072, "Kettlebell") for side in sides}

    def update(side, grip, axis=(1, 0, 0), hang=-UP):
        grip, axis, hang = Vector(grip), Vector(axis).normalized(), Vector(hang).normalized()
        left = grip - 0.061 * axis
        right = grip + 0.061 * axis
        head = grip + drop * hang
        end_left = head - 0.039 * axis
        end_right = head + 0.039 * axis
        shaft, a, b = handles[side]
        shaft(left, right)
        a(left, end_left)
        b(right, end_right)
        weights[side].location = head
    return update


def platform(stage, height, center=(0, 0), width=0.61, depth=0.42):
    return box("Step platform", (*center, height / 2), (width, depth, height), stage.frame)


def seat(stage, height=0.46, y=0.09, back=False):
    box("Seat pad", (0, y, height - 0.038), (0.40, 0.44, 0.076), stage.pad)
    box("Seat stand", (0, y, height * 0.47), (0.17, 0.21, height * 0.90), stage.frame)
    box("Seat base", (0, y, 0.035), (0.55, 0.47, 0.07), stage.frame)
    if back:
        return box("Seat back", (0, y + 0.19, height + 0.27), (0.38, 0.07, 0.57), stage.pad)


def smith(stage, center=0.35, height=1.76):
    for side in SIDES:
        y = center
        x = 0.69 * side
        box("Smith machine base", (x, y, 0.037), (0.115, 0.88, 0.074), stage.frame)
        box("Smith frame", (x, y + 0.19, height / 2), (0.068, 0.085, height), stage.frame)
        place(cylinder("Guide rail", height - 0.10, 0.021, stage.steel), (x, y, height / 2), UP)
    box("Smith top crossbar", (0, center + 0.19, height), (1.46, 0.07, 0.07), stage.frame)


def plate_machine(stage, anchor, pad=None):
    anchor = Vector(anchor)
    for side in SIDES:
        box("Machine upright", (side * 0.58, anchor.y, anchor.z / 2), (0.085, 0.10, anchor.z), stage.frame)
        box("Machine base", (side * 0.58, anchor.y, 0.038), (0.105, 1.05, 0.076), stage.frame)
    if pad:
        box("Body support pad", pad, (0.26, 0.15, 0.36), stage.pad)
    arms = {side: beam("Pivoting lever", stage.steel, 0.025) for side in SIDES}
    handles = {side: beam("Padded grip", stage.rubber, 0.019) for side in SIDES}

    def update(side, grip, axis=(1, 0, 0)):
        grip = Vector(grip)
        axis = Vector(axis).normalized() * 0.071
        arms[side](anchor + Vector((side * 0.58, 0, 0)), grip + side * axis)
        handles[side](grip - axis, grip + axis)
    return update


def finish_arm(rig, side, wrist, pole, fingers, across=None):
    return rig.arm(side, wrist, pole, fingers, across if across is not None else (-side, 0, 0))[1]


def bench_body(rig, incline, hip=(0, 0.065, 0.575)):
    rig.start(hip=hip, pitch=-90 + incline)
    for side in SIDES:
        rig.leg(side, (side * 0.22, -0.33, 0.073), pole=(side * 0.11, -0.32, 1))


def arc(degrees, plane=FRONT):
    angle = math.radians(degrees)
    return math.sin(angle) * Vector(plane) - math.cos(angle) * UP
