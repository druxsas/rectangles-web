#!/usr/bin/env node
/**
 * Deck-bottom graphics: /Images/Skate_Arts/*.png (1:3) → public/textures/decks/*.webp
 *
 * The deck bottom's UV strip is ~1:3.9 (deck + kicktails). Arts are scaled
 * to the deck width without cropping, and the ends are extended with each
 * art's own edge colour, giving a 512×2048 texture.
 *
 * Usage: node scripts/optimize-skate-arts.mjs
 */
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "..", "Images", "Skate_Arts");
const OUT = join(APP, "public", "textures", "decks");
const W = 512;
const H = 2048;

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => /^\d\d-.*\.png$/.test(f))) {
  const src = join(SRC, file);
  const art = sharp(src).resize(W, Math.round((W * 3))).removeAlpha();
  const body = await art.toBuffer();
  const h = (await sharp(body).metadata()).height;
  const edge = async (top) => {
    const { dominant } = await sharp(body).extract({ left: 0, top: top ? 0 : h - 24, width: W, height: 24 }).stats();
    return dominant;
  };
  const [topC, botC] = [await edge(true), await edge(false)];
  const pad = (H - h) / 2;
  const out = join(OUT, file.replace(/\.png$/, ".webp"));
  await sharp({ create: { width: W, height: H, channels: 3, background: topC } })
    .composite([
      { input: { create: { width: W, height: Math.ceil(pad), channels: 3, background: botC } }, top: H - Math.ceil(pad), left: 0 },
      { input: body, top: Math.floor(pad), left: 0 },
    ])
    .webp({ quality: 84, effort: 6 })
    .toFile(out);
  console.log(`${file}  ${Math.round(statSync(src).size / 1024)}K → ${Math.round(statSync(out).size / 1024)}K`);
}
