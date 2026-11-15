"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from "three";

/**
 * Shared loader for the Poly Haven CC0 PBR textures used on the shell.
 *
 * Returns three sets (floor, wall, counter wood). Each set contains map +
 * normal + arm (ambient-occlusion/roughness/metal). Repeat-wraps so the
 * same image tiles across walls and floor.
 */
export type PbrSet = {
  map: Texture;
  normal: Texture;
  arm: Texture;
};

function configure(t: Texture, repeat: [number, number], colorSpace = SRGBColorSpace) {
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

export function useShellTextures() {
  const paths = useMemo(
    () => [
      "/textures/concrete_floor_worn_001/diff.jpg",
      "/textures/concrete_floor_worn_001/nor.jpg",
      "/textures/concrete_floor_worn_001/arm.jpg",
      "/textures/concrete_wall_006/diff.jpg",
      "/textures/concrete_wall_006/nor.jpg",
      "/textures/concrete_wall_006/arm.jpg",
      "/textures/wood_table_001/diff.jpg",
      "/textures/wood_table_001/nor.jpg",
      "/textures/wood_table_001/arm.jpg",
    ],
    [],
  );
  const loaded = useLoader(TextureLoader, paths);
  const [
    fMap, fNor, fArm,
    wMap, wNor, wArm,
    cMap, cNor, cArm,
  ] = loaded;

  useEffect(() => {
    configure(fMap, [6, 6]); configure(fNor, [6, 6], undefined as any); configure(fArm, [6, 6], undefined as any);
    configure(wMap, [4, 2]); configure(wNor, [4, 2], undefined as any); configure(wArm, [4, 2], undefined as any);
    configure(cMap, [2, 2]); configure(cNor, [2, 2], undefined as any); configure(cArm, [2, 2], undefined as any);
  }, [fMap, fNor, fArm, wMap, wNor, wArm, cMap, cNor, cArm]);

  return {
    floor: { map: fMap, normal: fNor, arm: fArm } as PbrSet,
    wall: { map: wMap, normal: wNor, arm: wArm } as PbrSet,
    counter: { map: cMap, normal: cNor, arm: cArm } as PbrSet,
  };
}
