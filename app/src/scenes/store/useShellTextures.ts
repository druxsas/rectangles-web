"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type ColorSpace,
  type Texture,
} from "three";

export type PbrSet = {
  map: Texture;
  normal: Texture;
  arm: Texture;
};

function configure(t: Texture, repeat: [number, number], colorSpace: ColorSpace) {
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.colorSpace = colorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * Poly Haven CC0 PBR sets for the store shell (floor + walls), as WebP
 * (re-encoded by scripts/optimize-textures.mjs).
 */
export function useShellTextures() {
  const paths = useMemo(
    () => [
      "/textures/concrete_floor_worn_001/diff.webp",
      "/textures/concrete_floor_worn_001/nor.webp",
      "/textures/concrete_floor_worn_001/arm.webp",
      "/textures/concrete_wall_006/diff.webp",
      "/textures/concrete_wall_006/nor.webp",
      "/textures/concrete_wall_006/arm.webp",
    ],
    [],
  );
  const [fMap, fNor, fArm, wMap, wNor, wArm] = useLoader(TextureLoader, paths);

  useEffect(() => {
    configure(fMap, [8, 5], SRGBColorSpace);
    configure(fNor, [8, 5], NoColorSpace);
    configure(fArm, [8, 5], NoColorSpace);
    configure(wMap, [3, 1.1], SRGBColorSpace);
    configure(wNor, [3, 1.1], NoColorSpace);
    configure(wArm, [3, 1.1], NoColorSpace);
  }, [fMap, fNor, fArm, wMap, wNor, wArm]);

  return {
    floor: { map: fMap, normal: fNor, arm: fArm } as PbrSet,
    wall: { map: wMap, normal: wNor, arm: wArm } as PbrSet,
  };
}
