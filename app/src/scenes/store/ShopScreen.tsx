"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { FEATURED, useCheckout } from "@/stores/checkout";

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

/**
 * Layout boxes measured from the live StorePage home (offsets inside the
 * 1280×720 page). Keep in sync with components/store/StorePage.tsx so the
 * idle screen and the zoomed-in page look identical.
 */
const L = {
  logo: { x: 40, y: 43, h: 44 },
  nav: { x: 497, y: 52, items: [["Shop", 0], ["Skate", 78], ["Music", 161], ["Games", 246], ["Retro Computing", 339]] as [string, number][] },
  cart: { right: 1240, y: 52 },
  back: { x: 40, y: 103 },
  h1: { x: 40, y: 155, size: 88, leading: 79.2, lines: ["FIND YOUR", "NEXT", "OBSESSION."] },
  sub: { x: 40, y: 409, leading: 24.3 },
  cta: { x: 40, y: 479, w: 268, h: 55 },
  hero: { x: 498, y: 255, w: 742, h: 279 },
  finds: { x: 40, y: 568, size: 52 },
  tabs: { y: 576, items: [["All", 838, 25], ["Skate", 903, 51], ["Music", 994, 55], ["Games", 1089, 63], ["Retro", 1192, 48]] as [string, number, number][] },
  card: { y: 629, w: 287, gap: 18, imgH: 178, titleY: 820 },
};

/**
 * Draw text the way CSS lays out a line box: given the box top and its
 * line-height, the baseline sits at top + (lineHeight − (ascent+descent))/2
 * + ascent, using the font's own metrics. Engine-independent, unlike
 * textBaseline "top" (which shifted tall faces like Anton in some browsers).
 * `lineHeight` omitted = CSS "normal" (content area = ascent + descent).
 */
function textAt(ctx: CanvasRenderingContext2D, str: string, x: number, top: number, lineHeight?: number) {
  const m = ctx.measureText(str);
  const a = m.fontBoundingBoxAscent;
  const d = m.fontBoundingBoxDescent;
  const lh = lineHeight ?? a + d;
  ctx.fillText(str, x, top + (lh - (a + d)) / 2 + a);
}

function draw(ctx: CanvasRenderingContext2D, cartCount: number, imgs: Record<string, HTMLImageElement>) {
  const f = fonts();
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  // Demo strip
  ctx.fillStyle = "#e9e8e3";
  ctx.fillRect(0, 0, W, 23);
  ctx.fillStyle = C.ink;
  ctx.font = `700 11px ${f.sans}`;
  ctx.textAlign = "center";
  textAt(ctx, "DEMO STORE — NO REAL PAYMENTS", W / 2, 0, 23);
  ctx.textAlign = "left";

  // Header: official logo, nav, cart
  if (imgs.logo) ctx.drawImage(imgs.logo, L.logo.x, L.logo.y, L.logo.h * (1715.1591 / 248), L.logo.h);
  ctx.font = `600 17px ${f.sans}`;
  for (const [label, dx] of L.nav.items) textAt(ctx, label, L.nav.x + dx, L.nav.y, 26);
  // Search icon
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1135, 63, 6.5, 0, Math.PI * 2);
  ctx.moveTo(1140, 68);
  ctx.lineTo(1145, 73);
  ctx.stroke();
  ctx.textAlign = "right";
  textAt(ctx, `Cart (${cartCount})`, L.cart.right, L.cart.y, 26);
  ctx.textAlign = "left";

  // Hero copy — same face, size, leading and line breaks as the live page
  ctx.font = `600 15px ${f.sans}`;
  textAt(ctx, "← Back to the space", L.back.x, L.back.y, 23);
  ctx.font = `400 ${L.h1.size}px ${f.display}`;
  L.h1.lines.forEach((line, i) => textAt(ctx, line, L.h1.x, L.h1.y + i * L.h1.leading, L.h1.leading));
  ctx.font = `400 18px ${f.sans}`;
  textAt(ctx, "Boards, records, games and old machines.", L.sub.x, L.sub.y, L.sub.leading);
  textAt(ctx, "Same place. Your next find.", L.sub.x, L.sub.y + L.sub.leading, L.sub.leading);
  ctx.fillRect(L.cta.x, L.cta.y, L.cta.w, L.cta.h);
  ctx.fillStyle = "#fff";
  ctx.font = `600 18px ${f.sans}`;
  ctx.textAlign = "center";
  textAt(ctx, "Explore the collection", L.cta.x + L.cta.w / 2, L.cta.y, L.cta.h);
  ctx.textAlign = "left";

  // Hero image
  cover(ctx, imgs.hero, L.hero.x, L.hero.y, L.hero.w, L.hero.h);

  // Selected finds + tabs
  ctx.fillStyle = C.ink;
  ctx.font = `400 ${L.finds.size}px ${f.display}`;
  textAt(ctx, "SELECTED FINDS", L.finds.x, L.finds.y, L.finds.size * 0.9);
  for (const [label, x, w] of L.tabs.items) {
    ctx.font = `${label === "All" ? 700 : 500} 19px ${f.sans}`;
    textAt(ctx, label, x, L.tabs.y, 29);
    if (label === "All") {
      ctx.fillStyle = C.cobalt;
      ctx.fillRect(x, L.tabs.y + 35, w, 4);
      ctx.fillStyle = C.ink;
    }
  }

  // Product cards (top portion visible above the fold, like the live page)
  FEATURED.forEach((p, i) => {
    const x = 40 + i * (L.card.w + L.card.gap);
    ctx.fillStyle = C.card;
    ctx.fillRect(x, L.card.y, L.card.w, H - L.card.y);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, L.card.y + 0.5, L.card.w - 1, H - L.card.y);
    cover(ctx, imgs[p.id], x + 1, L.card.y + 1, L.card.w - 2, L.card.imgH);
    ctx.fillStyle = C.ink;
    ctx.font = `600 17px ${f.sans}`;
    textAt(ctx, p.shortTitle, x + 15, L.card.titleY, 26);
  });
}

/** Make sure the exact faces the canvas uses are loaded (fonts.ready alone isn't enough). */
function loadFaces() {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const f = fonts();
  return Promise.all(
    [`400 88px ${f.display}`, `400 18px ${f.sans}`, `500 19px ${f.sans}`, `600 17px ${f.sans}`, `700 11px ${f.sans}`].map((spec) =>
      document.fonts.load(spec).catch(() => []),
    ),
  ).then(() => document.fonts.ready);
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
    const sources: [string, string][] = [["hero", "/shop/hero.jpg"], ["logo", "/logo/horizontal-black.png"], ...FEATURED.map((p) => [p.id, p.image ?? ""] as [string, string])];
    Promise.all([
      Promise.all(sources.map(([k, src]) => loadImage(src).then((img) => [k, img] as const))),
      loadFaces(),
    ]).then(([loaded]) => {
      if (alive) repaint(texture, ctx, cartCount, Object.fromEntries(loaded));
    });
    return () => {
      alive = false;
    };
  }, [ctx, texture, cartCount]);

  return texture;
}
