"""sdg4-books: a short stack of rounded books on a #C5192D cove (SDG 4 Quality Education).

The top book lies open and its pages fan up into a small staircase. Loop: the
pages breathe open and closed a little while the stack sways on a slow turntable.

blender -b --python sdg4_books.py -- --out <dir> [--res 1080] [--still N]
"""
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(out=os.path.join(C.HERE, "_frames", "sdg4-books"), res=1080, still=0, samples=64)
FRAMES, BG = 96, "#C5192D"
PAGE, CRIMSON, NAVY, WHITE = "#F3E8D2", "#8C1424", C.NAVY, "#F6F4EF"

C.new_scene("BLENDER_EEVEE", a.res, a.res, FRAMES, a.out, a.samples, transparent=False, view="Standard", fast_gi=False)
cove = C.cove(BG, wall_y=3.0)
C.tarka_lights(BG, target=(0, 0, 0.5), key=420, dist=4.0, key_dir=(-1.0, -0.3, 1.5))  # shadow falls camera-side, short

page_mat = C.principled("pages", PAGE, rough=0.6, sheen=0.2, spec=0.35)  # no SSS: stays clean
stack = C.empty("Stack")


def book(name, cover_hex, w, d, t, z, turn):
    """Closed book: two cover boards and a spine around an inset page block."""
    root = C.empty(name, (0, 0, z))
    root.rotation_euler.z = math.radians(turn)
    root.parent = stack
    cover = C.satin(name, cover_hex)
    board = 0.04
    parts = [C.rounded_box(f"{name}Bottom", (w, d, board), cover, 0.018),
             C.rounded_box(f"{name}Top", (w, d, board), cover, 0.018),
             C.rounded_box(f"{name}Spine", (board * 1.6, d, t), cover, 0.03),
             C.rounded_box(f"{name}Pages", (w - 0.09, d - 0.07, t - 2 * board + 0.01), page_mat, 0.03)]
    parts[0].location = (0, 0, board / 2)
    parts[1].location = (0, 0, t - board / 2)
    parts[2].location = (-w / 2 + board * 0.8, 0, t / 2)
    parts[3].location = (0.01, 0, t / 2)
    for p in parts:
        p.parent = root
    return root


book("Navy", NAVY, 1.7, 1.18, 0.30, 0.0, 6)
book("White", WHITE, 1.55, 1.08, 0.26, 0.30, -7)

# Open book: two half-boards with page blocks rising to the spine, plus fanning sheets.
OPEN_Z, HW, D = 0.56, 0.74, 1.04
top = C.empty("Open", (0.02, -0.02, OPEN_Z))
top.rotation_euler.z = math.radians(10)
top.parent = stack
cover = C.satin("crimson", CRIMSON)
for side in (-1, 1):
    half = C.empty(f"Half{side}")
    half.parent = top
    half.rotation_euler.y = math.radians(5 * side)  # halves rise gently towards the spine
    b = C.rounded_box(f"Board{side}", (HW, D, 0.035), cover, 0.016)
    b.location = (side * HW / 2, 0, 0.0175)
    p = C.rounded_box(f"Block{side}", (HW - 0.05, D - 0.06, 0.07), page_mat, 0.03)
    p.location = (side * (HW / 2 - 0.01), 0, 0.07)
    b.parent = p.parent = half

sheets = []
for k in range(6):
    hinge = C.empty(f"Hinge{k}", (0, 0, 0.11))
    hinge.parent = top
    s = C.rounded_box(f"Sheet{k}", (HW - 0.07, D - 0.08, 0.016), page_mat, 0.007, 3)
    s.location = ((HW - 0.07) / 2 + 0.01, 0, 0)
    s.parent = hinge
    sheets.append(hinge)


def animate(p):
    w = 2 * math.pi * p
    stack.rotation_euler.z = math.radians(-18 + 10 * math.sin(w))  # slow turntable sway
    for k, h in enumerate(sheets):  # each sheet one step higher: a small staircase
        h.rotation_euler.y = -math.radians((k + 1) * 17 + 5 * math.sin(w - k * 0.45))


C.camera((4.8, -5.7, 3.3), (0.25, 0, 0.5), lens=85)  # stack sits left: shadow stays off the frame edge
C.run(animate, FRAMES, a.still, cove=cove)
