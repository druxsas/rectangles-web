"""
Convert a wavefront OBJ (with optional .mtl + texture maps) to a single
self-contained GLB with embedded textures.

Usage:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python app/scripts/blender/obj_to_glb.py \
    -- --in <source.obj> --out <target.glb> \
       [--keep <object name>] [--texture <basecolor.jpg>]

  --keep     keep only this object (e.g. one variant of a multi-object file)
  --texture  assign a fresh material with this base-colour map (for OBJs
             shipped without an .mtl)
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
    p.add_argument("--keep", default=None)
    p.add_argument("--texture", default=None)
    return p.parse_args(argv)


def main():
    args = cli_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import OBJ (Blender 4+ API).
    bpy.ops.wm.obj_import(filepath=args.input)

    if args.keep:
        for o in list(bpy.context.scene.objects):
            if o.name != args.keep:
                bpy.data.objects.remove(o)

    if args.texture:
        mat = bpy.data.materials.new("base")
        mat.use_nodes = True
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.abspath(args.texture))
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        mat.node_tree.links.new(tex.outputs[0], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.95
        for o in bpy.context.scene.objects:
            if o.type == "MESH":
                o.data.materials.clear()
                o.data.materials.append(mat)

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
