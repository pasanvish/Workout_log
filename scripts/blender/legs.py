"""Squats, hinges, step variations and lower-body equipment."""
import math

from mathutils import Vector

from equipment import ball, beam, cable, finish_arm, kettlebells, midpoint, platform, seat, smith
from poses import motion, standing
from rig import FRONT, ID, SIDES, UP, around, joint, smoothstep
from stage import box, cylinder, place


@motion("jump-squat", view="side", center=(0, 0, 1.10), scale=2.50)
@motion("band-squat", "original-barbell-hack-squat", "original-box-squat",
        "original-front-squats-with-two-kettlebells", "hack-squat", "smith-machine-squat",
        view="side", center=(0, 0, .97), scale=2.26)
def squats(rig, stage, name):
    machine = name == "hack-squat"
    hack = name == "original-barbell-hack-squat"
    guided = name == "smith-machine-squat"
    jump = name == "jump-squat"
    bells = kettlebells(stage) if "kettlebells" in name else None
    band = name == "band-squat"
    weights = stage.barbell(.31, 1.61) if hack or guided or name == "original-box-squat" else None
    rig.set_grip(0 if jump or machine else 1)
    if name == "original-box-squat":
        platform(stage, .405, (0, .29), .54, .43)
    if guided:
        smith(stage, .13, 1.90)
    straps = {side: cable(stage, (side * .17, -.045, .027), band=True) for side in SIDES} if band else {}
    if machine:
        direction = Vector((0, .48, .88))
        for side in SIDES:
            rail = beam("Sled guide", stage.steel, .023)
            rail((side * .42, .07, .21), (side * .42, .78, 1.51))
            box("Machine foot", (side * .42, .25, .038), (.10, 1.47, .076), stage.frame)
        platform(stage, .115, (0, -.27), .64, .53)
        pad = box("Moving back pad", (0, 0, 0), (.38, .73, .071), stage.pad)
        shoulders = [box("Shoulder pad", (0, 0, 0), (.134, .25, .109), stage.pad) for _ in SIDES]

    def pose(t):
        depth = t
        airtime = 0
        if jump:
            depth = 1 - smoothstep(t / .63)
            airtime = .23 * smoothstep((t - .58) / .42)
        if machine:
            hip = Vector((0, .33, .942)) - .36 * t * direction
            rig.start(hip=hip, pitch=-25, look=17)
            pad.location = hip + Vector((0, .21, .22))
            pad.rotation_euler.x = .44
        else:
            hip_y = .027 + (.13 if guided else .22) * depth
            hip = (0, hip_y, .863 - (.365 if not hack else .32) * depth + airtime)
            rig.start(hip=hip, pitch=6 + (13 if bells or guided else 25) * depth,
                      look=-10 * depth)
        palms = []
        for i, side in enumerate(SIDES):
            rig.leg(side, (side * .173, -.215, .187) if machine else (side * .173, .056, .073 + airtime),
                    pole=FRONT)
            shoulder = rig.point(joint("shoulder", side))
            if machine:
                shoulders[i].location = shoulder + Vector((.024 * side, .012, .037))
                wrist = shoulder + Vector((.075 * side, -.144, -.062))
                direction_hand = UP
            elif jump:
                reach = smoothstep(t / .70)
                wrist = shoulder + Vector((.026 * side, .405 * (1 - reach), -.19 + .63 * reach))
                direction_hand = wrist - shoulder
            elif hack:
                wrist = shoulder + Vector((side * .037, .159, -.464))
                direction_hand = -UP
            elif bells:
                wrist = shoulder + Vector((side * .035, -.117, -.078))
                direction_hand = UP
            else:
                wrist = (side * .327, .13 if guided else shoulder.y + .116, shoulder.z -.036)
                direction_hand = UP
            palm = finish_arm(rig, side, wrist, (side * .38, .35 if not bells else -.8, -1), direction_hand)
            palms.append(palm)
            if band:
                straps[side](palm)
            if bells:
                bells(side, palm, FRONT, (side * .93, .24, -.10))
        if weights:
            weights(midpoint(*palms))
    return pose


@motion("sumo-deadlift", "rack-pull", "original-deficit-deadlift", "original-cable-deadlifts",
        "original-stiff-legged-dumbbell-deadlift", "original-kettlebell-one-legged-deadlift",
        "cable-pull-through", view="side", center=(0, .06, .88), scale=2.20)
def loaded_hinge(rig, stage, name):
    sumo = name == "sumo-deadlift"
    rack = name == "rack-pull"
    deficit = "deficit" in name
    stiff = "stiff-legged" in name
    single = "one-legged" in name
    through = "pull-through" in name
    cable_lift = "cable-deadlifts" in name
    bars = stage.barbell(.40, 1.66) if sumo or rack or deficit else None
    weights = stage.dumbbells() if stiff else None
    bell = kettlebells(stage, sides=(1,)) if single else None
    rig.set_grip(1)
    if single:
        rig.set_grip(0, -1)
    if deficit:
        platform(stage, .10, (.0, .04), .67, .39)
    if rack:
        for side in SIDES:
            box("Rack support", (side * .63, -.085, .14), (.24, .43, .28), stage.frame)
    lines = {side: cable(stage, (side * .75, -.13, .11)) for side in SIDES} if cable_lift else {}
    rope = cable(stage, (0, 1.01, .13)) if through else None
    if through:
        ends = [beam("Rope end", stage.rubber, .013) for _ in SIDES]

    def pose(t):
        depth = 1 - t
        hip_z = .858 + (.10 if deficit else 0)
        descent = (.10 if stiff or single else .29 if sumo or cable_lift else .20) * depth
        hip = (0, .031 + (.27 if stiff else .15 if sumo else .224) * depth, hip_z - descent)
        rig.start(hip=hip, pitch=3 + (39 if sumo else 57) * depth, look=-16 * depth)
        palms = []
        for side in SIDES:
            if single and side < 0:
                thigh = rig.point(joint("hip", side))
                target = thigh + .78 * Vector((-.03, math.sin(depth), -math.cos(depth)))
                rig.leg(side, target, foot=around("X", depth * 61))
                shoulder = rig.point(joint("shoulder", side))
                finish_arm(rig, side, shoulder + Vector((-.38 * depth, -.14, -.28)), (-1, .4, -.3), -UP)
                continue
            foot = around("Z", side * 24) if sumo else ID
            rig.leg(side, (side * (.31 if sumo else .17), .055, .073 + (.10 if deficit else 0)), foot=foot)
            shoulder = rig.point(joint("shoulder", side))
            width = .074 if through else .17 if sumo else .226
            wrist_z = shoulder.z - .482
            if bars and (sumo or deficit or rack):
                wrist_z = (.55 if rack else .295) * depth + (hip_z - .007) * t
            wrist = (side * width, .12 * depth - .15 * t if through else -.169 + .053 * t, wrist_z)
            palm = finish_arm(rig, side, wrist, (.26 * side, .91, -.10), -UP, FRONT if weights or lines else None)
            palms.append(palm)
            if weights:
                weights(side, palm, FRONT)
            if bell:
                bell(side, palm)
            if lines:
                lines[side](palm)
        if bars:
            bars(midpoint(*palms))
        if rope:
            center = midpoint(*palms) - FRONT * .14
            rope(center)
            for line, palm in zip(ends, palms):
                line(center, palm)
    return pose


@motion("barbell-step-up", "dumbbell-step-up", "original-step-up-with-knee-raise", view="side")
def step_up(rig, stage, name):
    height = .29
    platform(stage, height, (0, -.37), .64, .46)
    bar = stage.barbell(.22, 1.56) if name.startswith("barbell") else None
    dumbbells = stage.dumbbells() if name.startswith("dumbbell") else None
    rig.set_grip(1 if bar or dumbbells else 0)
    knee_raise = "knee-raise" in name

    def pose(t):
        lift = smoothstep(t)
        rig.start(hip=(.025 * lift, .012 - .35 * lift, .842 + height * lift), pitch=8 - 6 * lift)
        rig.leg(1, (.15, -.373, height + .073), pole=FRONT)
        travel = smoothstep((t - .23) / .77)
        clearance = smoothstep(t / .48)
        trailing = Vector((-.155, .23 - (.89 if knee_raise else .60) * travel,
                           .073 + height * clearance + (.36 * lift if knee_raise else 0) + .080 * math.sin(math.pi * travel)))
        rig.leg(-1, trailing, pole=FRONT)
        hands = []
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            wrist = shoulder + (Vector((side * .124, .106, -.035)) if bar else
                                 Vector((side * .068, -.063 - .15 * t if knee_raise and side > 0 else -.042, -.464)))
            palm = finish_arm(rig, side, wrist, (side, .52, -.31), UP if bar else -UP, FRONT if dumbbells else None)
            hands.append(palm)
            if dumbbells:
                dumbbells(side, palm, FRONT)
        if bar:
            bar(midpoint(*hands))
    return pose


@motion("original-barbell-walking-lunge", "jump-lunge", "skater-jump", "original-monster-walk",
        view="side", center=(0, -.19, .90), scale=2.51)
def steps(rig, stage, name):
    walk = "walking-lunge" in name
    monster = "monster" in name
    lateral = name == "skater-jump"
    bar = stage.barbell(.26, 1.56) if walk else None
    rig.set_grip(1 if bar else 0)
    if monster:
        straps = [beam("Loop band", stage.rubber, .013) for _ in range(4)]

    def pose(t):
        lift = math.sin(math.pi * t)
        shift = 2 * t - 1
        if lateral:
            rig.start(hip=(.43 * shift, .03, .69 + .22 * lift), pitch=23 - 16 * lift, tilt=9 * shift)
        elif monster:
            rig.start(hip=(.022 * math.sin(2 * math.pi * t), -.41 * t, .688), pitch=22)
        elif walk:
            rig.start(hip=(0, -.66 * t, .849 - .275 * lift ** 2), pitch=8 + 6 * lift)
        else:
            rig.start(hip=(0, -.04, .609 + .43 * lift), pitch=9)
        hands = []
        for side in SIDES:
            if lateral:
                stance = max(0, side * shift)
                ankle = (.45 * shift + .154 * side + .171 * side * stance, .281 * (1 - stance) - .05,
                         .073 + .215 * lift + .058 * (1 - stance))
            elif monster:
                amount = smoothstep(t * 2) if side == 1 else smoothstep(t * 2 - 1)
                ankle = (.23 * side, .044 - .42 * amount, .073 + .09 * math.sin(math.pi * amount))
            elif walk:
                amount = smoothstep(t * 1.85) if side == 1 else smoothstep((t - .48) * 1.92)
                ankle = (.15 * side, .059 - .67 * amount, .073 + .115 * math.sin(math.pi * amount))
            else:
                ankle = (.145 * side, -.278 * side * shift, .081 + .31 * lift + max(0, .087 * side * -shift))
            rig.leg(side, ankle, foot=around("X", 18 * max(0, side * -shift)) if not lateral and not monster else ID)
            shoulder = rig.point(joint("shoulder", side))
            wrist = shoulder + (Vector((side * .128, .115, -.033)) if bar else
                                 Vector((.135 * side, -.25 * (1 - .8 * side * shift), -.315 + .26 * lift)))
            hands.append(finish_arm(rig, side, wrist, (side, .48, -.34), UP if bar else FRONT))
        if bar:
            bar(midpoint(*hands))
        if monster:
            for i, joint_name in enumerate(("foot", "shin")):
                a, b = [rig.current[f"{joint_name}.{side}"].translation for side in SIDES]
                straps[2 * i](a + .043 * FRONT, b + .043 * FRONT)
                straps[2 * i + 1](a - .043 * FRONT, b - .043 * FRONT)
    return pose


@motion("original-band-calf-raise", "original-barbell-seated-calf-raise", "original-dumbbell-seated-one-leg-calf-raise",
        "seated-calf-raise-machine", view="side")
def calf_variations(rig, stage, name):
    band = "band" in name
    single = "one-leg" in name
    machine = "machine" in name
    bar = stage.barbell(.21, 1.48) if "barbell" in name else None
    dumbbell = stage.dumbbells(sides=(1,)) if single else None
    rig.set_grip(1)
    if not band:
        seat(stage)
    center_y = -.414 if not band else -.111
    platform(stage, .115, (0, center_y), .54, .24)
    lines = {side: cable(stage, (side * .17, center_y, .122), band=True) for side in SIDES} if band else {}
    if machine:
        lever = beam("Calf machine swing arm", stage.steel, .022)
        knee_pad = cylinder("Knee pad", .37, .066, stage.pad)
        box("Lever support", (0, -.70, .26), (.12, .11, .51), stage.frame)

    def pose(t):
        raised = .086 * t
        hip = (0, .033, .918 + raised) if band else (0, .094, .575)
        rig.start(hip=hip)
        knee_points = []
        for side in SIDES:
            amount = t if not single or side == 1 else 0
            angle = -10 + 38 * amount
            foot = around("X", angle)
            toes = Vector((side * .17, center_y, .135))
            ankle = toes - foot @ (joint("toe", side) - joint("ankle", side))
            rig.leg(side, ankle, foot=foot, pole=FRONT if band else UP)
            knee = rig.current[f"shin.{side}"].translation
            knee_points.append(knee)
            wrist = (side * .315, -.094, 1.36 + raised) if band else (
                side * (.263 if machine else .195), knee.y + .052, knee.z + (.125 if machine else .068))
            palm = finish_arm(rig, side, wrist, (.72 * side, .18, -1), UP if band else FRONT,
                              None if band else UP)
            if band:
                lines[side](palm)
        center = midpoint(*knee_points) + Vector((0, .052, .068))
        if bar:
            bar(center)
        if dumbbell:
            dumbbell(1, knee_points[1] + Vector((0, .056, .072)), FRONT)
        if machine:
            center.z += .061
            place(knee_pad, center, (1, 0, 0))
            lever((0, -.69, .51), center)
    return pose


@motion("stability-ball-hamstring-curl", view="side", center=(0, -.14, .52), scale=2.12)
@motion("hip-thrusts", "original-physioball-hip-bridge",
        view="side", center=(0, 0, .56), scale=1.88)
def elevated_bridge(rig, stage, name):
    curl = "curl" in name
    physio = "physioball" in name
    weight = stage.barbell(.31, 1.52) if not physio and not curl else None
    if physio or curl:
        exercise_ball = ball(stage, .267, "Stability ball")
    else:
        box("Hip thrust bench", (0, .49, .25), (.54, .42, .37), stage.pad)
    rig.set_grip(1 if weight else 0)

    def pose(t):
        if curl:
            hip = Vector((0, .014, .257 + .068 * t))
            pitch = -110 + 13 * t
            exercise_ball.location = (0, -.83 + .31 * t, .267)
        else:
            shoulder_z = .631 if physio else .530
            height = (.333 + .216 * t) if physio else (.232 + .227 * t)
            reach = math.sqrt(.485 ** 2 - (shoulder_z - height) ** 2)
            hip = Vector((0, .46 - reach, height))
            pitch = -math.degrees(math.atan2(reach, shoulder_z - height))
            if physio:
                exercise_ball.location = (0, .46, .267)
        rig.start(hip=hip, pitch=pitch, look=7 if curl else 8 + 9 * t)
        for side in SIDES:
            ankle = (side * .15, -.80 + .31 * t, .575 - .024 * t) if curl else (side * .173, -.49, .073)
            rig.leg(side, ankle, foot=around("X", -33 + 24 * t) if curl else ID, pole=UP)
            wrist = (side * .236, .081, .051) if curl else tuple(hip + Vector((side * .246, -.076, .095)))
            finish_arm(rig, side, wrist, (side, .62, -.32), FRONT, (-side, 0, 0))
        if weight:
            weight(hip + Vector((0, -.062, .117)))
    return pose


@motion("original-band-hip-adductions", "original-cable-hip-adduction", "cable-kickback",
        "original-hip-extension-with-bands", "standing-leg-curl-machine", view="side")
def standing_leg(rig, stage, name):
    adduction = "adduction" in name
    band = "band" in name
    curl = "curl-machine" in name
    anchor = (.88, -.11, .11) if adduction else (0, -.57, .12)
    if band:
        box("Band anchor post", (anchor[0], anchor[1], .54), (.092, .092, 1.08), stage.frame)
    resistance = cable(stage, anchor, band=band) if not curl else None
    if curl:
        box("Machine chest pad", (0, -.41, 1.04), (.36, .18, .25), stage.pad)
        box("Machine frame", (0, -.42, .54), (.09, .14, 1.08), stage.frame)
        roller = cylinder("Calf roller", .22, .052, stage.pad)
        lever = beam("Curl lever", stage.steel, .02)
        grips = [beam("Machine grip", stage.steel, .019) for _ in SIDES]

    def pose(t):
        rig.start(hip=(-.11 if adduction else 0, .011, .861), pitch=34 if curl else 12 if not adduction else 4)
        rig.leg(-1, (-.17, .056, .073))
        if curl:
            hip = rig.point(joint("hip", 1))
            thigh = (joint("hip", 1) - joint("knee", 1)).length
            shin = (joint("knee", 1) - joint("ankle", 1)).length
            knee = hip + Vector((.034, -.086, -.40)).normalized() * thigh
            turn = math.radians(2 + 102 * t)
            direction = Vector((0, math.sin(turn), -math.cos(turn)))
            ankle = knee + direction * shin
            rig.leg_pose(1, knee, ankle, around("X", 21 + 77 * t))
            contact = ankle - .054 * direction + .103 * Vector((0, math.cos(turn), math.sin(turn)))
            place(roller, contact, (1, 0, 0))
            lever((.18, -.27, .45), contact + Vector((.106, 0, 0)))
        elif adduction:
            ankle = (.31 - .51 * t, -.117, .125 - .021 * t)
            ankle = rig.leg(1, ankle)
        else:
            turn = math.radians(4 + 36 * t)
            ankle = rig.leg(1, (.145, .017 + .76 * math.sin(turn), .865 - .76 * math.cos(turn)), pole=FRONT)
        if resistance:
            resistance(ankle + Vector((0, -.017, .025)))
        for i, side in enumerate(SIDES):
            shoulder = rig.point(joint("shoulder", side))
            wrist = (side * (.345 if curl else .168), -.351 if curl else -.424, 1.08) if not adduction else shoulder + Vector((side * .084, -.102, -.44))
            palm = finish_arm(rig, side, wrist, (side, .77, -.36), FRONT if not adduction else -UP)
            if curl:
                grips[i]((side * .176, palm.y, palm.z), palm + Vector((side * .06, 0, 0)))
    return pose


@motion("glute-ham-raise", view="side", center=(0, 0, .89), scale=2.07)
@motion("nordic-hamstring-curl", view="side", center=(0, 0, .73), scale=2.02)
@motion("donkey-kicks", view="side", center=(0, 0, .59), scale=2.02)
def posterior_chain(rig, stage, name):
    donkey = name == "donkey-kicks"
    machine = name == "glute-ham-raise"
    if machine:
        box("Glute-ham pad", (0, .03, .436), (.44, .35, .16), stage.pad)
        box("Machine frame", (0, .30, .24), (.43, .88, .48), stage.frame)
        box("Footplate", (0, .69, .60), (.48, .075, .34), stage.pad)
    elif not donkey:
        platform(stage, .036, (0, .29), .58, .74)
        box("Ankle anchor", (0, .60, .099), (.49, .12, .10), stage.pad)

    def pose(t):
        if donkey:
            rig.start(hip=(0, .20, .525), pitch=88, look=-15)
            rig.leg(-1, (-.156, .556, .052), foot=around("X", 73), pole=-UP)
            start = rig.point(joint("hip", 1))
            thigh = (joint("hip", 1) - joint("knee", 1)).length
            shin = (joint("knee", 1) - joint("ankle", 1)).length
            theta = math.radians(87 - 85 * t)
            knee = start + thigh * Vector((.02, math.cos(theta), -math.sin(theta))).normalized()
            end = knee + shin * Vector((0, math.sin(theta), math.cos(theta)))
            rig.leg_pose(1, knee, end, around("X", 68 + 20 * t))
            for side in SIDES:
                finish_arm(rig, side, (side * .19, -.31, .073), (side * .35, .48, .3), FRONT, (-side, 0, 0))
        else:
            knee = Vector((0, .127, .096 if not machine else .565))
            pitch = 5 + (74 if machine else 65) * t
            hip = knee + around("X", pitch) @ Vector((0, 0, .409))
            rig.start(hip=hip, pitch=pitch, look=-15 * t)
            for side in SIDES:
                bend = knee + Vector((side * .124, 0, 0))
                heel = bend + Vector((side * .023, .379, -.044 if not machine else .058))
                rig.leg_pose(side, bend, heel, around("X", 65))
                wrist = rig.point(Vector((.05 * -side, -.118, 1.28)))
                finish_arm(rig, side, wrist, (side, -.48, -.63), UP)
    return pose


@motion("one-arm-kettlebell-swing", "original-kettlebell-thruster", view="side", center=(0, 0, 1.02), scale=2.28)
def kettlebell_power(rig, stage, name):
    thruster = name.endswith("thruster")
    bells = kettlebells(stage, SIDES if thruster else (1,))
    rig.set_grip(1)
    if not thruster:
        rig.set_grip(0, -1)

    def pose(t):
        phase = smoothstep(t * 1.6)
        standing(rig, hip=(0, .05 + .19 * (1 - phase), .858 - (.355 if thruster else .13) * (1 - phase)),
                 pitch=(27 if thruster else 57) * (1 - phase), look=-12 * (1 - t))
        for side in SIDES:
            shoulder = rig.point(joint("shoulder", side))
            if thruster:
                lift = smoothstep((t - .40) / .60)
                wrist = (side * (.223 + .037 * (1 - lift)), -.163 + .17 * lift, shoulder.z - .08 + .559 * lift)
                palm = finish_arm(rig, side, wrist, (side, -.38, -1), UP)
                bells(side, palm, FRONT, (side * .89, .31, -.2))
            elif side > 0:
                angle = math.radians(-41 + 132 * t)
                direction = math.sin(angle) * FRONT - math.cos(angle) * UP
                _, palm = rig.elbow_hinge(side, shoulder + .255 * direction + Vector((.020, 0, 0)),
                                          direction, (-side, 0, 0))
                bells(side, palm, (1, 0, 0), direction)
            else:
                finish_arm(rig, side, shoulder + Vector((-.16, .18 - .41 * t, -.31)), (-1, .5, -.3), FRONT)
    return pose
