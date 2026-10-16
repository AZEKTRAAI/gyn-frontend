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

def new_scene(engine, w, h, frames, out_dir, samples=64, transparent=True,
              view="Khronos PBR Neutral", fast_gi=True):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    r = sc.render
    r.engine = engine
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    r.fps = 24
    sc.frame_start, sc.frame_end = 1, frames
    r.film_transparent = transparent
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA" if transparent else "RGB"
    r.filepath = os.path.join(out_dir, "")
    # Neutral tone mapper keeps brand base colours close to their hex values.
    # Opaque cove renders pass view="Standard" so the backdrop lands on its exact hex.
    sc.view_settings.view_transform = view
    sc.view_settings.exposure = 0.0
    if engine == "BLENDER_EEVEE":
        e = sc.eevee
        e.taa_render_samples = samples
        e.use_raytracing = True
        e.ray_tracing_options.resolution_scale = "1"
        e.use_fast_gi = fast_gi       # horizon-scan GI; grainy on matte light surfaces at low samples
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
    m = principled(name, hex_, rough=0.62, sss=0.25, sheen=0.25, spec=0.35)
    m.node_tree.nodes["Principled BSDF"].inputs["Sheen Roughness"].default_value = 0.5
    return m


def satin(name, hex_):
    """Tarka satin plastic: one broad soft highlight, light coat, faint edge glow."""
    m = principled(name, hex_, rough=0.38, coat=0.3, coat_rough=0.15, sss=0.08)
    m.node_tree.nodes["Principled BSDF"].inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.2)
    return m


# ---------------------------------------------------------------- tarka set: cove + rig

def cove(hex_, floor_z=0.0, wall_y=4.0, bend=3.0, width=60.0):
    """Seamless floor-to-wall backdrop that renders as exactly `hex_` where unshadowed.

    Camera rays see the cove's live lighting divided by a lighting map of the
    empty cove (made by calibrate_cove), times the hex: open backdrop comes out
    flat at the hex, and only object shadows darken it, tinted by the hex.
    Every other ray sees a plain diffuse surface in the hex, so bounce is tinted.
    """
    prof = [(y, 0.0) for y in (-40.0, -10.0, -3.0)]
    prof += [(bend * math.sin(a), bend - bend * math.cos(a))
             for a in (math.pi / 2 * k / 16 for k in range(17))]
    prof += [(bend, z) for z in (bend + 3.0, 40.0)]
    bm = bmesh.new()
    cols = [[bm.verts.new((x, y + wall_y - bend, z + floor_z)) for y, z in prof]
            for x in (-width / 2 + width * k / 8 for k in range(9))]
    for c0, c1 in zip(cols, cols[1:]):
        for k in range(len(prof) - 1):
            bm.faces.new((c0[k], c1[k], c1[k + 1], c0[k + 1]))
    o = mesh_object("Cove", bm)

    m = bpy.data.materials.new("cove")
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    white = N("ShaderNodeBsdfDiffuse")
    s2r = N("ShaderNodeShaderToRGB")
    L(white.outputs[0], s2r.inputs[0])
    bw = N("ShaderNodeRGBToBW")
    L(s2r.outputs["Color"], bw.inputs[0])
    ao = N("ShaderNodeAmbientOcclusion")  # firmer contact shadows where objects sit
    ao.name = "ao"
    ao.inputs["Distance"].default_value = 0.5
    lit = N("ShaderNodeMath")
    lit.operation = "MULTIPLY"
    L(bw.outputs[0], lit.inputs[0])
    L(ao.outputs["AO"], lit.inputs[1])
    tc = N("ShaderNodeTexCoord")
    tex = N("ShaderNodeTexImage")
    tex.name = "openlight"
    tex.extension = "EXTEND"
    L(tc.outputs["Window"], tex.inputs["Vector"])
    ref = N("ShaderNodeRGBToBW")
    L(tex.outputs["Color"], ref.inputs[0])
    safe = N("ShaderNodeMath")
    safe.operation = "MAXIMUM"
    safe.inputs[1].default_value = 1e-4
    L(ref.outputs[0], safe.inputs[0])
    ratio = N("ShaderNodeMath")
    ratio.operation = "DIVIDE"
    ratio.use_clamp = True  # bounce from objects can't push the backdrop past its hex
    L(lit.outputs[0], ratio.inputs[0])
    L(safe.outputs[0], ratio.inputs[1])
    raw = N("ShaderNodeMath")  # calibration output: raw lighting, scaled to stay < 1
    raw.operation = "MULTIPLY"
    raw.inputs[1].default_value = 0.25
    L(lit.outputs[0], raw.inputs[0])
    calib = N("ShaderNodeMix")
    calib.name = "calib"
    calib.data_type = "RGBA"
    L(ratio.outputs[0], calib.inputs["A"])
    L(raw.outputs[0], calib.inputs["B"])
    tint = N("ShaderNodeMix")
    tint.name = "tint"
    tint.data_type = "RGBA"
    tint.blend_type = "MULTIPLY"
    tint.inputs["Factor"].default_value = 1.0
    tint.inputs["A"].default_value = lin(hex_)
    L(calib.outputs["Result"], tint.inputs["B"])
    emit = N("ShaderNodeEmission")
    L(tint.outputs["Result"], emit.inputs["Color"])
    diff = N("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value = lin(hex_)
    lp = N("ShaderNodeLightPath")
    mix = N("ShaderNodeMixShader")
    L(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    L(diff.outputs[0], mix.inputs[1])
    L(emit.outputs[0], mix.inputs[2])
    out = N("ShaderNodeOutputMaterial")
    L(mix.outputs[0], out.inputs["Surface"])
    o.data.materials.append(m)
    o["hex"] = hex_
    return o


def calibrate_cove(cove_obj, samples=32):
    """Render the empty cove's lighting to EXR and feed it back as the open-light map."""
    sc = bpy.context.scene
    nodes = cove_obj.data.materials[0].node_tree.nodes
    hidden = [o for o in sc.objects if o.type in {"MESH", "CURVE", "FONT", "META"}
              and o != cove_obj and not o.hide_render]
    for o in hidden:
        o.hide_render = True
    nodes["calib"].inputs["Factor"].default_value = 1.0
    nodes["tint"].inputs["A"].default_value = (1, 1, 1, 1)
    r, ims, e = sc.render, sc.render.image_settings, sc.eevee
    keep = (r.filepath, ims.file_format, ims.color_mode, ims.color_depth, e.taa_render_samples)
    path = os.path.join(bpy.app.tempdir, f"cove_{os.getpid()}.exr")
    ims.file_format, ims.color_mode, ims.color_depth = "OPEN_EXR", "RGB", "32"
    e.taa_render_samples = samples
    r.filepath = path
    sc.frame_set(sc.frame_start)
    bpy.ops.render.render(write_still=True)
    r.filepath, ims.file_format, ims.color_mode, ims.color_depth, e.taa_render_samples = keep
    img = bpy.data.images.load(path)
    img.colorspace_settings.is_data = True
    nodes["openlight"].image = img
    nodes["calib"].inputs["Factor"].default_value = 0.0
    nodes["tint"].inputs["A"].default_value = lin(cove_obj["hex"])
    for o in hidden:
        o.hide_render = False


def tarka_lights(hex_, target=(0, 0, 1), key=600.0, dist=4.0, rim=0.0, world=0.25,
                 key_dir=(-0.62, -0.62, 1.4), key_size=2.2):
    """One big soft key front-left above, weak fill opposite, soft top box, world = backdrop."""
    t = Vector(target)
    # key a little tighter than the brief's 3-4 m so contact shadows read at this scale
    area("Key", t + Vector(key_dir).normalized() * dist, t, size=key_size, energy=key)
    area("Fill", t + Vector((0.8, -0.6, 0.25)).normalized() * dist * 1.3, t, size=5, energy=key * 0.1)
    area("Top", t + Vector((0, 0, dist)), t, size=2.5, energy=key * 0.06, shape="SQUARE")  # weaker than the brief: it washed out floor shadows
    if rim:
        area("Rim", t + Vector((0.4, 1.0, 0.6)).normalized() * dist, t, size=2, energy=key * rim)
    w = bpy.data.worlds.new("Cove")
    bpy.context.scene.world = w
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = lin(hex_)
    bg.inputs["Strength"].default_value = world


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


def rounded_box(name, size, mat, radius=0.08, segments=6):
    """Box of `size` (x, y, z) with every edge rounded."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = mesh_object(name, bm, mat)
    bevel(o, width=min(radius, min(size) * 0.49), segments=segments)
    return o


def uv_sphere(name, r, mat, seg=64):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    return mesh_object(name, bm, mat)


def capsule(name, r, length, mat, seg=48):
    """Pill along local Z: two hemispheres joined by a straight section of `length`."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2 + 1, radius=r)  # odd: no equator ring
    for v in bm.verts:
        v.co.z += length / 2 * (1 if v.co.z > 0 else -1)
    return mesh_object(name, bm, mat)


def soft_wedge(name, mat, r_in, r_out, step, gap, depth, round_r=0.07, edge=0.06, n=24, nb=8):
    """SDG wheel wedge as an inflated tile: rounded corners in plan, fully round rims.

    A filled 2D curve (origin at mid radius, centred on +X) whose bevel rounds every
    edge; corners are filleted with quadratic Beziers so nothing reads as a box.
    """
    rc = (r_in + r_out) / 2
    a_o, a_i = step / 2 - math.asin(gap / 2 / r_out), step / 2 - math.asin(gap / 2 / r_in)

    def P(r, a):
        return Vector((r * math.cos(a) - rc, r * math.sin(a)))

    corners = [P(r_out, -a_o), P(r_out, a_o), P(r_in, a_i), P(r_in, -a_i)]
    # each side: (start, end) trimmed by round_r, sampled as arc or line
    sides = [[P(r_out, -a_o + round_r / r_out + (2 * a_o - 2 * round_r / r_out) * k / n) for k in range(n + 1)],
             None,
             [P(r_in, a_i - round_r / r_in - (2 * a_i - 2 * round_r / r_in) * k / n) for k in range(n + 1)],
             None]
    for s, (c0, c1) in ((1, (corners[1], corners[2])), (3, (corners[3], corners[0]))):
        d = (c1 - c0).normalized()
        sides[s] = [c0 + d * round_r, c1 - d * round_r]
    pts = []
    for s in range(4):
        pts += sides[s]
        corner, nxt = corners[(s + 1) % 4], sides[(s + 1) % 4][0]
        prev = sides[s][-1]
        pts += [(1 - t) ** 2 * prev + 2 * (1 - t) * t * corner + t * t * nxt
                for t in (k / nb for k in range(1, nb))]
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions, cu.fill_mode = "2D", "BOTH"
    cu.extrude = max(depth / 2 - edge, 0.0)
    cu.bevel_depth, cu.bevel_resolution = edge, 8
    cu.offset = -edge  # keep the plan size: the round rim grows inward (edge must stay < half the narrow end)
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v.x, v.y, 0, 1)
    sp.use_cyclic_u = True
    sp.use_smooth = True
    cu.materials.append(mat)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    return o


def wedge_outline(r_in, r_out, step, gap, n=28):
    """Annular sector centred on +X (origin at its mid radius) with parallel gaps."""
    rc = (r_in + r_out) / 2
    pts = []
    for r, rev in ((r_out, False), (r_in, True)):
        d = math.asin(gap / 2 / r)
        angs = [-step / 2 + d + (step - 2 * d) * k / (n - 1) for k in range(n)]
        if rev:
            angs.reverse()
        pts += [(r * math.cos(t) - rc, r * math.sin(t)) for t in angs]
    return pts


# ---------------------------------------------------------------- animation

def run(animate, frames, still=0, cove=None):
    """Register animate(p) for every frame, then render the range (or one still).

    With a cove, its open-light map is rendered first (camera must not move).
    """
    def handler(scene, *_):
        animate(((scene.frame_current - 1) % frames) / frames)
    bpy.app.handlers.frame_change_pre.append(handler)
    sc = bpy.context.scene
    if cove:
        calibrate_cove(cove)
    if still:
        sc.frame_start = sc.frame_end = still
    sc.frame_set(sc.frame_start)
    bpy.ops.render.render(animation=True)
