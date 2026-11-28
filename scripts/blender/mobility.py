"""Entry and exit paths for timed holds and mobility guides."""
import math

from mathutils import Vector

from equipment import finish_arm
from poses import motion, standing
from rig import FRONT, ID, SIDES, UP, around, joint
from stage import box


@motion("plank", "side-plank", view="side", center=(0, -.05, .40), scale=2.13)
def plank(rig, stage, name):
    side_plank = name == "side-plank"
    rig.set_grip(.40, -1) if side_plank else rig.set_grip(.40)

    def pose(_t):
        pitch = 74 if side_plank else 83.2
        heels = Vector((0, .76, .158 if side_plank else .162))
        hip = heels + around("X", pitch) @ Vector((0, 0, .799))
        rig.start(hip=hip, pitch=pitch, roll=90 if side_plank else 0, look=-5)
        for side in SIDES:
            ankle = heels + (Vector((.019 * side, .025 * side, -.083 if side < 0 else .012)) if side_plank else Vector((side * .093, 0, 0)))
            foot = around("Y", -77) if side_plank else around("X", 39)
            rig.straight_leg(side, ankle, foot)
            shoulder = rig.point(joint("shoulder", side))
            if side_plank and side == 1:
                finish_arm(rig, side, rig.point(joint("hip", side)) + Vector((-.04, .083, .042)),
                           (1, .29, .67), rig.torso @ -UP)
                continue
            upper = (joint("elbow", side) - joint("shoulder", side)).length
            forearm = (joint("wrist", side) - joint("elbow", side)).length
            elbow = shoulder + upper * Vector((.05 * side, .13, -1)).normalized()
            direction = Vector((-.72, -.69, 0)).normalized() if side_plank else FRONT
            wrist = elbow + forearm * direction
            rig.arm_pose(side, elbow, wrist, direction, side * direction.cross(UP))
    return pose


@motion("childs-pose", "original-cat-stretch", "kneeling-forearm-stretch",
        view="side", center=(0, 0, .36), scale=1.99)
def floor_support(rig, stage, name):
    childs = name == "childs-pose"
    forearm = name == "kneeling-forearm-stretch"

    def pose(t):
        hip = (0, .297 + .229 * t if childs else .278, .528 - .252 * t if childs else .528)
        rig.start(hip=hip, pitch=89 + 10 * t if childs else 87 - 8 * t if forearm else 81 - 13 * t,
                  chest_pitch=36 * t if name == "original-cat-stretch" else 16 * t if childs else 0,
                  look=12 * t if name == "original-cat-stretch" else -11)
        for side in SIDES:
            rig.leg(side, (side * (.18 if childs else .125), .687, .057), foot=around("X", 70), pole=FRONT)
            wrist = (side * .176, -.334 - (.13 * t if childs else 0), .072)
            direction = FRONT if not forearm else around("Z", side * (45 + 125 * t)) @ FRONT
            finish_arm(rig, side, wrist, (side * .29, .65, .31), direction, UP if forearm else None)
    return pose


@motion("wall-calf-stretch", "original-standing-soleus-and-achilles-stretch", "kneeling-hip-flexor-stretch",
        view="side", center=(0, -.16, .84), scale=2.22)
def upright_lower_stretch(rig, stage, name):
    hip_stretch = name == "kneeling-hip-flexor-stretch"
    soleus = "soleus" in name
    if not hip_stretch:
        box("Wall support", (0, -.70, .91), (.55, .093, 1.82), stage.frame)
    else:
        box("Knee mat", (0, .27, .018), (.55, .7, .036), stage.pad)

    def pose(t):
        if hip_stretch:
            rig.start(hip=(0, .098 - .11 * t, .53), pitch=8 - 5 * t)
            rig.leg(1, (.15, -.337, .073), pole=UP)
            rig.leg(-1, (-.145, .554, .056), pole=FRONT, foot=around("X", 70))
        else:
            reach = .052 + .13 * t
            rig.start(hip=(0, .083 - reach, .839 - ((.073 if soleus else .027) * t)), pitch=10 + 13 * t)
            rig.leg(1, (.145, -.311, .073), pole=FRONT)
            rig.leg(-1, (-.155, .492 if not soleus else .327, .073), pole=FRONT)
        for side in SIDES:
            wrist = (side * .165, -.226, .589) if hip_stretch else (side * .205, -.566, 1.235)
            finish_arm(rig, side, wrist, (side * .52, .49, -.67), FRONT if hip_stretch else UP)
    return pose


@motion("original-90-90-hamstring-stretch", "supine-hamstring-stretch", "original-lying-glute-stretch",
        "original-side-lying-quad-stretch", view="side", center=(0, .01, .39), scale=2.04)
def recumbent_stretch(rig, stage, name):
    ninety = "90-90" in name
    quad = "quad" in name
    glute = "glute" in name

    def pose(t):
        rig.start(hip=(0, .028, .145 if not quad else .181), pitch=-90, tilt=-74 if quad else 0, look=8)
        heels = {}
        for side in SIDES:
            if quad:
                ankle = (side * .106, -.745 + (.73 * t if side > 0 else 0), .125 + .055 * (side > 0))
            elif glute:
                ankle = (side * (.14 if side < 0 else .29 - .40 * t), -.48 + .15 * t, .22 + (.19 if side > 0 else .15) * t)
            elif side < 0:
                ankle = (-.149, -.759, .128)
            elif ninety:
                theta = math.radians(87 * t)
                knee = rig.point(joint("hip", side)) + Vector((0, -.026, .412))
                ankle = knee + Vector((0, -.382 * math.cos(theta), .382 * math.sin(theta)))
                rig.leg_pose(side, knee, ankle, around("X", -73 - 73 * t))
                heels[side] = ankle
                continue
            else:
                theta = math.radians(22 + 60 * t)
                ankle = (.144, -.77 * math.cos(theta), .145 + .76 * math.sin(theta))
            heels[side] = rig.leg(side, ankle, foot=around("X", -73 if not quad else -13), pole=UP)
        for side in SIDES:
            if quad:
                wrist = heels[side] + Vector((.0, -.015, .067)) if side > 0 else (-.298, .58, .08)
            elif glute or ninety or side > 0:
                target = rig.current["shin.1"].translation if not glute else rig.current["shin.-1"].translation
                wrist = target + Vector((side * .110, .045, -.038))
            else:
                wrist = (side * .202, .041, .055)
            finish_arm(rig, side, wrist, (side * .73, .63, .22), FRONT)
    return pose


@motion("original-seated-biceps-stretch", "original-seated-calf-stretch", view="side",
        center=(0, .01, .41), scale=1.86)
def seated_stretch(rig, stage, name):
    biceps = "biceps" in name

    def pose(t):
        rig.start(hip=(0, .115, .136), pitch=-15 - 16 * t if biceps else 5 + 34 * t)
        for side in SIDES:
            heel = (.144 * side, -.445 if biceps else -.659, .073)
            rig.leg(side, heel, foot=around("X", -13 if not biceps else 0), pole=UP)
            wrist = (side * .231, .433 + .12 * t, .052) if biceps else (side * .104, -.373 - .254 * t, .177 - .065 * t)
            fingers = Vector((0, 1, 0)) if biceps else FRONT
            finish_arm(rig, side, wrist, (side * .44, .48, -.69), fingers)
    return pose


@motion("cross-body-shoulder-stretch", "overhead-triceps-stretch")
def upper_stretch(rig, stage, name):
    shoulder = name.startswith("cross")

    def pose(t):
        standing(rig)
        for side in SIDES:
            base = rig.point(joint("shoulder", side))
            if shoulder:
                wrist = (side * .218 - (.52 if side == 1 else -.302) * t,
                         -.118 - .113 * t, base.z - .397 + (.354 if side == 1 else .295) * t)
                direction = Vector((-side * t, -1 + .78 * t, -.49 * (1 - t)))
                pole = (side * .49, -.65, -.46)
            else:
                wrist = (.14 * side - .093 * t, -.066 + .167 * t, base.z - .405 + (.493 if side == 1 else .554) * t)
                direction = Vector((.05, .91 * t, -.91))
                pole = (side, .20, 1.13 * t - .50)
            finish_arm(rig, side, wrist, pole, direction)
    return pose
