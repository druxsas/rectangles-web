"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { displayFont, sansFont } from "@/scenes/store/brandCanvas";

/**
 * Hanging OPEN / CLOSED door sign: a two-sided board on a cord from a
 * suction hook on the glass. The shop is open, so OPEN faces the street and
 * CLOSED shows on the back, read from inside through the glass.
 *
 * Local space: the board hangs in the xy plane against a pane at z = 0,
 * street side toward +z; the origin is the centre of the board.
 */

const W = 0.32;
const H = 0.2;
const T = 0.006;
const INK = "#17191b";
const IVORY = "#f7f7f3";
const COBALT = "#165dfa";
const PX = 1600; // canvas pixels per metre

function face(word: string, sub: string, bg: string, fg: string) {
  const c = document.createElement("canvas");
  c.width = Math.round(W * PX);
  c.height = Math.round(H * PX);
  const ctx = c.getContext("2d")!;
  const w = c.width;
  const h = c.height;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // Framed rectangle, as in the brand mark.
  ctx.strokeStyle = fg;
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, w - 40, h - 40);
  // Word
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 ${Math.round(h * 0.56)}px ${displayFont()}`;
  const m = ctx.measureText(word);
  const cap = m.actualBoundingBoxAscent;
  const top = h * 0.17;
  ctx.fillText(word, w / 2, top + cap);
  // Cobalt bar + small line
  const barY = top + cap + h * 0.06;
  ctx.fillStyle = COBALT;
  ctx.fillRect(w / 2 - m.width / 2, barY, m.width, 7);
  ctx.fillStyle = fg;
  ctx.font = `600 ${Math.round(h * 0.075)}px ${sansFont()}`;
  ctx.fillText(sub, w / 2, barY + 7 + h * 0.11);
  return ctx;
}

function useFace(word: string, sub: string, bg: string, fg: string) {
  const texture = useMemo(() => {
    const t = new CanvasTexture(face(word, sub, bg, fg).canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [word, sub, bg, fg]);
  // Redraw once the display face has actually loaded (first paint may fall back).
  useEffect(() => {
    let live = true;
    const family = displayFont();
    Promise.all([document.fonts.load(`400 80px ${family}`), document.fonts.load(`600 20px ${sansFont()}`)]).then(() => {
      if (!live) return;
      texture.image = face(word, sub, bg, fg).canvas;
      texture.needsUpdate = true;
    });
    return () => {
      live = false;
    };
  }, [texture, word, sub, bg, fg]);
  return texture;
}

export function OpenSign({ position, rotation }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const open = useFace("OPEN", "COME IN — STAY A WHILE", IVORY, INK);
  const closed = useFace("CLOSED", "BACK SOON", INK, IVORY);
  // Cord: from the hook down to the two top corners of the board.
  const hookY = H / 2 + 0.11;
  const eyeX = W / 2 - 0.035;
  const len = Math.hypot(eyeX, hookY - H / 2);
  const lean = Math.atan2(eyeX, hookY - H / 2);
  const z = T / 2 + 0.004; // board hangs just off the glass
  return (
    <group position={position} rotation={rotation}>
      {/* Suction hook on the glass */}
      <mesh position={[0, hookY, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.017, 0.02, 0.008, 24]} />
        <meshStandardMaterial color="#c9ccd0" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Cord */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[(side * eyeX) / 2, (hookY + H / 2) / 2, z]} rotation={[0, 0, side * lean]}>
          <cylinderGeometry args={[0.0016, 0.0016, len, 6]} />
          <meshStandardMaterial color="#101113" roughness={0.8} />
        </mesh>
      ))}
      {/* Board: OPEN toward the street (+z), CLOSED on the back */}
      <mesh position={[0, 0, z]} rotation={[0, 0, -0.025]} castShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial attach="material-0" color={INK} roughness={0.6} />
        <meshStandardMaterial attach="material-1" color={INK} roughness={0.6} />
        <meshStandardMaterial attach="material-2" color={INK} roughness={0.6} />
        <meshStandardMaterial attach="material-3" color={INK} roughness={0.6} />
        {/* Ivory face under the canopy downlights: printed a step down so it doesn't clip and bloom */}
        <meshStandardMaterial attach="material-4" map={open} color="#8e8e8b" emissiveMap={open} emissive="#ffffff" emissiveIntensity={0.05} roughness={0.7} />
        <meshStandardMaterial attach="material-5" map={closed} emissiveMap={closed} emissive="#ffffff" emissiveIntensity={0.12} roughness={0.7} />
      </mesh>
      {/* Eyelets */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[side * eyeX, H / 2 - 0.012, z + T / 2 + 0.0004]}>
          <ringGeometry args={[0.003, 0.0055, 16]} />
          <meshStandardMaterial color="#c9ccd0" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
