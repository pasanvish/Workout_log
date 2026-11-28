"""Build and pose the Gym Logger mannequin from Blender Studio's CC0 male base mesh."""

import math

import bmesh
import bpy
from mathutils import Matrix, Vector


SIDES = (-1, 1)
FRONT = Vector((0, -1, 0))
UP = Vector((0, 0, 1))
REST_HIP = Vector((0, 0.018, 0.867))
REST_CHEST = Vector((0, 0.012, 1.116))
JOINTS = {
    "hip": (0.093, 0.018, 0.867),
    "knee": (0.152, 0.019, 0.458),
    "ankle": (0.174, 0.056, 0.073),
    "toe": (0.185, -0.122, 0.027),
    "shoulder": (0.194, 0.013, 1.352),
    "elbow": (0.296, -0.013, 1.117),
    "wrist": (0.381, -0.054, 0.884),
    "palm": (0.411, -0.079, 0.805),
}
ID = Matrix.Identity(3)


def joint(name, side):
    x, y, z = JOINTS[name]
    return Vector((x * side, y, z))


def hand_frame(side, fingers, thumb):
    fingers = Vector(fingers).normalized()
    thumb = Vector(thumb)
    thumb = (thumb - fingers * fingers.dot(thumb)).normalized()
    outer = side * thumb.cross(fingers)
    return Matrix((thumb, fingers, outer)).transposed()


def rest_hand_frame(side):
    return hand_frame(side, joint("palm", side) - joint("wrist", side), FRONT)


def smoothstep(amount):
    amount = max(0, min(1, amount))
    return amount * amount * (3 - 2 * amount)


def build_grips(body):
    body.shape_key_add(name="Neutral")
    grips = {}
    for side in SIDES:
        grip = grips[side] = body.shape_key_add(name=f"Grip {side}")
        wrist = joint("wrist", side)
        hand = rest_hand_frame(side)
        to_hand = hand.transposed()
        for vertex in body.data.vertices:
            if vertex.co.x * side < 0.32:
                continue
            across, length, depth = to_hand @ (vertex.co - wrist)
            thumb = (smoothstep((across - 0.023) / 0.016) * smoothstep((length - 0.04) / 0.045)
                     * (1 - smoothstep((length - 0.103) / 0.019)))
            knuckle = 0.077 + max(0, across) * 0.27
            finger_length = max(0, length - knuckle)

            # Bend the digits around the grip axis while retaining their original thickness.
            radius = 0.022
            center_depth = -0.008
            angle = min(2.88, finger_length * 0.91 / radius)
            thickness = radius + depth - center_depth
            curved_length = knuckle + thickness * math.sin(angle)
            curved_depth = center_depth - radius + thickness * math.cos(angle)
            if finger_length:
                length = curved_length + thumb * (length - 0.017 - curved_length)
                depth = curved_depth + thumb * (depth - curved_depth)
            # Bring the thumb across the handle without curling it as a fifth finger.
            across -= 0.018 * thumb
            depth -= 0.016 * thumb
            grip.data[vertex.index].co = wrist + hand @ Vector((across, length, depth))
    return grips


def around(axis, degrees):
    return Matrix.Rotation(math.radians(degrees), 3, axis)


def color(name, rgb):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*rgb, 1)
    return material


def ik(start, target, first, second, pole):
    """Solve a two-bone chain without stretching and return its bend and endpoint."""
    delta = target - start
    direction = delta.normalized()
    distance = max(abs(first - second) + 0.001, min(delta.length, first + second - 0.002))
    bend_direction = pole - direction * pole.dot(direction)
    if bend_direction.length < 1e-5:
        bend_direction = direction.cross(UP if abs(direction.z) < 0.8 else FRONT)
    along = (first * first - second * second + distance * distance) / (2 * distance)
    height = math.sqrt(max(0, first * first - along * along))
    return start + direction * along + bend_direction.normalized() * height, start + direction * distance


def build_body(library):
    names = ["GEO-body_male_realistic", "GEO-body_male_realistic.eye.L", "GEO-body_male_realistic.eye.R"]
    with bpy.data.libraries.load(str(library), link=False) as (_, imported):
        imported.objects = names
    body, *eyes = imported.objects
    positions = [eye.location.copy() - body.location for eye in eyes]
    body.location = (0, 0, 0)
    body.parent = None
    body.modifiers.clear()
    body.data.materials.clear()
    skin = color("Matte silver", (0.57, 0.60, 0.63))
    shorts = color("Slate training shorts", (0.057, 0.076, 0.096))
    shoes = color("Graphite training shoes", (0.09, 0.11, 0.14))
    for material in (skin, shorts, shoes):
        body.data.materials.append(material)

    # Cut the clothing boundaries across the mesh so the hems stay straight as the rig bends.
    mesh = bmesh.new()
    mesh.from_mesh(body.data)
    for height in (0.102, 0.617, 0.966):
        section = [item for item in (*mesh.verts, *mesh.edges, *mesh.faces)
                   if abs(item.co.x if isinstance(item, bmesh.types.BMVert) else
                          sum(vertex.co.x for vertex in item.verts) / len(item.verts)) < 0.28]
        bmesh.ops.bisect_plane(mesh, geom=section, dist=0.0001, plane_co=(0, 0, height), plane_no=(0, 0, 1))
    mesh.to_mesh(body.data)
    mesh.free()
    for poly in body.data.polygons:
        z = sum(body.data.vertices[index].co.z for index in poly.vertices) / len(poly.vertices)
        x = sum(body.data.vertices[index].co.x for index in poly.vertices) / len(poly.vertices)
        poly.material_index = 1 if abs(x) < 0.28 and 0.617 < z < 0.966 else 2 if z < 0.102 else 0
        poly.use_smooth = True
    body.name = "Gym Logger mannequin"
    bpy.context.collection.objects.link(body)

    data = bpy.data.armatures.new("Mannequin anatomy")
    armature = bpy.data.objects.new("Mannequin rig", data)
    bpy.context.collection.objects.link(armature)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, start, end, parent=None):
        edit = data.edit_bones.new(name)
        edit.head = start
        edit.tail = end
        if parent:
            edit.parent = data.edit_bones[parent]
        return edit

    neck = Vector((0, 0.012, 1.421))
    bone("spine", REST_HIP, REST_CHEST)
    bone("chest", REST_CHEST, neck, "spine")
    bone("head", neck, (0, -0.017, 1.654), "chest")
    for side in SIDES:
        suffix = f".{side}"
        for name, start, end, parent in (
            ("thigh", "hip", "knee", "spine"),
            ("shin", "knee", "ankle", "thigh" + suffix),
            ("foot", "ankle", "toe", "shin" + suffix),
            ("upper", "shoulder", "elbow", "chest"),
            ("lower", "elbow", "wrist", "upper" + suffix),
            ("hand", "wrist", "palm", "lower" + suffix),
        ):
            bone(name + suffix, joint(start, side), joint(end, side), parent)
    bpy.ops.object.mode_set(mode="OBJECT")
    body.select_set(True)
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    if len(body.vertex_groups) != len(data.bones) or not any(vertex.groups for vertex in body.data.vertices):
        raise RuntimeError("Blender could not weight the mannequin to its armature")

    grips = build_grips(body)

    for eye, position in zip(eyes, positions):
        # Joining the eyes is unnecessary. Weight them to the head without independently moving their sockets.
        eye.parent = None
        eye.location = position
        eye.data.materials.clear()
        eye.data.materials.append(skin)
        bpy.context.collection.objects.link(eye)
        group = eye.vertex_groups.new(name="head")
        group.add(list(range(len(eye.data.vertices))), 1, "REPLACE")
        deform = eye.modifiers.new("Head follows rig", "ARMATURE")
        deform.object = armature

    smooth = body.modifiers.new("Smooth anatomy", "SUBSURF")
    smooth.levels = 1
    smooth.render_levels = 1
    return Rig(armature, grips)


class Rig:
    def __init__(self, armature, grips):
        self.armature = armature
        self.grips = grips
        self.rest = {bone.name: bone.matrix_local.copy() for bone in armature.data.bones}
        self.current = {}

    def set_grip(self, amount, side=None):
        for hand in SIDES if side is None else (side,):
            self.grips[hand].value = amount

    def bone(self, name, start, rotation):
        rest = self.rest[name]
        world = (rotation @ rest.to_3x3()).to_4x4()
        world.translation = start
        self.current[name] = world
        pose = self.armature.pose.bones[name]
        if pose.parent:
            parent = pose.parent.name
            world = self.rest[parent] @ self.current[parent].inverted() @ world
        pose.matrix_basis = rest.inverted() @ world

    def start(self, hip=REST_HIP, pitch=0, yaw=0, tilt=0, look=0, chest_pitch=0):
        self.hip = Vector(hip)
        self.torso = around("Z", yaw) @ around("Y", tilt) @ around("X", pitch)
        self.bone("spine", self.hip, self.torso)
        self.chest_start = self.hip + self.torso @ (REST_CHEST - REST_HIP)
        self.chest = self.torso @ around("X", chest_pitch)
        self.bone("chest", self.chest_start, self.chest)
        neck = self.rest["head"].translation
        self.bone("head", self.point(neck), self.chest @ around("X", look))

    def point(self, rest):
        if rest.z >= REST_CHEST.z:
            return self.chest_start + self.chest @ (rest - REST_CHEST)
        return self.hip + self.torso @ (rest - REST_HIP)

    def aim(self, name, start, end, basis=ID):
        rest_direction = self.rest[name].to_3x3().col[1]
        turn = (basis @ rest_direction).rotation_difference(end - start).to_matrix()
        rotation = turn @ basis
        self.bone(name, start, rotation)
        return rotation

    def leg(self, side, ankle=None, foot=ID, pole=FRONT):
        hip, knee, heel = [joint(name, side) for name in ("hip", "knee", "ankle")]
        ankle = Vector(ankle) if ankle is not None else heel
        start = self.point(hip)
        bend, end = ik(start, ankle, (knee - hip).length, (heel - knee).length, Vector(pole))
        self.leg_pose(side, bend, end, foot)
        return end

    def leg_pose(self, side, bend, end, foot):
        start = self.point(joint("hip", side))
        thigh = self.aim(f"thigh.{side}", start, bend, self.torso)
        self.aim(f"shin.{side}", bend, end, thigh)
        self.bone(f"foot.{side}", end, foot)

    def arm(self, side, wrist, pole, direction=None, across=None):
        shoulder, elbow, hand = [joint(name, side) for name in ("shoulder", "elbow", "wrist")]
        start = self.point(shoulder)
        bend, end = ik(start, Vector(wrist), (elbow - shoulder).length, (hand - elbow).length, Vector(pole))
        upper = self.aim(f"upper.{side}", start, bend, self.chest)
        forearm = self.aim(f"lower.{side}", bend, end, upper)
        if direction is not None and across is not None:
            rotation = hand_frame(side, direction, across) @ rest_hand_frame(side).transposed()
        elif direction is None:
            rotation = forearm
        else:
            natural = self.rest[f"hand.{side}"].to_3x3().col[1]
            rotation = (forearm @ natural).rotation_difference(Vector(direction)).to_matrix() @ forearm
        self.bone(f"hand.{side}", end, rotation)
        inner = -0.023 * self.grips[side].value * rest_hand_frame(side).col[2]
        palm = end + rotation @ (joint("palm", side) - hand + inner)
        return end, palm
