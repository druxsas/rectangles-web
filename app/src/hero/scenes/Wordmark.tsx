"use client";

import { Center, Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, PointLight } from "three";

/**
 * Hero wordmark — "RECTANGLE'S" extruded in 3D, catching a cobalt rim light
 * that orbits slowly around it. Pure typography made volumetric; this is
 * the first thing a visitor sees.
 */
export function WordmarkScene() {
  const group = useRef<Group>(null);
  const rimLight = useRef<PointLight>(null);

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * 0.12;
    }
    if (rimLight.current) {
      const t = performance.now() / 1000;
      rimLight.current.position.x = Math.cos(t * 0.6) * 3.5;
      rimLight.current.position.z = Math.sin(t * 0.6) * 3.5;
      rimLight.current.position.y = 1.2 + Math.sin(t * 0.3) * 0.4;
    }
  });

  return (
    <group ref={group}>
      <Center>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={1.15}
          height={0.4}
          curveSegments={6}
          bevelEnabled
          bevelSize={0.02}
          bevelThickness={0.03}
          bevelSegments={3}
          letterSpacing={-0.04}
        >
          {"RECTANGLE'S"}
          <meshStandardMaterial
            color="#f7f7f3"
            metalness={0.3}
            roughness={0.25}
          />
        </Text3D>
      </Center>
      {/* Orbiting cobalt rim light */}
      <pointLight
        ref={rimLight}
        color="#165dfa"
        intensity={5}
        distance={9}
        decay={1.5}
      />
      {/* Grounding shadow catcher */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 8]} />
        <shadowMaterial opacity={0.4} />
      </mesh>
    </group>
  );
}
