#!/usr/bin/env node
/**
 * Re-encode the store shell PBR textures (Poly Haven CC0 JPGs) to WebP.
 * Colour maps q80, data maps (normal / ARM) q88 — data maps tolerate less
 * loss. Writes <name>.webp next to each source JPG.
 *
 * Usage: node scripts/optimize-textures.mjs
 */
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "textures");
const SETS = ["concrete_floor_worn_001", "concrete_wall_006"];

for (const set of SETS) {
  for (const file of readdirSync(join(ROOT, set)).filter((f) => f.endsWith(".jpg"))) {
    const src = join(ROOT, set, file);
    const out = src.replace(/\.jpg$/, ".webp");
    const quality = file.startsWith("diff") ? 80 : 88;
    await sharp(src).webp({ quality, effort: 6 }).toFile(out);
    const kb = (f) => Math.round(statSync(f).size / 1024);
    console.log(`${set}/${file}  ${kb(src)}K → ${kb(out)}K`);
  }
}
