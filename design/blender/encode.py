"""Encode a PNG frame folder to video with Blender's built-in FFmpeg (VSE).

blender -b --python encode.py -- --src <png dir> --dst <file.webm|.mp4> [--crf 32] [--size 0] [--fps 24]

.webm -> VP9 (with alpha when the PNGs have it). .mp4 -> H.264 (frames should already be opaque).
"""
import os
import sys

import bpy
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

a = C.args(src="", dst="", crf=32, size=0, fps=24)
files = sorted(f for f in os.listdir(a.src) if f.endswith(".png"))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
img = bpy.data.images.load(os.path.join(a.src, files[0]))
w, h = img.size
if a.size:  # scale to a target width, keep even dimensions for the codecs
    w, h = a.size, round(h * a.size / w / 2) * 2
r = sc.render
r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
r.fps = a.fps
sc.frame_start, sc.frame_end = 1, len(files)
sc.view_settings.view_transform = "Standard"  # frames are already display-referred

strip = sc.sequence_editor_create().strips.new_image("frames", os.path.join(a.src, files[0]), 1, 1, fit_method="FIT")
for f in files[1:]:
    strip.elements.append(f)

webm = a.dst.endswith(".webm")
ims = r.image_settings
ims.media_type = "VIDEO"
ims.file_format = "FFMPEG"
ff = r.ffmpeg
ff.format, ff.codec = ("WEBM", "WEBM") if webm else ("MPEG4", "H264")
alpha = webm and img.depth == 32  # only carry alpha when the frames have it
ims.color_mode = "RGBA" if alpha else "RGB"
r.film_transparent = alpha
ff.constant_rate_factor = "CUSTOM"
ff.custom_constant_rate_factor = a.crf
ff.ffmpeg_preset = "BEST"
ff.gopsize = len(files)
ff.audio_codec = "NONE"
r.filepath = a.dst
r.use_file_extension = False
bpy.ops.render.render(animation=True)
