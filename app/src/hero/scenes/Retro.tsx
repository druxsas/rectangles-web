"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { useCheckout } from "@/stores/checkout";

/**
 * Retro hero — iMac G3 high-poly (Draco-compressed) as the shop portal.
 * Click opens the marketplace. Slow Y rotation + hover bob, cobalt rim
 * light so the Bondi-blue shell reads.
 */
const PATH = "/models/opt/imac.glb";

export function RetroScene() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(PATH);
  const instance = useMemo(() => scene.clone(true), [scene]);
  const openCheckout = useCheckout((s) => s.open);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.25;
    const t = performance.now() / 1000;
    group.current.position.y = Math.sin(t * 0.8) * 0.04;
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        openCheckout();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <Center>
        <primitive object={instance} scale={1} />
      </Center>
      {/* Cobalt accent light */}
      <pointLight position={[1.5, 1.2, 1.5]} color="#4a86ff" intensity={2.5} distance={5} decay={1.4} />
    </group>
  );
}

useGLTF.preload(PATH);
