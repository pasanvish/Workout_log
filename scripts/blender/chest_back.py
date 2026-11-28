"""Chest and back exercise choreography."""
import math

from mathutils import Quaternion, Vector

from equipment import ball, beam, bench_body, cable, finish_arm, kettlebells, midpoint, plate_machine, platform, seat, smith
from poses import motion, standing
from rig import FRONT, SIDES, UP, around, joint, smoothstep
from stage import box, cylinder, place


@motion("smith-machine-bench-press", "original-smith-machine-decline-bench-press",
        "smith-machine-incline-press", "original-smith-machine-close-grip-bench-press",
        view="bench", center=(0, .33, .83), scale=2.23)
@motion("decline-bench-press", "dumbbell-decline-press", "original-one-arm-kettlebell-floor-press",
        view="bench", center=(0, .18, .64), scale=2.13)
def bench_variations(rig, stage, name):
    decline = "decline" in name
    floor = "floor" in name
    incline = -16 if decline else 28 if "incline" in name else 0
    guided = "smith-machine" in name
    height = .61 if decline else .47
    y = .50 if incline >= 0 else .46
    if guided:
        smith(stage, y, 1.66)
    if not floor:
        stage.bench(incline, height)
    if decline:
        box("Ankle support", (0, -.44, .423), (.52, .105, .094), stage.pad)
    bar = stage.barbell(.26, 1.70) if "dumbbell" not in name and not floor else None
    dumbbell = stage.dumbbells() if "dumbbell" in name else None
    bell = kettlebells(stage, sides=(1,), drop=.154) if floor else None
    rig.set_grip(1)
    if floor:
        rig.set_grip(0, -1)

    def pose(t):
        z = .13 if floor else height + .105
        hip = (0, .065, z)
        bench_body(rig, incline, hip)
        if floor or decline:
            for side in SIDES:
                rig.leg(side, (side * .18, -.45, .073 if floor else .52), pole=UP,
                        foot=around("X", 20 if decline else 0))
        hands = []
        for side in SIDES:
            if floor and side < 0:
                finish_arm(rig, side, (-.16, .13, .29), (-1, -1, 0), (0, -1, 0))
                continue
            shoulder = rig.point(joint("shoulder", side))
            grip = .20 if "close" in name else .30
            x = side * (grip if bar else .235 + .067 * t)
            wrist = (x, y if guided else shoulder.y - .035 - .115 * t,
                     shoulder.z + .452 - (.274 if floor else .331) * t)
            palm = finish_arm(rig, side, wrist, (side, -.76, -.37), UP)
            hands.append(palm)
            if dumbbell:
                dumbbell(side, palm)
            if bell:
                bell(side, palm, hang=(0, .69, -.72))
        if bar:
            bar(midpoint(*hands))
    return pose


FLIES = {
    "dumbbell-fly": ("dumbbell", 0), "incline-dumbbell-fly": ("dumbbell", 27),
    "original-decline-dumbbell-flyes": ("dumbbell", -17),
    "original-one-arm-flat-bench-dumbbell-flye": ("single", 0),
    "original-flat-bench-cable-flyes": ("bench cable", 0), "original-incline-cable-flye": ("bench cable", 27),
    "cable-crossover": ("cable fly", 0), "cable-fly-low-to-high": ("low cable", 0),
    "original-band-chest-fly": ("band", 0), "pec-deck": ("pec", 0),
    "standing-cable-chest-press": ("cable press", 0), "original-incline-cable-chest-press": ("bench press", 27),
    "dumbbell-pullover": ("pullover", 0),
}


@motion(*FLIES, view="bench", center=(0, .11, .85), scale=2.42)
def chest_cables(rig, stage, name):
    kind, incline = FLIES[name]
    bench = kind in ("dumbbell", "single", "bench cable", "bench press", "pullover")
    machine = kind == "pec"
    lower = kind == "low cable"
    offset = .62 if incline < 0 else .48
    if bench:
        stage.bench(incline, offset)
    if machine:
        seat(stage, back=True)
    dumbbell = stage.dumbbells(sides=(1,) if kind in ("single", "pullover") else SIDES) if kind in ("dumbbell", "single", "pullover") else None
    machine_lever = plate_machine(stage, (0, .20, 1.43 if kind == "pec" else 1.17)) if machine else None
    cable_y = .43 if bench else .21
    cables = {side: cable(stage, (side * .80, cable_y, .23 if lower or bench else 1.46),
                           band=kind == "band") for side in SIDES} if not dumbbell and not machine else {}
    rig.set_grip(1)
    if kind == "single":
        rig.set_grip(0, -1)

    def pose(t):
        if bench:
            bench_body(rig, incline, (0, .04, offset + .101))
        elif machine:
            rig.start(hip=(0, .055, .57), pitch=-incline * .35)
            for side in SIDES:
                rig.leg(side, (side * .18, -.39, .073), pole=UP)
        else:
            rig.start(hip=(0, -.045, .83), pitch=8)
            rig.leg(-1, (-.155, .27, .082))
            rig.leg(1, (.155, -.25, .073))
        if kind == "pullover":
            shoulder = rig.point(joint("shoulder", 1))
            angle = math.radians(3 + 83 * t)
            direction = Vector((0, math.sin(angle), math.cos(angle)))
            hands = [finish_arm(rig, side, Vector((side * .049, shoulder.y, shoulder.z)) + .464 * direction,
                                (side * .28, -.4, 1), direction) for side in SIDES]
            dumbbell(1, midpoint(*hands), direction)
            return
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if kind == "single" and side < 0:
                finish_arm(rig, side, (-.11, .18, shoulder.z + .13), (-1, -1, 0), FRONT)
                continue
            angle = math.radians(69 * (1 - t))
            opening = math.sin(angle)
            closing = math.cos(angle)
            press = kind in ("cable press", "bench press")
            if bench:
                spread = .23 + .06 * (1 - t) if press else .11 + .51 * opening
                wrist = (side * spread, shoulder.y - .06 - .073 * (1 - t),
                         shoulder.z + (.14 + .32 * t if press else .14 + .32 * closing))
                finger = UP
                pole = (side, -.54, -.45)
            else:
                spread = .24 if press else .085 + .58 * opening
                wrist = (side * spread, shoulder.y - (.145 + .325 * t if press else .06 + .409 * closing),
                         shoulder.z - (.42 - .40 * t if lower else .095))
                finger = FRONT
                pole = (side, .36, -.30)
            palm = finish_arm(rig, side, wrist, pole, finger, (side, 0, 0) if bench else UP)
            if machine_lever:
                machine_lever(side, palm, UP)
            if dumbbell:
                dumbbell(side, palm, (0, 1, 0))
            if cables:
                cables[side](palm)
    return pose


@motion("neutral-grip-pull-up", center=(0, 0, 1.18), scale=2.42)
def neutral_pullup(rig, stage, name):
    stage.pullup_station(2.08)
    for side in SIDES:
        place(cylinder("Neutral grip rail", .29, .017, stage.steel), (side * .215, -.085, 2.08), FRONT)
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, .035 + .07 * t, 1.105 + .42 * t), pitch=-8 * t)
        for side in SIDES:
            rig.leg(side, (side * .133, .12 + .15 * t, .348 + .42 * t), pole=FRONT)
            finish_arm(rig, side, (side * .23, -.095, 1.99), (side, .26, -1), UP, FRONT)
    return pose


@motion("close-grip-lat-pulldown", "original-v-bar-pulldown", "original-one-arm-lat-pulldown",
        "straight-arm-pulldown", center=(0, -.035, 1.10), scale=2.41)
def pulldown_variations(rig, stage, name):
    straight = name.startswith("straight")
    single = "one-arm" in name
    v_bar = name == "original-v-bar-pulldown"
    feeder = cable(stage, (.60, -.31, 2.10))
    box("Pulley crossbeam", (.30, -.31, 2.10), (.68, .075, .075), stage.frame)
    if not straight:
        seat(stage)
        box("Thigh restraint", (0, -.20, .672), (.49, .12, .091), stage.pad)
    handle = beam("Cable bar", stage.steel, .014)
    grips = {side: beam("Neutral handle", stage.rubber, .019) for side in SIDES}
    rig.set_grip(1)
    if single:
        rig.set_grip(0, -1)

    def pose(t):
        if straight:
            standing(rig, hip=(0, .082, .817), pitch=16)
        else:
            rig.start(hip=(0, .065, .579), pitch=-5 - 8 * t)
            for side in SIDES:
                rig.leg(side, (.17 * side, -.36, .073), pole=UP)
        hands = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if single and side < 0:
                finish_arm(rig, side, (-.324, -.134, .751), (-1, .05, -.2), FRONT)
                continue
            if straight:
                angle = math.radians(102 * (1 - t) + 5)
                direction = math.sin(angle) * FRONT - math.cos(angle) * UP
                _, palm = rig.elbow_hinge(side, shoulder + .244 * direction - .025 * UP,
                                          direction, (-side, 0, 0))
                hands.append(palm)
                continue
            else:
                direction = UP
                width = .215 if single else .082 if v_bar else .133
                wrist = (side * width, -.237, shoulder.z + .455 - .425 * t)
                across = FRONT
            palm = finish_arm(rig, side, wrist, (side, .44, -1), direction, across)
            hands.append(palm)
            if not straight:
                grips[side](palm + .061 * FRONT, palm - .061 * FRONT)
        center = sum(hands, Vector()) / len(hands)
        if v_bar:
            tip = center + Vector((0, .077, .054))
            for grip, palm in zip(grips.values(), hands):
                grip(tip, palm)
            handle(tip, tip + .055 * UP)
        elif len(hands) == 2:
            handle(*hands)
        else:
            handle(center, center + .081 * UP)
        feeder((.18, -.31, 2.08), center)
    return pose


ROWS = {
    "t-bar-row": "landmine", "original-one-arm-long-bar-row": "single landmine",
    "seated-cable-row": "seated cable", "original-seated-one-arm-cable-pulley-rows": "single cable",
    "chest-supported-dumbbell-row": "supported dumbbell", "original-incline-bench-pull": "supported bar",
    "chest-supported-t-bar-row": "supported landmine", "machine-high-row": "high machine",
    "original-leverage-iso-row": "iso machine", "original-two-arm-kettlebell-row": "kettlebell",
    "original-alternating-kettlebell-row": "alternating kettlebell",
    "original-barbell-rear-delt-row": "wide bar",
}


@motion(*ROWS, view="side", center=(0, -.13, .83), scale=2.18)
def rowing(rig, stage, name):
    kind = ROWS[name]
    seated = "cable" in kind or "machine" in kind
    supported = "supported" in kind
    landmine = "landmine" in kind
    alternate = "alternating" in kind
    single = "single" in kind
    bell = kettlebells(stage) if "kettlebell" in kind else None
    bar = stage.barbell(.22, 1.42) if kind in ("supported bar", "wide bar") else None
    weights = stage.dumbbells() if kind == "supported dumbbell" else None
    if supported:
        back = box("Inclined row bench", (0, -.183, .737), (.259, .47, .083), stage.pad)
        back.rotation_euler.x = -.541
        box("Bench support", (0, -.21, .322), (.105, .16, .644), stage.frame)
    if seated:
        seat(stage, .47, .19)
    if landmine:
        shaft = beam("Angled bar", stage.steel, .016)
        handle = beam("Row handle", stage.steel, .017)
        disc = cylinder("Landmine weight", .083, .138, stage.rubber)
    if "cable" in kind:
        feeder = cable(stage, (0, -.98, .21))
        bar_handle = beam("Cable handle", stage.steel, .017)
        box("Foot platform", (0, -.52, .025), (.55, .23, .05), stage.frame)
    machine = plate_machine(stage, (0, -.51, 1.54 if kind == "high machine" else 1.24),
                            pad=(0, -.21, .87)) if "machine" in kind else None
    rig.set_grip(1)
    if single:
        rig.set_grip(0, -1)

    def pose(t):
        if seated:
            rig.start(hip=(0, .17, .58), pitch=7 if machine else 2)
            for side in SIDES:
                rig.leg(side, (side * .16, -.48, .119), pole=UP)
        else:
            hip = (0, .28, .62) if supported else (0, .16, .78)
            standing(rig, hip=hip, pitch=59 if supported else 64, look=-16)
        hands = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if single and side < 0:
                finish_arm(rig, side, (-.17, -.10, .60), (-1, .45, -.3), FRONT)
                continue
            amount = t if not alternate or side == 1 else 1 - t
            width = .32 if kind == "wide bar" else .235 if kind == "supported landmine" else .10 if landmine else .293 if bell or kind == "supported bar" else .22
            if seated:
                wrist = (side * width, shoulder.y - .47 + .36 * amount,
                         shoulder.z + .20 * (1 - amount) - .08 if kind == "high machine" else shoulder.z - .245)
                finger = FRONT
            else:
                wrist = (side * width, shoulder.y + .035 + .23 * amount,
                         shoulder.z - .468 + .268 * amount)
                finger = -UP
            palm = finish_arm(rig, side, wrist, (.43 * side, 1, -.31), finger, FRONT if bell or weights else None)
            hands.append(palm)
            if bell:
                bell(side, palm, FRONT, (side * .39, 0, -.92))
            if weights:
                weights(side, palm, FRONT)
            if machine:
                machine(side, palm)
        if bar:
            bar(midpoint(*hands))
        if landmine:
            center = sum(hands, Vector()) / len(hands)
            pivot = Vector((0, .91, .10))
            axis = (center - pivot).normalized()
            end = center + .32 * axis
            shaft(pivot, end)
            place(disc, center + .225 * axis, axis)
            handle(center + Vector((-.14, 0, 0)), center + Vector((.14, 0, 0)))
        if "cable" in kind:
            center = sum(hands, Vector()) / len(hands)
            feeder(center)
            bar_handle(center + Vector((-.095, 0, 0)), center + Vector((.095, 0, 0)))
    return pose


@motion("shrugs", "dumbbell-shrug", "cable-shrug", "original-leverage-shrug")
def shrug(rig, stage, name):
    rail = "leverage" in name
    wired = name == "cable-shrug"
    hands = stage.dumbbells() if name == "dumbbell-shrug" else None
    bar = stage.barbell(.28, 1.63) if name == "shrugs" else None
    cables = {side: cable(stage, (side * .54, -.08, .10), tower=False) for side in SIDES} if wired else {}
    machine = plate_machine(stage, (0, -.54, .53)) if rail else None
    rig.set_grip(1)

    def pose(t):
        standing(rig)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            wrist = shoulder + Vector((side * .059, -.10 if bar else -.035, -.475 + .073 * t))
            # Raise the shoulder girdle with the arm so the elbows do not generate the rep.
            rig.raise_shoulder(side, .073 * t)
            palm = finish_arm(rig, side, wrist, (side * .11, 1, 0), -UP, FRONT if hands or wired else None)
            palms.append(palm)
            if hands:
                hands(side, palm, FRONT)
            if wired:
                cables[side](palm)
            if machine:
                machine(side, palm, FRONT)
        if bar:
            bar(midpoint(*palms))
    return pose


@motion("face-pulls", view="side")
def face_pull(rig, stage, name):
    rope = cable(stage, (0, -1.16, 1.55))
    left = beam("Rope end", stage.rubber, .011)
    right = beam("Rope end", stage.rubber, .011)
    rig.set_grip(1)

    def pose(t):
        standing(rig)
        palms = [finish_arm(rig, side, (side * (.07 + .23 * t), -.496 + .342 * t, 1.43 + .075 * t),
                            (side, .31, -.22), (.40 * side, -.94, .13), UP) for side in SIDES]
        center = midpoint(*palms) + FRONT * .12
        rope(center)
        left(center, palms[0])
        right(center, palms[1])
    return pose


@motion("original-clock-push-up", "original-stability-ball-push-up",
        view="side", center=(0, .03, .46), scale=2.30)
def pushup_variations(rig, stage, name):
    clock = "clock" in name
    balance = "stability-ball" in name
    if balance:
        exercise_ball = ball(stage, .24, "Stability ball")
        exercise_ball.location = (0, -.48, .24)

    def pose(t):
        pitch = (51 if balance else 69) + 17 * t
        heel = Vector((0, .78, .112))
        hip = heel + around("X", pitch) @ Vector((0, -.008, .785))
        hip.x -= .19 * t if clock else 0
        rig.start(hip=hip, pitch=pitch, look=-8)
        for side in SIDES:
            rig.leg(side, (side * .104, .78, .112),
                    foot=around("X", 37), pole=-UP)
            x = .163 if balance else .24 + (.12 * t if clock else 0)
            target = (side * x, -.382 if balance else -.421, .456 if balance else .080)
            across = (-side * .76, 0, .65) if balance else (-side, 0, 0)
            finish_arm(rig, side, target, (.51 * side, 1, .19), FRONT, across)
    return pose


@motion("original-push-up-to-side-plank", view="side", center=(0, -.02, .66), scale=2.51)
def pushup_to_side_plank(rig, stage, name):
    left_hand = Vector((-.215, -.48, .074))
    right_hand = Vector((.215, -.48, .074))
    toe = around("X", 39).to_quaternion()
    edge = around("Y", -78).to_quaternion()

    def pose(t):
        rep = min(1, t / .49)
        lower = math.sin(math.pi * rep) ** 2
        turn_progress = min(1, max(0, (t - .49) / .51))
        turn = smoothstep(turn_progress / .43) * smoothstep((1 - turn_progress) / .43)
        roll = math.pi / 2 * turn
        # Rotate about the long axis. The supporting shoulder stays over its original palm.
        shoulder_height = .542 - .295 * lower
        heel_height = .161 + .016 * turn
        low, high = 61.0, 89.6
        for _ in range(12):
            trial = (low + high) / 2
            angle = math.radians(trial)
            floor_shoulder = heel_height + 1.274 * math.cos(angle) - .194 * math.sin(roll) * math.sin(angle)
            if floor_shoulder > shoulder_height:
                low = trial
            else:
                high = trial
        pitch = (low + high) / 2
        yaw = math.degrees(math.asin((left_hand.x + .215 * math.cos(roll)) / 1.274))
        body_axis = around("Z", yaw) @ around("X", pitch) @ UP
        heel_center = Vector((0, .748, heel_height))
        hip = heel_center + .799 * body_axis
        rig.start(hip=hip, pitch=pitch, yaw=yaw, roll=math.degrees(roll), look=-7)
        foot = toe.slerp(edge, turn).to_matrix()
        for side in SIDES:
            ankle = heel_center + Vector((side * .096 * math.cos(roll), .022 * (side == 1) * turn,
                                         (.024 if side == 1 else -.099) * math.sin(roll)))
            rig.straight_leg(side, ankle, foot)
        finish_arm(rig, -1, left_hand, (-.31, .93, .23), FRONT, (1, 0, 0))
        shoulder = rig.point(joint("shoulder", 1))
        sweep = Quaternion(Vector((0, 1, 0)), -math.pi * turn)
        reach = sweep @ -UP
        radius = .449 + .052 * turn
        wrist = right_hand.lerp(shoulder + radius * reach, smoothstep(turn / .18))
        direction = FRONT.lerp(reach, smoothstep(turn / .43))
        across = sweep @ Vector((-1, 0, 0))
        finish_arm(rig, 1, wrist, (.51, .87, .23 - .56 * turn), direction, across)
    return pose


@motion("medicine-ball-chest-pass", "medicine-ball-slam", view="side", center=(0, -.54, 1.12), scale=2.83)
def ball_throw(rig, stage, name):
    slam = name.endswith("slam")
    weight = ball(stage, .119)
    rig.set_grip(.25)

    def pose(t):
        push = min(t / .52, 1)
        flight = max(0, (t - .52) / .48)
        standing(rig, hip=(0, -.13 * push, .864 - (.29 * push if slam else .031 * push)),
                 pitch=57 * push if slam else 10 * push, look=-13 * push if slam else 0)
        carry = Vector((0, -.14 - .43 * push, 1.94 - 1.12 * push if slam else 1.25))
        palms = []
        for side in SIDES:
            hand = carry + Vector((side * .142, .010, .066 if slam else 0))
            palms.append(finish_arm(rig, side, hand, (side * .71, .47, -.63), -UP if slam else FRONT,
                                    (0, 1, 0) if slam else UP))
        held = midpoint(*palms) + (.079 * FRONT if not slam else -.055 * UP)
        if slam:
            weight.location = (held.x, held.y - .08 * flight, max(.13, held.z - .70 * flight))
        else:
            weight.location = held + Vector((0, -1.04 * flight, -.20 * flight ** 2))
    return pose


@motion("good-morning", "original-band-good-morning", "back-extensions", "reverse-hyperextension",
        view="side", center=(0, .05, .77), scale=2.10)
def hip_hinge(rig, stage, name):
    supported = name in ("back-extensions", "reverse-hyperextension")
    reverse = name == "reverse-hyperextension"
    band = name.startswith("original")
    rig.set_grip(1 if not supported else 0)
    straps = {side: cable(stage, (side * .16, .015, .065), band=True) for side in SIDES} if band else {}
    bar = stage.barbell(.23, 1.52) if not supported and not band else None
    if supported:
        box("Extension pad", (0, -.22 if reverse else .11, .53), (.46, .71 if reverse else .29, .11), stage.pad)
        box("Frame", (0, -.31 if reverse else .065, .25), (.085, .28, .49), stage.frame)
        if not reverse:
            box("Ankle support", (0, .65, .088), (.47, .11, .09), stage.pad)

    def pose(t):
        if reverse:
            rig.start(hip=(0, .135, .67), pitch=90, look=-17)
        elif supported:
            rig.start(hip=(0, .11, .67), pitch=54 + 65 * t, look=-14)
        else:
            standing(rig, hip=(0, .026 + .25 * t, .857 - .095 * t), pitch=5 + 60 * t, look=-18 * t)
        palms = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if reverse:
                angle = math.radians(66 * (1 - t))
                start = rig.point(joint("hip", side))
                ankle = start + .784 * Vector((.04 * side, math.cos(angle), -math.sin(angle)))
                rig.leg(side, ankle, foot=around("X", 75 * t), pole=-UP)
                finish_arm(rig, side, (side * .304, -.51, .575), (side, .5, -.4), FRONT)
            elif supported:
                rig.leg(side, (side * .15, .62, .215), foot=around("X", 25), pole=FRONT)
                wrist = rig.point(Vector((.075 * -side, -.095, 1.27)))
                finish_arm(rig, side, wrist, (side, -.75, -.28), UP)
            else:
                wrist = shoulder + rig.chest @ Vector((.118 * side, .111, -.033))
                palm = finish_arm(rig, side, wrist, (.59 * side, .38, -1), rig.chest @ UP)
                palms.append(palm)
                if band:
                    straps[side](palm)
        if bar:
            bar(midpoint(*palms))
    return pose


@motion("chest-press-machine", "plate-loaded-incline-chest-press",
        view="three-quarter", center=(0, -.15, .83), scale=2.18)
def machine_chest_press(rig, stage, name):
    """Drive two rigid arms around fixed pivots, with the palms attached to the vertical grips."""
    incline = name == "plate-loaded-incline-chest-press"
    backrest = seat(stage, height=.45, y=.085, back=True)
    if incline:
        backrest.location.y += .053
        backrest.rotation_euler.x = math.radians(12)
    box("Machine crossmember", (0, -.57, .055), (1.61, .102, .105), stage.frame)
    box("Resistance tower" if not incline else "Upper frame support",
        (.72, .275, .568), (.17, .276, 1.07), stage.frame)
    axis = around("X", -17 if incline else 0) @ UP
    pivots = {}
    levers = {}
    handles = {}
    weights = {}
    for side in SIDES:
        pivot = pivots[side] = Vector((side * .72, -.56, 1.018 if incline else .981))
        box("Frame upright", (pivot.x, pivot.y, .51), (.093, .118, 1.02), stage.frame)
        box("Base rail", (pivot.x, -.203, .046), (.112, .94, .088), stage.frame)
        place(cylinder("Fixed press pivot", .135, .054, stage.steel), pivot, axis)
        levers[side] = (beam("Press lever", stage.frame, .029), beam("Grip mount", stage.frame, .027))
        handles[side] = beam("Neutral grip", stage.rubber, .017)
        if incline:
            weights[side] = cylinder("Plate load", .052, .113, stage.rubber)
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, .072, .565), pitch=-11 if incline else 0)
        for side in SIDES:
            rig.leg(side, (side * .184, -.392, .073), pole=UP)
            pivot = pivots[side]
            start = Vector((side * .332, -.177, pivot.z))
            angle = math.radians(44 * side * t)
            rotation = Quaternion(axis, angle)
            grip = pivot + rotation @ (start - pivot)
            grip_axis = rotation @ UP
            hand_direction = rotation @ FRONT
            hand_direction = (FRONT * .76 + .24 * hand_direction).normalized()
            outward = side * grip_axis.cross(hand_direction).normalized()
            wrist = grip - .088 * hand_direction + .023 * outward
            finish_arm(rig, side, wrist, (side * .79, .49, -.57), hand_direction, grip_axis)
            joint = pivot + rotation @ Vector((-.14 * side, .30, .004))
            lever, mount = levers[side]
            lever(pivot, joint)
            mount(joint, grip - .081 * grip_axis)
            handles[side](grip - .083 * grip_axis, grip + .092 * grip_axis)
            if incline:
                place(weights[side], joint + Vector((.085 * side, 0, -.015)), (1, 0, 0))
    return pose
