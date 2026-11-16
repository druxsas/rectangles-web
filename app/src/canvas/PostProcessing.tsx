"use client";

import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  FXAA,
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
  // `?nopost=1`: measurement aid — renders without the effect stack.
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("nopost")) return null;

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

  // Desktop stack, tuned by measurement (post was ~45% of the frame):
  // FXAA instead of SMAA and a 4-level mip bloom (intensity lowered to match
  // the old, wider 8-level glow) — ~30% more fps for a near-identical look.
  // `?off=fxaa,bloom,ca,noise,bc,vignette` skips effects (measurement aid).
  const off = typeof window === "undefined" ? [] : (new URLSearchParams(window.location.search).get("off") ?? "").split(",");
  const on = (k: string) => !off.includes(k);
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {on("fxaa") ? <FXAA /> : <></>}
      {on("bloom") ? <Bloom intensity={0.62} luminanceThreshold={0.38} luminanceSmoothing={0.3} mipmapBlur levels={4} /> : <></>}
      {on("ca") ? <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.4} /> : <></>}
      {on("noise") ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} /> : <></>}
      {on("bc") ? <BrightnessContrast brightness={0.02} contrast={0.08} /> : <></>}
      {on("vignette") ? <Vignette eskil={false} offset={0.22} darkness={0.7} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
