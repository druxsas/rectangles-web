"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useCheckout } from "@/stores/checkout";

/**
 * Shop hero — a stylized Rectangle's kraft shopping bag with a framed-mark
 * label. Clickable to open the marketplace. Slow bob + rotation.
 */
export function ShopScene() {
  const group = useRef<Group>(null);
  const openCheckout = useCheckout((s) => s.open);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.35;
    const t = performance.now() / 1000;
    group.current.position.y = Math.sin(t * 1.0) * 0.08;
    group.current.rotation.z = Math.sin(t * 0.8) * 0.05;
  });

  const kraft = "#b78a53";
  const ink = "#17191b";
  const paper = "#f7f7f3";

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
      {/* Bag body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.7, 0.7]} />
        <meshStandardMaterial color={kraft} roughness={0.9} />
      </mesh>
      {/* Front label plate */}
      <mesh position={[0, 0.15, 0.36]}>
        <planeGeometry args={[1.0, 0.45]} />
        <meshBasicMaterial color={ink} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.15, 0.37]}>
        <planeGeometry args={[0.92, 0.37]} />
        <meshBasicMaterial color={paper} toneMapped={false} />
      </mesh>
      {/* Handles — torus rings */}
      <mesh position={[-0.35, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.015, 8, 32]} />
        <meshStandardMaterial color="#6c4a1f" roughness={0.6} />
      </mesh>
      <mesh position={[0.35, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.015, 8, 32]} />
        <meshStandardMaterial color="#6c4a1f" roughness={0.6} />
      </mesh>
      {/* Cobalt accent pin */}
      <mesh position={[0.65, -0.65, 0.36]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshBasicMaterial color="#165dfa" toneMapped={false} />
      </mesh>
    </group>
  );
}
