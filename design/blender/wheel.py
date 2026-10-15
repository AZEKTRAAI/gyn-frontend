"""wheel-bloom: the 17-goal SDG wheel as thick glossy wedge blocks.

  loop     96-frame seamless bloom: segments drift apart in a staggered wave,
           twist, and settle; goals 4, 5, 9, 13 lift further forward.
  assemble 48-frame scroll-scrub: scattered floating segments (frame 1) fly
           into the complete wheel (frame 48).

blender -b --python wheel.py -- --mode loop --out <dir> [--res 1080] [--still N]
"""
import math
import os
import random
import sys

import bmesh
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(mode="loop", out="", res=0, still=0, samples=64)
FRAMES = 96 if a.mode == "loop" else 48
RES = a.res or (1080 if a.mode == "loop" else 900)
OUT = a.out or os.path.join(C.HERE, "_frames", "wheel-bloom" if a.mode == "loop" else "wheel-assemble")

R_IN, R_OUT, DEPTH, GAP = 0.50, 1.0, 0.24, 0.045
STEP = 2 * math.pi / 17
RC = (R_IN + R_OUT) / 2

C.new_scene("BLENDER_EEVEE", RES, RES, FRAMES, OUT, a.samples)
C.studio_world(0.9, key_dir=(-0.75, 0.1, 0.65))  # lobe off the mirror angle: highlights land on bevels


def wedge_outline(n=28):
    """Annular sector centred on +X with parallel (constant-width) gaps."""
    pts = []
    for r, rev in ((R_OUT, False), (R_IN, True)):
        d = math.asin(GAP / 2 / r)
        angs = [-STEP / 2 + d + (STEP - 2 * d) * k / (n - 1) for k in range(n)]
        if rev:
            angs.reverse()
        pts += [(r * math.cos(t) - RC, r * math.sin(t)) for t in angs]
    return pts


root = C.empty("Wheel")
root.rotation_euler = (math.radians(78), 0, math.radians(-16))
segs = []
for i, hex_ in enumerate(C.SDG):
    bm = C.extrude_outline(bmesh.new(), wedge_outline(), DEPTH)
    o = C.mesh_object(f"SDG{i + 1:02d}", bm, C.glossy(f"sdg{i + 1}", hex_))
    C.bevel(o, width=0.07, segments=6)
    o.parent = root
    o["angle"] = math.pi / 2 - (i + 0.5) * STEP  # goal 1 at 12 o'clock, clockwise
    segs.append(o)


def place(o, radial=0.0, lift=0.0, twist=0.0, tilt=0.0, spin=0.0):
    """Pose a segment relative to its rest slot (all offsets in wheel space)."""
    t = o["angle"] + spin
    r = RC + radial
    o.location = (r * math.cos(t), r * math.sin(t), lift)
    o.rotation_euler = (twist, tilt, t)


def loop(p):
    root.rotation_euler.y = math.radians(3) * math.sin(2 * math.pi * p)
    for i, o in enumerate(segs):
        w = C.pulse(p, 0.04 + 0.32 * i / 16, 0.58)
        focus = (i + 1) in C.FOCUS
        place(o,
              radial=(0.13 if focus else 0.09) * w,
              lift=(0.34 if focus else 0.07) * w,
              twist=math.radians(40) * w,
              tilt=math.radians(-14 if focus else -6) * w)


rng = random.Random(17)
# neighbours scatter to opposite depths so no two blocks intersect
SCATTER = [dict(radial=rng.uniform(0.12, 0.4), lift=(-0.6 if i % 2 else 0.35) * rng.uniform(0.5, 1),
                twist=rng.uniform(-1, 1) * math.radians(150),
                tilt=rng.uniform(-1, 1) * math.radians(80),
                spin=rng.uniform(-1, 1) * math.radians(22),
                delay=rng.uniform(0, 0.3)) for i in range(17)]


def assemble(p):
    t = p * FRAMES / (FRAMES - 1)  # frame 1 -> 0, frame 48 -> 1
    for o, s in zip(segs, SCATTER):
        k = 1 - C.ease((t - s["delay"]) / (1 - 0.3))
        place(o, **{key: v * k for key, v in s.items() if key != "delay"})


# camera slightly above, long lens for a calm product look
C.camera((0, -7.2, 1.3), (0, 0, 0.02), lens=85, fstop=0.6)
C.area("Key", (-5, -2, 3.5), size=4, energy=600)
C.area("Fill", (4.5, -3, -0.5), size=6, energy=180, color=(0.9, 0.93, 1.0))
C.area("Rim", (2.5, 4, 3.5), size=3, energy=900)
C.area("Top", (0, -1, 6), size=5, energy=150)

C.run(loop if a.mode == "loop" else assemble, FRAMES, a.still)
