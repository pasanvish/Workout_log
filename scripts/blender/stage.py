"""Build reusable studio equipment with rigid Blender meshes."""

import math

import bpy
from mathutils import Vector

from rig import SIDES, UP, color


def box(name, location, dimensions, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    item = bpy.context.object
    item.name = name
    item.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = item.modifiers.new("Rounded edges", "BEVEL")
    bevel.width = min(dimensions) * 0.13
    bevel.segments = 3
    item.modifiers.new("Flat faces", "WEIGHTED_NORMAL")
    item.data.materials.append(material)
    return item


def cylinder(name, length, radius, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=length)
    item = bpy.context.object
    item.name = name
    for face in item.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    item.data.materials.append(material)
    return item


def place(item, center, axis):
    item.location = center
    item.rotation_euler = Vector(axis).to_track_quat("Z", "Y").to_euler()


class Stage:
    def __init__(self):
        self.steel = color("Steel", (0.34, 0.39, 0.45))
        self.frame = color("Painted steel", (0.13, 0.17, 0.21))
        self.rubber = color("Rubber plates", (0.095, 0.117, 0.144))
        self.pad = color("Bench padding", (0.076, 0.092, 0.111))

    def barbell(self, diameter=0.35, length=1.7, curved=False):
        if curved:
            bend = [(-0.36, 0), (-0.26, -0.011), (-0.135, 0.023), (0.135, 0.023), (0.26, -0.011), (0.36, 0)]
            points = [(-length / 2, 0), *bend, (length / 2, 0)]
        else:
            points = [(-length / 2, 0), (length / 2, 0)]
        shaft = [(cylinder("Bar shaft", math.dist(a, b) + 0.012, 0.013, self.steel), a, b)
                 for a, b in zip(points, points[1:])]
        plates = [
            cylinder("Weight plate", 0.052, diameter / 2, self.rubber)
            for _ in SIDES
        ]
        def update(center, axis=(1, 0, 0)):
            center = Vector(center)
            axis = Vector(axis).normalized()
            depth = UP.cross(axis).normalized()
            for segment, a, b in shaft:
                start = center + a[0] * axis + a[1] * depth
                end = center + b[0] * axis + b[1] * depth
                place(segment, (start + end) / 2, end - start)
            for side, plate in zip(SIDES, plates):
                place(plate, Vector(center) + side * (length / 2 - 0.145) * axis, axis)
        return update

    def dumbbells(self, radius=0.056, sides=SIDES):
        parts = {
            side: (cylinder("Handle", 0.145, 0.011, self.steel),
             cylinder("Inner weight", 0.035, radius, self.rubber),
             cylinder("Outer weight", 0.035, radius, self.rubber))
            for side in sides
        }
        def update(side, center, axis=(1, 0, 0)):
            shaft, inside, outside = parts[side]
            axis = Vector(axis).normalized()
            place(shaft, center, axis)
            place(inside, Vector(center) + 0.074 * axis, axis)
            place(outside, Vector(center) - 0.074 * axis, axis)
        return update

    def bench(self, pitch=0, base=0.47):
        box("Bench seat", (0, 0, base - 0.04), (0.31, 0.40, 0.08), self.pad)
        back = box("Bench backrest", (0, 0.55, base - 0.04), (0.31, 0.76, 0.08), self.pad)
        back.location.y = 0.17 + 0.38 * math.cos(math.radians(pitch))
        back.location.z += 0.38 * math.sin(math.radians(pitch))
        back.rotation_euler.x = math.radians(pitch)
        for y in (-0.13, 0.67):
            box("Bench support", (0, y, 0.21), (0.07, 0.07, 0.42), self.frame)
            box("Bench foot", (0, y, 0.028), (0.57, 0.085, 0.056), self.frame)

    def pullup_station(self, z=2.08, spread=0.68):
        shaft = cylinder("Pull-up bar", 2 * spread, 0.015, self.steel)
        place(shaft, (0, 0, z), (1, 0, 0))
        for side in SIDES:
            box("Rack upright", (side * spread, 0, z / 2), (0.055, 0.055, z), self.frame)
            box("Rack foot", (side * spread, 0, 0.028), (0.055, 0.94, 0.056), self.frame)
