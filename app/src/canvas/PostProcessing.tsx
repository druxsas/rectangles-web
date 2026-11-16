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
import { useQuality } from "@/canvas/quality";

const CA_OFFSET = new Vector2(0.0008, 0.0008);

/**
 * Cinematic post-processing for the store walkthrough. Bloom lifts the
 * cobalt screens + warm signs; grain + vignette + aberration add the
 * "night store captured on film" cast the brandbook §15 storyboard asks for.
 *
 * Low tier keeps only what defines the look — a small-kernel mip bloom,
 * tone mapping, vignette and SMAA — and drops grain, chromatic aberration
 * and the contrast pass.
 */
export function PostProcessing() {
  const high = useQuality((s) => s.tier) === "high";

  if (!high) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <Bloom intensity={0.9} luminanceThreshold={0.42} luminanceSmoothing={0.3} kernelSize={KernelSize.SMALL} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.7} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SMAA />
      <Bloom intensity={1.0} luminanceThreshold={0.38} luminanceSmoothing={0.3} kernelSize={KernelSize.LARGE} mipmapBlur />
      <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.4} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
      <BrightnessContrast brightness={0.02} contrast={0.08} />
      <Vignette eskil={false} offset={0.22} darkness={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
