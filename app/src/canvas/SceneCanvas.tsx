"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "@/canvas/CameraRig";
import { Lighting } from "@/scenes/store/Lighting";
import { Store } from "@/scenes/store/Store";

/**
 * Global persistent R3F canvas.
 *
 * The scene is the Rectangle's store interior — per brandbook §15 it is
 * always dark concrete + warm lamps + cool screens. We paint a solid dark
 * background instead of letting the themed DOM show through, so the
 * cinematic environment stays consistent regardless of UI theme.
 */
export function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        shadows={false}
        camera={{ position: [0, 1.8, 14], fov: 45, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#0a0b0d"]} />
        {/* Fog pushed far out so the storefront reads from outside and the
            back of the store is still visible from the interior keyframes. */}
        <fog attach="fog" args={["#0a0b0d", 28, 55]} />
        <Suspense fallback={null}>
          <Lighting />
          <Store />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
