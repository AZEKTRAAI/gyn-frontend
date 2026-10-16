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

navy, bridge_mat, base_mat = C.satin("tower", C.NAVY), C.satin("bridge", C.CRIMSON), C.satin("base", BG)

# soft round plinth in the backdrop colour
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=96, radius1=1.25, radius2=1.25, depth=0.16)
plinth = C.mesh_object("Plinth", bm, base_mat)
plinth.location.z = 0.08
C.bevel(plinth, width=0.07, segments=6)

bridge_z = 0.0
for side in (-1, 1):
    x, z = side * 0.5, 0.16 - 0.2  # bottom tier sinks into the plinth so it sits, not perches
    for k, (r, h) in enumerate(((0.36, 0.55), (0.29, 0.38), (0.21, 0.26))):  # stacked pills, each slimmer
        p = C.capsule(f"Tier{side}{k}", r, h, navy)
        p.location = (x, 0, z + r + h / 2)
        if k == 1:
            bridge_z = z + r * 0.4
        z += h + r * 1.15
    spire = C.capsule(f"Spire{side}", 0.04, 0.3, navy)
    spire.location = (x, 0, z + 0.12)

bridge = C.rounded_box("Bridge", (0.5, 0.26, 0.17), bridge_mat, 0.07)
bridge.location = (0, 0, bridge_z)

C.camera((2.6, -11.5, 0.9), (0, 0, 1.1), lens=85)
C.run(lambda p: None, 1, 0, cove=cove)
