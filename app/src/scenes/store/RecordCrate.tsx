"use client";

import { useMemo } from "react";
import { CanvasTexture, DoubleSide, MeshStandardMaterial, SRGBColorSpace } from "three";
import { LogoPlane } from "@/scenes/store/LogoPlane";

/**
 * Rectangle's Record Crate — the store product (public/shop/p/record-crate-*)
 * as a 3D object: brushed-steel frame with bolted corners, perforated panels
 * (real holes, via an alpha map — you see the sleeves through them), handle
 * slots on the sides, an ivory name plate with the framed mark, a cobalt tab
 * and rubber feet. Filled with LP sleeves, one record half pulled out.
 *
 * Local space: sits on y = 0, name plate faces +z. Real size (m).
 */

const W = 0.46; // across the front
const D = 0.36; // front to back
const H = 0.27;
const FOOT = 0.012;
const RAIL = 0.032; // top/bottom frame rails
const POST = 0.02; // corner posts
const SLEEVE = 0.315; // LP sleeve edge

const COBALT = "#165dfa";

/** Alpha map for a perforated panel (white = metal, black = hole). */
function perforation(width: number, height: number, slot: boolean) {
  const px = 1100; // px per metre
  const c = document.createElement("canvas");
  c.width = Math.round(width * px);
  c.height = Math.round(height * px);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#000";
  const pitch = 0.0145 * px;
  const r = 0.0036 * px;
  const cols = Math.floor((c.width - pitch) / pitch);
  const rows = Math.floor((c.height - pitch) / pitch);
  const x0 = (c.width - (cols - 1) * pitch) / 2;
  const y0 = (c.height - (rows - 1) * pitch) / 2;
  // Handle slot (side panels): a rounded opening near the top.
  const sw = 0.13 * px;
  const sh = 0.034 * px;
  const sx = (c.width - sw) / 2;
  const sy = 0.03 * px;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = x0 + i * pitch;
      const y = y0 + j * pitch;
      // Keep solid metal around the slot.
      if (slot && x > sx - pitch && x < sx + sw + pitch && y < sy + sh + pitch) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (slot) {
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, sh / 2);
    ctx.fill();
  }
  const t = new CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/** One printed sleeve front (brand-style cover art, drawn once). */
function sleeveArt(bg: string, ink: string, kind: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 6;
  if (kind === 0) {
    ctx.strokeRect(28, 28, 200, 200);
    ctx.fillRect(28, 150, 200, 14);
  } else if (kind === 1) {
    ctx.beginPath();
    ctx.arc(128, 128, 78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 128, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 2) {
    for (let i = 0; i < 7; i++) ctx.fillRect(28, 36 + i * 28, 200 - i * 22, 10);
  } else {
    ctx.fillRect(28, 28, 96, 200);
    ctx.strokeRect(140, 28, 88, 88);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const SLEEVES: [bg: string, ink: string][] = [
  ["#101113", "#ece8df"],
  ["#ece8df", "#101113"],
  [COBALT, "#ece8df"],
  ["#2a2622", "#d9a35f"],
  ["#ece8df", COBALT],
  ["#101113", COBALT],
  ["#7c2f24", "#ece8df"],
  ["#c9c5bb", "#101113"],
];

export function RecordCrate({ position, rotation }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const { steel, frame, front, side, covers } = useMemo(() => {
    // Not fully metallic, plus a faint warm lift: the crate sits at the edge
    // of the wall spot, where pure metal would only mirror the dark room.
    const base = { color: "#8b8e91", metalness: 0.55, roughness: 0.5, envMapIntensity: 1.1, emissive: "#3b2f24", emissiveIntensity: 0.4 };
    const panel = (w: number, slot: boolean) =>
      new MeshStandardMaterial({ ...base, color: "#74777a", alphaMap: perforation(w, H - RAIL * 2, slot), alphaTest: 0.5, side: DoubleSide });
    return {
      steel: new MeshStandardMaterial(base),
      frame: new MeshStandardMaterial({ ...base, color: "#9a9da0", roughness: 0.4 }),
      front: panel(W - POST * 2, false),
      side: panel(D - POST * 2, true),
      covers: SLEEVES.map(([bg, ink], i) => sleeveArt(bg, ink, i % 4)),
    };
  }, []);

  const y0 = FOOT; // underside of the crate body
  const midY = y0 + H / 2;
  const panelH = H - RAIL * 2;

  // Sleeves stand front-to-back, leaning a touch; a small gap is left at the back.
  const sleeves = useMemo(() => {
    const n = 22;
    const pitch = (D - 0.07) / n;
    return Array.from({ length: n }, (_, i) => ({
      z: D / 2 - 0.03 - i * pitch,
      x: Math.sin(i * 2.4) * 0.018,
      lean: -0.05 - (Math.sin(i * 1.7) + 1) * 0.02,
      lift: i === 6 ? 0.03 : Math.max(0, Math.sin(i * 3.1)) * 0.006,
      art: i % SLEEVES.length,
    }));
  }, []);

  const bolt = (x: number, y: number, z: number, rot: [number, number, number], key: string) => (
    <mesh key={key} position={[x, y, z]} rotation={rot} material={steel}>
      <cylinderGeometry args={[0.0042, 0.0042, 0.004, 10]} />
    </mesh>
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Floor */}
      <mesh position={[0, y0 + 0.004, 0]} material={steel} receiveShadow>
        <boxGeometry args={[W - 0.01, 0.008, D - 0.01]} />
      </mesh>

      {/* Perforated panels */}
      {[1, -1].map((s) => (
        <mesh key={`f${s}`} position={[0, midY, (s * (D - 0.008)) / 2]} material={front} castShadow>
          <planeGeometry args={[W - POST * 2, panelH]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={`s${s}`} position={[(s * (W - 0.008)) / 2, midY, 0]} rotation={[0, Math.PI / 2, 0]} material={side} castShadow>
          <planeGeometry args={[D - POST * 2, panelH]} />
        </mesh>
      ))}

      {/* Frame: corner posts + top and bottom rails on every face */}
      {[1, -1].flatMap((sx) =>
        [1, -1].map((sz) => (
          <mesh key={`p${sx}${sz}`} position={[(sx * (W - POST)) / 2, midY, (sz * (D - POST)) / 2]} material={frame} castShadow>
            <boxGeometry args={[POST, H, POST]} />
          </mesh>
        )),
      )}
      {[y0 + RAIL / 2, y0 + H - RAIL / 2].flatMap((y, k) => [
        ...[1, -1].map((s) => (
          <mesh key={`rf${k}${s}`} position={[0, y, (s * (D - 0.006)) / 2]} material={frame}>
            <boxGeometry args={[W - POST * 2, RAIL, 0.006]} />
          </mesh>
        )),
        ...[1, -1].map((s) => (
          <mesh key={`rs${k}${s}`} position={[(s * (W - 0.006)) / 2, y, 0]} material={frame}>
            <boxGeometry args={[0.006, RAIL, D - POST * 2]} />
          </mesh>
        )),
      ])}

      {/* Bolts at the frame corners (front and both sides) */}
      {[1, -1].flatMap((sx) =>
        [y0 + RAIL / 2, y0 + H - RAIL / 2].flatMap((y, k) => [
          bolt((sx * (W - POST)) / 2, y, D / 2 + 0.001, [Math.PI / 2, 0, 0], `bf${sx}${k}`),
          bolt((sx * W) / 2 + sx * 0.001, y, (D - POST) / 2, [0, 0, Math.PI / 2], `bsa${sx}${k}`),
          bolt((sx * W) / 2 + sx * 0.001, y, -(D - POST) / 2, [0, 0, Math.PI / 2], `bsb${sx}${k}`),
        ]),
      )}

      {/* Rubber feet */}
      {[1, -1].flatMap((sx) =>
        [1, -1].map((sz) => (
          <mesh key={`ft${sx}${sz}`} position={[sx * (W / 2 - 0.03), FOOT / 2, sz * (D / 2 - 0.03)]}>
            <cylinderGeometry args={[0.012, 0.014, FOOT, 12]} />
            <meshStandardMaterial color="#0c0c0d" roughness={0.9} />
          </mesh>
        )),
      )}

      {/* Name plate with the framed mark, riveted to the front */}
      <group position={[0, midY - 0.005, D / 2 + 0.001]}>
        <mesh>
          <boxGeometry args={[0.15, 0.052, 0.004]} />
          <meshStandardMaterial color="#d8d3c6" roughness={0.55} metalness={0.15} />
        </mesh>
        <group position={[0, 0, 0.0026]}>
          <LogoPlane variant="framed" tone="black" width={0.128} />
        </group>
        {[1, -1].flatMap((sx) => [1, -1].map((sy) => bolt(sx * 0.069, sy * 0.02, 0.003, [Math.PI / 2, 0, 0], `pl${sx}${sy}`)))}
      </group>

      {/* Cobalt tab on the front, bottom right */}
      <mesh position={[W / 2 - POST - 0.012, y0 + RAIL + 0.012, D / 2 + 0.0015]}>
        <boxGeometry args={[0.012, 0.022, 0.002]} />
        <meshStandardMaterial color={COBALT} roughness={0.7} />
      </mesh>

      {/* Records */}
      {sleeves.map((s, i) => (
        <group key={i} position={[s.x, y0 + 0.008 + s.lift, s.z]} rotation={[s.lean, 0, 0]}>
          <mesh position={[0, SLEEVE / 2, 0]} castShadow>
            <boxGeometry args={[SLEEVE, SLEEVE, 0.0035]} />
            <meshStandardMaterial attach="material-0" color={SLEEVES[s.art][0]} roughness={0.8} />
            <meshStandardMaterial attach="material-1" color={SLEEVES[s.art][0]} roughness={0.8} />
            <meshStandardMaterial attach="material-2" color="#e8e4da" roughness={0.9} />
            <meshStandardMaterial attach="material-3" color={SLEEVES[s.art][0]} roughness={0.8} />
            <meshStandardMaterial attach="material-4" map={covers[s.art]} roughness={0.75} />
            <meshStandardMaterial attach="material-5" color={SLEEVES[s.art][0]} roughness={0.8} />
          </mesh>
          {/* One record pulled halfway out of its sleeve */}
          {i === 6 && (
            <group position={[0.02, SLEEVE - 0.03, -0.0035]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.15, 0.15, 0.0018, 48]} />
                <meshStandardMaterial color="#0a0a0b" roughness={0.28} metalness={0.2} />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.0022, 32]} />
                <meshStandardMaterial color={COBALT} roughness={0.6} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
