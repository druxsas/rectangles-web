"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SmokeTestScene } from "@/scenes/SmokeTestScene";

export function SceneCanvas() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <color attach="background" args={["#17191b"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <SmokeTestScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
