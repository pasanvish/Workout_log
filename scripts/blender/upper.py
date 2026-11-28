"""Shoulder, elbow and wrist motions with equipment-specific grip paths."""
import math

from mathutils import Vector

from equipment import arc, beam, bench_body, cable, finish_arm, kettlebells, midpoint, plate_machine, seat, smith
from poses import motion, standing
from rig import FRONT, SIDES, UP, around, joint, smoothstep
from stage import box


RAISES = {
    "machine-lateral-raise": "machine", "cable-front-raise": "front cable",
    "original-front-incline-dumbbell-raise": "incline dumbbell",
    "band-lateral-raise": "band", "original-cable-seated-lateral-raise": "seated cable",
    "rear-delt-fly": "rear dumbbell", "original-band-reverse-fly": "rear band",
    "original-cable-rear-delt-fly": "rear cable", "reverse-pec-deck": "rear machine",
    "band-pull-apart": "pull apart",
}


@motion(*RAISES, center=(0, -.04, .96), scale=2.18)
def raises(rig, stage, name):
    kind = RAISES[name]
    reverse = "rear" in kind
    pull = kind == "pull apart"
    front = "front" in kind or "incline" in kind
    seated = kind in ("machine", "rear machine", "seated cable")
    bell = stage.dumbbells() if "dumbbell" in kind else None
    is_band = "band" in kind
    machine = plate_machine(stage, (0, -.60 if reverse else .21, 1.20)) if "machine" in kind else None
    anchors = {side: cable(stage, ((-.69 if reverse else .60) * side, -.60 if reverse else .11,
                                    1.31 if reverse else .095), band=is_band)
               for side in SIDES} if is_band or "cable" in kind else {}
    spanning = beam("Resistance band", stage.rubber, .014) if pull else None
    rig.set_grip(1)
    if seated:
        seat(stage, back=not reverse)
        if reverse:
            box("Chest support", (0, -.19, .83), (.36, .11, .40), stage.pad)
    if "incline" in kind:
        stage.bench(48)

    def pose(t):
        if "incline" in kind:
            bench_body(rig, 48)
        elif seated:
            rig.start(hip=(0, .08, .578), pitch=6 if reverse else 0)
            for side in SIDES:
                rig.leg(side, (side * .18, -.385, .073), pole=UP)
        else:
            standing(rig, hip=(0, .125 if kind == "rear dumbbell" else .025, .777 if kind == "rear dumbbell" else .865),
                     pitch=57 if kind == "rear dumbbell" else 1, look=-17 if kind == "rear dumbbell" else 0)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if reverse or pull:
                amount = math.radians(12 + (76 if pull else 82) * t)
                direction = Vector((side * math.sin(amount), -math.cos(amount), -.11 if pull else -.19))
                if kind == "rear dumbbell":
                    direction = Vector((side * math.sin(amount), .044 * t, -math.cos(amount)))
            else:
                plane = FRONT if front else Vector((side * .973, -.23, 0))
                direction = arc(4 + 84 * t, plane)
            length = .377 if kind == "machine" else .485
            wrist = shoulder + length * direction
            across = Vector((1, 0, 0)) if front else FRONT
            unit = direction.normalized()
            across = across - unit * across.dot(unit)
            if across.length < .15:
                across = UP
            if kind == "incline dumbbell":
                _, palm = rig.elbow_hinge(side, shoulder + .24 * direction + Vector((.074 * side, 0, 0)),
                                          direction, across * side)
            else:
                palm = finish_arm(rig, side, wrist, (side * .42, .35, -.67), direction, across * side)
            palms.append(palm)
            if bell:
                bell(side, palm, across)
            if machine:
                machine(side, palm, UP if reverse else FRONT)
            if anchors:
                anchors[side](palm)
        if spanning:
            spanning(*palms)
    return pose


PRESSES = {
    "arnold-press": "arnold", "original-alternating-cable-shoulder-press": "alternating cable",
    "original-alternating-kettlebell-press": "alternating bell", "single-arm-overhead-press": "single dumbbell",
    "original-kettlebell-seated-press": "seated bell", "original-seated-barbell-military-press": "seated bar",
    "original-two-arm-kettlebell-military-press": "bell", "band-overhead-press": "band",
    "smith-machine-overhead-press": "smith bar", "shoulder-press-machine": "machine",
}


@motion(*PRESSES, center=(0, 0, 1.10), scale=2.30)
def shoulder_press(rig, stage, name):
    kind = PRESSES[name]
    seated = kind.startswith("seated") or kind in ("smith bar", "machine", "arnold")
    single = kind.startswith("single")
    dumbbells = stage.dumbbells(sides=(1,) if single else SIDES) if kind in ("arnold", "single dumbbell") else None
    kettles = kettlebells(stage) if "bell" in kind and kind != "single dumbbell" else None
    bar = stage.barbell(.24, 1.64) if "bar" in kind else None
    lines = {side: cable(stage, (side * .36, .028, .081), band=kind == "band") for side in SIDES} if kind in (
        "band", "alternating cable") else {}
    machine = plate_machine(stage, (0, .19, 1.41)) if kind == "machine" else None
    if seated:
        seat(stage, back=True)
    if kind == "smith bar":
        smith(stage, -.105, 1.95)
    rig.set_grip(1)
    if single:
        rig.set_grip(0, -1)

    def pose(t):
        if seated:
            rig.start(hip=(0, .075, .57))
            for side in SIDES:
                rig.leg(side, (side * .18, -.36, .073), pole=UP)
        else:
            standing(rig)
        grips = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            amount = 1 - t if side < 0 and "alternating" in kind else t
            if single and side < 0:
                finish_arm(rig, side, (-.18, -.09, .923), (-1, .75, -.1), -UP)
                continue
            width = .272 if bar else .30 - .086 * amount
            if kind == "arnold":
                width -= .162 * (1 - amount) ** 2
            path_y = -.108 if kind == "smith bar" else -.199 + .213 * smoothstep((amount - .59) / .41) if bar else -.138 + .14 * amount
            wrist = (side * width, path_y, shoulder.z - .068 + .554 * amount)
            across = Vector((-side, 0, 0))
            if kind == "arnold":
                across = around("Z", 172 * (1 - amount)) @ across
            grip = finish_arm(rig, side, wrist, (side, -.44, -1), UP, across)
            grips.append(grip)
            if dumbbells:
                dumbbells(side, grip, across)
            if kettles:
                kettles(side, grip, across, Vector((.71 * side, .36, -.51)))
            if lines:
                lines[side](grip)
            if machine:
                machine(side, grip)
        if bar:
            bar(midpoint(*grips))
    return pose


@motion("original-kettlebell-halo", center=(0, -.03, 1.08), scale=2.30)
@motion("upright-row", "band-external-rotation", "cable-external-rotation",
        center=(0, -.03, .94), scale=2.15)
def shoulder_detail(rig, stage, name):
    row = name == "upright-row"
    halo = "halo" in name
    barrel = stage.barbell(.216, 1.37) if row else None
    kettles = kettlebells(stage, sides=(1,)) if halo else None
    if not row and not halo:
        is_band = name.startswith("band")
        if is_band:
            box("Band anchor post", (-.74, -.12, .67), (.092, .092, 1.34), stage.frame)
        wire = cable(stage, (-.74, -.12, 1.06), band=is_band)
    rig.set_grip(1)
    if not row and not halo:
        rig.set_grip(0, -1)

    def pose(t):
        standing(rig)
        palms = []
        for side in SIDES:
            if row:
                wrist = (.173 * side, -.14, .847 + .38 * t)
                palm = finish_arm(rig, side, wrist, (side, -.24, 1), -UP)
            elif halo:
                phase = 2 * math.pi * t
                center = Vector((.194 * math.sin(phase), -.225 * math.cos(phase), 1.56 + .165 * (1 - math.cos(phase)) / 2))
                axis = Vector((math.cos(phase), math.sin(phase), 0))
                palm = finish_arm(rig, side, center + side * .070 * axis, (.82 * side, .41, -.46), UP, axis * -side)
            elif side == 1:
                shoulder = rig.point(joint("shoulder", side))
                elbow = shoulder + Vector((.021, .011, -.253))
                angle = math.radians(-29 + 100 * t)
                direction = Vector((math.sin(angle), -math.cos(angle), .025))
                palm = finish_arm(rig, side, elbow + .247 * direction, elbow - shoulder, direction, UP)
                wire(palm)
            else:
                palm = finish_arm(rig, side, (-.246, -.047, .88), (-.21, 1, -.04), -UP)
            palms.append(palm)
        if barrel:
            barrel(midpoint(*palms))
        if kettles:
            kettles(1, midpoint(*palms), palms[1] - palms[0], UP)
    return pose


CURLS = {
    "preacher-curl": "preacher bar", "incline-dumbbell-curl": "incline dumbbell", "cable-curl": "cable bar",
    "concentration-curl": "concentration", "rope-hammer-curl": "rope",
    "original-cable-preacher-curl": "preacher cable", "cross-body-hammer-curl": "cross",
    "original-drag-curl": "drag bar", "original-incline-hammer-curls": "incline hammer",
    "machine-preacher-curl": "preacher machine", "dumbbell-preacher-curl": "preacher single",
    "original-overhead-cable-curl": "overhead cable", "original-reverse-cable-curl": "reverse cable",
    "spider-curl": "spider", "zottman-curl": "zottman",
}


@motion(*CURLS, view="side", center=(0, 0, .88), scale=2.15)
def curl_variations(rig, stage, name):
    kind = CURLS[name]
    preacher = "preacher" in kind
    incline = kind.startswith("incline")
    spider = kind == "spider"
    single = kind in ("concentration", "preacher single", "cross")
    seated = preacher or kind == "concentration"
    overhead = kind == "overhead cable"
    wired = "cable" in kind or kind == "rope"
    bar = stage.barbell(.205, 1.23, curved=preacher) if kind in ("preacher bar", "drag bar") else None
    wire = cable(stage, (0, -.86, .129)) if wired and not overhead else None
    wire_handle = beam("Cable attachment", stage.steel, .015) if wire else None
    high_wires = {side: cable(stage, (side * .90, -.07, 1.48)) for side in SIDES} if overhead else {}
    weights = stage.dumbbells(.049, sides=(1,) if single else SIDES) if not (bar or wired or kind == "preacher machine") else None
    lever = plate_machine(stage, (0, -.50, .80)) if kind == "preacher machine" else None
    if seated:
        seat(stage)
    if preacher:
        pad = box("Preacher pad", (0, -.245, .759), (.43, .33, .08), stage.pad)
        pad.rotation_euler.x = .74
    if incline:
        stage.bench(49)
    if spider:
        pad = box("Incline support", (0, -.23, .93), (.28, .49, .09), stage.pad)
        pad.rotation_euler.x = -.75
        box("Support frame", (0, -.29, .39), (.12, .20, .78), stage.frame)
    rig.set_grip(1)
    if single:
        rig.set_grip(0, -1)

    def pose(t):
        if incline:
            bench_body(rig, 49)
        elif seated:
            rig.start(hip=(0, .095, .58), pitch=27 if kind == "concentration" else 14)
            for side in SIDES:
                rig.leg(side, (side * (.24 if kind == "concentration" else .18), -.39, .073), pole=UP)
        elif spider:
            standing(rig, hip=(0, .11, .78), pitch=48, look=-14)
        else:
            standing(rig)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if single and side < 0:
                finish_arm(rig, side, (side * .19, -.19, .55) if seated else (-.245, -.049, .87),
                           (-.47, .71, -.12), FRONT if seated else -UP)
                continue
            elbow = shoulder + Vector((side * (.081 if incline else .025),
                                       -.156 if preacher else -.091 if kind == "concentration" else .14 * t if kind == "drag bar" else -.020,
                                       -.231))
            angle = 10 + 116 * t
            if preacher:
                angle += 22
            direction = arc(angle)
            if kind == "cross":
                direction = (direction + Vector((-.62 * t, 0, 0))).normalized()
            if overhead:
                elbow = shoulder + Vector((side * .24, -.033, .041))
                angle = math.radians(2 + 129 * t)
                direction = Vector((side * math.cos(angle), 0, math.sin(angle)))
            axis = (Vector((0, direction.z, -direction.y)) if kind in ("cross", "incline hammer", "rope")
                    else Vector((1, 0, 0)))
            if overhead:
                axis = FRONT
            roll = 180 * smoothstep((t - .62) / .38) if kind == "zottman" else 0
            axis = around("Y", roll * side) @ axis
            direction = direction.normalized()
            _, palm = rig.elbow_hinge(side, elbow, direction, axis * (side if kind == "reverse cable" else -side))
            palms.append(palm)
            if lever:
                lever(side, palm)
            if weights:
                weights(side, palm, axis)
            if overhead:
                high_wires[side](palm)
        if bar:
            bar(midpoint(*palms))
        if wire:
            center = midpoint(*palms)
            wire(center + FRONT * .045)
            wire_handle(*palms)
    return pose


TRICEPS = {
    "skull-crushers": "lying ez", "overhead-triceps-extension": "overhead dumbbell", "dumbbell-kickback": "kickback",
    "original-band-skull-crusher": "lying band", "original-cable-lying-triceps-extension": "lying cable",
    "cable-overhead-triceps-extension": "overhead cable", "original-decline-dumbbell-triceps-extension": "decline dumbbell",
    "original-decline-ez-bar-triceps-extension": "decline ez", "seated-dip-machine": "dip machine",
    "original-incline-barbell-triceps-extension": "incline bar", "original-kettlebell-overhead-triceps-extension": "overhead bell",
    "dumbbell-skull-crusher": "lying dumbbell", "machine-triceps-extension": "extension machine",
    "original-tate-press": "tate", "original-triceps-pushdown-rope-attachment": "pushdown rope",
}


@motion(*TRICEPS, view="side", center=(0, .09, .88), scale=2.15)
def triceps_variations(rig, stage, name):
    kind = TRICEPS[name]
    lying = any(word in kind for word in ("lying", "decline", "incline", "tate"))
    overhead = kind.startswith("overhead")
    incline = -16 if "decline" in kind else 27 if "incline" in kind else 0
    base = .61 if incline < 0 else .47
    bar = stage.barbell(.19, 1.24, curved="ez" in kind) if "ez" in kind or "bar" in kind else None
    shared = kind in ("overhead dumbbell", "overhead bell")
    dumbbells = stage.dumbbells(.052, sides=(1,) if shared or kind == "kickback" else SIDES) if "dumbbell" in kind or kind in ("tate", "kickback") else None
    kettle = kettlebells(stage, sides=(1,)) if kind == "overhead bell" else None
    wire = cable(stage, (0, .95 if lying or overhead else -.37, .24 if lying or overhead else 1.95),
                 band="band" in kind) if "cable" in kind or "band" in kind or "rope" in kind else None
    grips = [beam("Cable grip", stage.rubber, .012) for _ in SIDES] if wire else []
    machine = plate_machine(stage, (0, .25 if kind == "dip machine" else -.46, .81)) if "machine" in kind else None
    if lying or kind == "kickback":
        stage.bench(incline, base)
        if incline < 0:
            box("Ankle support", (0, -.44, .423), (.52, .105, .094), stage.pad)
    if machine:
        seat(stage, back=kind == "dip machine")
        if kind == "extension machine":
            pad = box("Upper arm pad", (0, -.244, .807), (.45, .29, .085), stage.pad)
            pad.rotation_euler.x = .48
    rig.set_grip(1 if not machine else .85)
    if kind == "kickback":
        rig.set_grip(0, -1)

    def pose(t):
        if lying:
            bench_body(rig, incline, (0, .067, base + .108))
            if incline < 0:
                for side in SIDES:
                    rig.leg(side, (side * .18, -.45, .52), pole=UP, foot=around("X", 20))
        elif kind == "kickback":
            standing(rig, hip=(.21, .30, .76), pitch=75, look=-21)
        elif machine:
            rig.start(hip=(0, .077, .576), pitch=9 if kind == "extension machine" else 0)
            for side in SIDES:
                rig.leg(side, (side * .169, -.37, .073), pole=UP)
        else:
            standing(rig, pitch=13 if kind == "overhead cable" else 5)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if kind == "kickback" and side < 0:
                finish_arm(rig, side, (-.084, -.16, .505), (-1, .37, -.23), FRONT)
                continue
            if kind == "dip machine":
                wrist = (side * .291, -.176 + .092 * t, .881 - .26 * t)
                palm = finish_arm(rig, side, wrist, (side * .26, .98, -.31), -UP, FRONT)
                palms.append(palm)
                machine(side, palm, FRONT)
                continue
            if lying:
                elbow = shoulder + Vector((.045 * side, .034, .247))
                theta = math.radians(114 * (1 - t))
                direction = Vector((-.51 * side * (1 - t), -.66 * math.sin(theta), math.cos(theta))) if kind == "tate" else Vector((0, math.sin(theta), math.cos(theta)))
            elif overhead:
                gap = .055 if shared else .092
                elbow = Vector((side * gap, shoulder.y - .07, shoulder.z + .223))
                theta = math.radians(124 * (1 - t))
                direction = Vector((0, math.sin(theta), math.cos(theta)))
            elif kind == "kickback":
                elbow = shoulder + Vector((.038, .25, .022))
                theta = math.radians(81 * (1 - t))
                direction = Vector((0, math.cos(theta), -math.sin(theta)))
            elif kind == "extension machine":
                elbow = shoulder + Vector((side * .026, -.212, -.133))
                direction = arc(136 - 103 * t)
            else:
                elbow = shoulder + Vector((.039 * side, -.046, -.249))
                direction = arc(108 - 99 * t)
            direction = direction.normalized()
            neutral = kind in ("kickback", "pushdown rope")
            axis = Vector((0, direction.z, -direction.y)) if neutral else Vector((1, 0, 0))
            _, palm = rig.elbow_hinge(side, elbow, direction, axis * -side)
            palms.append(palm)
            if machine:
                machine(side, palm, axis)
            if dumbbells and not shared:
                dumbbells(side, palm, axis)
        center = sum(palms, Vector()) / len(palms)
        if bar:
            bar(center)
        if dumbbells and shared:
            dumbbells(1, center, (1, 0, 0))
        if kettle:
            kettle(1, center, hang=(0, .49, -.87))
        if wire:
            node = center + Vector((0, .073 if overhead or lying else -.074, .059))
            wire(node)
            for grip, palm in zip(grips, palms):
                grip(node, palm)
    return pose


@motion("dumbbell-reverse-wrist-curl", "dumbbell-wrist-curl",
        view="side", center=(0, 0, .63), scale=1.63)
def wrist_curl(rig, stage, name):
    reverse = "reverse" in name
    box("Forearm support bench", (0, -.337, .433), (.62, .44, .078), stage.pad)
    box("Bench frame", (0, -.29, .207), (.31, .27, .414), stage.frame)
    weights = stage.dumbbells(.043)
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, .069, .495), pitch=31)
        for side in SIDES:
            rig.leg(side, (side * .153, .439, .062), foot=around("X", 74), pole=FRONT)
            direction = around("X", (29 - 61 * t) if reverse else (42 - 86 * t)) @ FRONT
            palm = finish_arm(rig, side, (side * .153, -.568, .518), (side * .16, .44, -1), direction,
                              (side if reverse else -side, 0, 0))
            weights(side, palm)
    return pose
