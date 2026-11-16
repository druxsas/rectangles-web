#!/usr/bin/env node
/**
 * Generates the polygon "skeleton" shown while the 3D store loads.
 *
 * The storefront's main volumes (from scenes/store/Store.tsx + Exterior.tsx)
 * are projected with the exact facade camera (keyframe 01) onto a 1600×1000
 * view box, so when the real render fades in it lands on top of the lines.
 * The sidewalk/floor is a triangulated grid to read as a mesh.
 *
 * Output: src/components/scene-skeleton.data.ts  (a few KB of path data)
 * Usage:  node scripts/generate-skeleton.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "components", "scene-skeleton.data.ts");

// --- Camera (keyframe "facade") ------------------------------------------------
const W = 1600;
const H = 1000;
const POS = [0, 1.75, 15];
const LOOK = [0, 2.3, 4];
const FOV = 56;

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(...a);
  return a.map((v) => v / l);
};
const f = norm(sub(LOOK, POS));
const r = norm(cross(f, [0, 1, 0]));
const u = cross(r, f);
const T = Math.tan((FOV * Math.PI) / 360);
const NEAR = 0.3;

const toCam = (p) => {
  const v = sub(p, POS);
  return [dot(v, r), dot(v, u), dot(v, f)];
};
const toScreen = ([x, y, z]) => [((x / (z * T * (W / H)) + 1) / 2) * W, ((1 - y / (z * T)) / 2) * H];

/** Project a 3D segment, clipping it against the near plane. */
function segment(a, b) {
  let A = toCam(a);
  let B = toCam(b);
  if (A[2] < NEAR && B[2] < NEAR) return null;
  if (A[2] < NEAR || B[2] < NEAR) {
    const t = (NEAR - A[2]) / (B[2] - A[2]);
    const C = A.map((v, i) => v + (B[i] - v) * t);
    if (A[2] < NEAR) A = C;
    else B = C;
  }
  const [x1, y1] = toScreen(A);
  const [x2, y2] = toScreen(B);
  return { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`, depth: (A[2] + B[2]) / 2, x: (x1 + x2) / 2 };
}

// --- Primitives ---------------------------------------------------------------
const groups = { floor: [], building: [], interior: [], props: [], sign: [] };
const line = (g, a, b) => {
  const s = segment(a, b);
  if (s) groups[g].push(s);
};
const rect = (g, x0, y0, x1, y1, z) => {
  line(g, [x0, y0, z], [x1, y0, z]);
  line(g, [x1, y0, z], [x1, y1, z]);
  line(g, [x1, y1, z], [x0, y1, z]);
  line(g, [x0, y1, z], [x0, y0, z]);
};
const box = (g, [cx, cy, cz], [w, h, d]) => {
  const xs = [cx - w / 2, cx + w / 2];
  const ys = [cy - h / 2, cy + h / 2];
  const zs = [cz - d / 2, cz + d / 2];
  for (const y of ys) for (const z of zs) line(g, [xs[0], y, z], [xs[1], y, z]);
  for (const x of xs) for (const z of zs) line(g, [x, ys[0], z], [x, ys[1], z]);
  for (const x of xs) for (const y of ys) line(g, [x, y, zs[0]], [x, y, zs[1]]);
};
const cone = (g, [cx, cz], h, rad, sides = 6) => {
  const ring = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2;
    return [cx + Math.cos(a) * rad, h * 0.35, cz + Math.sin(a) * rad];
  });
  ring.forEach((p, i) => {
    line(g, p, ring[(i + 1) % sides]);
    line(g, p, [cx, h, cz]);
    line(g, p, [cx, 0, cz]);
  });
};

// --- Sidewalk + street: triangulated grid --------------------------------------
const STEP = 1.5;
for (let z = 5; z <= 13.5; z += STEP) line("floor", [-30, 0, z], [30, 0, z]);
for (let x = -30; x <= 30; x += STEP) line("floor", [x, 0, 5], [x, 0, 13.5]);
for (let x = -30; x < 30; x += STEP)
  for (let z = 5; z < 13.5; z += STEP) line("floor", [x, 0, z + STEP], [x + STEP, 0, z]);

// --- Building face + storefront -------------------------------------------------
const FZ = 5;
rect("building", -16, 0, 16, 9, FZ + 0.02); // building mass
rect("building", -6, 0, 6, 4.2, FZ); // shop opening
for (const x of [-5.85, 5.85]) box("building", [x, 2.1, FZ + 0.05], [0.3, 4.2, 0.3]); // piers
line("building", [-5.7, 3.35, FZ], [5.7, 3.35, FZ]); // head rail
for (const side of [-1, 1]) {
  for (const x of [0.85, 0.85 + 2.425, 5.7]) line("building", [side * x, 0.45, FZ], [side * x, 3.35, FZ]); // mullions
  line("building", [side * 0.85, 0.45, FZ], [side * 5.7, 0.45, FZ]); // sill
}
line("building", [-0.85, 2.7, FZ], [0.85, 2.7, FZ]); // transom
for (let i = 0; i < 4; i++) rect("building", 6.4, 2.6 - i * 0.34, 6.4 + 0.95 + (i === 3 ? 0.35 : 0), 2.9 - i * 0.34, FZ + 0.04); // lettering

// --- Sign band (accent) --------------------------------------------------------
box("sign", [0, 3.75, FZ + 0.1], [12, 0.8, 0.2]);
rect("sign", -1.95, 3.6, 0.85, 3.9, FZ + 0.21); // wordmark block
rect("sign", 1.0, 3.62, 1.95, 3.88, FZ + 0.21); // framed rectangle

// --- Interior seen through the glass ------------------------------------------
rect("interior", -6, 0, 6, 4.2, -5); // back wall
line("interior", [-6, 0, -5], [-6, 0, FZ]);
line("interior", [6, 0, -5], [6, 0, FZ]);
line("interior", [-6, 4.2, -5], [-6, 4.2, FZ]);
line("interior", [6, 4.2, -5], [6, 4.2, FZ]);
box("interior", [0, 0.5, -3.7], [4.4, 1, 0.75]); // counter
rect("interior", -0.8, 1.6, 0.8, 2.4, -4.98); // tv
rect("interior", -0.85, 3.2, 0.85, 3.8, -4.98); // back sign
for (const x of [-3.3, 3.3]) rect("interior", x - 0.35, 1.5, x + 0.35, 2.6, -4.97); // posters
box("interior", [-5.58, 0.9, 2.1], [0.75, 1.8, 1.6]); // arcades
rect("interior", -5.98, 0.4, -5.98, 3.1, -0.6); // skate lightbox (edge-on)
box("interior", [0, 0.01, 0.35], [4, 0.02, 3]); // rug

// --- Sidewalk props -------------------------------------------------------------
box("props", [-3.3, 0.45, FZ + 0.45], [1.5, 0.05, 0.4]); // bench top
for (const x of [-3.92, -2.68]) box("props", [x, 0.22, FZ + 0.45], [0.05, 0.44, 0.36]);
line("props", [2.0, 0, 6.35], [2.3, 0.92, 6.2]); // A-frame
line("props", [2.6, 0, 6.05], [2.3, 0.92, 6.2]);
rect("props", 2.02, 0.15, 2.58, 0.88, 6.3);
cone("props", [-8.2, 5.45], 1.45, 0.45);
cone("props", [8.2, 5.45], 1.45, 0.45);
cone("props", [-1.42, 5.48], 1.8, 0.55);
cone("props", [1.42, 5.48], 1.8, 0.55);
cone("props", [-5.05, -4.05], 1.9, 0.6);

// --- Emit ----------------------------------------------------------------------
// Each group becomes one path, sub-paths ordered near → far / left → right so
// the stroke-dash "draw-in" sweeps through the scene.
const out = {};
for (const [g, segs] of Object.entries(groups)) {
  segs.sort((a, b) => a.depth - b.depth || a.x - b.x);
  out[g] = segs.map((s) => s.d).join("");
}
const vertices = new Set();
for (const segs of [groups.building, groups.sign, groups.props])
  for (const s of segs) for (const m of s.d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) vertices.add(`${Math.round(m[1])},${Math.round(m[2])}`);

const file = `// Generated by scripts/generate-skeleton.mjs — do not edit by hand.
// Storefront wireframe projected with the facade camera onto a ${W}×${H} view box.

export const SKELETON_VIEWBOX = "0 0 ${W} ${H}";

export const SKELETON_PATHS = ${JSON.stringify(out, null, 2)} as const;

/** Corner points for the pulsing vertex dots. */
export const SKELETON_VERTICES: [number, number][] = ${JSON.stringify([...vertices].map((v) => v.split(",").map(Number)))};
`;
writeFileSync(OUT, file);
console.log(`✓ ${OUT}  ${(file.length / 1024).toFixed(1)} KB  (${Object.entries(groups).map(([g, s]) => `${g}:${s.length}`).join(" ")}, vertices:${vertices.size})`);
