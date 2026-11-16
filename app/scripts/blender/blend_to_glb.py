"""
Export a .blend scene to a web-ready GLB: drops cameras/lights and named
helper meshes (e.g. a backdrop plane), relinks missing images by basename
pattern, downsizes textures, Draco-compresses.

Usage:
  Blender --background <file.blend> --python app/scripts/blender/blend_to_glb.py -- \
    --out <target.glb> [--drop Plane] [--relink "Wood063_4K_=textures/Wood066_2K-JPG/Wood066_2K_"] [--max-tex 1024]
"""

import argparse
import os
import sys
import tempfile

import bpy


def cli_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--drop", default="")
    p.add_argument("--relink", action="append", default=[], help="OLDPREFIX=NEWPATHPREFIX (relative to the .blend)")
    p.add_argument("--max-tex", type=int, default=1024)
    return p.parse_args(argv)


def main():
    a = cli_args()
    base = os.path.dirname(bpy.data.filepath)

    for o in list(bpy.context.scene.objects):
        if o.type in {"CAMERA", "LIGHT"} or o.name in [d.strip() for d in a.drop.split(",") if d.strip()]:
            bpy.data.objects.remove(o)

    for img in bpy.data.images:
        if not img.filepath:
            continue
        name = os.path.basename(bpy.path.abspath(img.filepath))
        for rule in a.relink:
            old, new = rule.split("=", 1)
            if name.startswith(old):
                suffix = name[len(old):].replace("NormalGL", "NormalGL")
                cand = os.path.join(base, new + suffix)
                cand = cand.replace("_4K_", "_2K_")
                if os.path.exists(cand):
                    img.filepath = cand
                    img.reload()
                    print(f"  relinked {name} -> {cand}")

    tmp = tempfile.mkdtemp()
    for img in bpy.data.images:
        if not img.filepath or img.size[0] == 0:
            continue
        if max(img.size) > a.max_tex:
            img.scale(a.max_tex, max(1, a.max_tex * img.size[1] // img.size[0]))
        stem = os.path.splitext(os.path.basename(bpy.path.abspath(img.filepath)))[0]
        alpha = img.alpha_mode != "NONE" and img.file_format == "PNG"
        path = os.path.join(tmp, stem + (".png" if alpha else ".jpg"))
        img.filepath_raw = path
        img.file_format = "PNG" if alpha else "JPEG"
        img.save()

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(a.out),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"✓ exported → {a.out}")


main()
