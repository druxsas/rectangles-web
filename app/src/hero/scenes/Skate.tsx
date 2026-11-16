"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

/**
 * Skate hero — a single complete skateboard (Thomas van iseghem, CC-BY)
 * floating, catching a dramatic single light. Slow rotation in Y + a
 * subtle tilt breathing in Z.
 */
const PATH = "/models/skateboard/skateboard.glb";

export function SkateScene() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(PATH);
  const instance = useMemo(() => scene.clone(true), [scene]);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.35;
    const t = performance.now() / 1000;
    group.current.rotation.z = Math.sin(t * 0.6) * 0.08;
    group.current.position.y = Math.sin(t * 0.9) * 0.08;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={instance} scale={2.2} rotation={[0, 0, 0]} />
      </Center>
      {/* Cobalt underglow pool */}
      <pointLight position={[0, -1.4, 0]} color="#165dfa" intensity={3.5} distance={4} decay={1.5} />
    </group>
  );
}

useGLTF.preload(PATH);
