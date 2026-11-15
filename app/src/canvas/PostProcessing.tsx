"use client";

import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize, ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";

/**
 * Cinematic post-processing stack for the Rectangle's store scene.
 *
 * The emissive screens (arcade, iMac) and the facade wordmark carry the
 * scene; bloom turns them into light sources. A subtle vignette, grain,
 * chromatic aberration, and ACES tone mapping add the "night-store with
 * a camera" feel the brandbook §15 storyboard suggests.
 *
 * Keep effects count small — each pass costs a draw.
 */
export function PostProcessing() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SMAA />
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.3}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.0008, 0.0008)}
        radialModulation={true}
        modulationOffset={0.4}
      />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
      <BrightnessContrast brightness={0.02} contrast={0.08} />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
