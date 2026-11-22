import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

/** Holes per metre of the shop's perforated steel (counter front, arcade fascias). */
export const PERF_PER_METRE = 20;

/** Dot-grid texture for perforated steel, tiled `repeat` times across the panel. */
export function perforatedTexture(repeat: [number, number]) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#3a3d41";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#060607";
  ctx.beginPath();
  ctx.arc(32, 32, 11, 0, Math.PI * 2);
  ctx.fill();
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
