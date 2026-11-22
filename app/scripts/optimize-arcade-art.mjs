#!/usr/bin/env node
/**
 * Arcade cabinet artwork → web textures.
 *
 *   source:  /Images/Arcade_Art/templates/Arcade-Art-edited/<set>/arcade-{marquee,bezel,side}.{png,svg}
 *   output:  public/textures/arcade/<nn>-{marquee,bezel,side,side-mirror}.webp
 *
 * One art set per cabinet. The side art is drawn with the cabinet's front on
 * the left, which is right for one flank only; the other flank needs the
 * silhouette mirrored but the lettering still readable. `side-mirror` is
 * rendered from the SVG: the whole panel is flipped, then every outlined
 * lettering path is flipped back about its own centre.
 *
 * Usage: node scripts/optimize-arcade-art.mjs
 */
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "..", "Images", "Arcade_Art", "templates", "Arcade-Art-edited");
const OUT = join(APP, "public", "textures", "arcade");

const SETS = { "01": "rectangles-arcade", "02": "rectangles-arcade-v02" };
/** Output sizes (the panels are 0.69 × 0.20, 0.70 × 0.62 and 0.69 × 1.81 m). */
const SIZE = { marquee: [1386, 402], bezel: [1390, 1242], side: [1038, 2722] };
const SIDE_W = 1384;

/** Horizontal centre of an absolute-command path (M L H V Q Z). */
function centreX(d) {
  const xs = [];
  for (const [, cmd, args] of d.matchAll(/([MLHVQZ])([^MLHVQZ]*)/g)) {
    const n = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
    if (cmd === "H") xs.push(...n);
    else if (cmd === "M" || cmd === "L" || cmd === "Q") for (let i = 0; i < n.length; i += 2) xs.push(n[i]);
  }
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

function mirroredSide(svg) {
  const start = svg.indexOf("</defs>") + "</defs>".length;
  const end = svg.lastIndexOf("</svg>");
  // Lettering is exported as <path fill=… d=…/> (shapes put `d` first).
  const art = svg
    .slice(start, end)
    // Abutting pixel-art squares would show hairline seams when antialiased.
    .replaceAll("<rect ", '<rect shape-rendering="crispEdges" ')
    .replace(/<path fill="[^"]*" d="([^"]*)"\/>/g, (path, d) => `<g transform="translate(${(2 * centreX(d)).toFixed(3)} 0) scale(-1 1)">${path}</g>`);
  return `${svg.slice(0, start)}<g transform="translate(${SIDE_W} 0) scale(-1 1)">${art}</g></svg>`;
}

const webp = { quality: 90, alphaQuality: 95, effort: 6, smartSubsample: true };
mkdirSync(OUT, { recursive: true });
let before = 0;
let after = 0;
for (const [id, dir] of Object.entries(SETS)) {
  const jobs = [
    ["marquee", sharp(join(SRC, dir, "arcade-marquee.png")).flatten({ background: "#17191b" })],
    ["bezel", sharp(join(SRC, dir, "arcade-bezel.png"))],
    ["side", sharp(join(SRC, dir, "arcade-side.png"))],
    ["side-mirror", sharp(Buffer.from(mirroredSide(readFileSync(join(SRC, dir, "arcade-side.svg"), "utf8"))), { density: 72 * (SIZE.side[0] / SIDE_W) * 4 })],
  ];
  for (const [name, image] of jobs) {
    const [w, h] = SIZE[name.replace("-mirror", "")];
    const out = join(OUT, `${id}-${name}.webp`);
    await image.resize(w, h, { fit: "fill" }).webp(webp).toFile(out);
    after += statSync(out).size;
    console.log(`${id}-${name}.webp  ${w}×${h}  ${Math.round(statSync(out).size / 1024)} K`);
  }
  for (const f of ["arcade-marquee.png", "arcade-bezel.png", "arcade-side.png"]) before += statSync(join(SRC, dir, f)).size;
}
console.log(`sources ${Math.round(before / 1024)} K → ${Math.round(after / 1024)} K`);
