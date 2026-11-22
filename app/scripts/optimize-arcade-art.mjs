#!/usr/bin/env node
/**
 * Arcade cabinet artwork → web textures.
 *
 *   source:  /Images/Arcade_Art/templates/Arcade-Art-edited/rectangles-arcade-clean-svg-png/<set>/
 *            arcade-{marquee,bezel,side,side-right}.png
 *   output:  public/textures/arcade/<nn>-{marquee,bezel,side,side-mirror}.webp
 *
 * One art set per cabinet. Each set brings two flank designs: `side` with
 * the cabinet's front on the left and `side-right` with it on the right
 * (same silhouette mirrored, lettering the right way round) — the scene
 * calls the second one `side-mirror`.
 *
 * Usage: node scripts/optimize-arcade-art.mjs
 */
import { mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "..", "Images", "Arcade_Art", "templates", "Arcade-Art-edited", "rectangles-arcade-clean-svg-png");
const OUT = join(APP, "public", "textures", "arcade");

/** Cabinet → art set: 01 stands by the window, 02 on the skate side. */
const SETS = { "01": "07-beat-the-high-score", "02": "08-play-without-limits" };
/** Texture name → source file. */
const PIECES = { marquee: "arcade-marquee.png", bezel: "arcade-bezel.png", side: "arcade-side.png", "side-mirror": "arcade-side-right.png" };
/**
 * Output sizes (the panels are 0.69 × 0.20, 0.70 × 0.62 and 0.69 × 1.81 m):
 * about 1500 px per metre on the fronts, 1200 on the flanks — these are
 * textured illustrations, which weigh several times what flat art does.
 */
const SIZE = { marquee: [1040, 302], bezel: [1042, 931], side: [830, 2176], "side-mirror": [830, 2176] };

const webp = { quality: 76, alphaQuality: 90, effort: 6, smartSubsample: true };
mkdirSync(OUT, { recursive: true });
let before = 0;
let after = 0;
for (const [id, dir] of Object.entries(SETS)) {
  for (const [name, file] of Object.entries(PIECES)) {
    const src = join(SRC, dir, file);
    const [w, h] = SIZE[name];
    const out = join(OUT, `${id}-${name}.webp`);
    const image = sharp(src);
    // The marquee is an opaque panel: drop any stray alpha.
    await (name === "marquee" ? image.flatten({ background: "#17191b" }) : image).resize(w, h, { fit: "fill" }).webp(webp).toFile(out);
    before += statSync(src).size;
    after += statSync(out).size;
    console.log(`${id}-${name}.webp  ${w}×${h}  ${Math.round(statSync(out).size / 1024)} K`);
  }
}
console.log(`sources ${(before / 1024 / 1024).toFixed(1)} MB → ${Math.round(after / 1024)} K`);
