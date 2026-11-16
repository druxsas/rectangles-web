/**
 * Helpers for brand-correct 2D canvas art (screens, labels, idle cards).
 *
 * - `displayFont()` resolves the real family next/font registered for Anton
 *   (a hashed name), so canvas titles use the same face as the DOM.
 * - `loadLogo()` loads the official logo art from /public/logo once.
 */

export function displayFont(): string {
  if (typeof document === "undefined") return "Impact, sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v ? `${v}, Impact, sans-serif` : "Impact, sans-serif";
}

export function sansFont(): string {
  if (typeof document === "undefined") return "system-ui, sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim();
  return v ? `${v}, Inter, system-ui, sans-serif` : "Inter, system-ui, sans-serif";
}

export type LogoKey = "horizontal-white" | "horizontal-black" | "framed-white" | "framed-black";

/** width / height of each lock-up (source SVG viewBoxes). */
export const LOGO_RATIO: Record<LogoKey, number> = {
  "horizontal-white": 1715.1591 / 248,
  "horizontal-black": 1715.1591 / 248,
  "framed-white": 1247.1591 / 340,
  "framed-black": 1247.1591 / 340,
};

const cache = new Map<LogoKey, Promise<HTMLImageElement>>();

export function loadLogo(key: LogoKey): Promise<HTMLImageElement> {
  let p = cache.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `/logo/${key}.png`;
    });
    cache.set(key, p);
  }
  return p;
}

/** Wait for web fonts + the given logos, then run `draw`. */
export function whenBrandReady(keys: LogoKey[], draw: (logos: Record<LogoKey, HTMLImageElement>) => void) {
  const fonts = typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();
  return Promise.all([fonts, ...keys.map((k) => loadLogo(k).then((img) => [k, img] as const))]).then(([, ...pairs]) =>
    draw(Object.fromEntries(pairs as (readonly [LogoKey, HTMLImageElement])[]) as Record<LogoKey, HTMLImageElement>),
  );
}

/** Draw a logo centred at (cx, cy) with the given width. */
export function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, key: LogoKey, cx: number, cy: number, width: number) {
  const h = width / LOGO_RATIO[key];
  ctx.drawImage(img, cx - width / 2, cy - h / 2, width, h);
}
