"""sdg5-balance: a soft seesaw on a rounded pivot with two equal spheres, #FF3A21 cove
(SDG 5 Gender Equality). It rocks gently, never far, and settles level: frame 1 is level.

blender -b --python sdg5_balance.py -- --out <dir> [--res 1080] [--still N]
"""
import math
import os
import sys

import bpy
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "sdg5-balance"), res=1080, still=0, samples=64)
FRAMES, BG = 96, "#FF3A21"
PIVOT_R, PIVOT_L, BEAM_L, BALL_R, BALL_X = 0.36, 0.25, 2.8, 0.34, 1.1
PIVOT_H = 2 * PIVOT_R + PIVOT_L - 0.08  # pill pivot, sunk a little into the floor so it sits

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
cove = C.cove(BG, wall_y=3.0)
C.tarka_lights(BG, target=(0, 0, 0.8), key=480, dist=4.5, key_dir=(-0.6, -0.6, 2.0))

# Pivot: a soft upright pill.
pivot = C.capsule("Pivot", PIVOT_R, PIVOT_L, C.satin("pivot", "#F4F1EA"))
pivot.location.z = PIVOT_R + PIVOT_L / 2 - 0.08

beam_pivot = C.empty("BeamPivot", (0, 0, PIVOT_H + 0.02))
beam = C.rounded_box("Beam", (BEAM_L, 0.5, 0.2), C.satin("beam", "#FCC30B"), 0.09)
beam.location = (0, 0, 0.1)
beam.parent = beam_pivot
for side, hex_ in ((-1, C.NAVY), (1, "#F6F4EF")):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.045, major_segments=64, minor_segments=16)
    cradle = bpy.context.active_object
    cradle.data.shade_smooth()
    cradle.data.materials.append(C.satin(f"cradle{side}", "#FCC30B"))
    cradle.location = (side * BALL_X, 0, 0.2 + 0.03)
    cradle.parent = beam_pivot
    ball = C.uv_sphere(f"Ball{side}", BALL_R, C.principled(f"ball{side}", hex_, rough=0.42, sss=0.08))  # satin, no coat glint
    ball.location = (side * BALL_X, 0, 0.2 + 0.03 + math.sqrt(BALL_R ** 2 - 0.17 ** 2) + 0.01)
    ball.parent = beam_pivot


def animate(p):
    # two gentle rocks inside a sin^2 envelope: level at frame 1, never past ~5 degrees
    beam_pivot.rotation_euler.y = math.radians(6) * math.sin(4 * math.pi * p) * math.sin(math.pi * p) ** 2


C.camera((4.4, -12.6, 3.6), (0, 0, 0.8), lens=85)
C.run(animate, FRAMES, a.still, cove=cove)
