"""sdg9-gears: three soft interlocking gears (navy, white, yellow) turning together on a
#FD6925 cove (SDG 9 Industry, Innovation and Infrastructure).

Teeth share one pitch, so speeds follow tooth counts; each gear turns exactly one
tooth per loop, which keeps the loop seamless. An assert checks no teeth clip.

blender -b --python sdg9_gears.py -- --out <dir> [--res 1080] [--still N]
"""
import math
import os
import sys

import bmesh
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "sdg9-gears"), res=1080, still=0, samples=64)
FRAMES, BG = 96, "#FD6925"
PITCH, AMP, THICK, CLEAR = 0.07, 0.085, 0.3, 0.03  # pitch radius per tooth, tooth height, clearance
TAU = 2 * math.pi


def profile(x):
    """Rounded tooth wave: +1 on teeth, -1 in gaps; teeth a bit narrower than gaps."""
    return math.tanh(4 * (math.cos(x) - 0.15)) / math.tanh(4 * 0.85)


def radius(n, ang):
    return PITCH * n + AMP * profile(n * ang)


# (teeth, colour); gear 0 drives, the others mesh with it at angle beta
GEARS = [(14, C.NAVY), (10, "#F6F4EF"), (8, "#FCC30B")]
BETAS = [None, math.radians(-25), math.radians(128)]
centres, phases = [(-0.2, 0.2)], [0.0]
for (n, _), beta in zip(GEARS[1:], BETAS[1:]):
    n0 = GEARS[0][0]
    d = PITCH * (n0 + n) + CLEAR
    centres.append((centres[0][0] + d * math.cos(beta), centres[0][1] + d * math.sin(beta)))
    # gear 0 shows phase u at beta; the partner must show pi - u at beta + pi (tooth into gap)
    phases.append(beta + math.pi - (math.pi - n0 * (beta - phases[0])) / n)


def angles(p):
    """Rotation of each gear at loop phase p: gear 0 advances one tooth per loop."""
    n0 = GEARS[0][0]
    d0 = TAU / n0 * p
    return [phases[0] + d0] + [ph - d0 * n0 / n for (n, _), ph in zip(GEARS[1:], phases[1:])]


# self-check: sample the loop and make sure gear 0's outline never enters a partner
for k in range(48):
    rot = angles(k / 48)
    for g in (1, 2):
        cx, cy = centres[g]
        for j in range(720):
            t = TAU * j / 720
            r0 = radius(GEARS[0][0], t - rot[0])
            px, py = centres[0][0] + r0 * math.cos(t), centres[0][1] + r0 * math.sin(t)
            dx, dy = px - cx, py - cy
            assert math.hypot(dx, dy) > radius(GEARS[g][0], math.atan2(dy, dx) - rot[g]) + 0.005, "gears clip"

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
cove = C.cove(BG, wall_y=3.5)
C.tarka_lights(BG, target=(0, 0, 0.2), key=520, dist=4.5, key_dir=(-0.6, -0.6, 1.8))

hub_mat = C.satin("hub", BG)
gears = []
for g, ((n, hex_), (cx, cy)) in enumerate(zip(GEARS, centres)):
    pts = [(radius(n, TAU * j / (n * 24)) * math.cos(TAU * j / (n * 24)),
            radius(n, TAU * j / (n * 24)) * math.sin(TAU * j / (n * 24))) for j in range(n * 24)]
    o = C.mesh_object(f"Gear{g}", C.extrude_outline(bmesh.new(), pts, THICK), C.satin(f"gear{g}", hex_))
    C.bevel(o, width=0.06, segments=6)
    o.location = (cx, cy, THICK / 2 + 0.002)
    hub = C.capsule(f"Hub{g}", 0.16 + 0.012 * n, 0.12, hub_mat)  # soft button on the axle
    hub.scale.z = 0.55
    hub.location = (0, 0, THICK / 2)
    hub.parent = o
    gears.append(o)


def animate(p):
    for o, rot in zip(gears, angles(p)):
        o.rotation_euler.z = rot


el, az, dist = math.radians(32), math.radians(-18), 21.0
tgt = (0.15, 0.4, 0.15)  # middle of the cluster
C.camera((tgt[0] + dist * math.cos(el) * math.sin(az), tgt[1] - dist * math.cos(el) * math.cos(az),
          tgt[2] + dist * math.sin(el)), tgt, lens=110)
C.run(animate, FRAMES, a.still, cove=cove)
