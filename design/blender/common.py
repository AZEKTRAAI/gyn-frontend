"""Shared helpers for the GYN concept renders (Blender 5.2, run headless).

Each scene script builds everything procedurally, registers a per-frame
`animate(p)` callback where p runs 0..1 over the loop (frame 1 == frame N+1),
and renders RGBA PNG frames. make.py turns frames into webm/mp4/poster.
"""
import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))

# Official palette
NAVY, CRIMSON, FLAME, EMBER, LEAF = "#202F60", "#C52035", "#EF3F2D", "#F2692C", "#48783F"
SDG = ["#E5243B", "#DDA63A", "#4C9F38", "#C5192D", "#FF3A21", "#26BDE2", "#FCC30B",
       "#A21942", "#FD6925", "#DD1367", "#FD9D24", "#BF8B2E", "#3F7E44", "#0A97D9",
       "#56C02B", "#00689D", "#19486A"]
FOCUS = {4, 5, 9, 13}  # GYN focus goals (1-based)


def args(**defaults):
    """Parse args after Blender's `--`. Every default becomes a --flag."""
    ap = argparse.ArgumentParser()
    for k, v in defaults.items():
        ap.add_argument("--" + k, type=type(v), default=v)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return ap.parse_args(argv)


def lin(hex_):
    """sRGB hex -> linear RGBA tuple for shader inputs."""
    h = hex_.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*c, 1.0)


def ease(x):
    """Smoothstep-style ease in/out on 0..1 (zero slope at both ends)."""
    x = min(max(x, 0.0), 1.0)
    return x * x * x * (x * (6 * x - 15) + 10)


def pulse(p, start, length):
    """Seamless 0->1->0 bump inside [start, start+length], zero elsewhere."""
    x = (p - start) / length
    return math.sin(math.pi * x) ** 2 if 0.0 <= x <= 1.0 else 0.0


# ---------------------------------------------------------------- scene setup

def new_scene(engine, w, h, frames, out_dir, samples=64):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    r = sc.render
    r.engine = engine
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    r.fps = 24
    sc.frame_start, sc.frame_end = 1, frames
    r.film_transparent = True
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    r.filepath = os.path.join(out_dir, "")
    # Neutral tone mapper keeps brand base colours close to their hex values.
    sc.view_settings.view_transform = "Khronos PBR Neutral"
    sc.view_settings.exposure = 0.0
    if engine == "BLENDER_EEVEE":
        e = sc.eevee
        e.taa_render_samples = samples
        e.use_raytracing = True
        e.ray_tracing_options.resolution_scale = "1"
        e.use_fast_gi = True          # horizon-scan AO / contact occlusion
        e.fast_gi_distance = 0.6
        e.shadow_ray_count = 3
        e.shadow_step_count = 12
        e.shadow_resolution_scale = 1.0
    else:
        c = sc.cycles
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == "OPTIX"
        c.device = "GPU"
        c.samples = samples
        c.use_adaptive_sampling = True
        c.adaptive_threshold = 0.02
        c.use_denoising = True
        c.denoiser = "OPENIMAGEDENOISE"  # cleaner than OptiX on glass edges here
        c.denoising_use_gpu = True
        c.film_transparent_glass = True
        c.caustics_reflective = c.caustics_refractive = False
        c.blur_glossy = 1.0
        c.max_bounces, c.transmission_bounces, c.glossy_bounces = 12, 12, 6
    return sc


def studio_world(strength=1.0, key_dir=(-0.5, -0.7, 0.6)):
    """Gradient 'HDRI': dark floor, soft sky and one big softbox lobe.

    Invisible to camera (film_transparent) but drives reflections and fill.
    """
    w = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = w
    nt = w.node_tree
    nt.nodes.clear()
    N = nt.nodes.new
    tc = N("ShaderNodeTexCoord")
    sep = N("ShaderNodeSeparateXYZ")
    ramp = N("ShaderNodeValToRGB")
    mr = N("ShaderNodeMapRange")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -1, 1
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    cr = ramp.color_ramp
    cr.elements[0].position, cr.elements[0].color = 0.30, (0.015, 0.016, 0.022, 1)
    cr.elements[1].position, cr.elements[1].color = 1.0, (0.55, 0.58, 0.66, 1)
    mid = cr.elements.new(0.52)
    mid.color = (0.12, 0.12, 0.14, 1)
    # Softbox lobe: dot(view dir, key dir) pushed through a tight range.
    dot = N("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    nt.links.new(tc.outputs["Generated"], dot.inputs[0])
    dot.inputs[1].default_value = Vector(key_dir).normalized()
    lobe = N("ShaderNodeMapRange")
    lobe.inputs["From Min"].default_value, lobe.inputs["From Max"].default_value = 0.80, 0.97
    lobe.inputs["To Max"].default_value = 2.5
    nt.links.new(dot.outputs["Value"], lobe.inputs["Value"])
    mix = N("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "ADD"
    mix.inputs["Factor"].default_value = 1.0
    nt.links.new(ramp.outputs["Color"], mix.inputs["A"])
    nt.links.new(lobe.outputs["Result"], mix.inputs["B"])
    bg = N("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = strength
    nt.links.new(mix.outputs["Result"], bg.inputs["Color"])
    out = N("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs[0], out.inputs[0])
    return w


def area(name, loc, target=(0, 0, 0), size=3.0, energy=500.0, color=(1, 1, 1), shape="DISK", size_y=None):
    l = bpy.data.lights.new(name, "AREA")
    l.shape = shape
    l.size = size
    l.size_y = size_y or size
    l.energy = energy
    l.color = color
    o = bpy.data.objects.new(name, l)
    bpy.context.collection.objects.link(o)
    o.location = loc
    look_at(o, target)
    return o


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(loc, target=(0, 0, 0), lens=85.0, fstop=None, focus=None):
    c = bpy.data.cameras.new("Cam")
    c.lens = lens
    c.clip_start = 0.05
    o = bpy.data.objects.new("Cam", c)
    bpy.context.collection.objects.link(o)
    o.location = loc
    look_at(o, target)
    bpy.context.scene.camera = o
    if fstop:
        c.dof.use_dof = True
        c.dof.aperture_fstop = fstop
        c.dof.focus_distance = (Vector(focus or target) - Vector(loc)).length
        c.dof.aperture_blades = 7
    return o


# ---------------------------------------------------------------- materials

def principled(name, hex_, rough=0.3, coat=0.0, coat_rough=0.05, sss=0.0,
               sheen=0.0, metallic=0.0, transmission=0.0, ior=1.5, spec=0.5):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    i = b.inputs
    i["Base Color"].default_value = lin(hex_)
    i["Roughness"].default_value = rough
    i["Metallic"].default_value = metallic
    i["IOR"].default_value = ior
    i["Specular IOR Level"].default_value = spec
    i["Coat Weight"].default_value = coat
    i["Coat Roughness"].default_value = coat_rough
    i["Subsurface Weight"].default_value = sss
    i["Subsurface Radius"].default_value = (0.4, 0.2, 0.1)
    i["Subsurface Scale"].default_value = 0.05
    i["Sheen Weight"].default_value = sheen
    i["Sheen Tint"].default_value = (1, 1, 1, 1)
    i["Transmission Weight"].default_value = transmission
    return m


def glossy(name, hex_):
    """Candy plastic: soft subsurface body under a crisp clearcoat."""
    return principled(name, hex_, rough=0.32, coat=0.85, coat_rough=0.04, sss=0.12)


def clay(name, hex_):
    """Soft matte clay with a hint of sheen and subsurface."""
    return principled(name, hex_, rough=0.62, sss=0.25, sheen=0.25, spec=0.35)


# ---------------------------------------------------------------- geometry

def mesh_object(name, bm, mat=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    if mat:
        me.materials.append(mat)
    return o


def extrude_outline(bm, pts, depth):
    """Extrude a closed 2D outline (list of (x, y)) along Z, centred on z=0."""
    top = [bm.verts.new((x, y, depth / 2)) for x, y in pts]
    bot = [bm.verts.new((x, y, -depth / 2)) for x, y in pts]
    n = len(pts)
    bm.faces.new(top)
    bm.faces.new(list(reversed(bot)))
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((bot[k], bot[j], top[j], top[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def bevel(obj, width=0.03, segments=4, angle=30):
    m = obj.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    m.harden_normals = True
    m.miter_outer = "MITER_ARC"
    return m


def empty(name, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = loc
    return o


# ---------------------------------------------------------------- animation

def run(animate, frames, still=0):
    """Register animate(p) for every frame, then render the range (or one still)."""
    def handler(scene, *_):
        animate(((scene.frame_current - 1) % frames) / frames)
    bpy.app.handlers.frame_change_pre.append(handler)
    sc = bpy.context.scene
    if still:
        sc.frame_start = sc.frame_end = still
    sc.frame_set(sc.frame_start)
    bpy.ops.render.render(animation=True)
