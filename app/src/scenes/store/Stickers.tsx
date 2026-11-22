"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { BufferGeometry, Euler, Float32BufferAttribute, Matrix4, Quaternion, SRGBColorSpace, Vector3, type Texture } from "three";
import { IMAC } from "@/scenes/store/imacPose";
import { STICKER_ATLAS, STICKER_NAMES, STICKERS, type StickerName } from "@/scenes/store/stickers.data";

/**
 * Rectangle's sticker collection, slapped around the shop the way stickers
 * end up in a skate shop: thick on the counter top, a handful on the back of
 * the iMac, the white plinths and the bench outside.
 *
 * Every sticker is a quad cut from one atlas (scripts/optimize-stickers.mjs);
 * each surface is a single merged mesh, so the whole lot costs a few draw
 * calls and no extra lights. Layouts come from a seeded generator: random
 * positions, sizes and angles, identical on every visit.
 */

type Placement = {
  name: StickerName;
  pos: Vector3;
  normal: Vector3;
  /** Direction the sticker's top edge points to before `angle` is applied. */
  up: Vector3;
  /** Rotation about the normal, radians. */
  angle: number;
  /** Side of the square with the sticker's area, metres. */
  size: number;
  /** Set for stickers wrapped round a pot (see `potStickers`). */
  wrap?: Wrap;
};

/**
 * A sticker bent round a truncated cone (a plant pot): `m` places the pot's
 * model in the world; in that model's space the pot's axis stands at
 * (cx, cz), with radius r0 at height y0 and r1 at y1; the sticker is centred
 * at height `y`, facing direction `theta` (radians about the axis).
 */
type Wrap = { m: Matrix4; cx: number; cz: number; y0: number; r0: number; y1: number; r1: number; y: number; theta: number };

/** Point and outward normal on a pot, `a` metres round it and `b` metres up from the sticker's centre. */
function onPot(w: Wrap, a: number, b: number, lift: number, point: Vector3, normal: Vector3) {
  const k = (w.r1 - w.r0) / (w.y1 - w.y0);
  const radius = (y: number) => w.r0 + k * (y - w.y0);
  const y = w.y + b / Math.sqrt(1 + k * k);
  // Seen from outside, increasing angle runs to the viewer's left.
  const ang = w.theta - a / radius(w.y);
  const r = radius(y) + lift;
  point.set(w.cx + Math.cos(ang) * r, y, w.cz + Math.sin(ang) * r).applyMatrix4(w.m);
  normal.set(Math.cos(ang), -k, Math.sin(ang)).normalize().transformDirection(w.m);
}

/** Stickers sit this far off the surface (they don't write depth, see material). */
const LIFT = 0.0006;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deals every design before repeating one, so the mix stays varied. */
function dealer(rng: () => number) {
  let bag: StickerName[] = [];
  return () => {
    if (!bag.length) {
      bag = [...STICKER_NAMES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop()!;
  };
}

/**
 * Angle of a sticker put down without much thought: mostly "roughly
 * straight" for someone standing on one side or the other, crooked by a few
 * degrees, with a fair share stuck on at any angle at all.
 */
function casualAngle(rng: () => number) {
  const r = rng();
  if (r < 0.32) return rng() * Math.PI * 2;
  const base = r < 0.7 ? 0 : r < 0.84 ? Math.PI : r < 0.92 ? Math.PI / 2 : -Math.PI / 2;
  // Sum of uniforms ≈ bell curve, ±~28°.
  return base + (rng() + rng() + rng() - 1.5) * 0.65;
}

/**
 * Counter variant: same crookedness, but the straight-ish ones mostly read
 * the right way up for whoever stands behind the counter (the visitor at
 * the Shop stop), then for the customer side, with a few sideways.
 * (Draws the same number of random values as `casualAngle`.)
 */
function counterAngle(rng: () => number) {
  const r = rng();
  if (r < 0.32) return rng() * Math.PI * 2;
  const base = r < 0.68 ? Math.PI : r < 0.9 ? 0 : r < 0.95 ? Math.PI / 2 : -Math.PI / 2;
  return base + (rng() + rng() + rng() - 1.5) * 0.65;
}

function extent(name: StickerName, size: number) {
  const a = Math.sqrt(STICKERS[name].aspect);
  return { w: size * a, h: size / a };
}

type Patch = {
  center: Vector3;
  normal: Vector3;
  up: Vector3;
  /** Size along the patch's right (up × normal) and up axes. */
  width: number;
  height: number;
};

/** Random stickers over a flat rectangular patch, kept inside its edges. */
function scatter(
  rng: () => number,
  deal: () => StickerName,
  patch: Patch,
  count: number,
  size: [number, number],
  opts: {
    angle?: (name: StickerName) => number;
    avoid?: (u: number, v: number, radius: number) => boolean;
    /** Keep stickers this share of their combined radii apart (1 = just touching; unset = anywhere). */
    apart?: number;
  } = {},
): Placement[] {
  const right = new Vector3().crossVectors(patch.up, patch.normal).normalize();
  const out: Placement[] = [];
  const taken: { u: number; v: number; radius: number }[] = [];
  let guard = count * 60;
  while (out.length < count && guard-- > 0) {
    const name = deal();
    const s = size[0] + rng() * (size[1] - size[0]);
    const { w, h } = extent(name, s);
    const radius = Math.hypot(w, h) / 2;
    const spanU = patch.width / 2 - radius * 0.92;
    const spanV = patch.height / 2 - radius * 0.92;
    if (spanU < 0 || spanV < 0) continue;
    const u = (rng() * 2 - 1) * spanU;
    const v = (rng() * 2 - 1) * spanV;
    if (opts.avoid?.(u, v, radius)) continue;
    const apart = opts.apart;
    if (apart && taken.some((t) => Math.hypot(t.u - u, t.v - v) < (t.radius + radius) * apart)) continue;
    taken.push({ u, v, radius });
    out.push({
      name,
      pos: patch.center.clone().addScaledVector(right, u).addScaledVector(patch.up, v),
      normal: patch.normal,
      up: patch.up,
      angle: opts.angle ? opts.angle(name) : casualAngle(rng),
      size: s,
    });
  }
  return out;
}

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const neg = (v: Vector3) => v.clone().negate();

// ----------------------------------------------------------------
// Counter top — the sticker-bombed one
// ----------------------------------------------------------------
/**
 * Years of stickers on a shop counter: each one put down where there was
 * room, so they sit side by side with the odd corner over a neighbour rather
 * than in piles. A few big ones went on first and the small ones filled in
 * around them; some stretches are packed, others still show the steel.
 */
function counterTop(): Placement[] {
  const rng = mulberry32(39);
  const deal = dealer(rng);
  // Top slab: 4.5 × 0.85 m at y = 1.0, centred on z = -3.67 (see Store.tsx).
  const W = 4.5;
  const D = 0.85;
  const center = new Vector3(0, 1.0, -3.67);
  const up = neg(Z);

  // Busy spots (u along the counter, v toward the back wall) and how far they reach.
  const hubs = Array.from({ length: 7 }, () => ({ u: (rng() - 0.5) * W * 0.92, v: (rng() - 0.5) * D * 0.7, r: 0.28 + rng() * 0.3 }));
  const density = (u: number, v: number) => {
    let d = 0.16;
    for (const h of hubs) d += Math.exp(-((u - h.u) ** 2 + (v - h.v) ** 2) / (2 * h.r * h.r));
    // The customers' edge collects more than the vendor's.
    return Math.min(1, d * (0.75 - (v / D) * 0.5));
  };

  // Each sticker is covered by circles along its long side for the spacing test.
  type Disc = { u: number; v: number; r: number };
  const placed: Disc[] = [];
  const discs = (u: number, v: number, w: number, h: number, angle: number): Disc[] => {
    const long = Math.max(w, h);
    const short = Math.min(w, h);
    const n = Math.max(1, Math.round(long / short));
    const a = angle + (w >= h ? 0 : Math.PI / 2);
    return Array.from({ length: n }, (_, i) => {
      const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * (long - short);
      return { u: u + Math.cos(a) * t, v: v + Math.sin(a) * t, r: short / 2 };
    });
  };

  const out: Placement[] = [];
  const tiers: { count: number; size: [number, number] }[] = [
    { count: 14, size: [0.115, 0.14] },
    { count: 60, size: [0.085, 0.108] },
    { count: 150, size: [0.058, 0.082] },
  ];
  for (const tier of tiers) {
    let made = 0;
    for (let tries = 0; made < tier.count && tries < tier.count * 60; tries++) {
      const u = (rng() - 0.5) * W;
      const v = (rng() - 0.5) * D;
      if (rng() > density(u, v)) continue;
      const name = deal();
      const size = tier.size[0] + rng() * (tier.size[1] - tier.size[0]);
      const { w, h } = extent(name, size);
      const radius = Math.hypot(w, h) / 2;
      if (Math.abs(u) > W / 2 - radius * 0.9 || Math.abs(v) > D / 2 - radius * 0.9) continue;
      const angle = counterAngle(rng);
      const mine = discs(u, v, w, h, angle);
      // Mostly clear of the neighbours; now and then a corner lands on one.
      const slack = rng() < 0.14 ? 0.62 : 0.94;
      if (mine.some((m) => placed.some((q) => Math.hypot(m.u - q.u, m.v - q.v) < (m.r + q.r) * slack))) continue;
      placed.push(...mine);
      out.push({ name, pos: center.clone().add(new Vector3(u, 0, -v)), normal: Y, up, angle, size });
      made++;
    }
  }
  return out;
}

// ----------------------------------------------------------------
// Back of the iMac — a few, clear of the Apple logo and the stand
// ----------------------------------------------------------------
/** Spots on the rear shell in the iMac's local space: [x, y, z, nx, ny, nz, angle, size]. */
// Positions and normals sampled from the model's rear shell (it bulges and
// leans back); the Apple logo spans x ±0.026, y 0.363–0.425 and stays clear.
const IMAC_BACK: [StickerName, number, number, number, number, number, number, number, number][] = [
  ["04-monogram", -0.2, 0.42, -0.1085, -0.075, -0.018, -0.997, 0.28, 0.062],
  ["26-extra-life", 0.19, 0.41, -0.109, 0.075, -0.029, -0.997, -0.35, 0.058],
  ["09-skate-truck", 0.215, 0.25, -0.0839, 0.179, -0.188, -0.966, 0.5, 0.06],
  ["18-press-play", -0.2, 0.2, -0.0756, -0.133, -0.235, -0.963, -0.2, 0.064],
  ["01-framed-logo", 0.12, 0.33, -0.1086, 0.069, -0.11, -0.992, -0.12, 0.052],
  ["12-cassette", -0.13, 0.3, -0.1038, -0.081, -0.15, -0.985, 0.42, 0.056],
];

function imacBack(): Placement[] {
  const m = new Matrix4().compose(new Vector3(...IMAC.position), new Quaternion().setFromEuler(new Euler(0, IMAC.yaw, 0)), new Vector3(1, 1, 1));
  const rot = new Matrix4().extractRotation(m);
  return IMAC_BACK.map(([name, x, y, z, nx, ny, nz, angle, size]) => {
    const normal = new Vector3(nx, ny, nz).normalize();
    // "Up" along the shell: world up made perpendicular to the normal.
    const up = Y.clone().addScaledVector(normal, -normal.y).normalize();
    return { name, pos: new Vector3(x, y, z).applyMatrix4(m), normal: normal.applyMatrix4(rot), up: up.applyMatrix4(rot), angle, size };
  });
}

// ----------------------------------------------------------------
// White plinths — the deck plinth and the marble cubes under the plants
// ----------------------------------------------------------------
function plinths(): Placement[] {
  const rng = mulberry32(7);
  const deal = dealer(rng);
  const out: Placement[] = [];

  // Deck plinth (Store.tsx SkateZone): 0.7 × 0.4 × 1.2 m box at (-4.75, 0.2, -2.0).
  const c = new Vector3(-4.75, 0.2, -2.0);
  out.push(
    // Long face toward the room.
    ...scatter(rng, deal, { center: c.clone().add(new Vector3(0.35, 0, 0)), normal: X, up: Y, width: 1.2, height: 0.4 }, 4, [0.095, 0.13]),
    // End toward the entrance.
    ...scatter(rng, deal, { center: c.clone().add(new Vector3(0, 0, 0.6)), normal: Z, up: Y, width: 0.7, height: 0.4 }, 2, [0.095, 0.125]),
    // Top, around the deck on display.
    ...scatter(rng, deal, { center: c.clone().add(new Vector3(0, 0.2, 0)), normal: Y, up: neg(X), width: 1.2, height: 0.7 }, 3, [0.075, 0.095], {
      avoid: (u, v, r) => Math.abs(u) < 0.46 + r && Math.abs(v) < 0.2 + r,
    }),
  );

  // Marble cubes of the plant arrangements, in the model's normalized space:
  // [min x, min z, side] (they stand on the floor). See PlantsHQ in Store.tsx.
  const cubes: [number, number, number][] = [
    [0.13, 0.409, 0.421],
    [0.183, -0.522, 0.566],
  ];
  const arrangements: { position: [number, number, number]; yaw: number }[] = [
    { position: [-5.05, 0, -4.05], yaw: 0.6 },
    { position: [4.95, 0, 3.95], yaw: -2.4 },
  ];
  for (const a of arrangements) {
    const m = new Matrix4().compose(new Vector3(...a.position), new Quaternion().setFromEuler(new Euler(0, a.yaw, 0)), new Vector3(1, 1, 1));
    const rot = new Matrix4().extractRotation(m);
    for (const [x0, z0, side] of cubes) {
      const centre = new Vector3(x0 + side / 2, side / 2, z0 + side / 2);
      for (const dir of [X, neg(X), Z, neg(Z)]) {
        const faceCentre = centre.clone().addScaledVector(dir, side / 2).applyMatrix4(m);
        const normal = dir.clone().applyMatrix4(rot);
        // Only faces that look into the room get stickers.
        const toRoom = new Vector3(0, faceCentre.y, 0).sub(faceCentre).normalize();
        if (normal.dot(toRoom) < 0.35) continue;
        out.push(...scatter(rng, deal, { center: faceCentre, normal, up: Y, width: side, height: side }, side > 0.5 ? 2 : 1, [0.1, 0.14]));
      }
    }
  }
  return out;
}

// ----------------------------------------------------------------
// Plant pots — a few stickers wrapped round the black ceramic
// ----------------------------------------------------------------
type Pot = Omit<Wrap, "m" | "y" | "theta">;
// Pots in each model's normalized space (models.tsx). The low bowl of the
// arrangement is left bare: it bulges, a flat-printed sticker wouldn't sit.
const ARRANGEMENT_POTS: Pot[] = [
  { cx: 0.337, cz: 0.618, y0: 0.421, r0: 0.183, y1: 0.897, r1: 0.152 },
  { cx: -0.321, cz: 0.361, y0: 0, r0: 0.183, y1: 0.283, r1: 0.142 },
  { cx: -0.381, cz: -0.546, y0: 0, r0: 0.236, y1: 0.607, r1: 0.191 },
];
const TALL_POT: Pot = { cx: 0.043, cz: 0.009, y0: 0, r0: 0.264, y1: 0.678, r1: 0.214 };
const BIG_POT: Pot = { cx: 0.053, cz: 0.012, y0: 0, r0: 0.327, y1: 0.841, r1: 0.265 };

function potStickers(): Placement[] {
  const rng = mulberry32(404);
  const deal = dealer(rng);
  const out: Placement[] = [];
  const point = new Vector3();
  const normal = new Vector3();
  /** `toward`: world point the stickers should roughly face (where people look from). */
  const add = (pots: Pot[], position: [number, number, number], yaw: number, toward: Vector3, count: (pot: Pot) => number) => {
    const m = new Matrix4().compose(new Vector3(...position), new Quaternion().setFromEuler(new Euler(0, yaw, 0)), new Vector3(1, 1, 1));
    for (const pot of pots) {
      const h = pot.y1 - pot.y0;
      let made = 0;
      for (let tries = 0; made < count(pot) && tries < 80; tries++) {
        const wrap: Wrap = { ...pot, m, y: pot.y0 + h * (0.3 + rng() * 0.42), theta: rng() * Math.PI * 2 };
        onPot(wrap, 0, 0, 0, point, normal);
        const facing = toward.clone().sub(point).setY(0).normalize();
        if (normal.dot(facing) < 0.3) continue;
        // Keep clear of the ones already on this pot.
        if (out.some((o) => o.wrap?.cx === pot.cx && o.wrap.m === m && o.pos.distanceTo(point) < 0.13)) continue;
        // Small enough to stay on the pot, top and bottom.
        const size = Math.min(0.078 + rng() * 0.04, h * 0.34);
        out.push({ name: deal(), pos: point.clone(), normal: normal.clone(), up: Y, angle: (rng() + rng() + rng() - 1.5) * 0.7, size, wrap });
        made++;
      }
    }
  };
  const room = new Vector3(0, 0, 0);
  // Arrangements inside (Store.tsx Furnishings).
  add(ARRANGEMENT_POTS, [-5.05, 0, -4.05], 0.6, room, (pot) => (pot.y1 - pot.y0 > 0.4 ? 2 : 1));
  add(ARRANGEMENT_POTS, [4.95, 0, 3.95], -2.4, room, (pot) => (pot.y1 - pot.y0 > 0.4 ? 2 : 1));
  // Single plants on the sidewalk (Exterior.tsx), seen from the street.
  const street = (x: number) => new Vector3(x * 0.6, 0, 12);
  add([TALL_POT], [-8.2, 0, 5.45], 0.6, street(-8.2), () => 2);
  add([TALL_POT], [8.2, 0, 5.45], -0.8, street(8.2), () => 2);
  add([BIG_POT], [-1.42, 0, 5.48], 0.3, street(-1.42), () => 3);
  add([BIG_POT], [1.42, 0, 5.48], -1.9, street(1.42), () => 3);
  return out;
}

// ----------------------------------------------------------------
// Arcade cabinets — the perforated steel fronts
// ----------------------------------------------------------------
function arcades(): Placement[] {
  const out: Placement[] = [];
  // Cabinets stand at x = -5.58 facing +x (Store.tsx GamesZone). In cabinet
  // space the lower front is 0.69 × 0.77 m, 0.222 m ahead of centre, with
  // the coin door in the middle; the strip under the controls is 0.17 m
  // tall, 0.329 m ahead (ArcadeArt.tsx).
  [2.55, 1.7].forEach((z, i) => {
    const rng = mulberry32(64 + i * 13);
    const deal = dealer(rng);
    out.push(
      ...scatter(rng, deal, { center: new Vector3(-5.58 + 0.2218 + 0.0012, 0.401, z), normal: X, up: Y, width: 0.66, height: 0.74 }, 9, [0.07, 0.115], {
        avoid: (u, v, r) => Math.abs(u) < 0.134 + r * 0.8 && Math.abs(v) < 0.167 + r * 0.8,
        apart: 0.72,
      }),
      ...scatter(rng, deal, { center: new Vector3(-5.58 + 0.3286 + 0.0012, 0.911, z), normal: X, up: Y, width: 0.66, height: 0.168 }, 4, [0.058, 0.078], { apart: 0.75 }),
    );
  });
  return out;
}

// ----------------------------------------------------------------
// Bench on the sidewalk
// ----------------------------------------------------------------
function bench(): Placement[] {
  const rng = mulberry32(58);
  const deal = dealer(rng);
  // Bench at (-3.3, 0, 5.45) (Exterior.tsx): two 1.5 × 0.16 m planks, top at
  // y = 0.47; steel legs at x ± 0.62, 0.36 deep × 0.44 tall.
  const o = new Vector3(-3.3, 0, 5.45);
  // On a 16 cm plank a long sticker only fits lengthwise.
  const alongPlank = (name: StickerName) => (STICKERS[name].aspect > 1.4 ? (rng() - 0.5) * 0.35 + (rng() < 0.25 ? Math.PI : 0) : casualAngle(rng));
  const plank = (dz: number): Patch => ({ center: o.clone().add(new Vector3(0, 0.47, dz)), normal: Y, up: neg(Z), width: 1.42, height: 0.16 });
  return [
    ...scatter(rng, deal, plank(0.09), 4, [0.068, 0.085], { angle: alongPlank }),
    ...scatter(rng, deal, plank(-0.09), 3, [0.068, 0.085], { angle: alongPlank }),
    ...scatter(rng, deal, { center: o.clone().add(new Vector3(0.645, 0.24, 0)), normal: X, up: Y, width: 0.36, height: 0.4 }, 1, [0.1, 0.12]),
    ...scatter(rng, deal, { center: o.clone().add(new Vector3(-0.645, 0.24, 0)), normal: neg(X), up: Y, width: 0.36, height: 0.4 }, 1, [0.085, 0.1]),
  ];
}

// ----------------------------------------------------------------
// Geometry
// ----------------------------------------------------------------
function build(placements: Placement[]) {
  const origin = new Vector3();
  for (const p of placements) origin.add(p.pos);
  origin.divideScalar(Math.max(placements.length, 1));

  const position: number[] = [];
  const normal: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const right = new Vector3();
  const r = new Vector3();
  const u = new Vector3();
  const corner = new Vector3();
  placements.forEach((p) => {
    const { w, h } = extent(p.name, p.size);
    if (p.wrap) {
      // Bent round the pot: an N × N grid of quads following the cone.
      const N = 6;
      const cos = Math.cos(p.angle);
      const sin = Math.sin(p.angle);
      const [u0, v0, u1, v1] = STICKERS[p.name].uv;
      const base = position.length / 3;
      for (let j = 0; j <= N; j++) {
        for (let i = 0; i <= N; i++) {
          const sx = (i / N - 0.5) * w;
          const sy = (j / N - 0.5) * h;
          onPot(p.wrap, sx * cos - sy * sin, sx * sin + sy * cos, LIFT * 2, corner, r);
          corner.sub(origin);
          position.push(corner.x, corner.y, corner.z);
          normal.push(r.x, r.y, r.z);
          uv.push(u0 + (i / N) * (u1 - u0), v0 + (j / N) * (v1 - v0));
        }
      }
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = base + j * (N + 1) + i;
          index.push(a, a + 1, a + N + 2, a, a + N + 2, a + N + 1);
        }
      }
      return;
    }
    right.crossVectors(p.up, p.normal).normalize();
    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);
    r.copy(right).multiplyScalar(cos).addScaledVector(p.up, sin);
    u.copy(p.up).multiplyScalar(cos).addScaledVector(right, -sin);
    const [u0, v0, u1, v1] = STICKERS[p.name].uv;
    const corners: [number, number, number, number][] = [
      [-1, -1, u0, v0],
      [1, -1, u1, v0],
      [1, 1, u1, v1],
      [-1, 1, u0, v1],
    ];
    for (const [sx, sy, cu, cv] of corners) {
      corner
        .copy(p.pos)
        .sub(origin)
        .addScaledVector(r, (sx * w) / 2)
        .addScaledVector(u, (sy * h) / 2)
        .addScaledVector(p.normal, LIFT);
      position.push(corner.x, corner.y, corner.z);
      normal.push(p.normal.x, p.normal.y, p.normal.z);
      uv.push(cu, cv);
    }
    // Index order is paint order: later stickers overlap earlier ones.
    const b = position.length / 3 - 4;
    index.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normal, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeBoundingSphere();
  return { geometry, origin };
}

function configure(t: Texture | Texture[]) {
  for (const tex of Array.isArray(t) ? t : [t]) {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
  }
}

function Sheet({
  layout,
  map,
  tint = "#ffffff",
  depthBias = true,
}: {
  layout: () => Placement[];
  map: Texture;
  tint?: string;
  /**
   * Pull the stickers toward the camera so they never fight a curved or
   * imprecise surface. Off for the counter: at grazing angles the bias grows
   * enough to draw stickers over things lying on them (the desk mat).
   */
  depthBias?: boolean;
}) {
  const { geometry, origin } = useMemo(() => build(layout()), [layout]);
  return (
    <mesh geometry={geometry} position={origin} receiveShadow>
      {/* Printed vinyl: blended edges, no depth write (paint order handles overlaps). */}
      <meshStandardMaterial
        map={map}
        color={tint}
        transparent
        depthWrite={false}
        roughness={0.55}
        metalness={0}
        envMapIntensity={0.5}
        polygonOffset={depthBias}
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-4}
      />
    </mesh>
  );
}

export function Stickers() {
  const map = useTexture(STICKER_ATLAS, configure);
  return (
    <group>
      {/* The counter sits under a hard downlight: full-white vinyl clips and blooms there */}
      <Sheet layout={counterTop} map={map} tint="#9c9c99" depthBias={false} />
      <Sheet layout={imacBack} map={map} />
      <Sheet layout={plinths} map={map} />
      <Sheet layout={potStickers} map={map} />
      <Sheet layout={arcades} map={map} />
      <Sheet layout={bench} map={map} />
    </group>
  );
}

useTexture.preload(STICKER_ATLAS);
