"""Core work and transitions through supported poses."""
import math

from mathutils import Vector

from equipment import ball, beam, cable, finish_arm, kettlebells, midpoint, plate_machine, seat
from poses import motion, standing
from rig import FRONT, ID, SIDES, UP, around, joint, smoothstep
from stage import box


CRUNCHES = {
    "bicycle-crunch": "bicycle", "heel-taps": "heels", "original-cross-body-crunch": "cross",
    "decline-crunch": "decline", "original-decline-reverse-crunch": "decline reverse",
    "original-elbow-to-knee": "elbow", "stability-ball-crunch": "ball",
    "original-flat-bench-leg-pull-in": "bench pull", "original-frog-sit-ups": "frog",
    "v-up": "jackknife", "original-medicine-ball-crunch": "medicine",
    "oblique-crunch": "oblique", "original-side-jackknife": "side jackknife",
}


@motion("original-flat-bench-leg-pull-in", view="side", center=(0, -.03, .75), scale=2.14)
@motion(*(name for name in CRUNCHES if name != "original-flat-bench-leg-pull-in"),
        view="side", center=(0, -.03, .51), scale=2.14)
def crunch_variations(rig, stage, name):
    kind = CRUNCHES[name]
    knees_up = kind in ("bicycle", "cross", "elbow", "jackknife", "decline reverse", "bench pull", "side jackknife")
    bench = kind in ("decline", "decline reverse", "bench pull")
    side_lying = kind in ("oblique", "side jackknife")
    if bench:
        stage.bench(-17 if "decline" in kind else 0, .59 if "decline" in kind else .47)
    if kind == "decline":
        box("Ankle restraint", (0, -.43, .534), (.44, .13, .09), stage.pad)
    if kind == "ball":
        support = ball(stage, .264, "Stability ball")
        support.location = (0, .22, .261)
    if kind == "medicine":
        medicine_ball = ball(stage, .108)
        rig.set_grip(.18)

    def pose(t):
        z = .13
        pitch = -90
        chest = 22 * t
        hip = Vector((0, 0, z))
        yaw, tilt, chest_yaw, chest_tilt = 0, 0, 0, 0
        if kind == "bicycle":
            chest_yaw = 25 * (2 * t - 1)
            chest = 19
        elif kind == "cross":
            chest_yaw = 34 * math.sin(2 * math.pi * t)
            chest = 22 * abs(math.sin(2 * math.pi * t))
        elif kind == "elbow":
            chest_yaw = -37 * t
        elif kind == "heels":
            chest_tilt = 26 * (2 * t - 1)
            chest = 15
        elif side_lying:
            tilt = -77
            chest_tilt = 36 * t
        elif kind == "ball":
            hip = Vector((0, -.045, .435 + .042 * t))
            pitch = -105 + 25 * t
        elif kind == "bench pull":
            hip = Vector((0, -.102 + .085 * t, .585))
            pitch = -53 + 34 * t
        elif "decline" in kind:
            hip = Vector((0, .073, .685 + (.03 * t if kind == "decline reverse" else 0)))
            pitch = -106 if kind != "decline reverse" else -106 - 14 * t
        elif kind in ("frog", "jackknife"):
            pitch = -90 + (61 if kind == "frog" else 48) * t
        rig.start(hip=hip, pitch=pitch, tilt=tilt, yaw=yaw, look=7 + 7 * t,
                  chest_pitch=chest, chest_yaw=chest_yaw, chest_tilt=chest_tilt)
        palms = []
        for side in SIDES:
            if side_lying:
                raise_top = .37 * t if side == 1 and kind == "side jackknife" else 0
                rig.leg(side, (.044 * side, -.69 + .32 * raise_top, .12 + .086 * (side > 0) + raise_top),
                        foot=around("X", -72), pole=UP)
            elif kind == "frog":
                rig.leg(side, (side * .08, -.39, .072), foot=around("Z", (side * 37)), pole=(side, 0, .40))
            elif knees_up:
                if kind == "bicycle":
                    amount = t if side > 0 else 1 - t
                    ankle = (side * .13, -.746 + .363 * amount, .18 + .36 * amount)
                elif kind == "jackknife":
                    ankle = (side * .124, -.765 + .302 * t, .125 + .53 * t)
                elif kind == "bench pull":
                    ankle = (side * .118, -.862 + .43 * t, .51 + .24 * t)
                elif kind == "decline reverse":
                    ankle = (side * .124, -.51 + .30 * t, .733 + .31 * t)
                elif kind == "elbow":
                    if side > 0:
                        rig.leg(side, (-.087, -.354, .372), foot=around("Z", -31), pole=(1, .15, .67))
                        ankle = None
                    else:
                        ankle = (-.145, -.43, .073)
                else:
                    amount = max(0, side * math.sin(2 * math.pi * t))
                    ankle = (side * .145, -.448 + .215 * amount, .073 + .32 * amount)
                if ankle is not None:
                    foot_angle = -57 * smoothstep((ankle[2] - .10) / .25)
                    rig.leg(side, ankle, foot=around("X", foot_angle), pole=UP)
            else:
                rig.leg(side, (.16 * side, -.45, .622 if kind == "decline" else .073), pole=UP)
            shoulder = rig.point(joint("shoulder", side))
            neck = rig.current["head"].translation
            if kind in ("heels", "jackknife"):
                wrist = (side * .189, -.086 - .22 * t, .051 + (.43 * t if kind == "jackknife" else 0))
                direction = FRONT
            elif kind == "bench pull":
                wrist = (side * .15, .09, .572)
                direction = FRONT
            elif kind == "medicine":
                wrist = (side * .148, shoulder.y - .14, shoulder.z + .235)
                direction = UP
            elif side_lying and side < 0:
                wrist = (-.38, .327, .045)
                direction = (-1, 0, 0)
            else:
                wrist = neck + rig.chest @ Vector((side * .074, -.014, .053))
                direction = rig.chest @ UP
            across = (0, 1, 0) if kind == "medicine" or (side_lying and side < 0) else None
            palms.append(finish_arm(rig, side, wrist, (side, -.11, .75), direction, across))
        if kind == "medicine":
            medicine_ball.location = midpoint(*palms)
    return pose


@motion("russian-twists", "original-medicine-ball-full-twist", "horizontal-cable-twist", "cable-woodchopper",
        "pallof-press", "original-barbell-side-bend", "dumbbell-side-bend",
        center=(0, 0, .93), scale=2.23)
def twist(rig, stage, name):
    seated = name in ("russian-twists", "horizontal-cable-twist")
    chop = name == "cable-woodchopper"
    press = name == "pallof-press"
    bend = "side-bend" in name
    wire = cable(stage, (-.87, -.048, 1.82 if chop else .84 if seated else 1.12)) if "cable" in name or press else None
    handle = beam("Cable grip", stage.rubber, .014) if wire else None
    medicine = ball(stage, .118) if "medicine" in name else None
    bar = stage.barbell(.21, 1.53) if "barbell" in name else None
    dumbbell = stage.dumbbells(sides=(1,)) if "dumbbell" in name else None
    rig.set_grip(1 if wire or bar or dumbbell else .18 if medicine else 0)
    if dumbbell:
        rig.set_grip(0, -1)
    if name == "horizontal-cable-twist":
        seat(stage, height=.40, y=.08)

    def pose(t):
        turn = (-36 + 72 * t) if seated or medicine else 41 - 90 * t if chop else 0
        hip = (0, .057, .509 if wire else .139) if seated else (0, .025, .863)
        rig.start(hip=hip, pitch=-24 if seated and not wire else 0, tilt=12 * t if bend else 0,
                  chest_tilt=16 * t if bend else 0, chest_yaw=turn)
        for side in SIDES:
            rig.leg(side, (side * .163, -.37, .081) if seated else None, pole=UP if seated else FRONT)
        palms = []
        reach = .105 + .313 * t if press else .285
        chest = rig.point(Vector((0, -.022, 1.249 if not chop else 1.53 - .58 * t)))
        center = chest + rig.chest @ (FRONT * reach)
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if bar:
                wrist = shoulder + rig.chest @ Vector((side * .13, .121, -.034))
                palm = finish_arm(rig, side, wrist, (side, .26, -1), rig.chest @ UP)
            elif dumbbell:
                wrist = shoulder + rig.chest @ Vector((side * .056, -.042, -.475 if side > 0 else -.24))
                palm = finish_arm(rig, side, wrist, (side, .35, -.85), -UP, FRONT)
                if side > 0:
                    dumbbell(side, palm, FRONT)
            else:
                palm = finish_arm(rig, side, center + rig.chest @ Vector((side * (.151 if medicine else .077), 0, 0)),
                                  (side * .48, .71, -.63), rig.chest @ FRONT, UP)
            palms.append(palm)
        if bar:
            bar(midpoint(*palms), palms[1] - palms[0])
        if medicine:
            medicine.location = midpoint(*palms) + rig.chest @ (.046 * FRONT)
        if wire:
            handle(*palms)
            wire(midpoint(*palms))
    return pose


@motion("machine-abdominal-crunch", "cable-crunch", view="side", center=(0, -.09, .90), scale=2.18)
def resisted_crunch(rig, stage, name):
    machine = name == "machine-abdominal-crunch"
    if machine:
        seat(stage, back=True)
        resistance = plate_machine(stage, (0, .11, 1.17))
    else:
        wire = cable(stage, (0, -.71, 1.96))
        ropes = [beam("Rope end", stage.rubber, .012) for _ in SIDES]
    rig.set_grip(1)

    def pose(t):
        rig.start(hip=(0, .044, .577 if machine else .50), pitch=6 + 23 * t, chest_pitch=27 * t, look=5 * t)
        for side in SIDES:
            rig.leg(side, (side * .165, -.37 if machine else .44, .073 if machine else .056),
                    pole=UP if machine else FRONT, foot=ID if machine else around("X", 69))
        neck = rig.current["head"].translation
        palms = []
        for side in SIDES:
            wrist = neck + rig.chest @ Vector((side * .119, -.125, -.035))
            palm = finish_arm(rig, side, wrist, (side * .25, -.68, -.64), rig.chest @ UP)
            palms.append(palm)
            if machine:
                resistance(side, palm)
        if not machine:
            mid = midpoint(*palms) + Vector((0, -.124, .094))
            for line, palm in zip(ropes, palms):
                line(mid, palm)
            wire(mid)
    return pose


@motion("original-barbell-ab-rollout", "stability-ball-knee-tuck", view="side", center=(0, -.02, .49), scale=2.31)
def straight_core(rig, stage, name):
    rolling = "rollout" in name
    if rolling:
        bars = stage.barbell(.224, .98)
        rig.set_grip(1)
    else:
        exercise_ball = ball(stage, .241, "Stability ball")

    def pose(t):
        if rolling:
            rig.start(hip=(0, .307 - .436 * t, .502 - .228 * t), pitch=43 + 38 * t, look=-11 * t)
            grip_y = -.237 - .579 * t
        else:
            rig.start(hip=(0, .067 + .16 * t, .423 + .157 * t), pitch=86 - 15 * t, look=-10)
            exercise_ball.location = (0, .80 - .38 * t, .242)
        palms = []
        for side in SIDES:
            ankle = (side * .142, .633, .058) if rolling else (side * .126, .824 - .344 * t, .516 - .01 * t)
            foot_angle = 61 - 20 * t if rolling else 164 - 24 * t
            rig.leg(side, ankle, foot=around("X", foot_angle), pole=FRONT if rolling else UP)
            wrist = (side * .199, grip_y, .168) if rolling else (side * .21, -.42, .077)
            palm = finish_arm(rig, side, wrist, (side * .21, .85, .25), -UP if rolling else FRONT)
            palms.append(palm)
        if rolling:
            center = midpoint(*palms)
            center.z = .113
            bars(center)
    return pose


@motion("turkish-get-up", view="side", center=(0, -.12, .99), scale=2.60)
def get_up(rig, stage, name):
    weight = kettlebells(stage, sides=(1,))
    rig.set_grip(1, 1)
    # Hips, trunk angles, free wrist and sweeping ankle through sit-up, bridge, kneel and stand.
    poses = [
        ((-.07, .14, .13), (-90, 0, 0), (-.45, .43, .061), (-.28, -.68, .072)),
        ((-.04, .117, .21), (-57, -16, -13), (-.43, .33, .075), (-.29, -.64, .074)),
        ((-.02, .07, .425), (-29, -24, -17), (-.43, .285, .078), (-.31, -.54, .083)),
        ((.025, -.001, .468), (-6, -15, -26), (-.36, .16, .112), (-.21, .43, .092)),
        ((.02, -.063, .546), (6, 0, 0), (-.235, -.09, .823), (-.20, .41, .092)),
        ((.04, -.28, .845), (4, 0, 0), (-.251, -.28, .88), (-.157, -.279, .073)),
    ]

    def pose(t):
        index = min(int(t * (len(poses) - 1)), len(poses) - 2)
        fraction = smoothstep(t * (len(poses) - 1) - index)
        hip, angles, support, heel = [Vector(a).lerp(Vector(b), fraction) for a, b in zip(poses[index], poses[index + 1])]
        rig.start(hip=hip, pitch=angles.x, yaw=angles.y, tilt=angles.z)
        rig.leg(1, (.196, -.328, .073), pole=UP if t < .51 else FRONT)
        rig.leg(-1, heel, foot=around("X", 54 * max(0, 1 - abs(t - .63) / .3)), pole=FRONT)
        finish_arm(rig, -1, support, (-.37, .64, .22), FRONT if t < .63 else -UP, (1, 0, 0))
        shoulder = rig.point(joint("shoulder", 1))
        palm = finish_arm(rig, 1, shoulder + Vector((.028, -.027, .481)), (1, .28, -.37), UP)
        weight(1, palm, (1, 0, 0), (.52, .60, -.66))
    return pose
