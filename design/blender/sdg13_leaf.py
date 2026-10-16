"""sdg13-leaf: half a satin globe (SDG 14 blue sea, light raised land) with one large
soft leaf growing from the top and swaying, on a #3F7E44 cove (SDG 13 Climate Action).

blender -b --python sdg13_leaf.py -- --out <dir> [--res 1080] [--still N]
"""
import math
import os
import sys

import bmesh
import bpy
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "sdg13-leaf"), res=1080, still=0, samples=64)
FRAMES, BG = 96, "#3F7E44"
SEA, LAND, LEAF = "#0A97D9", "#E6ECDC", "#4C9F38"
R = 1.0

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
cove = C.cove(BG, wall_y=3.0)
C.tarka_lights(BG, target=(0, 0, 1.0), key=480, dist=4.5, key_dir=(-0.6, -0.6, 1.8))

# Dome: upper half of a sphere, closed underneath.
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=96, v_segments=48, radius=R)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context="VERTS")
bmesh.ops.holes_fill(bm, edges=bm.edges, sides=0)
globe = C.mesh_object("Globe", bm, C.satin("globe", SEA))
nt = globe.data.materials[0].node_tree
N, L = nt.nodes.new, nt.links.new
bsdf = nt.nodes["Principled BSDF"]
tc, noise, ramp, bump = N("ShaderNodeTexCoord"), N("ShaderNodeTexNoise"), N("ShaderNodeValToRGB"), N("ShaderNodeBump")
L(tc.outputs["Object"], noise.inputs["Vector"])
noise.inputs["Scale"].default_value = 1.6
noise.inputs["Detail"].default_value = 3.0
noise.inputs["Roughness"].default_value = 0.45
L(noise.outputs["Fac"], ramp.inputs["Fac"])
ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[1].position = 0.53, 0.56  # soft coastline
L(ramp.outputs["Color"], bump.inputs["Height"])
bump.inputs["Strength"].default_value = 0.35
L(bump.outputs["Normal"], bsdf.inputs["Normal"])
mix = N("ShaderNodeMix")
mix.data_type = "RGBA"
mix.inputs["A"].default_value = C.lin(SEA)
mix.inputs["B"].default_value = C.lin(LAND)
L(ramp.outputs["Color"], mix.inputs["Factor"])
L(mix.outputs["Result"], bsdf.inputs["Base Color"])

# Leaf: lens-shaped blade, V-folded along the midrib and curling at the tip, on a short stem.
LEN, WID = 1.9, 0.62
bm = bmesh.new()
rows = []
for i in range(41):
    u = i / 40
    w = WID * math.sin(math.pi * min(u * 1.04, 1.0)) ** 0.85
    row = []
    for j in range(13):
        v = j / 6 - 1
        x = v * w
        row.append(bm.verts.new((x, u * LEN, 0.35 * abs(x) ** 1.3 + 0.25 * u * u)))
    rows.append(row)
for r0, r1 in zip(rows, rows[1:]):
    for j in range(12):
        bm.faces.new((r0[j], r0[j + 1], r1[j + 1], r1[j]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
leaf_mat = C.satin("leaf", LEAF)
leaf = C.mesh_object("Leaf", bm, leaf_mat)
sol = leaf.modifiers.new("Thick", "SOLIDIFY")
sol.thickness, sol.offset = 0.04, 0
sub = leaf.modifiers.new("Soft", "SUBSURF")
sub.levels = sub.render_levels = 2

sway = C.empty("Sway", (0, 0, R - 0.02))
stem_cu = bpy.data.curves.new("stem", "CURVE")
stem_cu.dimensions = "3D"
stem_cu.bevel_depth, stem_cu.bevel_resolution = 0.04, 6
stem_cu.use_fill_caps = True
sp = stem_cu.splines.new("BEZIER")
sp.bezier_points.add(1)
for bp, co in zip(sp.bezier_points, ((0, 0, -0.05), (0.08, 0, 0.38))):
    bp.co = co
    bp.handle_left_type = bp.handle_right_type = "AUTO"
stem = bpy.data.objects.new("Stem", stem_cu)
bpy.context.collection.objects.link(stem)
stem_cu.materials.append(leaf_mat)
stem.parent = sway
leaf.parent = sway
leaf.location = (0.08, 0, 0.34)
leaf.rotation_euler = (math.radians(90), math.radians(32), math.radians(-18))  # stands up, leans right, blade to camera


def animate(p):
    w = 2 * math.pi * p
    sway.rotation_euler = (math.radians(4) * math.sin(w + 0.6), math.radians(7) * math.sin(w), 0)
    globe.rotation_euler.z = math.radians(10) * math.sin(w)


C.camera((2.4, -10.6, 1.4), (0.3, 0, 1.45), lens=85)
C.run(animate, FRAMES, a.still, cove=cove)
