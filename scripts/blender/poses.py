"""Authored exercise poses and rep paths for the Blender mannequin."""

import math

import bpy
from mathutils import Vector

from rig import FRONT, ID, REST_HIP, SIDES, UP, around, color, joint
from stage import box, cylinder, place


MOTIONS = {}


def motion(*names, view="three-quarter", center=(0, 0, 0.91), scale=2.03):
    def register(function):
        for name in names:
            MOTIONS[name] = (function, view, center, scale)
        return function
    return register


def standing(rig, **kwargs):
    rig.start(**kwargs)
    for side in SIDES:
        rig.leg(side)


@motion("biceps-curl", "hammer-curls", "barbell-curl", "ez-bar-curl", "seated-dumbbell-curl",
        "original-reverse-barbell-curl", "original-standing-dumbbell-reverse-curl")
def curl(rig, stage, name):
    use_bar = name in ("barbell-curl", "ez-bar-curl", "original-reverse-barbell-curl")
    reverse = "reverse" in name
    seated = name == "seated-dumbbell-curl"
    weights = stage.barbell(0.19, 1.16, curved=name == "ez-bar-curl") if use_bar else stage.dumbbells(0.049)
    rig.set_grip(1)
    if seated:
        box("Seat", (0, 0.095, 0.435), (0.40, 0.45, 0.086), stage.pad)
        box("Seat support", (0, 0.09, 0.23), (0.17, 0.22, 0.46), stage.frame)

    def pose(t):
        if seated:
            rig.start(hip=(0, 0.048, 0.583))
            for side in SIDES:
                rig.leg(side, (side * 0.21, -0.37, 0.073), pole=UP)
        else:
            standing(rig)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            elbow = shoulder + Vector((side * (0.083 if seated else 0.027), -0.012, -0.254))
            angle = math.radians(12 + 120 * t)
            direction = Vector((side * 0.012, -math.sin(angle), -math.cos(angle)))
            wrist = elbow + 0.248 * direction
            axis = Vector((0, direction.z, -direction.y)) if name == "hammer-curls" else Vector((1, 0, 0))
            _, palm = rig.arm(side, wrist, elbow - shoulder, direction, axis * (side if reverse else -side))
            palms.append(palm)
            if not use_bar:
                weights(side, palm, axis)
        if use_bar:
            weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("bodyweight-squat", "goblet-squat", "dumbbell-squat", "squat", "front-squat",
        "original-narrow-stance-squats", view="side")
def squat(rig, stage, name):
    use_bar = name in ("squat", "front-squat", "original-narrow-stance-squats")
    dumbbells = stage.dumbbells(0.062) if name == "dumbbell-squat" else None
    bar = stage.barbell(0.34, 1.56) if use_bar else None
    rig.set_grip(0.7 if use_bar or dumbbells or name == "goblet-squat" else 0)
    if name == "goblet-squat":
        goblet = cylinder("Goblet dumbbell shaft", 0.21, 0.018, stage.steel)
        ends = [cylinder("Goblet dumbbell head", 0.063, 0.068, stage.rubber) for _ in SIDES]

    def pose(t):
        hip = REST_HIP + Vector((0, 0.225 * t, -0.362 * t))
        rig.start(hip=hip, pitch=3 + (17 if name == "front-squat" else 25) * t, look=-12 * t)
        palms = []
        for side in SIDES:
            narrow = name == "original-narrow-stance-squats"
            rig.leg(side, (side * 0.087, 0.056, 0.073) if narrow else None)
            shoulder = rig.point(joint("shoulder", side))
            if name == "goblet-squat":
                wrist = Vector((0.072 * side, shoulder.y - 0.272, shoulder.z - 0.17))
                rig.arm(side, wrist, Vector((0.12 * side, 0, -1)), UP, (0, 1, 0))
            elif dumbbells:
                wrist = shoulder + Vector((side * 0.075, -0.044, -0.482))
                _, palm = rig.arm(side, wrist, Vector((0.22 * side, 1, 0)), -UP, FRONT)
                dumbbells(side, palm, (0, 1, 0))
            elif bar:
                front = name == "front-squat"
                wrist = shoulder + Vector((side * (0.085 if front else 0.13), -0.111 if front else 0.111, -0.05 if front else -0.018))
                direction = UP if not front else Vector((0, 0.31, 1))
                pole = Vector((0.60 * side, -1.0, 0.24) if front else (0.45 * side, 0.38, -1))
                _, palm = rig.arm(side, wrist, pole, direction, (-side, 0, 0))
                palms.append(palm)
            else:
                wrist = shoulder + Vector((0.012 * side, -0.493, -0.043))
                rig.arm(side, wrist, -UP, FRONT, (-side, 0, 0))
        if name == "goblet-squat":
            shoulder = rig.point(joint("shoulder", 1))
            center = Vector((0, shoulder.y - 0.269, shoulder.z - 0.11))
            place(goblet, center, UP)
            for side, end in zip(SIDES, ends):
                place(end, center + 0.087 * side * UP, UP)
        if bar:
            bar((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("incline-bench-press", "incline-dumbbell-press", view="bench",
        center=(0, .25, .82), scale=2.12)
@motion("bench-press", "dumbbell-chest-press",
        "close-grip-bench-press", "wide-grip-bench-press",
        "original-close-grip-dumbbell-press", "original-dumbbell-bench-press-with-neutral-grip",
        "original-one-arm-dumbbell-bench-press", "dumbbell-floor-press", "barbell-floor-press",
        view="bench", center=(0, 0.25, 0.64), scale=2.04)
def bench_press(rig, stage, name):
    incline = 29 if name.startswith("incline") else 0
    use_bar = "dumbbell" not in name
    floor = "floor-press" in name
    close_dumbbell = "close-grip-dumbbell" in name
    neutral = close_dumbbell or "neutral-grip" in name
    one_arm = "one-arm" in name
    grip = 0.198 if name.startswith("close") else 0.376 if name.startswith("wide") else 0.291
    weights = stage.barbell(0.27, 1.78) if use_bar else stage.dumbbells(0.058, sides=(1,) if one_arm else SIDES)
    if not floor:
        stage.bench(incline)
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, 0.065, 0.125 if floor else 0.575), pitch=-90 + incline, look=-7 if incline else 0)
        for side in SIDES:
            rig.leg(side, (side * 0.22, -0.43 if floor else -0.31, 0.073), pole=Vector((side * 0.11, -0.32, 1)))
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            wrist_z = shoulder.z + 0.478 - (0.286 if floor else 0.387) * t
            wrist_y = shoulder.y - 0.028 - (0.133 + incline * 0.0007) * t
            wrist_x = side * (grip if use_bar else 0.103 if close_dumbbell else 0.22 + 0.10 * t)
            elbow_pole = Vector((side, -0.78, -0.46))
            if one_arm and side < 0:
                rig.arm(side, (0.02, 0.24, 0.735), (-1, -0.6, -0.12), (0, -1, 0), (0, 0, -1))
                continue
            axis = FRONT if neutral else Vector((1, 0, 0))
            _, palm = rig.arm(side, (wrist_x, wrist_y, wrist_z), elbow_pole, UP, axis * -side)
            palms.append(palm)
            if not use_bar:
                weights(side, palm, axis)
        if use_bar:
            weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("pull-up", "chin-up", center=(0, 0, 1.13), scale=2.46)
def pullup(rig, stage, name):
    stage.pullup_station()
    width = 0.29 if name == "pull-up" else 0.21
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, 0.085 - 0.04 * t, 1.07 + 0.43 * t), pitch=1 - 9 * t)
        for side in SIDES:
            direction = side if name == "chin-up" else -side
            rig.arm(side, (side * width, 0.023 * -direction * side, 1.992), (side, 0.28, -0.46), UP, (direction, 0, 0))
            rig.leg(side, (side * 0.155, 0.163 + t * 0.10, 0.31 + 0.43 * t), foot=around("X", 14), pole=FRONT)
    return pose


@motion("overhead-press", "dumbbell-shoulder-press", "original-standing-dumbbell-press",
        center=(0, 0, 1.05), scale=2.31)
def overhead_press(rig, stage, name):
    seated = name == "dumbbell-shoulder-press"
    use_bar = name == "overhead-press"
    weights = stage.barbell(0.26, 1.54) if use_bar else stage.dumbbells(0.055)
    rig.set_grip(1)
    if seated:
        box("Seat", (0, 0.08, 0.43), (0.43, 0.45, 0.084), stage.pad)
        box("Seat post", (0, 0.09, 0.23), (0.12, 0.12, 0.46), stage.frame)
        box("Seat foot", (0, 0.09, 0.033), (0.60, 0.48, 0.066), stage.frame)

    def pose(t):
        rig.start(hip=(0, 0.036, 0.57 if seated else 0.867), pitch=-5 * math.sin(math.pi * t))
        palms = []
        for side in SIDES:
            if seated:
                rig.leg(side, (0.20 * side, -0.38, 0.073), pole=UP)
            else:
                rig.leg(side)
            shoulder = rig.point(joint("shoulder", side))
            width = 0.257 if use_bar else 0.32 - 0.081 * t
            bar_path = -0.202 + 0.226 * (max(0, t - 0.65) / 0.35) ** 1.5
            dumbbell_path = -0.11 + 0.137 * t
            wrist = (width * side, bar_path if use_bar else dumbbell_path, shoulder.z - 0.066 + 0.549 * t)
            _, palm = rig.arm(side, wrist, (side, -0.40, -1), UP, (-side, 0, 0))
            palms.append(palm)
            if not use_bar:
                weights(side, palm)
        if use_bar:
            weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("deadlift", "romanian-deadlift", view="side", center=(0, 0, 0.90), scale=2.13)
def deadlift(rig, stage, name):
    weights = stage.barbell(0.41)
    romanian = name == "romanian-deadlift"
    rig.set_grip(1)

    def pose(t):
        low_hip = 0.796 if romanian else 0.552
        hip = (0, (0.31 if romanian else 0.185) * (1 - t) + 0.02 * t, low_hip + (0.867 - low_hip) * t)
        low_pitch = 59 if romanian else 60
        standing(rig, hip=hip, pitch=low_pitch * (1 - t), look=-18 * (1 - t))
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            z = (0.558 if romanian else 0.293) * (1 - t) + 0.859 * t
            wrist_y = -0.185 * (1 - t) - 0.105 * t
            _, palm = rig.arm(side, (side * 0.226, wrist_y, z), (side * 0.3, 1, 0), -UP, (-side, 0, 0))
            palms.append(palm)
        weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("push-up", "diamond-push-up", "wide-push-up", "incline-push-up", "decline-push-up",
        view="side", center=(0, 0, 0.40), scale=2.08)
def pushup(rig, stage, name):
    width = 0.063 if name.startswith("diamond") else 0.33 if name.startswith("wide") else 0.23
    hands_up = name == "incline-push-up"
    feet_up = name == "decline-push-up"
    support = 0.27 if hands_up or feet_up else 0
    if support:
        y = -0.50 if hands_up else 0.685
        box("Push-up bench", (0, y, support - 0.036), (0.69, 0.39, 0.072), stage.pad)
        box("Bench support", (0, y, support / 2), (0.26, 0.21, support), stage.frame)
    heel_z = 0.112 + (support if feet_up else 0)
    wrist_z = 0.08 + (support if hands_up else 0)

    def pose(t):
        pitch = math.degrees(math.acos((wrist_z + 0.490 - 0.34 * t - heel_z) / 1.283))
        rotation = around("X", pitch)
        heel = Vector((0, 0.78, heel_z))
        hip = heel + rotation @ Vector((0, -0.008, 0.798))
        rig.start(hip=hip, pitch=pitch, look=-7)
        for side in SIDES:
            rig.leg(side, heel + Vector((side * 0.11, 0, 0)), foot=around("X", 37), pole=-UP)
            thumb = (-side, 0.85 if name.startswith("diamond") else 0, 0)
            direction = Vector((-side * 0.4, -1, 0)) if name.startswith("diamond") else FRONT
            rig.arm(side, (side * width, -0.421, wrist_z), (side * 0.36, 0.94, 0.25), direction, thumb)
    return pose


@motion("dumbbell-lunge", "dumbbell-reverse-lunge", "original-split-squat-with-dumbbells", "barbell-lunge",
        view="side")
def lunge(rig, stage, name):
    reverse = name == "dumbbell-reverse-lunge"
    fixed = name.startswith("original-split")
    use_bar = name == "barbell-lunge"
    weights = stage.barbell(0.26, 1.57) if use_bar else stage.dumbbells(0.055)
    rig.set_grip(1)

    def pose(t):
        reach = 1 if fixed else min(1, t / 0.49)
        reach = (1 - math.cos(math.pi * reach)) / 2
        down = t if fixed else max(0, (t - 0.43) / 0.57)
        down = (1 - math.cos(math.pi * down)) / 2
        front_y = 0.056 - (0.33 if fixed or reverse else 0.57) * reach
        back_y = 0.056 + (0.33 if fixed or reverse else 0.04) * reach
        hip_y = 0.018 + (0.05 if reverse else -0.13 if fixed else -0.26) * reach
        rig.start(hip=(0, hip_y, 0.849 - 0.29 * down - (0.017 if fixed else 0.023 * reach)),
                  pitch=5 + 6 * down)
        for side, y in ((1, front_y), (-1, back_y)):
            swing = (not fixed and ((side == 1) != reverse))
            lift = 0.095 * math.sin(math.pi * reach) if swing else 0
            back = side == -1
            toe_angle = (14 * reach + 29 * down) if back else 0
            foot_z = 0.073 + lift + 0.101 * math.sin(math.radians(toe_angle))
            rig.leg(side, (side * 0.135, y, foot_z), foot=around("X", toe_angle))
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if use_bar:
                wrist = (side * 0.326, shoulder.y + 0.128, shoulder.z - 0.012)
                _, palm = rig.arm(side, wrist, (0.5 * side, 0.26, -1), UP, (-side, 0, 0))
                palms.append(palm)
            else:
                wrist = shoulder + Vector((0.052 * side, -0.024, -0.484))
                _, palm = rig.arm(side, wrist, (0.3 * side, 1, 0), -UP, FRONT)
                weights(side, palm, FRONT)
        if use_bar:
            weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("lateral-raises", "front-raises", "dumbbell-scaption", "original-seated-side-lateral-raise")
def dumbbell_raise(rig, stage, name):
    seated = name == "original-seated-side-lateral-raise"
    forward = name == "front-raises"
    scaption = name == "dumbbell-scaption"
    weights = stage.dumbbells(0.050)
    rig.set_grip(1)
    if seated:
        box("Seat", (0, 0.08, 0.43), (0.42, 0.45, 0.08), stage.pad)
        box("Seat stand", (0, 0.08, 0.215), (0.12, 0.13, 0.43), stage.frame)

    def pose(t):
        rig.start(hip=(0, 0.041, 0.572 if seated else 0.867), pitch=4 if seated else 0)
        for side in SIDES:
            rig.leg(side, (0.20 * side, -0.365, 0.073) if seated else None, pole=UP if seated else FRONT)
            angle = math.radians(4 + 82 * t)
            reach = math.sin(angle)
            rise = math.cos(angle)
            lateral = 0.09 if forward else 0.85 if scaption else 0.98
            anterior = math.sqrt(1 - lateral * lateral)
            direction = Vector((side * lateral * reach, -anterior * reach, -rise))
            wrist = rig.point(joint("shoulder", side)) + 0.489 * direction
            if seated:
                wrist.x += side * .064 * (1 - t)
            axis = Vector((1, 0, 0)) if forward else Vector((0, 1, 0))
            axis = (axis - direction * axis.dot(direction)).normalized()
            _, palm = rig.arm(side, wrist, FRONT, direction, axis * -side)
            weights(side, palm, axis)
    return pose


@motion("bent-over-row", "bent-over-two-dumbbell-row", "reverse-grip-barbell-row", view="side")
def row(rig, stage, name):
    use_bar = name != "bent-over-two-dumbbell-row"
    weights = stage.barbell(0.27, 1.49) if use_bar else stage.dumbbells(0.056)
    rig.set_grip(1)

    def pose(t):
        standing(rig, hip=(0, 0.155, 0.767), pitch=62, look=-19)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            wrist = shoulder + Vector((side * (0.043 if use_bar else 0.066), 0.021 + 0.205 * t, -0.486 + 0.298 * t))
            pole = Vector((0.15 * side, 1, 0.24))
            hand = Vector((0, -0.22 * t, -1))
            axis = Vector((1, 0, 0)) if use_bar else Vector((0, 1, 0.22 * t))
            sign = side if name.startswith("reverse") else -side
            _, palm = rig.arm(side, wrist, pole, hand, axis * sign)
            palms.append(palm)
            if not use_bar:
                weights(side, palm, axis)
        if use_bar:
            weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("glute-bridge", "single-leg-glute-bridge", "banded-glute-bridge", "barbell-glute-bridge",
        view="side", center=(0, 0, 0.31), scale=1.57)
def bridge(rig, stage, name):
    band = None
    weights = None
    if name.startswith("banded"):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.142, minor_radius=0.010, location=(0, 0, 0))
        band = bpy.context.object
        band.data.materials.append(color("Resistance band", (0.24, 0.35, 0.42)))
    if name.startswith("barbell"):
        weights = stage.barbell(0.23, 1.40)

    def pose(t):
        height = 0.126 + 0.211 * t
        shoulder = Vector((0, 0.446, 0.132))
        dz = shoulder.z - height
        reach = math.sqrt(0.485 ** 2 - dz ** 2)
        hip = Vector((0, shoulder.y - reach, height))
        pitch = -math.degrees(math.atan2(reach, dz))
        rig.start(hip=hip, pitch=pitch, look=-90 - pitch)
        for side in SIDES:
            if side > 0 and name.startswith("single"):
                direction = Vector((0, -0.79, 0.027 + 0.30 * t)).normalized()
                ankle = rig.point(joint("hip", side)) + 0.784 * direction
                foot = around("X", -91 - 22 * t)
            else:
                ankle = (side * 0.178, -0.427, 0.073)
                foot = ID
            rig.leg(side, ankle, foot=foot, pole=UP)
            target = (side * 0.252, 0.037, 0.057)
            if weights:
                target = (side * 0.249, hip.y - 0.022, hip.z + 0.092)
                rig.set_grip(1)
            rig.arm(side, target, UP, FRONT if not weights else UP, (-side, 0, 0))
        if weights:
            weights(hip + Vector((0, -0.035, 0.117)), (1, 0, 0))
        if band:
            thighs = [rig.current[f"thigh.{side}"].translation for side in SIDES]
            knees = [rig.current[f"shin.{side}"].translation for side in SIDES]
            thigh_center = (thighs[0] + thighs[1]) / 2
            knee_center = (knees[0] + knees[1]) / 2
            place(band, thigh_center.lerp(knee_center, 0.70), knee_center - thigh_center)
            band.scale = (1.29, 0.56, 1)
    return pose


@motion("leg-raises", "original-bent-knee-hip-raise", "reverse-crunch",
        view="side", center=(0, 0, 0.39), scale=1.88)
def floor_legs(rig, stage, name):
    folded = name in ("reverse-crunch", "original-bent-knee-hip-raise")

    def pose(t):
        pelvic_curl = 14 * t ** 2 if folded else 0
        hip = Vector((0, 0, 0.126 + 0.004 * pelvic_curl))
        rig.start(hip=hip, pitch=-90 - pelvic_curl, chest_pitch=pelvic_curl, look=9)
        for side in SIDES:
            if folded:
                knee_phase = math.radians(61 + 28 * t if name == "reverse-crunch" else 31 + 55 * t)
                upper = Vector((0, -math.cos(knee_phase), math.sin(knee_phase)))
                lower = Vector((0, -math.cos(knee_phase - 1.45), math.sin(knee_phase - 1.45)))
                ankle = rig.point(joint("hip", side)) + 0.412 * upper + 0.385 * lower
                foot = around("X", -90 - math.degrees(knee_phase) + 65)
            else:
                degrees = 6 + 74 * t
                angle = math.radians(degrees)
                ankle = rig.point(joint("hip", side)) + Vector((0.016 * side, -0.793 * math.cos(angle), 0.793 * math.sin(angle)))
                foot = around("X", -82 - degrees)
            rig.leg(side, ankle, foot=foot, pole=UP)
            rig.arm(side, (side * 0.233, 0.005, 0.044), UP, FRONT, (-side, 0, 0))
    return pose


@motion("flutter-kicks", view="side", center=(0, 0.045, 0.55), scale=1.93)
def flutter_kicks(rig, stage, name):
    box("Bench pad", (0, -0.35, 0.455), (0.42, 0.76, 0.076), stage.pad)
    for y in (-0.62, -0.09):
        box("Bench leg", (0, y, 0.21), (0.083, 0.083, 0.42), stage.frame)
        box("Bench foot", (0, y, 0.025), (0.48, 0.071, 0.05), stage.frame)

    def pose(t):
        rig.start(hip=(0, 0.013, 0.625), pitch=91, look=-15)
        for side in SIDES:
            angle = math.radians(side * (21 * t - 10.5))
            ankle = rig.point(joint("hip", side)) + Vector((0.052 * side, 0.789 * math.cos(angle), 0.789 * math.sin(angle)))
            rig.leg(side, ankle, foot=around("X", 64 + math.degrees(angle)), pole=-UP)
            rig.arm(side, (side * 0.179, -0.621, 0.533), (side, 0.48, -0.46), FRONT, (-side, 0, 0))
    return pose


@motion("dead-bug", view="side", center=(0, 0.08, 0.38), scale=2.23)
def dead_bug(rig, stage, name):
    def pose(t):
        rig.start(hip=(0, 0, 0.128), pitch=-90, look=8)
        for side in SIDES:
            reach = t if side == 1 else 0
            ankle = (0.103 * side, -0.375 - 0.407 * reach, 0.517 - 0.363 * reach)
            rig.leg(side, ankle, foot=around("X", -32 - 56 * reach), pole=UP)
            shoulder = rig.point(joint("shoulder", side))
            arc = math.radians(90 * t if side == -1 else 0)
            direction = Vector((0, math.sin(arc), math.cos(arc)))
            rig.arm(side, shoulder + 0.493 * direction, FRONT, direction, (side, 0, 0))
    return pose


@motion("crunches", "sit-up", "original-partial-sit-up", "original-tuck-crunch",
        view="side", center=(0, 0, 0.42), scale=1.76)
def crunch(rig, stage, name):
    full = name == "sit-up"
    partial = name == "original-partial-sit-up"
    tuck = name == "original-tuck-crunch"

    def pose(t):
        pitch = -74 + 59 * t if partial else -90 + (67 if full else 9) * t
        rig.start(hip=(0, 0, 0.128), pitch=pitch, chest_pitch=(21 if partial else 26) * t, look=7 + t * 7)
        for side in SIDES:
            ankle = (0.137 * side, -0.55 + 0.16 * t if tuck else -0.46, 0.21 + 0.15 * t if tuck else 0.073)
            rig.leg(side, ankle, foot=around("X", -37) if tuck else ID, pole=UP)
            neck = rig.current["head"].translation
            wrist = neck + rig.chest @ Vector((0.075 * side, -0.020, 0.043))
            rig.arm(side, wrist, (side, -0.15, 0.75), rig.chest @ UP, rig.chest @ Vector((-side, 0, 0)))
    return pose


@motion("calf-raises", "dumbbell-calf-raise", "original-standing-barbell-calf-raise", view="side")
def calf_raise(rig, stage, name):
    use_bar = name.startswith("original")
    dumbbell = name.startswith("dumbbell")
    weights = stage.barbell(0.22, 1.50) if use_bar else stage.dumbbells(0.052) if dumbbell else None
    rig.set_grip(int(bool(weights)))
    box("Calf block", (0, -0.122, 0.060), (0.53, 0.25, 0.12), stage.frame)

    def pose(t):
        turn = -13 + 42 * t
        foot = around("X", turn)
        toes = Vector((0, -0.11, 0.143))
        ankle_shift = -(foot @ (joint("toe", 1) - joint("ankle", 1)))
        heel = toes + ankle_shift
        lift = heel.z - 0.073
        rig.start(hip=(0, heel.y - 0.034, 0.863 + lift))
        palms = []
        for side in SIDES:
            rig.leg(side, heel + Vector((side * 0.174, 0, 0)), foot=foot)
            shoulder = rig.point(joint("shoulder", side))
            if use_bar:
                wrist = (side * 0.326, shoulder.y + 0.125, shoulder.z - 0.025)
                _, palm = rig.arm(side, wrist, (0.45 * side, 0.3, -1), UP, (-side, 0, 0))
                palms.append(palm)
            else:
                wrist = shoulder + Vector((0.046 * side, -0.019, -0.487))
                _, palm = rig.arm(side, wrist, (0.2 * side, 1, 0), -UP, FRONT)
                if dumbbell:
                    weights(side, palm, FRONT)
        if use_bar:
            weights((palms[0] + palms[1]) / 2, palms[1] - palms[0])
    return pose


@motion("leg-extension", "original-single-leg-leg-extension", "leg-curl",
        view="side", center=(0, 0, 0.70), scale=1.90)
def seated_legs(rig, stage, name):
    lying = name == "leg-curl"
    unilateral = name.startswith("original")
    base = 0.53 if lying else 0.49
    pad_y = -0.21 if lying else 0.09
    box("Machine padding", (0, pad_y, base), (0.40, 0.99 if lying else 0.65, 0.08), stage.pad)
    if not lying:
        box("Back support", (0, 0.22, 0.74), (0.38, 0.085, 0.52), stage.pad)
    box("Machine base", (0, 0.043, 0.039), (0.68, 1.20, 0.078), stage.frame)
    box("Machine stand", (0, 0.043, base / 2), (0.12, 0.38, base), stage.frame)
    lever = cylinder("Resistance lever", 0.36, 0.020, stage.frame)
    roller = cylinder("Ankle roller", 0.46 if not unilateral else 0.20, 0.049, stage.rubber)
    handles = [cylinder("Support grip", .14, .018, stage.rubber) for _ in SIDES]
    for side in SIDES:
        box("Grip support", (side * (.229 if lying else .252), -.645 if lying else .001,
                            .283 if lying else .273),
            (.035, .047, .437 if lying else .417), stage.frame)
    rig.set_grip(.83)

    def pose(t):
        rig.start(hip=(0, 0.02 if lying else 0.083, 0.678 if lying else 0.601),
                  pitch=91 if lying else -5, look=-15 if lying else 0)
        anchors = []
        for side, handle in zip(SIDES, handles):
            start = rig.point(joint("hip", side))
            thigh = (joint("hip", side) - joint("knee", side)).length
            shin = (joint("knee", side) - joint("ankle", side)).length
            knee = start + thigh * (Vector((0.06 * side, 1, -0.088)) if lying else Vector((0.15 * side, -1, -0.14))).normalized()
            amount = 0 if unilateral and side < 0 else t
            edge = math.radians((2 + 94 * amount) if lying else (-9 + 99 * amount))
            direction = Vector((0, math.cos(edge), math.sin(edge))) if lying else Vector((0, -math.sin(edge), -math.cos(edge)))
            end = knee + shin * direction
            foot = around("X", (49 + 98 * amount) if lying else (-18 - 54 * amount))
            rig.leg_pose(side, knee, end, foot)
            if not unilateral or side == 1:
                anchors.append((knee, end - direction * 0.045))
            if lying:
                target = Vector((side * 0.229, -0.63, 0.59))
            else:
                target = Vector((side * 0.252, 0.016, 0.57))
            _, palm = rig.arm(side, target, Vector((side, 0.9, -0.03)), FRONT, UP)
            place(handle, palm, UP)
        knee = sum((pair[0] for pair in anchors), Vector()) / len(anchors)
        center = sum((pair[1] for pair in anchors), Vector()) / len(anchors)
        angle = math.radians((2 + 94 * t) if lying else (-9 + 99 * t))
        normal = Vector((0, -math.sin(angle), math.cos(angle))) if lying else Vector((0, -math.cos(angle), math.sin(angle)))
        center += .102 * normal
        lever_x = 0.264
        a = Vector((lever_x, knee.y, knee.z))
        b = Vector((lever_x, center.y, center.z))
        place(lever, (a + b) / 2, b - a)
        place(roller, center, (1, 0, 0))
    return pose


def cable_station(stage, pulley_y, seated):
    side_x = 0.57
    top = 2.02
    box("Cable tower", (side_x, pulley_y + 0.15, 1.02), (0.16, 0.38, 2.04), stage.frame)
    box("Tower foot", (side_x, pulley_y + 0.15, 0.033), (0.48, 0.67, 0.066), stage.frame)
    box("Overhead crossbar", (side_x / 2, pulley_y, top), (side_x + 0.19, 0.085, 0.092), stage.frame)
    cable = cylinder("Tensioned cable", 1, 0.005, stage.steel)
    if seated:
        box("Pulldown seat", (0, 0.04, 0.432), (0.42, 0.45, 0.078), stage.pad)
        box("Seat support", (0, 0.04, 0.22), (0.13, 0.13, 0.44), stage.frame)
        box("Thigh restraint", (0, -0.235, 0.676), (0.44, 0.13, 0.093), stage.pad)

    def update(handle):
        anchor = Vector((0, pulley_y, top - 0.042))
        handle = Vector(handle)
        cable.scale.z = (anchor - handle).length
        place(cable, (handle + anchor) / 2, anchor - handle)
    return update


@motion("lat-pulldown", "reverse-grip-lat-pulldown", center=(0, -0.04, 1.03), scale=2.24)
def pulldown(rig, stage, name):
    cable = cable_station(stage, -0.151, seated=True)
    bar = cylinder("Pulldown bar", 0.85 if name == "lat-pulldown" else 0.57, 0.014, stage.steel)
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, 0.055, 0.587), pitch=-3 - 12 * t, look=7 * t)
        palms = []
        for side in SIDES:
            rig.leg(side, (0.19 * side, -0.373, 0.073), pole=UP)
            shoulder = rig.point(joint("shoulder", side))
            width = 0.343 if name == "lat-pulldown" else 0.23
            wrist = (side * width, -0.155, shoulder.z + 0.429 - 0.396 * t)
            _, palm = rig.arm(side, wrist, (side, 0.32, -1), UP, ((-side if name == "lat-pulldown" else side), 0, 0))
            palms.append(palm)
        center = (palms[0] + palms[1]) / 2
        place(bar, center, palms[1] - palms[0])
        cable(center)
    return pose


@motion("tricep-pushdowns", center=(0, -0.1, 1.0), scale=2.24)
def pushdown(rig, stage, name):
    cable = cable_station(stage, -0.32, seated=False)
    bar = cylinder("Short pushdown bar", 0.53, 0.014, stage.steel)
    rig.set_grip(1)

    def pose(t):
        standing(rig, pitch=7)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            elbow = shoulder + Vector((side * 0.008, -0.045, -0.251))
            angle = math.radians(103 - 93 * t)
            direction = Vector((0, -math.sin(angle), -math.cos(angle)))
            wrist = elbow + 0.247 * direction
            _, palm = rig.arm(side, wrist, elbow - shoulder, direction, (-side, 0, 0))
            palms.append(palm)
        center = (palms[0] + palms[1]) / 2
        place(bar, center, palms[1] - palms[0])
        cable(center)
    return pose


@motion("dips", "bench-dip", view="side", center=(0, 0, 1.0), scale=2.28)
def dip(rig, stage, name):
    bench = name == "bench-dip"
    if bench:
        box("Bench pad", (0, 0.12, 0.46), (0.58, 0.53, 0.075), stage.pad)
        box("Bench support", (0, 0.12, 0.21), (0.38, 0.32, 0.42), stage.frame)
    else:
        rig.set_grip(1)
        for side in SIDES:
            rail = cylinder("Dip bar", 0.74, 0.018, stage.steel)
            place(rail, (side * 0.28, 0, 1.1), FRONT)
            box("Dip upright", (side * 0.28, 0.19, 0.55), (0.056, 0.056, 1.10), stage.frame)
            box("Dip station foot", (side * 0.28, 0.19, 0.026), (0.31, 0.56, 0.052), stage.frame)

    def pose(t):
        if bench:
            rig.start(hip=(0, -0.26 - 0.036 * t, 0.556 - 0.27 * t), pitch=4 + 6 * t)
        else:
            rig.start(hip=(0, 0.019 + 0.051 * t, 1.195 - 0.329 * t), pitch=9 + 15 * t, look=-10 * t)
        for side in SIDES:
            if bench:
                rig.leg(side, (side * 0.135, -0.94, 0.073), pole=UP)
                rig.arm(side, (side * 0.218, -0.104, 0.539), (side * 0.16, 1, 0.5), FRONT, (-side, 0, 0))
            else:
                rig.leg(side, (side * 0.137, 0.324 + 0.14 * t, 0.505 - 0.229 * t), foot=around("X", 39), pole=FRONT)
                rig.arm(side, (side * 0.28 - 0.023 * side, -0.03, 1.187), (side * 0.16, 1, 0.34), -UP, FRONT)
    return pose


@motion("dumbbell-row", view="side", center=(0, 0, 0.78), scale=2.06)
def supported_row(rig, stage, name):
    load = stage.dumbbells(0.058, sides=(1,))
    rig.set_grip(1, side=1)
    stage.bench(base=0.47)

    def pose(t):
        rig.start(hip=(0.14, 0.36, 0.708), pitch=82, look=-19)
        rig.leg(1, (0.411, 0.46, 0.073))
        hip = rig.point(joint("hip", -1))
        thigh = (joint("knee", -1) - joint("hip", -1)).length
        shin = (joint("ankle", -1) - joint("knee", -1)).length
        knee = hip + Vector((-.049, .364, -.158)).normalized() * thigh
        heel = knee + Vector((.015, .385, .052)).normalized() * shin
        rig.leg_pose(-1, knee, heel, around("X", 66))
        rig.arm(-1, (-0.085, -0.104, 0.50), (-0.5, 1, 0.42), FRONT, (1, 0, 0))
        shoulder = rig.point(joint("shoulder", 1))
        wrist = shoulder + Vector((0.045, 0.025 + 0.183 * t, -0.485 + 0.31 * t))
        _, palm = rig.arm(1, wrist, (0.25, 1, 0.31), -UP, FRONT)
        load(1, palm, FRONT)
    return pose




@motion("leg-press", "leg-press-calf-raise", view="profile", center=(0, -0.16, 0.64), scale=2.16)
def sled_press(rig, stage, name):
    calf = name == "leg-press-calf-raise"
    rail = Vector((0, -0.74, 0.67)).normalized()
    plate = box("Foot plate", (0, 0, 0), (0.58, 0.42, 0.071), stage.pad)
    box("Seat", (0, 0.165, 0.435), (0.42, 0.34, 0.08), stage.pad)
    back = box("Back pad", (0, 0.385, 0.58), (0.42, 0.59, 0.08), stage.pad)
    back.rotation_euler.x = math.radians(43)
    for side in SIDES:
        box("Base rail", (side * 0.37, -0.156, 0.033), (0.063, 1.48, 0.066), stage.frame)
        track = cylinder("Inclined guide", 1.24, 0.025, stage.steel)
        place(track, (side * 0.375, -0.36, 0.68), rail)
        box("Guide support", (side * 0.375, -0.72, 0.54), (0.054, 0.056, 1.08), stage.frame)
    load = [cylinder("Sled plate", 0.061, 0.092, stage.rubber) for _ in SIDES]
    handles = [cylinder("Side grip", .137, .017, stage.rubber) for _ in SIDES]
    for side in SIDES:
        box("Seat rail", (side * .29, .21, .036), (.20, .43, .072), stage.frame)
        box("Grip support", (side * .262, .14, .246), (.035, .047, .390), stage.frame)
    rig.set_grip(.90)

    def pose(t):
        rig.start(hip=(0, 0.145, 0.557), pitch=-48, look=6)
        turn = -131 - (22 * t if calf else 0)
        foot = around("X", turn)
        heel = Vector((0, -0.590, 0.829)) - rail * (0 if calf else 0.273 * t)
        for side, handle in zip(SIDES, handles):
            ankle = heel + Vector((side * 0.17, 0, 0))
            rig.leg(side, ankle, foot=foot, pole=UP)
            _, palm = rig.arm(side, (side * 0.262, 0.156, 0.522), (0.24 * side, 1, 0), FRONT, UP)
            place(handle, palm, UP)
        contact = foot @ Vector((0, -0.096 if calf else -0.048, -0.071))
        plate.location = heel + contact + rail * 0.028
        plate.rotation_euler.x = math.radians(48)
        for side, weight in zip(SIDES, load):
            place(weight, plate.location + rail * 0.102 + Vector((side * 0.335, 0, 0)), (1, 0, 0))
    return pose


@motion("hip-abduction-machine", "hip-adduction-machine", center=(0, -0.05, 0.78), scale=1.77)
def hip_machine(rig, stage, name):
    abduct = name == "hip-abduction-machine"
    box("Machine seat", (0, 0.126, 0.445), (0.45, 0.47, 0.085), stage.pad)
    back = box("Backrest", (0, 0.248, 0.69), (0.43, 0.075, 0.43), stage.pad)
    back.rotation_euler.x = math.radians(-5)
    box("Machine base", (0, -0.085, 0.033), (0.94, 1.08, 0.066), stage.frame)
    box("Seat support", (0, 0.114, 0.21), (0.25, 0.23, 0.42), stage.frame)
    pads = [box("Thigh pad", (0, 0, 0), (0.083 if abduct else .048, 0.16, 0.168), stage.pad) for _ in SIDES]
    rests = [box("Foot support", (0, 0, 0), (0.13, 0.21, 0.049), stage.frame) for _ in SIDES]
    hinges = [cylinder("Pivot arm", 1, 0.018, stage.steel) for _ in SIDES]
    posts = [cylinder("Pad support", 1, 0.019, stage.steel) for _ in SIDES]

    def pose(t):
        rig.start(hip=(0, 0.099, 0.573), pitch=-6)
        angle = math.radians(8 + 44 * (t if abduct else 1 - t))
        for side, pad, rest, hinge, post in zip(SIDES, pads, rests, hinges, posts):
            thigh_length = (joint("knee", side) - joint("hip", side)).length
            shin_length = (joint("ankle", side) - joint("knee", side)).length
            lateral = Vector((side * math.sin(angle), -math.cos(angle), -0.105)).normalized()
            knee = rig.point(joint("hip", side)) + thigh_length * lateral
            heel = knee + shin_length * Vector((side * 0.033, -0.08, -1)).normalized()
            foot = around("Z", math.degrees(angle) * side)
            rig.leg_pose(side, knee, heel, foot)
            rig.arm(side, (side * 0.243, 0.059, 0.505), (0.55 * side, 1, 0.22), FRONT, (-side, 0, 0))
            normal = Vector((side * math.cos(angle), math.sin(angle), 0))
            pad.location = knee - 0.067 * lateral + (0.11 if abduct else -0.132) * normal
            if not abduct:
                pad.location.x = side * max(.028, side * pad.location.x)
            pad.rotation_euler.z = math.degrees(angle) * side
            rest.location = heel + foot @ Vector((0, -0.033, -0.09))
            rest.rotation_euler.z = math.degrees(angle) * side
            pivot = Vector((0.088 * side, 0.11, 0.11))
            base = rest.location + Vector((0, 0, -0.02))
            pad_base = pad.location + Vector((0, 0, -0.058))
            hinge.scale.z = (base - pivot).length
            place(hinge, (base + pivot) / 2, base - pivot)
            post.scale.z = (pad_base - base).length
            place(post, (pad_base + base) / 2, pad_base - base)
    return pose
