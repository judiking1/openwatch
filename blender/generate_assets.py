"""Generates the shared watch-body assets (Phase 8) with Blender's Python API.

    python blender/generate_assets.py            # needs the `bpy` module (pip install bpy)

Writes GLB files to src/assets/models/. They are committed, so building the app never needs
Blender. All geometry is authored in dial units (dial radius = 100, dial plane z = 0, the
watch faces +z, 12 o'clock along +y) and exported Z-up, so three.js reads it unchanged.

These are visual models only: proportions follow the procedural watch body, not any real
watch, and nothing here is meant for manufacture.
"""

import math
import os
import subprocess
import tempfile

import bpy  # noqa: I001 — bpy must be imported before bmesh
import bmesh

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "src", "assets", "models")
# meshopt compression (EXT_meshopt_compression, decoded by three's GLTFLoader) without
# quantisation, so the geometry keeps its dial-unit coordinates (-kn keeps the names, -kv
# the UVs that no exported material uses): about 3x smaller.
GLTFPACK = os.path.join(ROOT, "node_modules", ".bin", "gltfpack")

# Strap path (matches WatchCase.strapSegments): a straight run from the lugs, then an arc
# bending back around an imaginary wrist.
STRAIGHT = 24.0
BEND = 110.0
SWEEP = 1.2
LENGTH = STRAIGHT + BEND * SWEEP


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def path_point(s):
    """Centre line at arc length s: (y, z) and unit tangent (ty, tz)."""
    if s <= STRAIGHT:
        return (s, 0.0), (1.0, 0.0)
    a = (s - STRAIGHT) / BEND
    return (STRAIGHT + BEND * math.sin(a), -BEND * (1 - math.cos(a))), (math.cos(a), -math.sin(a))


def frame(s):
    """Point on the path plus its thickness direction (towards the viewer on the straight)."""
    (y, z), (ty, tz) = path_point(s)
    return (y, z), (-tz, ty)


def obj_from_bmesh(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def smooth(obj, angle=40):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.set_sharp_from_angle(angle=math.radians(angle))


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)


def bevel(obj, width, segments=3):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    apply_modifiers(obj)


def loft(name, sections):
    """Joins closed cross-sections (lists of 3D points, same count) into a tube with end caps."""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in ring] for ring in sections]
    n = len(sections[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bmesh(name, bm)


def rounded_rect(width, thickness, radius, steps=4):
    """Cross-section in (x, n) around its centre: a rectangle with rounded corners."""
    pts = []
    corners = [
        (width / 2 - radius, thickness / 2 - radius, 0),
        (-width / 2 + radius, thickness / 2 - radius, 90),
        (-width / 2 + radius, -thickness / 2 + radius, 180),
        (width / 2 - radius, -thickness / 2 + radius, 270),
    ]
    for cx, cy, start in corners:
        for k in range(steps + 1):
            a = math.radians(start + 90 * k / steps)
            pts.append((cx + radius * math.cos(a), cy + radius * math.sin(a)))
    return pts


def strap_width(s):
    """Tapers from 62 at the lugs to 54, then a rounded tip over the last 27 units."""
    w = 62 - 8 * s / LENGTH
    tip = LENGTH - s
    if tip < 27:
        w *= math.sqrt(max(0.04, 1 - ((27 - tip) / 27) ** 2))
    return w


def place(section, s):
    (y, z), (ny, nz) = frame(s)
    return [(x, y + ny * t, z + nz * t) for x, t in section]


def make_strap():
    """Leather strap: tapered, rounded edges, a rounded tip and two rows of stitching."""
    samples = 80
    sections = []
    for i in range(samples + 1):
        s = LENGTH * (i / samples) ** 0.85
        thickness = 6 - 1.5 * s / LENGTH
        w = strap_width(s)
        sections.append(place(rounded_rect(w, thickness, min(2.2, w / 2 - 0.01)), s))
    strap = loft("strap", sections)
    smooth(strap, 50)

    # Stitching: short raised dashes along both edges of the top face.
    bm = bmesh.new()
    s = 3.0
    while s < LENGTH - 30:
        w = strap_width(s)
        t = (6 - 1.5 * s / LENGTH) / 2
        (y, z), (ny, nz) = frame(s)
        (_, _), (ty, tz) = path_point(s)
        for side in (-1, 1):
            x = side * (w / 2 - 3.6)
            ret = bmesh.ops.create_cube(bm, size=1.0)
            verts = ret["verts"]
            for v in verts:
                lx, ly, lz = v.co.x * 0.7, v.co.y * 2.4, v.co.z * 0.5
                v.co = (
                    x + lx,
                    y + ty * ly + ny * (t + lz * 0.6),
                    z + tz * ly + nz * (t + lz * 0.6),
                )
        s += 4.2
    stitches = obj_from_bmesh("stitches", bm)
    join(strap, [stitches])
    return strap


def make_bracelet():
    """Three-piece link bracelet along the same path, links bevelled and tapering."""
    bm = bmesh.new()
    pitch = 7.0
    s = 0.5
    while s < LENGTH - 2:
        w = 62 - 8 * s / LENGTH
        centre = w * 0.36
        outer = (w - centre) / 2 - 1.0
        (y, z), (ny, nz) = frame(s + pitch / 2)
        (_, _), (ty, tz) = path_point(s + pitch / 2)
        for x0, width, thick in (
            (0.0, centre, 5.6),
            (-(centre / 2 + 1.0 + outer / 2), outer, 5.0),
            ((centre / 2 + 1.0 + outer / 2), outer, 5.0),
        ):
            ret = bmesh.ops.create_cube(bm, size=1.0)
            for v in ret["verts"]:
                lx, ly, lz = v.co.x * width, v.co.y * (pitch - 0.5), v.co.z * thick
                v.co = (x0 + lx, y + ty * ly + ny * lz, z + tz * ly + nz * lz)
        s += pitch
    links = obj_from_bmesh("bracelet", bm)
    bevel(links, 0.9, 2)
    smooth(links, 35)
    return links


def make_crown():
    """Fluted crown on a tube, along +x from the case side (x = 0)."""
    flutes = 24
    around = flutes * 4
    sections = []

    def ring(x, radius, fluted):
        pts = []
        for k in range(around):
            a = 2 * math.pi * k / around
            r = radius
            if fluted:
                r -= 0.7 * max(0.0, math.cos(flutes * a)) ** 2
            pts.append((x, r * math.cos(a), r * math.sin(a)))
        return pts

    # tube, shoulder, fluted body, chamfered cap
    profile = [
        (-5.0, 4.0, False),
        (0.0, 4.0, False),
        (0.0, 7.2, False),
        (0.6, 8.0, True),
        (10.6, 8.0, True),
        (11.4, 7.4, False),
        (12.0, 6.2, False),
        (12.2, 0.01, False),
    ]
    for x, r, fluted in profile:
        sections.append(ring(x, r, fluted))
    crown = loft("crown", sections)
    smooth(crown, 30)
    return crown


def make_lug():
    """One lug: a tapered, bevelled horn. The case places four (mirrored)."""
    bm = bmesh.new()
    ret = bmesh.ops.create_cube(bm, size=1.0)
    for v in ret["verts"]:
        x, y, z = v.co
        # 14 wide, 34 long (y), 14 tall; the tip (y > 0) slopes down and narrows.
        taper = 0.82 if y > 0 else 1.0
        drop = -3.0 if (y > 0 and z > 0) else 0.0
        v.co = (x * 14 * taper, y * 34, z * 14 + drop)
    lug = obj_from_bmesh("lug", bm)
    bevel(lug, 2.4, 4)
    smooth(lug, 35)
    return lug


def lathe(name, profile, segments, shape=None):
    """Revolves an (r, z) profile about the z axis. `shape(r, z, angle)` may adjust r."""
    bm = bmesh.new()
    rings = []
    for k in range(segments):
        a = 2 * math.pi * k / segments
        ring = []
        for r, z in profile:
            rr = shape(r, z, a) if shape else r
            ring.append(bm.verts.new((rr * math.sin(a), rr * math.cos(a), z)))
        rings.append(ring)
    n = len(profile)
    for k in range(segments):
        a, b = rings[k], rings[(k + 1) % segments]
        for i in range(n - 1):
            bm.faces.new((a[i], b[i], b[i + 1], a[i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bmesh(name, bm)


def make_bezel():
    """Bezel for the 100-unit dial: a seat for the crystal, a sloped top and a coin edge."""
    profile = [
        (101.5, -1.0),
        (101.5, 8.0),
        (102.5, 10.2),
        (106.0, 11.0),
        (111.5, 10.4),
        (113.5, 8.6),
        (114.0, 7.6),
        (114.0, 6.0),
        (114.0, 1.0),
        (113.6, -0.2),
        (113.0, -1.0),
        (101.5, -1.0),
    ]
    flutes = 120

    def coin_edge(r, z, a):
        if r >= 113.9 and 0.5 < z < 6.5:
            return r - 0.7 * max(0.0, math.cos(flutes * a)) ** 2
        return r

    bezel = lathe("bezel", profile, flutes * 4, coin_edge)
    smooth(bezel, 50)
    return bezel


def glyphs(text, radius, size, bottom):
    """Characters of `text` set around an arc, read from the back of the watch (mirrored)."""
    font = bpy.data.fonts.load("<builtin>")
    parts = []
    step = size * 0.72 / radius  # radians per character
    span = step * (len(text) - 1)
    for i, ch in enumerate(text):
        if ch == " ":
            continue
        # Clock angle in the back view (as seen from behind, 12 o'clock up).
        theta = math.pi + span / 2 - i * step if bottom else -span / 2 + i * step
        curve = bpy.data.curves.new(f"g{i}", type="FONT")
        curve.body = ch
        curve.font = font
        curve.size = size
        curve.align_x = "CENTER"
        curve.align_y = "CENTER"
        curve.extrude = 0.8
        obj = bpy.data.objects.new(f"g{i}", curve)
        bpy.context.collection.objects.link(obj)
        obj.location = (radius * math.sin(theta), radius * math.cos(theta), 0)
        obj.rotation_euler = (0, 0, -(theta - math.pi) if bottom else -theta)
        parts.append(obj)
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    text_obj = bpy.context.view_layer.objects.active
    # Seen from behind, +x is on the left: mirror so the text reads correctly there.
    text_obj.scale = (-1, 1, 1)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return text_obj


def engrave(target, cutter):
    mod = target.modifiers.new("engrave", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    apply_modifiers(target)
    bpy.data.objects.remove(cutter)


def make_caseback():
    """Caseback with engraved rings, an orbit emblem and lettering, facing −z (outward)."""
    face = -4.2
    profile = [(0.0, face), (107.0, face), (110.0, -3.0), (110.0, -1.0), (108.0, 0.0), (0.0, 0.0)]
    back = lathe("caseback", profile, 128)
    # V-grooves: rings cut 0.8 deep with sloped walls.
    for r_mid, w in ((96.6, 1.4), (70.4, 1.0), (13.5, 1.0)):
        ring = lathe("ring", [(r_mid - w, face - 1), (r_mid + w, face - 1), (r_mid, face + 0.8), (r_mid - w, face - 1)], 128)
        engrave(back, ring)
    # The orbit emblem: a small disc on the inner ring, as in Watch 001.
    bpy.ops.mesh.primitive_cone_add(radius1=3.6, radius2=1.6, depth=1.8, location=(9.5, 9.5, face - 0.1))
    engrave(back, bpy.context.view_layer.objects.active)
    for text, bottom in (("ORBITAL WATCH LAB", False), ("VISUAL MODEL - NOT FOR MANUFACTURE", True)):
        letters = glyphs(text, 82.0, 10.0, bottom)
        letters.location.z = face
        bpy.ops.object.select_all(action="DESELECT")
        letters.select_set(True)
        bpy.context.view_layer.objects.active = letters
        bpy.ops.object.transform_apply(location=True)
        engrave(back, letters)
    # Chamfer the cut edges: sloped walls catch the light, as real engraving does. (Bevelled
    # glyphs would do it in one step, but their outlines self-intersect and break the
    # boolean.)
    bevel(back, 0.3, 1)
    smooth(back, 30)
    # The boolean leaves long sliver triangles on the flat back; shade flat faces flat so
    # they do not streak.
    for poly in back.data.polygons:
        if abs(poly.normal.z) > 0.999:
            poly.use_smooth = False
    return back


def join(target, others):
    bpy.ops.object.select_all(action="DESELECT")
    for o in others:
        o.select_set(True)
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.join()


def unwrap(obj):
    """UVs for the brushed-metal node material on WebGPU (it reads uv for the grain)."""
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")


def export(obj, filename):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    unwrap(obj)
    path = os.path.abspath(os.path.join(OUT, filename))
    raw = os.path.join(tempfile.mkdtemp(), filename)
    bpy.ops.export_scene.gltf(
        filepath=raw,
        export_format="GLB",
        use_selection=True,
        export_yup=False,
        export_materials="NONE",
        export_normals=True,
        export_texcoords=True,
        export_extras=False,
    )
    subprocess.run([GLTFPACK, "-i", raw, "-o", path, "-cc", "-noq", "-kn", "-kv"], check=True)
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    print(f"wrote {filename}: {tris} triangles")


def main():
    os.makedirs(OUT, exist_ok=True)
    for make, filename in (
        (make_strap, "strap.glb"),
        (make_bracelet, "bracelet.glb"),
        (make_crown, "crown.glb"),
        (make_lug, "lug.glb"),
        (make_bezel, "bezel.glb"),
        (make_caseback, "caseback.glb"),
    ):
        reset()
        export(make(), filename)


if __name__ == "__main__":
    main()
