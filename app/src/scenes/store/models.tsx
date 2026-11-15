"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

/**
 * Wrappers for 3D models. Clones the cached scene so the same model can
 * appear multiple times with different transforms.
 *
 * Sources:
 *   - public/models/imac_g3/ + public/models/arcade/ : Blender-authored
 *     low-poly meshes (see app/scripts/blender/*.py). CC0 — our work.
 *   - public/models/<other>/ : Poly Haven CC0 (see CREDITS.md).
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

// ---- Blender originals -------------------------------------------------
export const ImacG3Model = model("/models/imac_g3/imac_g3.glb");
export const ArcadeModel = model("/models/arcade/arcade.glb");

// ---- Poly Haven CC0 ----------------------------------------------------
export const ShelfModel = model("/models/Shelf_01/Shelf_01.gltf");
export const TelevisionModel = model("/models/Television_01/Television_01.gltf");
