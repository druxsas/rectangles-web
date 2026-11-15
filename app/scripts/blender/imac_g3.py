"""
Build a stylized low-poly iMac G3 (Bondi Blue) and export to GLB.

Not photoreal — a confident interpretation that reads immediately as the
iconic 1998 iMac: curved translucent body, recessed screen, white keyboard
and hockey-puck mouse on the counter.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python app/scripts/blender/imac_g3.py \
    -- --out app/public/models/imac_g3/imac_g3.glb
"""

import argparse
import math
import os
import sys

import bpy

# -------------------- CLI --------------------
def cli_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def wipe_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


# -------------------- Materials --------------------
def make_material(name, base_color, roughness=0.3, metallic=0.0,
                  transmission=0.0, ior=1.45, alpha=1.0, emission=None,
                  emission_strength=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if transmission > 0 or alpha < 1 else "OPAQUE"
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    output = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in bsdf.inputs:
        bsdf.inputs["Transmission"].default_value = transmission
    bsdf.inputs["IOR"].default_value = ior
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


# -------------------- Geometry helpers --------------------
def add_sphere(name, loc, scale, segments=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    return obj


def add_cube(name, loc, size):
    bpy.ops.mesh.primitive_cube_add(location=loc, size=1)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def add_cylinder(name, loc, radius, depth, segments=36, axis="Z"):
    bpy.ops.mesh.primitive_cylinder_add(location=loc, radius=radius, depth=depth, vertices=segments)
    obj = bpy.context.active_object
    obj.name = name
    if axis == "X":
        obj.rotation_euler[1] = math.pi / 2
    elif axis == "Y":
        obj.rotation_euler[0] = math.pi / 2
    bpy.ops.object.transform_apply(rotation=True)
    bpy.ops.object.shade_smooth()
    return obj


def boolean(target, modifier, op):
    """Apply a boolean on `target` using `modifier`, then delete the modifier."""
    mod = target.modifiers.new("Bool", "BOOLEAN")
    mod.operation = op
    mod.object = modifier
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier="Bool")
    bpy.data.objects.remove(modifier, do_unlink=True)


def set_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


# -------------------- Build --------------------
def build():
    wipe_scene()

    BONDI = (0.09, 0.36, 0.78)
    BONDI_DARK = (0.04, 0.17, 0.42)
    WHITE = (0.94, 0.94, 0.92)
    BLACK = (0.05, 0.05, 0.06)
    DARK = (0.09, 0.10, 0.11)
    SCREEN = (0.08, 0.36, 0.98)
    GRAY = (0.25, 0.25, 0.28)

    mat_shell = make_material("iMac.Shell", BONDI, roughness=0.18, transmission=0.4, ior=1.45, alpha=0.75)
    mat_back = make_material("iMac.Back", BONDI_DARK, roughness=0.3)
    mat_bezel = make_material("iMac.Bezel", DARK, roughness=0.4)
    mat_screen = make_material("iMac.Screen", SCREEN, emission=SCREEN, emission_strength=2.6)
    mat_white = make_material("iMac.White", WHITE, roughness=0.3)
    mat_stand = make_material("iMac.Stand", WHITE, roughness=0.3)
    mat_keyboard = make_material("Keyboard", WHITE, roughness=0.4)
    mat_keys = make_material("Keys", DARK, roughness=0.45)
    mat_mouse = make_material("Mouse", WHITE, roughness=0.3)
    mat_cable = make_material("Cable", GRAY, roughness=0.6)

    # ---- Body (shell) ------------------------------------------------------
    # Use a slightly ellipsoidal UV sphere, then flatten the front for the
    # screen face.
    body = add_sphere("iMac_Body", (0, 0, 0.6), (0.52, 0.56, 0.48), segments=56, rings=32)
    # Flatten front — cut away with a cube that overlaps the +Y face.
    cutter = add_cube("FrontCutter", (0, 0.52, 0.6), (1.4, 0.3, 1.4))
    boolean(body, cutter, "DIFFERENCE")

    # Back bulge (where the CRT lived) — darker, opaque for mass.
    back = add_sphere("iMac_Back", (0, -0.25, 0.55), (0.34, 0.34, 0.34), segments=32, rings=20)
    set_material(back, mat_back)
    set_material(body, mat_shell)

    # ---- Front bezel plate (opaque dark where the screen sits) -------------
    bezel = add_cube("iMac_Bezel", (0, 0.42, 0.62), (0.68, 0.015, 0.56))
    set_material(bezel, mat_bezel)

    # ---- Screen (emissive) ------------------------------------------------
    screen = add_cube("iMac_Screen", (0, 0.43, 0.62), (0.56, 0.005, 0.44))
    set_material(screen, mat_screen)

    # ---- Chin label area (the lip below the screen) -----------------------
    chin = add_cube("iMac_Chin", (0, 0.42, 0.22), (0.68, 0.015, 0.1))
    set_material(chin, mat_bezel)

    # ---- Stand / foot -----------------------------------------------------
    stand = add_sphere("iMac_StandBall", (0, -0.05, 0.08), (0.42, 0.42, 0.08), segments=32, rings=16)
    set_material(stand, mat_stand)
    foot = add_cylinder("iMac_Foot", (0, -0.05, 0.02), 0.3, 0.03)
    set_material(foot, mat_stand)

    # ---- Keyboard ----------------------------------------------------------
    kb = add_cube("Keyboard", (0.4, 0.4, 0.015), (0.55, 0.22, 0.03))
    set_material(kb, mat_keyboard)
    keys = add_cube("Keys", (0.4, 0.4, 0.03), (0.5, 0.18, 0.005))
    set_material(keys, mat_keys)

    # ---- Puck mouse --------------------------------------------------------
    mouse = add_sphere("Mouse", (0.95, 0.45, 0.018), (0.07, 0.085, 0.018), segments=32, rings=16)
    set_material(mouse, mat_mouse)

    # ---- Cables ------------------------------------------------------------
    # Mouse → keyboard, keyboard → iMac
    mcable = add_cylinder("MouseCable", (0.72, 0.45, 0.015), 0.006, 0.4, axis="X")
    set_material(mcable, mat_cable)
    kcable = add_cylinder("KbCable", (0.15, 0.4, 0.015), 0.006, 0.4, axis="X")
    set_material(kcable, mat_cable)

    # ---- Export ------------------------------------------------------------
    # Clear selection, select everything, export.
    bpy.ops.object.select_all(action="SELECT")


def export_glb(out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_yup=True,
    )
    print(f"✓ exported → {out_path}")


def main():
    args = cli_args()
    build()
    export_glb(args.out)


main()
