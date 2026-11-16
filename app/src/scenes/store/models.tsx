"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

/**
 * Model wrappers. Each returns a clone of the cached scene so the same
 * model can appear multiple times at different transforms.
 *
 * Catalog:
 *   - Poly Pizza (CC-BY, Poly by Google unless noted) : the bulk of the
 *     store furniture. Attribution lives in CREDITS.md.
 *   - Poly Haven (CC0): CashRegister_01, Television_01, Shelf_01 — see
 *     CREDITS.md. All public domain.
 *   - Blender originals (CC0): imac_g3, arcade — see app/scripts/blender/*.py.
 *
 * `gltf-path` names ending in `.glb` are self-contained binary; `.gltf`
 * ones have sibling `.bin` and `textures/` files in the same folder.
 */

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

function model(path: string) {
  function Model({ position, rotation, scale }: Props) {
    const { scene } = useGLTF(path);
    const instance = useMemo(() => scene.clone(true), [scene]);
    return (
      <primitive
        object={instance}
        position={position}
        rotation={rotation}
        scale={scale}
      />
    );
  }
  useGLTF.preload(path);
  return Model;
}

// ---- Poly Pizza (CC-BY, Poly by Google unless noted) -------------------
export const MacClassicModel = model("/models/mac_classic/mac_classic.glb");            // Charlie
export const ArcadeCabinetModel = model("/models/arcade_cabinet/arcade_cabinet.glb");    // Poly by Google
export const TurntableModel = model("/models/turntable/turntable.glb");                  // Poly by Google
export const HifiStereoModel = model("/models/hifi_stereo/hifi_stereo.glb");             // Poly by Google
export const MonsteraModel = model("/models/monstera/monstera.glb");                     // Isa Lousberg (CC0)
export const RetroSystemsModel = model("/models/retro_systems/retro_systems.glb");       // Yogoshimo 2.0
export const BassSpeakersModel = model("/models/bass_speakers/bass_speakers.glb");       // Zsky
export const ComputerModel = model("/models/computer/computer.glb");                     // Poly by Google
export const SkateboardModel = model("/models/skateboard/skateboard.glb");               // Thomas van iseghem
export const SkateboardAltModel = model("/models/skateboard_alt/skateboard_alt.glb");    // Michael Fuchs
export const VendorCharacterModel = model("/models/vendor_character/vendor_character.glb"); // madtrollstudio
export const PersonCasualModel = model("/models/person_casual/person_casual.glb");       // hat_my_guy
export const CounterStraightModel = model("/models/counter_straight/counter_straight.glb"); // Quaternius
export const CountertopModel = model("/models/countertop/countertop.glb");               // Isa Lousberg

// ---- Blender originals (CC0) ------------------------------------------
export const ImacG3Model = model("/models/imac_g3/imac_g3.glb");
export const ArcadeHomegrownModel = model("/models/arcade/arcade.glb");

// ---- Poly Haven (CC0) --------------------------------------------------
export const ShelfModel = model("/models/Shelf_01/Shelf_01.gltf");
export const TelevisionModel = model("/models/Television_01/Television_01.gltf");
export const CashRegisterModel = model("/models/CashRegister_01/CashRegister_01.gltf");
