"""Build one render end to end (system Python 3.12 + Pillow).

python make.py <name> [--render] [--webm-crf N] [--mp4-crf N] [--size 0]

  --render  run the Blender scene script into _frames/<name>/ (PNG)
Then, by kind:
  alpha  (r2) poster from frame 1 keeps alpha; webm = VP9 + alpha; mp4 = frames on #0E1530
  cove   (r3) opaque cove renders: poster from frame 1, webm VP9 and mp4 H.264 as rendered
  seq    PNG frames -> 0001..NNNN.webp (+ an optional poster from a chosen frame)
  still  frame 1 -> <name>.webp
Cove renders also print the measured colour of the outer 15% of the poster frame,
so the page background can match the backdrop exactly.
"""
import argparse
import os
import struct
import subprocess
import time

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BLENDER = r"D:/tools/blender-5.2.2-windows-x64/blender.exe"
R2 = os.path.normpath(os.path.join(HERE, "../../concepts/assets/r2/renders"))
R3 = os.path.normpath(os.path.join(HERE, "../../concepts/assets/r3"))
NAVY_BG = "#0E1530"
# name -> (script args, output dir, kind, backdrop hex, extras)
SCENES = {
    "wheel-bloom": (["wheel.py", "--mode", "loop"], R2, "alpha", None, {}),
    "wheel-assemble": (["wheel.py", "--mode", "assemble"], R2, "seq", None, {"q": 78}),
    "ribbons": (["ribbons.py"], R2, "alpha", None, {}),
    "glass-globe": (["globe.py"], R2, "alpha", None, {}),
    "sticker-pile": (["stickers.py"], R2, "alpha", None, {}),
    "hero-wheel-seq": (["hero_wheel.py"], R3, "seq", "#EEF2F6", {"q": 80, "poster": ("hero-wheel-poster", -1)}),
    "sdg4-books": (["sdg4_books.py"], R3, "cove", "#C5192D", {}),
    "sdg5-balance": (["sdg5_balance.py"], R3, "cove", "#FF3A21", {}),
    "sdg9-gears": (["sdg9_gears.py"], R3, "cove", "#FD6925", {}),
    "sdg13-leaf": (["sdg13_leaf.py"], R3, "cove", "#3F7E44", {}),
    "hands-wheel": (["hands_wheel.py"], R3, "cove", "#0E1530", {}),
    "kl-towers": (["kl_towers.py"], R3, "still", "#EEF2F6", {}),
    "morph-loop": (["morph_loop.py"], R3, "cove", "#EEF2F6", {"fps": 30}),
}


def blender(script, *args):
    subprocess.run([BLENDER, "-b", "--python", os.path.join(HERE, script), "--", *args],
                   check=True, stdout=subprocess.DEVNULL)


def edge_colour(path, hex_):
    """Median colour of the outer 15% band, plus 95th-percentile / max deviation from hex."""
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px, bx, by = im.load(), int(w * 0.15), int(h * 0.15)
    band = [px[x, y] for y in range(0, h, 2) for x in range(0, w, 2)
            if x < bx or x >= w - bx or y < by or y >= h - by]
    med = [sorted(c[i] for c in band)[len(band) // 2] for i in range(3)]
    t = [int(hex_[i:i + 2], 16) for i in (1, 3, 5)]
    dev = sorted(max(abs(c[i] - t[i]) for i in range(3)) for c in band)
    return "#%02X%02X%02X" % tuple(med), dev[int(len(dev) * 0.95)], dev[-1]


def faststart(path):
    """Move the mp4 'moov' box ahead of 'mdat' (ffmpeg -movflags +faststart) and shift chunk offsets."""
    d = open(path, "rb").read()
    boxes, i = [], 0
    while i < len(d):
        size, typ = struct.unpack(">I4s", d[i:i + 8])
        size = size or len(d) - i
        assert size >= 8, "64-bit box sizes not handled"
        boxes.append((typ, d[i:i + size]))
        i += size
    names = [t for t, _ in boxes]
    mi, di = names.index(b"moov"), names.index(b"mdat")
    if mi < di:
        return
    moov = bytearray(boxes[mi][1])
    shift = len(moov)

    def patch(lo, hi):  # walk containers down to stco / co64
        j = lo
        while j < hi:
            size, typ = struct.unpack(">I4s", moov[j:j + 8])
            if typ in (b"trak", b"mdia", b"minf", b"stbl"):
                patch(j + 8, j + size)
            elif typ in (b"stco", b"co64"):
                n, w = struct.unpack(">I", moov[j + 12:j + 16])[0], 4 if typ == b"stco" else 8
                f = ">I" if w == 4 else ">Q"
                for k in range(n):
                    o = j + 16 + k * w
                    moov[o:o + w] = struct.pack(f, struct.unpack(f, moov[o:o + w])[0] + shift)
            j += size

    patch(8, len(moov))
    order = boxes[:di] + [(b"moov", bytes(moov))] + [b for k, b in enumerate(boxes[di:], di) if k != mi]
    open(path, "wb").write(b"".join(b for _, b in order))


def webp(src, dst, q, size=0):
    im = Image.open(src)
    if size:
        im = im.resize((size, round(im.height * size / im.width)), Image.LANCZOS)
    im.save(dst, quality=q, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name", choices=SCENES)
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--webm-crf", type=int, default=0, help="0 = 28 for alpha, 24 for opaque")
    ap.add_argument("--mp4-crf", type=int, default=20)
    ap.add_argument("--size", type=int, default=0, help="output width, 0 = as rendered")
    a = ap.parse_args()
    script, out, kind, hex_, extra = SCENES[a.name]
    frames = os.path.join(HERE, "_frames", a.name)
    os.makedirs(out, exist_ok=True)

    if a.render:
        t = time.time()
        blender(script[0], *script[1:], "--out", frames)
        print(f"render {a.name}: {time.time() - t:.0f}s")

    pngs = sorted(f for f in os.listdir(frames) if f.endswith(".png"))
    if hex_:
        poster_frame = pngs[extra["poster"][1]] if "poster" in extra else pngs[0]
        med, p95, mx = edge_colour(os.path.join(frames, poster_frame), hex_)
        print(f"edge {a.name}: median {med} (target {hex_}), p95 dev {p95}, max dev {mx}")

    if kind == "still":
        dst = os.path.join(out, f"{a.name}.webp")
        webp(os.path.join(frames, pngs[0]), dst, 86, a.size)
        print(f"{dst}: {os.path.getsize(dst) / 1e3:.0f} KB")
        return
    if kind == "seq":
        dst = os.path.join(out, a.name)
        os.makedirs(dst, exist_ok=True)
        for f in pngs:
            webp(os.path.join(frames, f), os.path.join(dst, f[:-4] + ".webp"), extra["q"], a.size)
        total = sum(os.path.getsize(os.path.join(dst, f)) for f in os.listdir(dst))
        print(f"{len(pngs)} webp frames -> {dst} ({total / 1e6:.2f} MB)")
        if "poster" in extra:
            name, idx = extra["poster"]
            webp(os.path.join(frames, pngs[idx]), os.path.join(out, f"{name}.webp"), 86, a.size)
        return

    webp(os.path.join(frames, pngs[0]), os.path.join(out, f"{a.name}-poster.webp"), 86 if kind == "alpha" else 82, a.size)
    flat = frames
    if kind == "alpha":  # Safari can't play webm alpha: mp4 gets the frames on navy
        flat = frames + "-bg"
        os.makedirs(flat, exist_ok=True)
        for f in pngs:
            im = Image.open(os.path.join(frames, f)).convert("RGBA")
            bg = Image.new("RGBA", im.size, NAVY_BG)
            bg.alpha_composite(im)
            bg.convert("RGB").save(os.path.join(flat, f), compress_level=1)
    webm_crf = a.webm_crf or (28 if kind == "alpha" else 24)  # flat coves compress well: spend it on detail
    for src, ext, crf in ((frames, "webm", webm_crf), (flat, "mp4", a.mp4_crf)):
        dst = os.path.join(out, f"{a.name}.{ext}")
        blender("encode.py", "--src", src, "--dst", dst, "--crf", str(crf), "--size", str(a.size),
                "--fps", str(extra.get("fps", 24)))
        if ext == "mp4":
            faststart(dst)
        print(f"{dst}: {os.path.getsize(dst) / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
