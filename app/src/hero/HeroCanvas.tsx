"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { KernelSize, ToneMappingMode } from "postprocessing";
import { ToneMapping } from "@react-three/postprocessing";
import type { ReactNode } from "react";

/**
 * Per-section hero canvas. Each editorial section instantiates its own
 * canvas with a single hero element inside. Shared lighting + post stack
 * so every section reads with the same craft.
 *
 * The Rectangle's approach: one object per frame, treated with care — no
 * dioramas. Dark surround, soft bloom, a cool rim and a warm key.
 */
type Props = {
  children: ReactNode;
  /** Camera position. Defaults to a clean 3/4 angle. */
  cameraPos?: [number, number, number];
  cameraFov?: number;
  /** Optional background color (transparent by default so the section bg shows through). */
  background?: string;
  /** Bloom intensity (default soft). */
  bloom?: number;
};

export function HeroCanvas({
  children,
  cameraPos = [2.4, 1.6, 4],
  cameraFov = 40,
  background,
  bloom = 0.8,
}: Props) {
  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: background === undefined, powerPreference: "high-performance" }}
        shadows="soft"
        camera={{ position: cameraPos, fov: cameraFov, near: 0.1, far: 50 }}
      >
        {background ? <color attach="background" args={[background]} /> : null}

        {/* Lighting: subtle fill + a cool rim light + a warm key */}
        <ambientLight intensity={0.25} color="#f1dfc6" />
        <hemisphereLight args={["#2a3b5a", "#1d1710", 0.4]} />
        <directionalLight
          position={[4, 6, 3]}
          intensity={1.4}
          color="#f5e3c8"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={15}
          shadow-bias={-0.0005}
        />
        {/* Cobalt rim from the back-left */}
        <directionalLight position={[-4, 2, -3]} intensity={1.0} color="#4a86ff" />

        <Environment preset="studio" environmentIntensity={0.3} />

        {children}

        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={bloom}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.25}
            kernelSize={KernelSize.LARGE}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.3} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
