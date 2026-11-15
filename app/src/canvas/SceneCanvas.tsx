"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "@/canvas/CameraRig";
import { PostProcessing } from "@/canvas/PostProcessing";
import { Lighting } from "@/scenes/store/Lighting";
import { Store } from "@/scenes/store/Store";

/**
 * Global persistent R3F canvas.
 *
 * Scene is always the Rectangle's store interior — dark concrete, warm
 * lamps, cool screens (brandbook §15). A solid dark background + HDRI
 * environment lighting + a full postprocessing stack give the scene its
 * cinematic cast regardless of the DOM theme.
 */
export function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        shadows="soft"
        camera={{ position: [0, 1.8, 14], fov: 45, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#0a0b0d"]} />
        <fog attach="fog" args={["#0a0b0d", 32, 60]} />
        <Suspense fallback={null}>
          {/* Night interior HDRI — adds ambient color and specular highlights.
              `warehouse` preset is the closest drei baked HDRI to the brandbook mood. */}
          <Environment preset="warehouse" environmentIntensity={0.35} />
          <Lighting />
          <Store />
        </Suspense>
        <CameraRig />
        <PostProcessing />
      </Canvas>
    </div>
  );
}
