"""kl-towers: a small soft token of two pill-shaped towers joined by a bridge, on a
#EEF2F6 cove. Inspired by Kuala Lumpur's twin towers, deliberately not a model of them.
Still, 900x900.

blender -b --python kl_towers.py -- --out <dir> [--res 900]
"""
import math
import os
import sys

import bmesh
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "kl-towers"), res=900, still=0, samples=160)
BG = "#EEF2F6"

C.new_scene("BLENDER_EEVEE", a.res, a.res, 1, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
cove = C.cove(BG, wall_y=2.5)
C.tarka_lights(BG, target=(0, 0, 1.2), key=420, dist=4.5, key_dir=(-0.6, -0.6, 1.8))

navy, white = C.satin("navy", C.NAVY), C.satin("white", "#F6F4EF")
bridge_mat, base_mat = C.satin("bridge", "#0A97D9"), C.satin("base", BG)

# small soft round plinth in the backdrop colour
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=96, radius1=0.95, radius2=0.95, depth=0.14)
plinth = C.mesh_object("Plinth", bm, base_mat)
plinth.location.z = 0.07
C.bevel(plinth, width=0.06, segments=6)

# six rounded tiers per tower, each narrower, alternating navy / white, to a soft spire
TIERS = [(0.2, 0.72), (0.185, 0.56), (0.165, 0.46), (0.14, 0.37), (0.115, 0.29), (0.085, 0.21)]
for side in (-1, 1):
    x, z = side * 0.36, 0.14
    for k, (r, h) in enumerate(TIERS):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=64, radius1=r, radius2=r, depth=h)
        t = C.mesh_object(f"Tier{side}{k}", bm, navy if k % 2 == 0 else white)
        C.bevel(t, width=min(0.07, r * 0.45), segments=6)
        t.location = (x, 0, z + h / 2)
        z += h
    spire = C.capsule(f"Spire{side}", 0.035, 0.42, navy)
    spire.location = (x, 0, z + 0.2)

# short bridge a third of the way up the tower (two-thirds of the way down)
bridge = C.rounded_box("Bridge", (0.42, 0.22, 0.16), bridge_mat, 0.06)
bridge.location = (0, 0, 0.14 + 0.72 + 0.12)

# three-quarter view, 85mm, centred, towers ~45% of the frame height
C.camera((7.6, -13.2, 2.0), (0, 0, 1.55), lens=85)
C.run(lambda p: None, 1, 0, cove=cove)
