"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * Music hero — a spinning vinyl record. Built from primitives (thin
 * cylinder + concentric grooves + label), no model needed. The cobalt
 * label echoes the brand accent.
 */
export function MusicScene() {
  const record = useRef<Mesh>(null);

  useFrame((_, dt) => {
    if (record.current) {
      record.current.rotation.y += dt * 1.6;
    }
  });

  return (
    <group rotation={[-0.3, 0, 0.1]}>
      {/* Record body */}
      <mesh ref={record} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 96]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Concentric grooves — a few lighter rings to catch highlight */}
      {[1.3, 1.1, 0.9, 0.75].map((r) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
          <ringGeometry args={[r - 0.005, r, 128]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Label — cobalt disc with wordmark approximated as a smaller ring */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 64]} />
        <meshStandardMaterial color="#165dfa" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.46, 64]} />
        <meshBasicMaterial color="#f7f7f3" />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 24]} />
        <meshBasicMaterial color="#0a0b0d" />
      </mesh>

      {/* Tonearm hint — a thin bar coming from the side */}
      <mesh position={[1.4, 0.25, -0.4]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[1.2, 0.04, 0.05]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.9, 0.2, -0.25]}>
        <boxGeometry args={[0.08, 0.1, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
