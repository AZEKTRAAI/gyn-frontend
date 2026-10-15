"""Build one concept render end to end (system Python 3.12 + Pillow).

python make.py <name> [--render] [--webm-crf 34] [--mp4-crf 26] [--size 0]

  1. --render: run the Blender scene script into _frames/<name>/ (RGBA PNG)
  2. poster: frame 1 -> <name>-poster.webp (keeps alpha)
  3. webm:   VP9 + alpha straight from the RGBA frames
  4. mp4:    frames composited on #0E1530, H.264 (Safari fallback)
wheel-assemble instead exports the frames as 0001..0048.webp (q78).
"""
import argparse
import os
import subprocess
import time

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BLENDER = r"D:/tools/blender-5.2.2-windows-x64/blender.exe"
OUT = os.path.normpath(os.path.join(HERE, "../../concepts/assets/r2/renders"))
BG = "#0E1530"
SCENES = {  # name -> scene script + its args
    "wheel-bloom": ["wheel.py", "--mode", "loop"],
    "wheel-assemble": ["wheel.py", "--mode", "assemble"],
    "ribbons": ["ribbons.py"],
    "glass-globe": ["globe.py"],
    "sticker-pile": ["stickers.py"],
}


def blender(script, *args):
    subprocess.run([BLENDER, "-b", "--python", os.path.join(HERE, script), "--", *args],
                   check=True, stdout=subprocess.DEVNULL)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name", choices=SCENES)
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--webm-crf", type=int, default=28)
    ap.add_argument("--mp4-crf", type=int, default=20)
    ap.add_argument("--size", type=int, default=0, help="output width, 0 = as rendered")
    a = ap.parse_args()
    frames = os.path.join(HERE, "_frames", a.name)
    os.makedirs(OUT, exist_ok=True)

    if a.render:
        t = time.time()
        blender(SCENES[a.name][0], *SCENES[a.name][1:], "--out", frames)
        print(f"render {a.name}: {time.time() - t:.0f}s")

    pngs = sorted(f for f in os.listdir(frames) if f.endswith(".png"))
    if a.name == "wheel-assemble":
        dst = os.path.join(OUT, a.name)
        os.makedirs(dst, exist_ok=True)
        for f in pngs:
            Image.open(os.path.join(frames, f)).save(os.path.join(dst, f[:-4] + ".webp"), quality=78, method=6)
        print(f"{len(pngs)} webp frames -> {dst}")
        return

    poster = Image.open(os.path.join(frames, pngs[0]))
    if a.size:
        poster = poster.resize((a.size, round(poster.height * a.size / poster.width)), Image.LANCZOS)
    poster.save(os.path.join(OUT, f"{a.name}-poster.webp"), quality=86, method=6)

    flat = frames + "-bg"
    os.makedirs(flat, exist_ok=True)
    for f in pngs:
        im = Image.open(os.path.join(frames, f)).convert("RGBA")
        bg = Image.new("RGBA", im.size, BG)
        bg.alpha_composite(im)
        bg.convert("RGB").save(os.path.join(flat, f), compress_level=1)

    for src, ext, crf in ((frames, "webm", a.webm_crf), (flat, "mp4", a.mp4_crf)):
        dst = os.path.join(OUT, f"{a.name}.{ext}")
        blender("encode.py", "--src", src, "--dst", dst, "--crf", str(crf), "--size", str(a.size))
        print(f"{dst}: {os.path.getsize(dst) / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
