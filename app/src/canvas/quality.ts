"use client";

import { create } from "zustand";

/**
 * Render quality tier.
 *
 *   high — desktop: full quality, exactly as designed (soft shadows, full
 *          post stack, all accent lights, native DPR up to 2). Never
 *          degraded automatically — sharpness on retina screens matters.
 *   low  — phones / tablets (touch + small screen) or Save-Data: no
 *          shadows, a single cheap bloom pass, fewer lights, DPR ≤ 1.5.
 *
 * Detected once on the client; override with `?quality=low|high`.
 */
export type Tier = "high" | "low";

export function detectTier(): Tier {
  if (typeof window === "undefined") return "high";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "low" || forced === "high") return forced;

  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.screen.width, window.screen.height) < 820;
  const saveData = nav.connection?.saveData === true;

  return (coarse && small) || saveData ? "low" : "high";
}

type QualityState = {
  tier: Tier;
  /** True once the tier has been detected on the client. */
  ready: boolean;
  /** Device-pixel-ratio cap for the tier. */
  dpr: number;
  setTier: (t: Tier) => void;
};

export const useQuality = create<QualityState>((set) => ({
  tier: "high",
  ready: false,
  dpr: 1.5,
  setTier: (tier) => set({ tier, ready: true, dpr: tier === "low" ? 1.5 : 2 }),
}));
