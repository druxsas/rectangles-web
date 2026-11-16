"""
Convert a wavefront OBJ (with optional .mtl + texture maps) to a single
self-contained GLB with embedded textures.

Usage:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python app/scripts/blender/obj_to_glb.py \
    -- --in <source.obj> --out <target.glb>
"""

import argparse
import os
import sys

import bpy


def cli_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="input", required=True)
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def main():
    args = cli_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import OBJ (Blender 4+ API).
    bpy.ops.wm.obj_import(filepath=args.input)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")

    bpy.ops.export_scene.gltf(
        filepath=args.out,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_yup=True,
        # Draco mesh compression — reduces geometry size ~80% and is
        # handled natively by drei's useGLTF (DRACOLoader built in).
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"✓ exported → {args.out}")


main()
