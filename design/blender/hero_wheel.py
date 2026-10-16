"""hero-wheel-seq: 72-frame scroll-scrub of the satin SDG wheel on a #EEF2F6 cove.

  frames 1-40   face-on and calm -> turns a quarter into a three-quarter view
  frames 40-72  goals 4, 5, 9, 13 slide forward and lift out; the other 13 settle back
Frame 72 doubles as the poster.

blender -b --python hero_wheel.py -- --out <dir> [--res 1200] [--still N]
"""
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "hero-wheel-seq"), res=1200, still=0, samples=96)
FRAMES, BG = 72, "#EEF2F6"
R_IN, R_OUT, DEPTH, GAP = 0.55, 1.0, 0.3, 0.015  # the round rims open the visible gap further
STEP = 2 * math.pi / 17
RC = (R_IN + R_OUT) / 2
CLEAR = 0.02  # the wheel stands on the cove floor: one attached contact shadow
CENTRE_Z = R_OUT + CLEAR
LIFT_OUT, LIFT_FWD, SINK = 0.15, 0.45, 0.1  # focus wedges: outward + towards camera; the rest recede

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
cove = C.cove(BG, wall_y=3.0)
C.tarka_lights(BG, target=(0, 0, CENTRE_Z), key=600, dist=4.5, key_dir=(-0.62, -0.62, 1.6))

root = C.empty("Wheel", (0, 0, CENTRE_Z))
segs = []
for i, hex_ in enumerate(C.SDG):
    o = C.soft_wedge(f"SDG{i + 1:02d}", C.satin(f"sdg{i + 1}", hex_), R_IN, R_OUT, STEP, GAP, DEPTH)
    o.parent = root
    th = math.pi / 2 - (i + 0.5) * STEP  # goal 1 at 12 o'clock, clockwise
    o.location = (RC * math.cos(th), RC * math.sin(th), 0)
    o.rotation_euler.z = th
    o["home"], o["radial"], o["hex"] = tuple(o.location), (math.cos(th), math.sin(th)), hex_
    segs.append(o)


def animate(p):
    t = p * FRAMES / (FRAMES - 1)              # frame 1 -> 0, frame 72 -> 1
    turn = C.ease(t / (39 / 71))               # frames 1-40: face-on -> gentle three-quarter
    pop = C.ease((t - 39 / 71) / (32 / 71))    # frames 40-72: the four focus goals lift out
    root.rotation_euler = (math.pi / 2, 0, math.radians(16) * turn)
    root.location.z = CENTRE_Z + LIFT_OUT * pop  # ring rises as goal 9 steps out and down onto the floor
    for i, o in enumerate(segs):
        hx, hy, hz = o["home"]
        bsdf = o.data.materials[0].node_tree.nodes["Principled BSDF"]
        if (i + 1) in C.FOCUS:  # same move for all four: out along their own radius, towards camera
            rx, ry = o["radial"]
            o.location = (hx + rx * LIFT_OUT * pop, hy + ry * LIFT_OUT * pop, LIFT_FWD * pop)
            bsdf.inputs["Base Color"].default_value = C.lin(o["hex"])
        else:                   # intact ring, pushed back a little and a touch deeper in colour
            o.location = (hx, hy, -SINK * pop)
            r, g, b, _ = C.lin(o["hex"])
            k = 1 - 0.22 * pop
            bsdf.inputs["Base Color"].default_value = (r * k, g * k, b * k, 1)


# wheel ~62% of frame width, centred; camera a touch below centre looking up
C.camera((0, -7.7, CENTRE_Z - 0.3), (0, 0, CENTRE_Z), lens=85)
C.run(animate, FRAMES, a.still, cove=cove)
