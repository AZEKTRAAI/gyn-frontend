"""sticker-pile: chunky navy clay "GYN" with SDG-coloured toys bobbing around it
(spheres, pills, rings, stars, a paper plane). 1600x900, 96-frame loop.

blender -b --python stickers.py -- --out <dir> [--w 1600] [--still N]
"""
import math
import os
import sys

import bmesh
import bpy
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "sticker-pile"), w=1600, still=0, samples=64)
FRAMES = 96
FONT = "C:/Windows/Fonts/seguibl.ttf"  # Segoe UI Black: round, heavy, friendly

C.new_scene("BLENDER_EEVEE", a.w, a.w * 9 // 16, FRAMES, a.out, a.samples)
C.studio_world(0.7, key_dir=(-0.7, -0.2, 0.7))
TAU = 2 * math.pi

# ---------------------------------------------------------------- letters
font = bpy.data.fonts.load(FONT)
navy = C.clay("navy", C.NAVY)
letters, x = [], 0.0
for ch in "GYN":
    cu = bpy.data.curves.new(ch, "FONT")
    cu.body, cu.font = ch, font
    cu.size = 2.3
    cu.extrude = 0.24
    cu.bevel_depth = 0.07
    cu.bevel_resolution = 5
    cu.align_x, cu.align_y = "CENTER", "CENTER"
    o = bpy.data.objects.new(ch, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(navy)
    o.rotation_euler.x = math.pi / 2
    letters.append(o)
bpy.context.view_layer.update()
widths = [o.dimensions.x for o in letters]
total = sum(widths) + 0.12 * 2
x = -total / 2
for o, w in zip(letters, widths):
    o["home"] = (x + w / 2, 0.0, 0.0)
    x += w + 0.12


# ---------------------------------------------------------------- toys
def sphere(r):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=r)
    return bm


def pill(r):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=25, radius=r)  # odd: no equator ring
    for v in bm.verts:
        v.co.z += r * 1.1 * (1 if v.co.z > 0 else -1)
    return bm


def star(r):
    pts = [((r if k % 2 == 0 else r * 0.48) * math.cos(math.pi / 2 + k * math.pi / 5),
            (r if k % 2 == 0 else r * 0.48) * math.sin(math.pi / 2 + k * math.pi / 5)) for k in range(10)]
    return C.extrude_outline(bmesh.new(), pts, r * 0.42)


def plane(r):
    bm = bmesh.new()
    v = [bm.verts.new((r * px, r * py, r * pz)) for px, py, pz in
         ((1, 0, 0), (-0.6, 0.55, 0.2), (-0.6, -0.55, 0.2), (-0.6, 0, 0), (-0.6, 0, -0.24))]
    for f in ((v[0], v[1], v[3]), (v[0], v[3], v[2]), (v[0], v[4], v[3])):
        bm.faces.new(f)
    return bm


def toy(kind, goal, loc, size, rot=(0, 0, 0)):
    mat = (C.clay if kind in ("star", "plane") else C.glossy)(f"{kind}{goal}", C.SDG[goal - 1])
    if kind == "ring":
        bpy.ops.mesh.primitive_torus_add(major_radius=size, minor_radius=size * 0.36,
                                         major_segments=64, minor_segments=24)
        o = bpy.context.active_object
        o.data.shade_smooth()
        o.data.materials.append(mat)
    else:
        bm = {"sphere": sphere, "pill": pill, "star": star, "plane": plane}[kind](size)
        o = C.mesh_object(f"{kind}{goal}", bm, mat, smooth=kind != "plane")
        if kind == "star":
            C.bevel(o, width=size * 0.12, segments=5)
        if kind == "plane":
            s = o.modifiers.new("Paper", "SOLIDIFY")
            s.thickness = 0.03
            C.bevel(o, width=0.008, segments=2)
    o["home"], o["rot"] = loc, rot
    return o


# kind, SDG goal, (x, depth, z), size, base rotation (deg)
TOYS = [toy(k, g, l, s, tuple(math.radians(d) for d in r)) for k, g, l, s, r in [
    ("sphere", 4, (-3.55, 0.5, 1.45), 0.42, (0, 0, 0)),
    ("pill", 5, (-2.05, -0.5, 1.7), 0.2, (0, 55, 10)),
    ("ring", 13, (2.35, 0.3, 1.45), 0.36, (70, 20, 0)),
    ("star", 7, (3.65, -0.3, 0.45), 0.5, (90, 15, 0)),
    ("plane", 14, (-3.3, -0.6, -0.75), 0.62, (65, 0, 25)),
    ("sphere", 9, (0.9, -1.6, -1.5), 0.3, (0, 0, 0)),
    ("sphere", 3, (3.1, 1.0, -1.35), 0.36, (0, 0, 0)),
    ("pill", 10, (-2.15, 0.6, -1.55), 0.21, (0, -60, 0)),
    ("star", 2, (0.4, 1.6, 1.75), 0.38, (90, -20, 0)),
    ("ring", 1, (-0.95, -1.3, -1.6), 0.26, (60, -30, 0)),
    ("sphere", 6, (0.75, 2.2, 1.45), 0.26, (0, 0, 0)),
    ("pill", 11, (3.95, 0.6, -0.75), 0.19, (0, 25, 0)),
    ("sphere", 16, (-4.1, 1.6, 0.35), 0.27, (0, 0, 0)),
    ("sphere", 12, (1.85, -0.9, 1.95), 0.17, (0, 0, 0)),
    ("star", 15, (-0.8, -2.0, 1.45), 0.28, (80, 25, 0)),
    ("sphere", 8, (1.85, 1.4, -1.85), 0.22, (0, 0, 0)),
    ("ring", 17, (4.1, 1.3, 1.65), 0.28, (40, 60, 0)),
    ("pill", 9, (-0.1, 1.5, -2.1), 0.17, (0, 80, 30)),
]]

C.area("Key", (-5, -6, 6), size=6, energy=1600)
C.area("Rim", (5, 5, 4), size=4, energy=2600, color=(0.92, 0.95, 1.0))
C.area("Kick", (-6, 4, -1), size=3, energy=600, color=(1.0, 0.9, 0.82))
C.area("Fill", (2, -8, -2), size=8, energy=120)


def animate(p):
    w = TAU * p
    for i, o in enumerate(letters):
        hx, hy, hz = o["home"]
        o.location = (hx, hy, hz + 0.07 * math.sin(w - i * TAU / 3))
        o.rotation_euler = (math.pi / 2, math.radians(3) * math.sin(w - i * TAU / 3 + 1), 0)
    for i, o in enumerate(TOYS):
        hx, hy, hz = o["home"]
        rx, ry, rz = o["rot"]
        f = 1 + i % 2                # integer cycles per loop keep it seamless
        ph = i * 2.39996             # golden-angle phases so nothing moves in sync
        if o.name.startswith("plane"):  # paper plane drifts on a figure-eight and banks
            o.location = (hx + 0.3 * math.sin(w), hy, hz + 0.16 * math.sin(2 * w))
            o.rotation_euler = (rx + math.radians(18) * math.cos(w), ry + math.radians(10) * math.cos(2 * w), rz)
            continue
        o.location = (hx + 0.05 * math.sin(w + ph), hy, hz + 0.13 * math.sin(f * w + ph))
        o.rotation_euler = (rx + math.radians(14) * math.sin(w + ph),
                            ry + math.radians(20) * math.sin(w + ph * 0.5),
                            rz + (w if o.name.startswith("ring") else math.radians(16) * math.sin(w + ph)))


C.camera((0, -12, 0.9), (0, 0, 0.05), lens=50, fstop=0.9, focus=(0, -0.3, 0.05))
C.run(animate, FRAMES, a.still)
