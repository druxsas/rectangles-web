"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SmokeTestScene } from "@/scenes/SmokeTestScene";

/**
 * Global persistent R3F canvas.
 *
 * - Transparent background: the body paints `--theme-bg-canvas`, so the
 *   3D scene sits on top of a theme-aware surface without needing to be
 *   repainted on theme change.
 * - `fixed inset-0 z-0`: below the DOM layer which uses `z-10`.
 * - `pointer-events-none` lives on the DOM layer, not here — that way we
 *   can wire scene interactions directly on the canvas later.
 */
export function SceneCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <SmokeTestScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
