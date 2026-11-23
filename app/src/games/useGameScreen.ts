"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, LinearFilter, NearestFilter, SRGBColorSpace } from "three";
import { live } from "@/components/games/arcadeInput";
import { H, W, createRunner, type Game } from "@/games/engine";
import { GAMES } from "@/games";
import { useArcade, type CabinetId } from "@/stores/arcade";

/** Draw the frame and flag the texture for upload (module-level: hook values aren't mutated in render scope). */
function paint(ctx: CanvasRenderingContext2D, texture: CanvasTexture, game: Game) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  game.draw(ctx);
  texture.needsUpdate = true;
}

/**
 * The picture on one cabinet's screen: its game, drawn into a canvas
 * texture (shown on a flat plane in the bezel's window, see ArcadeArt.tsx).
 *
 * While the cabinet is being played the game runs on the players' input;
 * otherwise it idles on its title screen (redrawn at a third of the frame
 * rate — nobody is looking closely). Leaving the cabinet resets the game.
 */
export function useGameScreen(cabinet: CabinetId) {
  const { canvas, texture, runner, game } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = new CanvasTexture(c);
    t.magFilter = NearestFilter;
    t.minFilter = LinearFilter;
    t.colorSpace = SRGBColorSpace;
    const g = GAMES[cabinet];
    return { canvas: c, texture: t, runner: createRunner(g), game: g };
  }, [cabinet]);

  const wasActive = useRef(false);
  const tick = useRef(0);
  useFrame((_, dt) => {
    const state = useArcade.getState();
    const active = state.cabinet === cabinet;
    if (active) runner.advance(dt, live, state.players);
    else {
      if (wasActive.current) game.reset();
      runner.idle(dt);
    }
    wasActive.current = active;
    if (!active && tick.current++ % 3) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paint(ctx, texture, game);
  });
  return texture;
}
