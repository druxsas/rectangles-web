#!/usr/bin/env node
/**
 * /Images/rectangles-hotspot-pulse.gif (512², opaque dark background)
 * → public/ui/hotspot.webp: animated WebP, 128², background keyed out to
 * alpha so the blue ring floats over the 3D scene.
 *
 * Usage: node scripts/optimize-hotspot.mjs
 */
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "..", "Images", "rectangles-hotspot-pulse.gif");
const OUT = join(APP, "public", "ui", "hotspot.webp");
const SIZE = 128;

const meta = await sharp(SRC, { animated: true }).metadata();
const frames = [];
let bg = null;
for (let i = 0; i < meta.pages; i++) {
  const { data, info } = await sharp(SRC, { page: i }).resize(SIZE, SIZE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (!bg) bg = [data[0], data[1], data[2]]; // corner = background
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    // Light above the background becomes coverage; un-premultiply against it.
    const a = Math.min(1, Math.max(0, (Math.max(r - bg[0], g - bg[1], b - bg[2]) / 255) * 1.6));
    const un = (c, k) => (a > 0.004 ? Math.min(255, Math.max(0, (c - k * (1 - a)) / a)) : 0);
    rgba[p * 4] = un(r, bg[0]);
    rgba[p * 4 + 1] = un(g, bg[1]);
    rgba[p * 4 + 2] = un(b, bg[2]);
    rgba[p * 4 + 3] = Math.round(a * 255);
  }
  frames.push(await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer());
}
await sharp(frames, { join: { animated: true } })
  .webp({ quality: 72, alphaQuality: 85, effort: 6, loop: 0, delay: meta.delay ?? Array(meta.pages).fill(60) })
  .toFile(OUT);
console.log(`${meta.pages} frames, bg rgb(${bg}) → ${OUT}  ${Math.round(statSync(SRC).size / 1024)}K → ${Math.round(statSync(OUT).size / 1024)}K`);
