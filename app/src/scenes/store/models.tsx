"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

/**
 * Thin wrappers for the Poly Haven CC0 models we currently use. Each wrapper
 * clones the cached scene so the same model can appear multiple times with
 * different transforms.
 *
 * All source files live under `/public/models/<slug>/` with their textures
 * in `/public/models/<slug>/textures/`. License: CC0 (public domain) via
 * https://polyhaven.com — no attribution required.
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

export const CashRegisterModel = model("/models/CashRegister_01/CashRegister_01.gltf");
export const TelevisionModel = model("/models/Television_01/Television_01.gltf");
export const BoomboxModel = model("/models/boombox/boombox.gltf");
export const CassettePlayerModel = model("/models/cassette_player/cassette_player.gltf");
export const ShelfModel = model("/models/Shelf_01/Shelf_01.gltf");
export const VintageCabinetModel = model("/models/vintage_cabinet_01/vintage_cabinet_01.gltf");
