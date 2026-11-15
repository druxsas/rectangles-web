"""
Classic upright arcade cabinet — boxed black body, slanted control panel,
illuminated marquee, recessed screen area. Export to GLB.

The screen area is left black/matte so the Night Shift CanvasTexture plane
can be laid on top in R3F without competing with a baked emissive surface.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python app/scripts/blender/arcade.py \
    -- --out app/public/models/arcade/arcade.glb
"""

import argparse
import math
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
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def wipe_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(name, base_color, roughness=0.5, metallic=0.0,
                  emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    output = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def add_cube(name, loc, size, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, size=1, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj


def add_cylinder(name, loc, radius, depth, segments=24, axis="Z"):
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


def set_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def build():
    wipe_scene()

    BLACK = (0.04, 0.04, 0.045)
    DARK = (0.09, 0.09, 0.10)
    WHITE = (0.95, 0.95, 0.92)
    COBALT = (0.09, 0.36, 0.98)
    AMBER = (0.98, 0.72, 0.4)
    RED = (0.86, 0.14, 0.14)
    GRAY = (0.25, 0.25, 0.28)

    mat_body = make_material("Arcade.Body", BLACK, roughness=0.6)
    mat_trim = make_material("Arcade.Trim", DARK, roughness=0.5)
    mat_marquee = make_material("Arcade.Marquee", WHITE, emission=(1, 0.95, 0.88), emission_strength=2.2)
    mat_screenback = make_material("Arcade.ScreenBack", (0.015, 0.015, 0.02), roughness=0.4)
    mat_controls = make_material("Arcade.Controls", DARK, roughness=0.5)
    mat_joystick = make_material("Arcade.Stick", BLACK, roughness=0.3, metallic=0.2)
    mat_ball = make_material("Arcade.Ball", RED, roughness=0.2, metallic=0.1)
    mat_btn = make_material("Arcade.Btn", COBALT, roughness=0.2, emission=COBALT, emission_strength=0.6)
    mat_coin = make_material("Arcade.Coin", AMBER, roughness=0.4, metallic=0.4)

    # ---- Main body (tall rectangular with slight back taper) --------------
    body = add_cube("Body", (0, 0, 1.1), (0.72, 0.5, 2.2))
    set_material(body, mat_body)

    # Side trim panels (thin planes slightly outside the body)
    for x in (-0.37, 0.37):
        trim = add_cube("Trim", (x, 0, 1.1), (0.01, 0.52, 2.2))
        set_material(trim, mat_trim)

    # ---- Marquee (top illuminated box) ------------------------------------
    marquee = add_cube("Marquee", (0, 0.05, 2.1), (0.7, 0.4, 0.3))
    set_material(marquee, mat_marquee)

    # Marquee frame (darker edge)
    for z in (1.98, 2.22):
        edge = add_cube("MarqueeEdge", (0, 0.05, z), (0.72, 0.42, 0.015))
        set_material(edge, mat_trim)

    # ---- Screen recessed area (flat black so a CanvasTexture plane can
    # sit on top in R3F without competing) ----------------------------------
    screen_back = add_cube("ScreenBack", (0, 0.24, 1.55), (0.56, 0.02, 0.44))
    set_material(screen_back, mat_screenback)
    # Bezel frame around the screen
    for off in ((-0.33, 0, 0), (0.33, 0, 0), (0, 0, 0.26), (0, 0, -0.26)):
        if off[0] != 0:
            s = (0.06, 0.03, 0.54)
        else:
            s = (0.6, 0.03, 0.06)
        bezel = add_cube("ScreenBezel", (off[0], 0.245, 1.55 + off[2]), s)
        set_material(bezel, mat_trim)

    # ---- Control deck (slanted) ------------------------------------------
    # Angled plate using rotation around X.
    deck = add_cube("Deck", (0, 0.16, 1.02), (0.68, 0.46, 0.04), rot=(-0.35, 0, 0))
    set_material(deck, mat_controls)

    # Joystick in deck-left
    stick_base = add_cylinder("StickBase", (-0.22, 0.14, 1.07), 0.04, 0.02)
    set_material(stick_base, mat_trim)
    stick = add_cylinder("Stick", (-0.22, 0.14, 1.14), 0.015, 0.14)
    set_material(stick, mat_joystick)
    ball = add_cube("Ball", (-0.22, 0.14, 1.22), (0.045, 0.045, 0.045))
    bpy.ops.object.shade_smooth()
    set_material(ball, mat_ball)

    # Buttons in a row
    for i, x in enumerate((-0.05, 0.05, 0.15, 0.25)):
        base_z = 1.07
        btn = add_cylinder(f"Btn{i}", (x, 0.14, base_z + 0.01), 0.025, 0.015)
        set_material(btn, mat_btn)

    # Coin door
    coin = add_cube("CoinDoor", (0, 0.25, 0.55), (0.3, 0.015, 0.14))
    set_material(coin, mat_trim)
    slot = add_cube("CoinSlot", (0, 0.26, 0.62), (0.05, 0.015, 0.01))
    set_material(slot, mat_coin)

    # ---- Base plinth -----------------------------------------------------
    plinth = add_cube("Plinth", (0, 0, 0.06), (0.72, 0.5, 0.12))
    set_material(plinth, mat_trim)

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
