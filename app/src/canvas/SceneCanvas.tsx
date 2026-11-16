"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "@/canvas/CameraRig";
import { PostProcessing } from "@/canvas/PostProcessing";
import { Store } from "@/scenes/store/Store";

/**
 * Global persistent R3F canvas — the store is here and nothing else.
 * Scroll drives the camera through the brandbook §15 storyboard.
 */
export function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        shadows="soft"
        camera={{ position: [0, 4.2, 18], fov: 55, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#0a0b0d"]} />
        <fog attach="fog" args={["#0a0b0d", 28, 55]} />

        <Suspense fallback={null}>
          <Environment preset="warehouse" environmentIntensity={0.3} />
          <ambientLight intensity={0.3} color="#5a3f2a" />
          <hemisphereLight args={["#2a3b5a", "#1d1710", 0.5]} />
          <directionalLight
            position={[6, 9, 6]}
            intensity={0.7}
            color="#f1dfc6"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={30}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={10}
            shadow-camera-bottom={-2}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[0, 5, 14]} intensity={0.6} color="#8bb3e0" />
          <Store />
        </Suspense>
        <CameraRig />
        <PostProcessing />
      </Canvas>
    </div>
  );
}
