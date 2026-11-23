import type { Controls } from "@/components/games/arcadeInput";

/**
 * Tiny engine for the cabinet games.
 *
 * Every game draws into a 256 × 216 canvas (16-bit console resolution, in
 * the proportions of the cabinet's screen) and advances in fixed 1/60 s steps, so
 * it plays the same at any display refresh rate. A game is a plain object:
 * add one by implementing `Game` and listing it in games/index.ts.
 */

export const W = 256;
/** 256 × 216: the proportions of the cabinet's screen opening. */
export const H = 216;
export const STEP = 1 / 60;

export type Ctx = CanvasRenderingContext2D;

/** One player's controls for this step, with "just pressed" edges. */
export type Pad = {
  x: number;
  y: number;
  /** Top row left→right (0–2), bottom row left→right (3–5). */
  held: boolean[];
  pressed: boolean[];
  start: boolean;
  startPressed: boolean;
};

export type Game = {
  title: string;
  /** For the setup window: how to play, what the stick does, and what the six buttons do (top row, then bottom row; "—" = unused). */
  controls: { stick: string; stickShort: string; buttons: string[] };
  /** Back to the title screen. */
  reset(): void;
  /** Advance one 1/60 s step. `players` is how many humans are playing. */
  step(pads: [Pad, Pad], players: 1 | 2): void;
  /** Draw the current frame. */
  draw(ctx: Ctx): void;
};

const blankPad = (): Pad => ({ x: 0, y: 0, held: Array(6).fill(false), pressed: Array(6).fill(false), start: false, startPressed: false });

/** Turns the raw live controls into per-step pads with edges, at a fixed timestep. */
export function createRunner(game: Game) {
  const pads: [Pad, Pad] = [blankPad(), blankPad()];
  let acc = 0;
  return {
    /** Feed real time; runs as many fixed steps as fit (capped, so a stalled tab doesn't fast-forward). */
    advance(dt: number, live: [Controls, Controls], players: 1 | 2) {
      acc = Math.min(acc + dt, STEP * 5);
      while (acc >= STEP) {
        acc -= STEP;
        for (const p of [0, 1] as const) {
          const src = live[p];
          const pad = pads[p];
          pad.x = src.x;
          pad.y = src.y;
          for (let i = 0; i < 6; i++) {
            pad.pressed[i] = src.tapped[i] || (src.buttons[i] && !pad.held[i]);
            pad.held[i] = src.buttons[i];
          }
          pad.startPressed = src.tapped[6] || (src.start && !pad.start);
          pad.start = src.start;
          src.tapped.fill(false);
        }
        game.step(pads, players);
      }
    },
    /** Idle step with nobody at the controls (title / attract screen). */
    idle(dt: number) {
      acc = Math.min(acc + dt, STEP * 5);
      const none: [Pad, Pad] = [blankPad(), blankPad()];
      while (acc >= STEP) {
        acc -= STEP;
        game.step(none, 1);
      }
    },
  };
}

// ----------------------------------------------------------------
// Pixel helpers
// ----------------------------------------------------------------
export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 5 × 7 bitmap font, rows top to bottom: crisp at any integer scale (canvas text would blur at this size). */
const GLYPHS: Record<string, string> = {
  A: "01110 10001 10001 11111 10001 10001 10001", B: "11110 10001 10001 11110 10001 10001 11110", C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11110 10001 10001 10001 10001 10001 11110", E: "11111 10000 10000 11110 10000 10000 11111", F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01111", H: "10001 10001 10001 11111 10001 10001 10001", I: "01110 00100 00100 00100 00100 00100 01110",
  J: "00111 00010 00010 00010 00010 10010 01100", K: "10001 10010 10100 11000 10100 10010 10001", L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001", N: "10001 11001 10101 10011 10001 10001 10001", O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000", Q: "01110 10001 10001 10001 10101 10010 01101", R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110", T: "11111 00100 00100 00100 00100 00100 00100", U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100", W: "10001 10001 10001 10101 10101 11011 10001", X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100", Z: "11111 00001 00010 00100 01000 10000 11111",
  "0": "01110 10001 10011 10101 11001 10001 01110", "1": "00100 01100 00100 00100 00100 00100 01110", "2": "01110 10001 00001 00010 00100 01000 11111",
  "3": "11110 00001 00001 01110 00001 00001 11110", "4": "00010 00110 01010 10010 11111 00010 00010", "5": "11111 10000 11110 00001 00001 10001 01110",
  "6": "00110 01000 10000 11110 10001 10001 01110", "7": "11111 00001 00010 00100 01000 01000 01000", "8": "01110 10001 10001 01110 10001 10001 01110",
  "9": "01110 10001 10001 01111 00001 00010 01100",
  ".": "00000 00000 00000 00000 00000 01100 01100", "!": "00100 00100 00100 00100 00100 00000 00100", "-": "00000 00000 00000 11111 00000 00000 00000",
  ":": "00000 01100 01100 00000 01100 01100 00000", "/": "00001 00010 00010 00100 01000 01000 10000", "'": "00100 00100 01000 00000 00000 00000 00000",
  ">": "01000 00100 00010 00001 00010 00100 01000", "<": "00010 00100 01000 10000 01000 00100 00010", "+": "00000 00100 00100 11111 00100 00100 00000",
  "?": "01110 10001 00001 00010 00100 00000 00100", ",": "00000 00000 00000 00000 01100 00100 01000",
};
for (const k in GLYPHS) GLYPHS[k] = GLYPHS[k].replaceAll(" ", "");

/**
 * Type sizes → pixel scale of the 5 × 7 font. Sizes 1–2 are HUD text, 3–5
 * captions and calls, 7–10 titles (a size-8 title is 35 px tall).
 */
const SCALE: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 5, 8: 5, 9: 6, 10: 7 };
const px = (size: number) => SCALE[size] ?? Math.max(1, Math.round(size * 0.65));

/** Pixel scale for a string at a size, stepped down until the line fits the screen. */
function fit(s: string, size: number) {
  let k = px(size);
  while (k > 1 && s.length * 6 * k - k > W - 8) k--;
  return k;
}

export function textWidth(s: string, size = 1) {
  const k = fit(s, size);
  return s.length * 6 * k - k;
}

/** Draw text; `align` 0 = left at x, 0.5 = centred on x, 1 = right-aligned to x. */
export function text(ctx: Ctx, s: string, x: number, y: number, color: string, size = 1, align = 0) {
  const str = s.toUpperCase();
  const k = fit(str, size);
  let cx = Math.round(x - textWidth(str, size) * align);
  ctx.fillStyle = color;
  for (const ch of str) {
    const g = GLYPHS[ch];
    if (g) for (let i = 0; i < 35; i++) if (g[i] === "1") ctx.fillRect(cx + (i % 5) * k, Math.round(y) + Math.floor(i / 5) * k, k, k);
    cx += 6 * k;
  }
}

/** Text with a small drop shadow, the way 16-bit HUDs keep type readable. */
export function shadowText(ctx: Ctx, s: string, x: number, y: number, color: string, size = 1, align = 0, shadow = "#000") {
  const d = Math.min(fit(s, size), 2);
  text(ctx, s, x + d, y + d, shadow, size, align);
  text(ctx, s, x, y, color, size, align);
}

/** Deterministic pseudo-random in [0, 1) from an integer (stable backgrounds without Math.random). */
export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const PAL = { ink: "#0d0e10", ivory: "#f7f7f3", cobalt: "#165dfa", cobaltDark: "#0b2f8f", warm: "#ffbc7a", red: "#e5484d", night: "#0a0b1a" };
