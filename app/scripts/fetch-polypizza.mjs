#!/usr/bin/env node
/**
 * Download a Poly Pizza (poly.pizza / Google Poly archive) model as a
 * self-contained GLB and place it under `public/models/<slug>/`.
 *
 * Scrapes the model page HTML to find the static GLB UUID, then pulls the
 * raw .glb from the CDN. Poly Pizza models are CC-BY or CC0; credit the
 * author in CREDITS.md per the model page.
 *
 * Usage:
 *   node scripts/fetch-polypizza.mjs <modelId> <slug>
 *   node scripts/fetch-polypizza.mjs pkmHvN1O2V monstera
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(__dirname, "..", "public", "models");

const modelId = process.argv[2];
const slug = process.argv[3];
if (!modelId || !slug) {
  console.error("usage: node scripts/fetch-polypizza.mjs <modelId> <slug>");
  process.exit(1);
}

console.log(`→ ${slug} (id: ${modelId})`);

const pageUrl = `https://poly.pizza/m/${modelId}`;
const page = await (await fetch(pageUrl)).text();

// Find the static CDN uuid. Pattern: https://static.poly.pizza/<uuid>.glb
const match = page.match(/static\.poly\.pizza\/([a-f0-9-]{36})\.glb/);
if (!match) {
  console.error(`! Could not find GLB UUID on page ${pageUrl}`);
  process.exit(1);
}
const uuid = match[1];
const glbUrl = `https://static.poly.pizza/${uuid}.glb`;

const outDir = resolve(OUT_ROOT, slug);
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, `${slug}.glb`);

const res = await fetch(glbUrl);
if (!res.ok) {
  console.error(`! Download failed: HTTP ${res.status}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(outPath, buf);
console.log(`✓ ${(buf.length / 1024).toFixed(1)} KB → public/models/${slug}/${slug}.glb`);

// Try to grab license + author from the page for CREDITS.md
const authorMatch = page.match(/by\s+<[^>]+>([^<]+)</) || page.match(/"author":"([^"]+)"/);
const licenseMatch = page.match(/(CC0|CC BY|CC-BY|Creative Commons Attribution|Creative Commons Zero)/i);
console.log(`  author: ${authorMatch ? authorMatch[1] : "(see page)"}`);
console.log(`  license: ${licenseMatch ? licenseMatch[1] : "(see page)"}`);
