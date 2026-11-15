#!/usr/bin/env node
/**
 * Download a Poly Haven texture asset (CC0) — Diffuse + Normal + ARM at a
 * chosen resolution. Files are placed under `public/textures/<slug>/` as
 * three JPGs that Three.js can consume via `useTexture`.
 *
 * Usage:
 *   node scripts/fetch-polyhaven-tex.mjs <slug> [res=1k]
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(__dirname, "..", "public", "textures");

const slug = process.argv[2];
const res = process.argv[3] || "1k";
if (!slug) {
  console.error("usage: node scripts/fetch-polyhaven-tex.mjs <slug> [res=1k]");
  process.exit(1);
}

const api = `https://api.polyhaven.com/files/${slug}`;
console.log(`→ ${slug} @ ${res}`);
const idx = await (await fetch(api)).json();

const outDir = resolve(OUT_ROOT, slug);
mkdirSync(outDir, { recursive: true });

async function pull(mapName, outName) {
  const node = idx?.[mapName]?.[res]?.jpg;
  if (!node) {
    console.log(`  - no ${mapName}@${res}`);
    return;
  }
  const target = resolve(outDir, outName);
  if (existsSync(target)) {
    console.log(`  = cached   ${outName}`);
    return;
  }
  const buf = Buffer.from(await (await fetch(node.url)).arrayBuffer());
  writeFileSync(target, buf);
  console.log(`  ↓ ${(buf.length / 1024).toFixed(1).padStart(8)} KB  ${outName}`);
}

await pull("Diffuse", "diff.jpg");
await pull("nor_gl", "nor.jpg");
await pull("arm", "arm.jpg"); // AO + Rough + Metal packed

console.log(`✓ ${slug} → public/textures/${slug}/`);
