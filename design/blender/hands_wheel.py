"""hands-wheel: four mitten hands in the GYN logo colours rise from below the frame and
hold the satin SDG wheel up between them, on a deep navy #0E1530 cove. 1600x900.

Hands are metaballs, so palm, fingers, thumb and forearm fuse with a smooth blend.
The wheel rocks a little in its plane and the hands breathe up and down with it.

blender -b --python hands_wheel.py -- --out <dir> [--w 1600] [--still N]
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "hands-wheel"), w=1600, still=0, samples=64, test=0)
FRAMES, BG = 96, "#0E1530"
R_IN, R_OUT, DEPTH, GAP = 0.50, 1.0, 0.26, 0.05
STEP = 2 * math.pi / 17
ZC = 0.0  # wheel centre

C.new_scene("BLENDER_EEVEE", a.w, a.w * 9 // 16, FRAMES, a.out, a.samples, transparent=False,
            view="Standard", fast_gi=False)
cove = C.cove(BG, floor_z=ZC - 3.2, wall_y=1.6, bend=2.0)
C.tarka_lights(BG, target=(0, 0, ZC), key=700, dist=5.0, key_dir=(-0.7, -1.0, 1.0), rim=0.12)

# ---------------------------------------------------------------- wheel
wheel = C.empty("Wheel", (0, 0, ZC))
wheel.rotation_euler.x = math.pi / 2  # face the camera
for i, hex_ in enumerate(C.SDG):
    bm = C.extrude_outline(bmesh.new(), C.wedge_outline(R_IN, R_OUT, STEP, GAP), DEPTH)
    o = C.mesh_object(f"SDG{i + 1:02d}", bm, C.satin(f"sdg{i + 1}", hex_))
    C.bevel(o, width=0.085, segments=8)
    th = math.pi / 2 - (i + 0.5) * STEP
    o.location = ((R_IN + R_OUT) / 2 * math.cos(th), (R_IN + R_OUT) / 2 * math.sin(th), 0)
    o.rotation_euler.z = th
    o.parent = wheel


# ---------------------------------------------------------------- hands
def capsule_el(mb, start, end, r, stiffness=2.0):
    """Metaball capsule between two local points."""
    s, e = Vector(start), Vector(end)
    el = mb.elements.new(type="CAPSULE")
    el.co = (s + e) / 2
    el.radius = r
    el.stiffness = stiffness
    el.size_x = (e - s).length / 2
    el.rotation = Vector((1, 0, 0)).rotation_difference((e - s).normalized())
    return el


def hand(name, hex_, wrist, fingers_dir, thumb_dir, arm_dir):
    """Mitten hand: fingers point along fingers_dir, thumb towards thumb_dir, forearm along arm_dir.

    Local frame: +Y fingers, +X thumb side, +Z out of the palm.
    """
    y = Vector(fingers_dir).normalized()
    x = (Vector(thumb_dir) - Vector(thumb_dir).project(y)).normalized()
    z = x.cross(y)
    rot = Matrix((x, y, z)).transposed()
    mb = bpy.data.metaballs.new(name)
    mb.resolution, mb.render_resolution, mb.threshold = 0.04, 0.02, 0.6
    o = bpy.data.objects.new(name, mb)
    bpy.context.collection.objects.link(o)
    o.location = wrist
    o.matrix_world = Matrix.Translation(wrist) @ rot.to_4x4() @ Matrix.Scale(1.2, 4)
    pal = mb.elements.new(type="ELLIPSOID")
    pal.co, pal.radius = (0, 0.32, 0), 0.6
    pal.size_x, pal.size_y, pal.size_z = 0.72, 0.7, 0.34
    # four fingers close enough to fuse into a mitten, middle one longest
    for fx, length in ((0.2, 0.34), (0.067, 0.41), (-0.067, 0.39), (-0.2, 0.3)):
        capsule_el(mb, (fx * 0.9, 0.5, 0.0), (fx * 1.05, 0.5 + length, -0.05), 0.115, 3.2)
    capsule_el(mb, (0.22, 0.2, -0.02), (0.5, 0.44, -0.08), 0.15)  # thumb, set off to the side
    arm_local = rot.transposed() @ Vector(arm_dir).normalized()
    capsule_el(mb, (0, 0.05, 0), tuple(arm_local * 2.6), 0.3)
    o.data.materials.append(C.clay(name, hex_))
    return o


HANDS = []
for k, (phi, hex_) in enumerate(((198, C.CRIMSON), (244, C.FLAME), (296, C.EMBER), (342, C.LEAF))):
    ph = math.radians(phi)
    radial = Vector((math.cos(ph), 0, math.sin(ph)))
    up_tangent = Vector((math.sin(ph), 0, -math.cos(ph))) if phi < 270 else Vector((-math.sin(ph), 0, math.cos(ph)))
    wrist = Vector((0, -0.45, ZC)) + radial * 1.3 - up_tangent * 0.35  # just in front of the rim: thumbs overlap it, nothing intersects
    arm = (radial * 0.35 + Vector((0, 0, -1)) - up_tangent * 0.3).normalized()
    h = hand(f"Hand{k}", hex_, wrist, up_tangent, -radial + Vector((0, -0.25, 0)), arm)
    h["home"] = tuple(h.location)
    HANDS.append(h)


def animate(p):
    w = 2 * math.pi * p
    wheel.rotation_euler.y = math.radians(9) * math.sin(w)  # in-plane turn, back and forth
    wheel.location.z = ZC + 0.03 * math.sin(w)
    for k, h in enumerate(HANDS):
        hx, hy, hz = h["home"]
        h.location = (hx, hy, hz + 0.03 * math.sin(w) + 0.015 * math.sin(2 * w + k))


C.camera((0, -16.0, ZC + 0.4), (0, 0, ZC - 0.05), lens=85)
C.run(animate, FRAMES, a.still, cove=cove)
