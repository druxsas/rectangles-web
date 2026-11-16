"""
Collapse-decimate every mesh in a GLB (robust for foliage and kit-bashed
models where meshoptimizer's conservative simplifier can't collapse
open borders). Used as a pre-pass for scripts/optimize-models.mjs.

Usage:
  Blender --background --python app/scripts/blender/decimate_glb.py -- \
    --in assets-src/models/plants_hq.glb --out assets-src/models/plants_hq.lod.glb --ratio 0.08
"""

import argparse
import sys

import bpy


def cli():
    argv = sys.argv[sys.argv.index("--") + 1:]
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="src", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--ratio", type=float, required=True)
    return p.parse_args(argv)


def main():
    a = cli()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=a.src)
    before = after = 0
    for o in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
        before += sum(len(p.vertices) - 2 for p in o.data.polygons)
        mod = o.modifiers.new("decimate", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = a.ratio
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)
        after += sum(len(p.vertices) - 2 for p in o.data.polygons)
    bpy.ops.export_scene.gltf(filepath=a.out, export_format="GLB", export_yup=True, export_apply=True)
    print(f"✓ decimated {before} → {after} tris → {a.out}")


main()
