"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { PRODUCTS, useCheckout } from "@/stores/checkout";

/**
 * Idle picture on the counter iMac: a canvas rendering of the store home
 * (mockup /Storyboard/store-mockups/01-home.png) using the same product
 * images and catalog as the live store page. When the visitor clicks the
 * iMac, ImacStore swaps this for the real, interactive page.
 */

const W = 1280;
const H = 720;

const C = {
  paper: "#f4f3ef",
  card: "#fbfbf9",
  ink: "#17191b",
  line: "#d6d8d5",
  cobalt: "#165dfa",
} as const;

function fonts() {
  const css = getComputedStyle(document.documentElement);
  return {
    display: css.getPropertyValue("--font-family-display").trim() || "Anton, Impact, sans-serif",
    sans: css.getPropertyValue("--font-family-sans").trim() || "Inter, system-ui, sans-serif",
  };
}

const imageCache = new Map<string, HTMLImageElement>();
function loadImage(src: string) {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  const el = img;
  return el.complete
    ? Promise.resolve(el)
    : new Promise<HTMLImageElement>((r) => el.addEventListener("load", () => r(el), { once: true }));
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number) {
  if (!img?.naturalWidth) return;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function draw(ctx: CanvasRenderingContext2D, cartCount: number, imgs: Record<string, HTMLImageElement>) {
  const f = fonts();
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);

  // Demo strip
  ctx.fillStyle = "#e9e8e3";
  ctx.fillRect(0, 0, W, 24);
  ctx.fillStyle = C.ink;
  ctx.font = `700 11px ${f.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DEMO STORE — NO REAL PAYMENTS", W / 2, 12.5);

  // Header
  ctx.textAlign = "left";
  if (imgs.logo) {
    const lw = 44 * (1715.1591 / 248);
    ctx.drawImage(imgs.logo, 40, 44, lw, 44);
  }
  ctx.font = `600 17px ${f.sans}`;
  let nx = 460;
  for (const item of ["Shop", "Skate", "Music", "Games", "Retro Computing"]) {
    ctx.fillText(item, nx, 66);
    nx += ctx.measureText(item).width + 36;
  }
  ctx.textAlign = "right";
  ctx.fillText(`Cart (${cartCount})`, W - 40, 66);
  ctx.textAlign = "left";

  // Hero copy
  ctx.font = `600 15px ${f.sans}`;
  ctx.fillText("← Back to the space", 40, 112);
  ctx.font = `400 82px ${f.display}`;
  ctx.fillText("FIND YOUR NEXT", 40, 190);
  ctx.fillText("OBSESSION.", 40, 262);
  ctx.font = `400 18px ${f.sans}`;
  ctx.fillText("Boards, records, games and old machines.", 40, 304);
  ctx.fillText("Same place. Your next find.", 40, 328);
  ctx.fillRect(40, 350, 248, 44);
  ctx.fillStyle = "#fff";
  ctx.font = `600 18px ${f.sans}`;
  ctx.textAlign = "center";
  ctx.fillText("Explore the collection", 164, 373);
  ctx.textAlign = "left";

  // Hero image
  cover(ctx, imgs.hero, 498, 98, W - 538, 300);

  // Selected finds
  ctx.fillStyle = C.ink;
  ctx.font = `400 50px ${f.display}`;
  ctx.fillText("SELECTED FINDS", 40, 452);
  let tx = 820;
  ["All", "Skate", "Music", "Games", "Retro"].forEach((t, i) => {
    ctx.font = `${i === 0 ? 700 : 500} 19px ${f.sans}`;
    ctx.fillText(t, tx, 448);
    if (i === 0) {
      ctx.fillStyle = C.cobalt;
      ctx.fillRect(tx, 462, ctx.measureText(t).width, 4);
      ctx.fillStyle = C.ink;
    }
    tx += ctx.measureText(t).width + 40;
  });

  const top = 484;
  const gap = 18;
  const cw = (W - 80 - gap * 3) / 4;
  const ih = cw * (223 / 356);
  PRODUCTS.forEach((p, i) => {
    const x = 40 + i * (cw + gap);
    ctx.fillStyle = C.card;
    ctx.fillRect(x, top, cw, 236);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, top + 0.5, cw - 1, 236);
    cover(ctx, imgs[p.id], x, top, cw, ih);
    ctx.fillStyle = C.ink;
    ctx.font = `600 17px ${f.sans}`;
    ctx.fillText(p.shortTitle, x + 14, top + ih + 26);
    ctx.font = `700 22px ${f.sans}`;
    ctx.fillText(`$${p.price}`, x + 14, top + ih + 54);
  });
}

function repaint(
  texture: CanvasTexture,
  ctx: CanvasRenderingContext2D,
  cartCount: number,
  imgs: Record<string, HTMLImageElement>,
) {
  draw(ctx, cartCount, imgs);
  texture.needsUpdate = true;
}

export function useShopScreenTexture() {
  const cartCount = useCheckout((s) => s.cart.reduce((n, c) => n + c.qty, 0));

  const { texture, ctx } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return { texture: t, ctx: canvas.getContext("2d")! };
  }, []);

  useEffect(() => {
    let alive = true;
    const sources: [string, string][] = [["hero", "/shop/hero.jpg"], ["logo", "/logo/horizontal-black.png"], ...PRODUCTS.map((p) => [p.id, p.image] as [string, string])];
    Promise.all([
      Promise.all(sources.map(([k, src]) => loadImage(src).then((img) => [k, img] as const))),
      document.fonts?.ready,
    ]).then(([loaded]) => {
      if (alive) repaint(texture, ctx, cartCount, Object.fromEntries(loaded));
    });
    return () => {
      alive = false;
    };
  }, [ctx, texture, cartCount]);

  return texture;
}
