#!/usr/bin/env node
/**
 * Download a Poly Haven model asset (CC0) with its gltf + bin + textures
 * at a chosen resolution. Files are placed under `public/models/<slug>/`
 * ready for `useGLTF` to load via `/models/<slug>/<file>.gltf`.
 *
 * Usage:
 *   node scripts/fetch-polyhaven.mjs CashRegister_01 1k
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_MODELS = resolve(__dirname, "..", "public", "models");

const slug = process.argv[2];
const res = process.argv[3] || "1k";
if (!slug) {
  console.error("usage: node scripts/fetch-polyhaven.mjs <slug> [res=1k]");
  process.exit(1);
}

const api = `https://api.polyhaven.com/files/${slug}`;
console.log(`→ Fetching index: ${api}`);
const idx = await (await fetch(api)).json();
const gltfBundle = idx?.gltf?.[res]?.gltf;
if (!gltfBundle) {
  console.error(`! No gltf bundle at resolution ${res} for ${slug}`);
  console.error(`  Available resolutions: ${Object.keys(idx?.gltf ?? {}).join(", ")}`);
  process.exit(1);
}

const outDir = resolve(PUBLIC_MODELS, slug);
mkdirSync(resolve(outDir, "textures"), { recursive: true });

async function download(url, localPath) {
  if (existsSync(localPath)) {
    console.log(`  = cached   ${localPath.split("/").slice(-2).join("/")}`);
    return;
  }
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(localPath, buf);
  console.log(`  ↓ ${(buf.length / 1024).toFixed(1).padStart(8)} KB  ${localPath.split("/").slice(-2).join("/")}`);
}

// Main gltf file
await download(gltfBundle.url, resolve(outDir, `${slug}.gltf`));
// Everything the gltf references
for (const [relPath, item] of Object.entries(gltfBundle.include)) {
  const target = resolve(outDir, relPath);
  mkdirSync(dirname(target), { recursive: true });
  await download(item.url, target);
}

console.log(`✓ ${slug} @ ${res} → public/models/${slug}/`);
