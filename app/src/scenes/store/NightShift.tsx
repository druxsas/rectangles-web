"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, LinearFilter, NearestFilter, SRGBColorSpace } from "three";

/**
 * Night Shift — pixel-art screen content for the arcade cabinet (and the
 * TV in the back of the games zone, if we add it).
 *
 * This is the MVP placeholder for the full mini-game: a looping scene with
 * a pixel character walking left-to-right across a shop interior, stars
 * drifting behind, and a flashing "NIGHT SHIFT" title. Rendered off-screen
 * to a tiny canvas, then uploaded as a CanvasTexture so it reads crisp
 * through bloom. Phase 2 will wire keyboard input and an actual score.
 *
 * Returns both the texture and a plane geometry that can be used as the
 * arcade screen. The caller places it in world space.
 */

const WIDTH = 160;
const HEIGHT = 120;

/**
 * Drop-in screen component — the plane sized to the arcade screen aspect
 * with the Night Shift canvas texture applied, including a soft emissive
 * cast so bloom picks it up.
 */
export function NightShiftScreen({
  width = 1.2,
  height = 0.9,
  position,
  rotation,
}: {
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const texture = useNightShiftTexture();
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export function useNightShiftTexture() {
  // Offscreen pixel canvas (crisp when sampled with nearest-neighbor).
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = WIDTH;
    c.height = HEIGHT;
    return c;
  }, []);

  const texture = useMemo(() => {
    const t = new CanvasTexture(canvas);
    t.magFilter = NearestFilter;
    t.minFilter = LinearFilter;
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [canvas]);

  const start = useRef(performance.now());
  const stars = useRef<Array<{ x: number; y: number; p: number }>>(
    Array.from({ length: 18 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * (HEIGHT - 40),
      p: Math.random(),
    })),
  );

  useFrame(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const t = (performance.now() - start.current) / 1000;

    // --- Background: deep night with scanlines ---------------------------
    ctx.fillStyle = "#0a0b1a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Scanlines
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let y = 0; y < HEIGHT; y += 2) ctx.fillRect(0, y, WIDTH, 1);

    // --- Stars (twinkle via p + t) ---------------------------------------
    for (const s of stars.current) {
      const flick = 0.5 + 0.5 * Math.sin(t * 2 + s.p * 7);
      ctx.fillStyle = `rgba(200, 220, 255, ${0.3 + 0.7 * flick})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
    }

    // --- Horizon strip (store floor) -------------------------------------
    ctx.fillStyle = "#1f1a12";
    ctx.fillRect(0, HEIGHT - 32, WIDTH, 32);
    // Floor highlight line
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(0, HEIGHT - 32, WIDTH, 1);

    // Scrolling floor dots (sense of movement)
    const scroll = (t * 36) % 8;
    ctx.fillStyle = "#5a3f20";
    for (let x = -scroll; x < WIDTH; x += 8) ctx.fillRect(x, HEIGHT - 10, 2, 1);

    // --- Pixel character (stick figure) walking right -------------------
    const cx = ((t * 24) % (WIDTH + 24)) - 12; // loops with 12px off-screen edges
    const cy = HEIGHT - 32 - 16;
    const step = Math.floor((t * 6) % 2);
    ctx.fillStyle = "#f7f7f3";
    // Head
    ctx.fillRect(cx + 3, cy, 3, 3);
    // Body
    ctx.fillRect(cx + 3, cy + 3, 3, 6);
    // Arms
    ctx.fillRect(cx + 1, cy + 4, 2, 4);
    ctx.fillRect(cx + 6, cy + 4, 2, 4);
    // Legs — alternate per step
    if (step === 0) {
      ctx.fillRect(cx + 3, cy + 9, 2, 5);
      ctx.fillRect(cx + 5, cy + 9, 2, 4);
    } else {
      ctx.fillRect(cx + 3, cy + 9, 2, 4);
      ctx.fillRect(cx + 5, cy + 9, 2, 5);
    }

    // Cobalt phone/mop pixel on hand
    ctx.fillStyle = "#165dfa";
    ctx.fillRect(cx + 8, cy + 4, 1, 3);

    // --- Title bar ------------------------------------------------------
    ctx.fillStyle = "#17191b";
    ctx.fillRect(0, 0, WIDTH, 18);
    ctx.fillStyle = "#f7f7f3";
    ctx.fillRect(0, 17, WIDTH, 1);
    // Title text — tiny 5x5 bitmap drawn one letter at a time
    drawTitle(ctx, 8, 6, "NIGHT  SHIFT", "#f7f7f3");

    // Flashing cursor to the right of the title
    if ((t * 2) % 2 > 1) {
      ctx.fillStyle = "#165dfa";
      ctx.fillRect(80, 6, 4, 6);
    }

    // Score at top-right (increments by seconds)
    drawTitle(ctx, WIDTH - 36, 6, `${String(Math.floor(t)).padStart(4, "0")}`, "#4ade80");

    texture.needsUpdate = true;
  });

  return texture;
}

// -------------------- tiny bitmap font --------------------
// 3x5 font for the characters we actually use in Night Shift.
const FONT: Record<string, string[]> = {
  N: ["x.x", "xxx", "xxx", "x.x", "x.x"],
  I: ["xxx", ".x.", ".x.", ".x.", "xxx"],
  G: ["xxx", "x..", "x.x", "x.x", "xxx"],
  H: ["x.x", "x.x", "xxx", "x.x", "x.x"],
  T: ["xxx", ".x.", ".x.", ".x.", ".x."],
  S: ["xxx", "x..", "xxx", "..x", "xxx"],
  F: ["xxx", "x..", "xxx", "x..", "x.."],
  "0": ["xxx", "x.x", "x.x", "x.x", "xxx"],
  "1": [".x.", "xx.", ".x.", ".x.", "xxx"],
  "2": ["xxx", "..x", "xxx", "x..", "xxx"],
  "3": ["xxx", "..x", "xxx", "..x", "xxx"],
  "4": ["x.x", "x.x", "xxx", "..x", "..x"],
  "5": ["xxx", "x..", "xxx", "..x", "xxx"],
  "6": ["xxx", "x..", "xxx", "x.x", "xxx"],
  "7": ["xxx", "..x", ".x.", "x..", "x.."],
  "8": ["xxx", "x.x", "xxx", "x.x", "xxx"],
  "9": ["xxx", "x.x", "xxx", "..x", "xxx"],
  " ": ["...", "...", "...", "...", "..."],
};

function drawTitle(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < text.length; i++) {
    const g = FONT[text[i]] ?? FONT[" "];
    for (let ry = 0; ry < 5; ry++) {
      for (let rx = 0; rx < 3; rx++) {
        if (g[ry][rx] === "x") ctx.fillRect(x + i * 4 + rx, y + ry, 1, 1);
      }
    }
  }
}
