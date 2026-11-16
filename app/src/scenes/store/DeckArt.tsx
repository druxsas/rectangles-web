"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { SRGBColorSpace, type Texture } from "three";
import { SkateHQ, type ModelProps } from "@/scenes/store/models";

/**
 * Deck-bottom graphics (art: /Images/Skate_Arts, optimized by
 * scripts/optimize-skate-arts.mjs into /public/textures/decks).
 *
 * The skate model's "Deck_Bottom" material samples a strip of its atlas,
 * u ∈ [0, 0.254] across the deck width and v ∈ [0, 1] along its length; the
 * texture transform stretches each 512×2048 art over exactly that strip.
 */
export const DECK_ARTS = [
  "01-classic-ivory",
  "02-classic-outline",
  "03-inverted-paper",
  "04-offset-label",
  "05-repeat-type",
  "06-nested-frames",
  "07-split-field",
  "08-blue-label",
  "09-editorial-type",
  "10-archive-stripes",
  "11-sticker-composition",
  "12-halftone-concrete",
] as const;

export type DeckArtName = (typeof DECK_ARTS)[number];

const U_SPAN = 0.254;

function configure(t: Texture | Texture[]) {
  for (const tex of Array.isArray(t) ? t : [t]) {
    tex.colorSpace = SRGBColorSpace;
    tex.flipY = false; // glTF UV convention
    tex.anisotropy = 8;
    tex.repeat.set(1 / U_SPAN, 1);
  }
}

/** `maps` prop for <SkateHQ /> showing the given deck art. */
export function useDeckArt(name: DeckArtName) {
  const tex = useTexture(`/textures/decks/${name}.webp`, configure);
  return useMemo(() => ({ Deck_Bottom: tex }), [tex]);
}

/** A complete skateboard with the given bottom graphic. */
export function Deck({ art, ...props }: { art: DeckArtName } & Omit<ModelProps, "maps">) {
  const maps = useDeckArt(art);
  return <SkateHQ {...props} maps={maps} />;
}
