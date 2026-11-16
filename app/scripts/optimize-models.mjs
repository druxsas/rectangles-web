#!/usr/bin/env node
/**
 * Web/mobile optimization pass for every GLB the store loads.
 *
 *   source:  /assets-src/models/<name>.glb   (full-quality conversions)
 *   output:  /app/public/models/opt/<name>.glb
 *
 * Per model: dedup + prune → weld → simplify (meshoptimizer, ratio picked by
 * how close the camera ever gets) → textures to WebP, base colour ≤ `tex`
 * px and data maps (normal/roughness/metal/AO) ≤ `data` px → Draco.
 *
 * Usage:  node scripts/optimize-models.mjs [name ...]
 */

import { NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, draco, flatten, join as joinMeshes, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptSimplifier } from "meshoptimizer";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "..", "assets-src", "models");
const OUT = join(APP, "public", "models", "opt");

/**
 * source: alternate source file in assets-src/models (e.g. a Blender
 *         collapse-decimated "<name>.lod" from scripts/blender/decimate_glb.py,
 *         used for foliage / kit-bashed models meshoptimizer can't reduce)
 * join:  merge all meshes that share a material into one draw call each
 *        (only for models whose node names the scene doesn't rely on)
 * drop:  node names removed before joining (e.g. material-preview spheres)
 * ratio: target share of triangles kept (1 = no simplification)
 * error: max simplification error, relative to mesh extent
 * tex / data: max texture edge for base colour / data maps
 */
const MODELS = {
  // Hero deck seen close at the Skate stop, 7 instances in the scene.
  skate_hq: { ratio: 0.04, error: 0.002, tex: 1024, data: 512, join: true },
  // Foliage, 4 instances, never closer than ~1.5 m. Blender pre-pass: --ratio 0.18
  plants_hq: { source: "plants_hq.lod", ratio: 1 },
  // Ceiling track lights, 4 instances, always far away.
  hokasu: { ratio: 0.04, error: 0.004, join: true, drop: ["HOKASU Tube Clip TR4-001", "HOKASU Tube Clip TR4-002"] },
  // Two cabinets, seen at mid-distance at the Games stop. Blender pre-pass: --ratio 0.12
  arcade_hq: { source: "arcade_hq.lod", ratio: 1, join: true },
  // Close-up at the Music stop.
  record_player: { ratio: 0.4, error: 0.001, tex: 1024, data: 512 },
  // Close-up when shopping (screen is a separate plane).
  imac: { ratio: 0.5, error: 0.0008, tex: 1024, data: 1024 },
  william: { ratio: 1, tex: 1024, data: 512 },
  speaker_hq: { ratio: 0.7, error: 0.001, join: true },
  rug: { ratio: 1, tex: 1024 },
  tv: { ratio: 1 },
  paper_bag: { ratio: 1 },
  turntable: { ratio: 1 },
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});

function triangles(doc) {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      const idx = p.getIndices();
      n += (idx ? idx.getCount() : p.getAttribute("POSITION").getCount()) / 3;
    }
  return Math.round(n);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MODELS);
mkdirSync(OUT, { recursive: true });
await MeshoptSimplifier.ready;

for (const name of names) {
  const cfg = MODELS[name];
  if (!cfg) {
    console.warn(`skip ${name}: no config`);
    continue;
  }
  const src = join(SRC, `${cfg.source ?? name}.glb`);
  const out = join(OUT, `${name}.glb`);
  const doc = await io.read(src);
  const before = triangles(doc);

  // Materials are NOT deduplicated: the scene overrides them by name
  // (e.g. the arcade screen, the bag's gold foil), even when identical.
  for (const node of doc.getRoot().listNodes()) if (cfg.drop?.includes(node.getName())) node.dispose();

  const steps = [
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
    prune({ keepAttributes: true }),
    weld(),
  ];
  if (cfg.ratio < 1) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio: cfg.ratio, error: cfg.error ?? 0.001 }));
  // Join after simplifying (per-part simplification collapses much further).
  if (cfg.join) steps.push(flatten(), joinMeshes({ keepNamed: false }));
  if (cfg.tex || cfg.data) {
    if (cfg.tex)
      steps.push(
        textureCompress({ encoder: sharp, targetFormat: "webp", quality: 82, resize: [cfg.tex, cfg.tex], slots: /^(baseColor|emissive)/ }),
      );
    steps.push(
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        quality: 85,
        resize: [cfg.data ?? cfg.tex, cfg.data ?? cfg.tex],
        slots: /^(normal|metallicRoughness|occlusion|specular)/,
      }),
    );
  }
  // keepAttributes: the scene assigns its own textures to some materials
  // (e.g. the record label), so UVs that look unused here must survive —
  // dropping them makes those shaders produce NaN (black frame via bloom).
  steps.push(prune({ keepAttributes: true }), draco());
  await doc.transform(...steps);
  await io.write(out, doc);

  const mb = (f) => (statSync(f).size / 1048576).toFixed(2);
  console.log(`${name.padEnd(14)} ${mb(src).padStart(6)} → ${mb(out).padStart(5)} MB   tris ${before} → ${triangles(doc)}`);
}
