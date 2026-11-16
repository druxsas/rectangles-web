"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

/**
 * Music hero — a tower speaker (Draco-compressed) alongside a spinning
 * vinyl record built from primitives. The vinyl rotates on its own axis;
 * the whole pair pans subtly.
 */
const SPEAKER_PATH = "/models/speaker_hq/speaker_hq.glb";

export function MusicScene() {
  const group = useRef<Group>(null);
  const record = useRef<Mesh>(null);
  const { scene } = useGLTF(SPEAKER_PATH);
  const speakerInstance = useMemo(() => scene.clone(true), [scene]);

  useFrame((_, dt) => {
    if (record.current) {
      record.current.rotation.y += dt * 1.8;
    }
    if (group.current) {
      const t = performance.now() / 1000;
      group.current.rotation.y = Math.sin(t * 0.4) * 0.2;
    }
  });

  return (
    <group ref={group}>
      {/* Speaker tower on the left */}
      <group position={[-0.9, 0, 0]}>
        <Center>
          <primitive object={speakerInstance} scale={1} />
        </Center>
      </group>

      {/* Vinyl on the right, slightly in front */}
      <group position={[0.9, 0.3, 0.5]} rotation={[-0.3, 0, 0.1]}>
        <mesh ref={record} castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.02, 96]} />
          <meshStandardMaterial color="#0b0b0b" roughness={0.6} metalness={0.3} />
        </mesh>
        {[0.7, 0.6, 0.5, 0.4].map((r) => (
          <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
            <ringGeometry args={[r - 0.004, r, 128]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.28, 64]} />
          <meshStandardMaterial color="#165dfa" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.025, 24]} />
          <meshBasicMaterial color="#0a0b0d" />
        </mesh>
      </group>

      {/* Cobalt accent light */}
      <pointLight position={[0.5, 1, 1.2]} color="#4a86ff" intensity={2.0} distance={4.5} decay={1.4} />
    </group>
  );
}

useGLTF.preload(SPEAKER_PATH);
