"""ribbons: four glossy tubes (crimson, flame, ember, leaf) linked like hands.

The tubes form a (4,4) torus link: each loop links all three others, so they
hold together like the four hands of the GYN logo. Over the 96-frame loop the
loops slide against each other, the ring breathes, the whole piece sways, and
the light rig orbits once so highlights sweep along the tubes.

blender -b --python ribbons.py -- --out <dir> [--res 1080] [--still N]
"""
import math
import os
import sys

import bpy
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "ribbons"), res=1080, still=0, samples=64)
FRAMES, PTS = 96, 96
R, r, TUBE = 1.0, 0.5, 0.16

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples)
C.studio_world(0.5, key_dir=(-0.6, -0.3, 0.75))

root = C.empty("Link")
tubes = []
for k, hex_ in enumerate((C.CRIMSON, C.FLAME, C.EMBER, C.LEAF)):
    cu = bpy.data.curves.new(f"tube{k}", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = TUBE
    cu.bevel_resolution = 10
    cu.resolution_u = 8
    sp = cu.splines.new("NURBS")
    sp.points.add(PTS - 1)
    sp.use_cyclic_u = True
    sp.order_u = 4
    sp.use_smooth = True
    o = bpy.data.objects.new(f"Ribbon{k}", cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(C.glossy(f"ribbon{k}", hex_))
    o.parent = root
    tubes.append((k, sp))

rig = C.empty("LightRig")
for light in (C.area("Key", (-4, -3, 4), size=4, energy=700),
              C.area("Rim", (3, 4, 2.5), size=2.5, energy=900),
              C.area("Kick", (4, -2, 0.5), size=1.5, energy=350, color=(1.0, 0.92, 0.85))):
    light.parent = rig
C.area("Fill", (0, -6, -1), size=8, energy=60, color=(0.88, 0.92, 1.0))


def animate(p):
    w = 2 * math.pi * p
    rig.rotation_euler.z = w                       # highlights orbit once per loop
    root.rotation_euler = (math.radians(6) * math.sin(w), 0, math.radians(28) * math.sin(w))
    rr = r + 0.05 * math.sin(2 * w)                # ring breathes twice per loop
    for k, sp in tubes:
        slide = 0.32 * math.sin(w + k * math.pi / 2)   # loops slide against each other
        for i, pt in enumerate(sp.points):
            t = 2 * math.pi * i / PTS
            v = t + slide
            u = t + k * math.pi / 2
            pt.co = ((R + rr * math.cos(v)) * math.cos(u),
                     (R + rr * math.cos(v)) * math.sin(u),
                     rr * math.sin(v), 1.0)


C.camera((0, -2.6, 7.3), (0, 0, 0), lens=70, fstop=1.2)
C.run(animate, FRAMES, a.still)
