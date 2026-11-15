"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

export function SmokeTestScene() {
  const rect = useRef<Mesh>(null);

  useFrame((_, dt) => {
    if (!rect.current) return;
    rect.current.rotation.x += dt * 0.2;
    rect.current.rotation.y += dt * 0.35;
  });

  return (
    <mesh ref={rect}>
      <boxGeometry args={[3, 1, 0.1]} />
      <meshStandardMaterial color="#165dfa" roughness={0.3} metalness={0.1} />
    </mesh>
  );
}
