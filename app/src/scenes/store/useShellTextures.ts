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

/** Load the Poly Haven CC0 PBR texture sets for the store shell. */
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
  const [fMap, fNor, fArm, wMap, wNor, wArm, cMap, cNor, cArm] = useLoader(TextureLoader, paths);

  useEffect(() => {
    configure(fMap, [8, 5]); configure(fNor, [8, 5], undefined as any); configure(fArm, [8, 5], undefined as any);
    configure(wMap, [3, 1.1]); configure(wNor, [3, 1.1], undefined as any); configure(wArm, [3, 1.1], undefined as any);
    configure(cMap, [2, 2]); configure(cNor, [2, 2], undefined as any); configure(cArm, [2, 2], undefined as any);
  }, [fMap, fNor, fArm, wMap, wNor, wArm, cMap, cNor, cArm]);

  return {
    floor: { map: fMap, normal: fNor, arm: fArm } as PbrSet,
    wall: { map: wMap, normal: wNor, arm: wArm } as PbrSet,
    counter: { map: cMap, normal: cNor, arm: cArm } as PbrSet,
  };
}
