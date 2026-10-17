"""morph-loop: one satin hero that never stops morphing, sphere -> torus (a hole punches
through) -> 17-scallop ring (the SDG wheel) -> four lobes (our four goals) -> sphere,
striped in the 17 SDG colours, while three small satellites ride two tilted dotted
orbits. 300 frames at 30 fps on a #EEF2F6 cove; frame 301 == frame 1.

The hero is one torus-topology mesh. Every form is a shape key over the same (u, v)
grid: closed forms (sphere, lobes) collapse the inner half of the tube onto the axis,
so the hole opens and closes without tearing.

blender -b --python morph_loop.py -- --out <dir> [--res 1080] [--still N]
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "morph-loop"), res=1080, still=0, samples=64)
FRAMES, BG = 300, "#EEF2F6"
H = 1.8                        # hero centre height above the cove floor
SEG = 24                       # u segments per SDG sector
U, V = 17 * SEG, 192
INK, YELLOW, NAVY = "#0E1530", "#FCC30B", "#202F60"

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
bpy.context.scene.render.fps = 30
cove = C.cove(BG, wall_y=4.0)
C.tarka_lights(BG, target=(0, 0, H), key=600, dist=4.5, key_dir=(-0.62, -0.9, 1.3), key_size=3.2)


# ---------------------------------------------------------------- hero forms over (u, v)
# u runs around the axis, v around the tube (0 outer equator, pi/2 top, pi inner equator).
def sphere(u, v):
    return max(math.cos(v), 0.0), math.sin(v)  # inner half sits on the axis: closed


def torus(u, v):
    return 0.66 + 0.36 * math.cos(v), 0.36 * math.sin(v)


def scallops(u, v):
    r = 0.39 * (1 - 0.42 * math.cos(17 * u / 2) ** 8)  # necks on the sector boundaries
    return 0.65 + r * math.cos(v), 0.85 * r * math.sin(v)


def lobes(u, v):
    l = 0.64 + 0.40 * abs(math.cos(2 * u)) ** 1.2  # smooth clefts (exponent > 1)
    return max(math.cos(v), 0.0) * l, 0.62 * math.sin(v)


FORMS = [sphere, torus, scallops, lobes]


def coords(form):
    out = []
    for i in range(U):
        u = 2 * math.pi * i / U
        cu, su = math.cos(u), math.sin(u)
        for j in range(V):
            rho, z = form(u, 2 * math.pi * j / V)
            out.append((rho * cu, rho * su, z))
    return out


bm = bmesh.new()
verts = [bm.verts.new(c) for c in coords(torus)]  # build on the torus so normals recalc cleanly
for i in range(U):
    for j in range(V):
        i1, j1 = (i + 1) % U, (j + 1) % V
        bm.faces.new((verts[i * V + j], verts[i1 * V + j], verts[i1 * V + j1], verts[i * V + j1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
mat = C.satin("hero", "#FFFFFF")
hero = C.mesh_object("Hero", bm, mat)
me = hero.data

# 17 SDG sectors as face-corner colours: hard edges on the sector boundaries (the scallop necks)
col = me.color_attributes.new("sdg", "BYTE_COLOR", "CORNER")
sector = [C.SDG[(p.index // V) // SEG] for p in me.polygons]
for p in me.polygons:
    h = sector[p.index].lstrip("#")
    c = tuple(int(h[k:k + 2], 16) / 255 for k in (0, 2, 4)) + (1.0,)
    for li in p.loop_indices:
        col.data[li].color_srgb = c
nt = mat.node_tree
vc = nt.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "sdg"
nt.links.new(vc.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])

shapes = [coords(f) for f in FORMS]
basis = hero.shape_key_add(name="Basis", from_mix=False)
for v, c in zip(me.vertices, shapes[0]):
    v.co = c
basis.data.foreach_set("co", [x for c in shapes[0] for x in c])
keys = []
for f, s in zip(FORMS[1:], shapes[1:]):
    k = hero.shape_key_add(name=f.__name__, from_mix=False)
    k.data.foreach_set("co", [x for c in s for x in c])
    keys.append(k)
HERO_R = max(Vector(c).length for s in shapes for c in s)


# ---------------------------------------------------------------- satellites on dotted orbits
def orbit_frame(gamma, incl):
    """Circle facing the camera, tipped back by incl, then turned by gamma in view."""
    m = Matrix.Rotation(math.radians(gamma), 3, "Y") @ Matrix.Rotation(math.radians(incl), 3, "X")
    return m @ Vector((1, 0, 0)), m @ Vector((0, 0, 1))


ORBITS = [  # (radius, gamma, incl, cycles per loop)
    (1.36, -22.0, 70.0, 1),
    (1.64, 26.0, 74.0, -1),
]


def on_orbit(k, phi):
    r, g, i, _ = ORBITS[k]
    e1, e2 = orbit_frame(g, i)
    return Vector((0, 0, H)) + r * (math.cos(phi) * e1 + math.sin(phi) * e2), (-math.sin(phi) * e1 + math.cos(phi) * e2)


dot_mat = bpy.data.materials.new("orbit-dot")  # flat drawn dots, navy at low contrast
dn = dot_mat.node_tree
dn.nodes.clear()
em = dn.nodes.new("ShaderNodeEmission")
navy, bg = C.lin(NAVY), C.lin(BG)
em.inputs["Color"].default_value = tuple(0.38 * n + 0.62 * b for n, b in zip(navy[:3], bg[:3])) + (1,)
dn.links.new(em.outputs[0], dn.nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
for k, (r, *_rest) in enumerate(ORBITS):
    n = round(2 * math.pi * r / 0.085)
    for d in range(n):
        o = C.uv_sphere(f"Dot{k}_{d}", 0.011, dot_mat, seg=10)
        o.location = on_orbit(k, 2 * math.pi * d / n)[0]
        o.visible_shadow = False

SAT_R = 0.13  # largest radial half-extent of any satellite
sats = [  # (object, orbit, phase)
    (C.uv_sphere("SatSphere", 0.105, C.satin("sat-yellow", YELLOW)), 0, 0.0),
    (C.capsule("SatCapsule", 0.068, 0.16, C.satin("sat-navy", NAVY)), 0, math.pi),
    (C.rounded_box("SatCube", (0.18, 0.18, 0.18), C.satin("sat-ink", INK), radius=0.05), 1, 0.6),
]
# self-check: orbits sit on concentric spheres, so these gaps hold at every frame
assert ORBITS[0][0] - SAT_R > HERO_R + 0.05, (HERO_R, ORBITS[0][0])
assert ORBITS[1][0] - ORBITS[0][0] > 2 * SAT_R


def animate(p):
    w = 2 * math.pi * p
    # morph: four equal legs, sine-eased, chain ends where it began
    seg = p * len(FORMS)
    leg, x = int(seg) % len(FORMS), seg - int(seg)
    e = 0.5 - 0.5 * math.cos(math.pi * x)
    weights = [0.0] * len(FORMS)
    weights[leg] += 1 - e
    weights[(leg + 1) % len(FORMS)] += e
    for k, wk in zip(keys, weights[1:]):
        k.value = wk
    # one even spin per loop about the hero's axis; the axis precesses gently (whole cycles)
    hero.matrix_world = (Matrix.Translation((0, 0, H))
                         @ Matrix.Rotation(math.radians(12) * math.sin(w), 4, "Z")
                         @ Matrix.Rotation(math.radians(64 + 5 * math.cos(w)), 4, "X")
                         @ Matrix.Rotation(w, 4, "Z"))
    for o, k, ph in sats:
        pos, tan = on_orbit(k, ph + ORBITS[k][3] * w)
        o.location = pos
        if o.name == "SatCapsule":   # rides lengthwise along its track
            o.rotation_euler = tan.to_track_quat("Z", "Y").to_euler()
        elif o.name == "SatCube":    # slow tumble, whole turns
            o.rotation_euler = (w, 0.0, w)


# hero ~50% of frame width, strictly centred
C.camera((0, -9.2, H), (0, 0, H), lens=85)
C.run(animate, FRAMES, a.still, cove=cove)
