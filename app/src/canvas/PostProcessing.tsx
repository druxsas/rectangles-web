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
 * Cinematic post-processing stack for the store walkthrough. Bloom lifts
 * the cobalt screens + warm lamps; grain + vignette + aberration add the
 * "night store captured on film" cast the brandbook §15 storyboard asks for.
 */
export function PostProcessing() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SMAA />
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.38}
        luminanceSmoothing={0.3}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.0008, 0.0008)}
        radialModulation
        modulationOffset={0.4}
      />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
      <BrightnessContrast brightness={0.02} contrast={0.08} />
      <Vignette eskil={false} offset={0.22} darkness={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
