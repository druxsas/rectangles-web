"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { useNightShiftTexture } from "@/hero/NightShiftTexture";

/**
 * Games hero — the arcade cabinet (Poly by Google, CC-BY) with Night
 * Shift running live on its face. Gentle rotation + cobalt pool light
 * from the recessed screen.
 */
const PATH = "/models/arcade_cabinet/arcade_cabinet.glb";

export function GamesScene() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(PATH);
  const instance = useMemo(() => scene.clone(true), [scene]);
  const nightShift = useNightShiftTexture();

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(performance.now() / 1000 * 0.4) * 0.3;
    }
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={instance} scale={2.6} />
      </Center>
      {/* Night Shift live screen laid in front of the cabinet face. The
          cabinet model's exact screen cutout varies, so we float this
          plane slightly forward and tune in-browser. */}
      <mesh position={[0, 0.55, 0.52]}>
        <planeGeometry args={[0.9, 0.7]} />
        <meshBasicMaterial map={nightShift} toneMapped={false} />
      </mesh>
      {/* Cobalt spill from the screen */}
      <pointLight position={[0, 0.6, 1]} color="#165dfa" intensity={2.6} distance={4.5} decay={1.4} />
    </group>
  );
}

useGLTF.preload(PATH);
