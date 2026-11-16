"""
Convert a rigged FBX character (with loose TGA textures) into a static,
web-ready GLB: optional arm pose, armature baked into the meshes, textures
downscaled to JPEG/PNG, Draco-compressed.

Usage:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python app/scripts/blender/fbx_character_to_glb.py -- \
    --in <source.fbx> --out <target.glb> [--clavicle 12] [--arms-down 45] [--elbow 0] [--drop Box001,"IK Chain006"]
"""

import argparse
import os
import sys
import tempfile

import bpy
from mathutils import Matrix


def cli_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="input", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--arms-down", type=float, default=0.0, help="degrees to lower both upper arms")
    p.add_argument("--clavicle", type=float, default=0.0, help="degrees to drop both clavicles")
    p.add_argument("--arms-forward", type=float, default=0.0, help="degrees to swing upper arms forward")
    p.add_argument("--elbow", type=float, default=0.0, help="degrees to bend forearms forward")
    p.add_argument("--drop", default="", help="comma-separated object names to delete")
    p.add_argument("--max-tex", type=int, default=1024)
    p.add_argument("--skin-tex", type=int, default=2048)
    return p.parse_args(argv)


def rotate_bone_world(arm, name, axis, degrees):
    import math

    pb = arm.pose.bones.get(name)
    if pb is None:
        print(f"! missing bone {name}")
        return
    m = arm.matrix_world @ pb.matrix
    pivot = m.to_translation()
    r = Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(degrees), 4, axis) @ Matrix.Translation(-pivot)
    pb.matrix = arm.matrix_world.inverted() @ (r @ m)
    bpy.context.view_layer.update()


def main():
    a = cli_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=a.input)

    for name in filter(None, [n.strip() for n in a.drop.split(",")]):
        o = bpy.data.objects.get(name)
        if o:
            bpy.data.objects.remove(o)

    arm = next((o for o in bpy.context.scene.objects if o.type == "ARMATURE"), None)
    if arm and (a.arms_down or a.elbow or a.clavicle or a.arms_forward):
        # Character faces -Y (Blender). Its left arm is on +X.
        rotate_bone_world(arm, "clavicle_l", "Y", a.clavicle)
        rotate_bone_world(arm, "clavicle_r", "Y", -a.clavicle)
        rotate_bone_world(arm, "upperarm_l", "Y", a.arms_down)
        rotate_bone_world(arm, "upperarm_r", "Y", -a.arms_down)
        rotate_bone_world(arm, "upperarm_l", "X", a.arms_forward)
        rotate_bone_world(arm, "upperarm_r", "X", a.arms_forward)
        rotate_bone_world(arm, "lowerarm_l", "X", a.elbow)
        rotate_bone_world(arm, "lowerarm_r", "X", a.elbow)

    # Bake the pose into the meshes, then drop the rig.
    for o in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
        mods = [m for m in o.modifiers if m.type == "ARMATURE"]
        if not mods:
            continue
        if o.data.shape_keys:
            o.shape_key_clear()
        bpy.context.view_layer.objects.active = o
        for m in mods:
            bpy.ops.object.modifier_apply(modifier=m.name)
    if arm:
        for c in [c for c in bpy.context.scene.objects if c.parent == arm]:
            mw = c.matrix_world.copy()
            c.parent = None
            c.matrix_world = mw
        bpy.data.objects.remove(arm)

    # Drop specular-level maps (not useful on the web, heavy).
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        nt = mat.node_tree
        for n in list(nt.nodes):
            if n.type == "TEX_IMAGE" and not n.outputs[0].links:
                nt.nodes.remove(n)
            elif n.type == "TEX_IMAGE" and all(l.to_socket.name.startswith("Specular") for l in n.outputs[0].links):
                nt.nodes.remove(n)

    # Downscale + re-encode textures.
    tmp = tempfile.mkdtemp()
    for img in bpy.data.images:
        if not img.filepath or img.size[0] == 0:
            continue
        base = os.path.splitext(os.path.basename(bpy.path.abspath(img.filepath)))[0]
        limit = a.skin_tex if base.startswith("skin") and not base.endswith(("_n", "_s")) else a.max_tex
        if max(img.size) > limit:
            img.scale(limit, limit * img.size[1] // img.size[0])
        alpha = "eyelash" in base
        ext, fmt = (".png", "PNG") if alpha else (".jpg", "JPEG")
        path = os.path.join(tmp, base + ext)
        img.filepath_raw = path
        img.file_format = fmt
        img.save()
        print(f"  tex {base}: {img.size[0]}x{img.size[1]} {fmt}")

    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=a.out,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_yup=True,
        export_skins=False,
        export_animations=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"✓ exported → {a.out}")


main()
