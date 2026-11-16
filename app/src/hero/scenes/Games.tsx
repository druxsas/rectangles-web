"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { useNightShiftTexture } from "@/hero/NightShiftTexture";

/**
 * Games hero — the high-poly arcade cabinet (Draco-compressed) with the
 * Night Shift CanvasTexture overlaid on its face. Gentle rotation + cobalt
 * pool light from the screen.
 */
const PATH = "/models/opt/arcade_hq.glb";

export function GamesScene() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(PATH);
  const instance = useMemo(() => scene.clone(true), [scene]);
  const nightShift = useNightShiftTexture();

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y = Math.sin(performance.now() / 1000 * 0.4) * 0.3;
    }
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={instance} scale={1} />
      </Center>
      {/* Night Shift live screen on the arcade face (positioned loosely —
          the cabinet geometry's screen cutout varies, this sits in front). */}
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
