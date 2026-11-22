"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace } from "three";
import { drawLogo, whenBrandReady } from "@/scenes/store/brandCanvas";
import { DESK_MAT_THICKNESS } from "@/scenes/store/imacPose";

/**
 * Extended desk mat under the iMac, keyboard and mouse: black textured
 * cloth on a rubber base, overlock-stitched edge, the Rectangle's lock-up
 * printed in the bottom-right corner (as the vendor sees it) and a cobalt
 * woven tag folded over the right edge, like the tab on the record crate.
 *
 * Local space: lies on y = 0, centred; +z is the user's side, +x their right.
 */

export const MAT = { width: 0.9, depth: 0.45, thickness: DESK_MAT_THICKNESS } as const;
const RADIUS = 0.014;
const BEVEL = 0.0008;
const COBALT = "#165dfa";
/** Canvas pixels per metre. */
const PX = 2048 / MAT.width;

function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Top face: cloth weave, stitched border and (once loaded) the logo. */
function drawTop(ctx: CanvasRenderingContext2D, w: number, h: number, logo?: HTMLImageElement) {
  ctx.fillStyle = "#111215";
  ctx.fillRect(0, 0, w, h);

  // Fine woven texture: a small tile of light/dark threads.
  const tile = document.createElement("canvas");
  tile.width = tile.height = 96;
  const t = tile.getContext("2d")!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 96; y += 2) {
    for (let x = 0; x < 96; x += 2) {
      const v = rnd();
      t.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.09})` : `rgba(0,0,0,${(0.5 - v) * 0.5})`;
      t.fillRect(x + ((y / 2) % 2), y, 2, 2);
    }
  }
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, w, h);

  // Overlock stitching: a raised band of close stitches around the edge.
  const band = 0.005 * PX;
  const r = RADIUS * PX;
  const edge = () => {
    ctx.beginPath();
    ctx.roundRect(band / 2, band / 2, w - band, h - band, r - band / 2);
  };
  edge();
  ctx.lineWidth = band;
  ctx.strokeStyle = "#0a0b0d";
  ctx.stroke();
  edge();
  ctx.setLineDash([2.5, 3]);
  ctx.strokeStyle = "#41444b";
  ctx.stroke();
  ctx.setLineDash([]);
  // Soft shadow line where the stitching meets the cloth.
  ctx.beginPath();
  ctx.roundRect(band, band, w - band * 2, h - band * 2, r - band);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.stroke();

  if (logo) {
    const lw = 0.13 * PX;
    const margin = 0.03 * PX;
    ctx.globalAlpha = 0.72;
    drawLogo(ctx, logo, "horizontal-white", w - margin - lw / 2, h - margin - lw / (1715.1591 / 248) / 2, lw);
    ctx.globalAlpha = 1;
  }
}

export function DeskMat() {
  const { geometry, top } = useMemo(() => {
    const geo = new ExtrudeGeometry(roundedRect(MAT.width, MAT.depth, RADIUS), {
      // The bevel adds its thickness on both faces: total height = MAT.thickness.
      depth: MAT.thickness - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelOffset: -BEVEL,
      bevelSegments: 2,
      curveSegments: 8,
    });
    const c = document.createElement("canvas");
    c.width = 2048;
    c.height = Math.round(MAT.depth * PX);
    drawTop(c.getContext("2d")!, c.width, c.height);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    // Extrude caps are UV-mapped in shape units (metres, origin at centre).
    tex.repeat.set(1 / MAT.width, 1 / MAT.depth);
    tex.offset.set(0.5, 0.5);
    return { geometry: geo, top: tex };
  }, []);

  useEffect(() => {
    let live = true;
    whenBrandReady(["horizontal-white"], (logos) => {
      if (!live) return;
      const c = top.image as HTMLCanvasElement;
      drawTop(c.getContext("2d")!, c.width, c.height, logos["horizontal-white"]);
      top.needsUpdate = true;
    });
    return () => {
      live = false;
    };
  }, [top]);

  // Tag: sits 11 cm up from the user's edge, folded over the right side.
  // The two pieces overlap each other and sink into the mat, so no face of
  // the tag is ever coplanar with the mat or with the other piece (that
  // flickers as the camera moves).
  const tagZ = MAT.depth / 2 - 0.115;
  const T = MAT.thickness;
  const edge = MAT.width / 2;
  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, BEVEL, 0]} receiveShadow>
        <meshStandardMaterial attach="material-0" map={top} roughness={0.96} metalness={0} envMapIntensity={0.25} />
        <meshStandardMaterial attach="material-1" color="#0b0c0e" roughness={0.9} />
      </mesh>
      {/* Cobalt woven tag: top flap (1 mm proud of the cloth)… */}
      <mesh position={[edge - 0.0079, T + 0.0003, tagZ]}>
        <boxGeometry args={[0.0182, 0.0014, 0.03]} />
        <meshStandardMaterial color={COBALT} roughness={0.75} />
      </mesh>
      {/* …and the part folded down the edge */}
      <mesh position={[edge + 0.0004, (T + 0.0007) / 2, tagZ]}>
        <boxGeometry args={[0.0016, T + 0.0001, 0.0298]} />
        <meshStandardMaterial color={COBALT} roughness={0.75} />
      </mesh>
    </group>
  );
}
