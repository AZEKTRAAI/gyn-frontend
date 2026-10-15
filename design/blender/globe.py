"""glass-globe: a clear glass bubble (thick shell), 17 SDG spheres orbiting
on three tilted rings. Spheres passing behind the ball refract through it.

Cycles (OptiX GPU) + OIDN denoise. Each ring turns exactly once per 96-frame loop.

blender -b --python globe.py -- --out <dir> [--res 900] [--still N]
"""
import math
import os
import sys

import bmesh
import bpy
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "glass-globe"), res=900, still=0, samples=200)
FRAMES = 96

C.new_scene("CYCLES", a.res, a.res, FRAMES, a.out, a.samples)
C.studio_world(0.8, key_dir=(-0.6, -0.5, 0.65))


def sphere(name, radius, mat, seg=64):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=radius)
    return C.mesh_object(name, bm, mat)


glass = C.principled("glass", "#FFFFFF", rough=0.0, transmission=1.0, ior=1.45, spec=0.6)
# Thin glass shell (outer + flipped inner sphere): stays clear in the middle,
# bends the spheres behind it towards the rim and carries crisp reflections.
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=128, v_segments=64, radius=1.0)
inner = bmesh.ops.create_uvsphere(bm, u_segments=128, v_segments=64, radius=0.93)
bmesh.ops.reverse_faces(bm, faces=list({f for v in inner["verts"] for f in v.link_faces}))
C.mesh_object("Globe", bm, glass)

# (tilt x, tilt z, radius, direction, goals) per orbit ring
RINGS = [(math.radians(72), math.radians(25), 1.45, 1, range(0, 6)),
         (math.radians(-58), math.radians(-40), 1.68, -1, range(6, 12)),
         (math.radians(14), math.radians(8), 1.9, 1, range(12, 17))]
orbit_mat = C.principled("orbit", "#E8ECF7", rough=0.2, metallic=1.0)
orbits = []
for n, (tx, tz, rad, sign, goals) in enumerate(RINGS):
    pivot = C.empty(f"Ring{n}")
    pivot.rotation_euler = (tx, 0, tz)
    bpy.ops.mesh.primitive_torus_add(major_radius=rad, minor_radius=0.006,
                                     major_segments=192, minor_segments=8)
    line = bpy.context.active_object
    line.data.materials.append(orbit_mat)
    line.data.shade_smooth()
    line.parent = pivot
    spin = C.empty(f"Spin{n}")
    spin.parent = pivot
    for j, g in enumerate(goals):
        s = sphere(f"SDG{g + 1:02d}", 0.17 if (g + 1) in C.FOCUS else 0.135, C.glossy(f"sdg{g + 1}", C.SDG[g]))
        t = 2 * math.pi * j / len(goals)
        s.location = (rad * math.cos(t), rad * math.sin(t), 0)
        s.parent = spin
    orbits.append((spin, sign, n * 0.37))

C.area("Key", (-4, -4, 4.5), size=1.2, size_y=4.5, energy=900, shape="RECTANGLE")  # strip softbox
C.area("Rim", (3.5, 4, 3), size=2.5, energy=1400)
C.area("Kick", (5, -1, -1), size=1.5, energy=400, color=(0.85, 0.9, 1.0), shape="RECTANGLE")
# no front fill: it would mirror as a grey blob in the glass


def animate(p):
    for spin, sign, phase in orbits:
        spin.rotation_euler.z = phase + sign * 2 * math.pi * p


C.camera((0, -9.2, 1.9), (0, 0, 0), lens=72, fstop=1.0)
C.run(animate, FRAMES, a.still)
