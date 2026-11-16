#!/usr/bin/env node
/**
 * Store product photos: /Images/Shop/<nn-slug>/{card,main}.png → public/shop/p/*.jpg
 *
 *   card  712 × 446   listing card + cart thumbnail (shown at 356 × 223)
 *   main 1706 × 1026  product page (shown at 853 × 513)
 *
 * A second colourway is "card 2.png" / "main 2.png" in the same folder.
 *
 * Usage: node scripts/optimize-shop.mjs
 */
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP, "..", "Images", "Shop");
const OUT = join(APP, "public", "shop", "p");

/** Source folder → product id (stores/checkout.ts). */
const FOLDERS = {
  "01-black-frame-deck": "black-frame-deck",
  "02-ivory-wheels-53mm": "ivory-wheels",
  "03-raw-silver-trucks": "raw-trucks",
  "04-classic-black-grip-tape": "classic-grip",
  "05-sessions-vol-02": "sessions-02",
  "06-framed-mark-slipmat": "framed-slipmat",
  "07-replacement-stylus": "needle-stylus",
  "08-record-crate": "record-crate",
  "09-ivory-controller-pad": "ivory-pad",
  "10-night-shift-poster": "night-shift-poster",
  "11-night-shift-cassette": "night-shift-ost",
  "12-cartridge-carry-case": "cartridge-case",
  "13-desktop-culture-hoodie": "desktop-hoodie",
  "14-old-hardware-sticker-pack": "old-hardware-stickers",
  "15-technical-drawing-mousepad": "technical-mousepad",
  "16-beige-box-keycap-set": "beige-keycaps",
};
const SIZES = { card: [712, 446], main: [1706, 1026] };

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [folder, id] of Object.entries(FOLDERS)) {
  for (const [kind, [w, h]] of Object.entries(SIZES)) {
    for (const [suffix, tag] of [["", ""], [" 2", "-2"]]) {
      const src = join(SRC, folder, `${kind}${suffix}.png`);
      if (!existsSync(src)) continue;
      const out = join(OUT, `${id}-${kind}${tag}.jpg`);
      await sharp(src).resize(w, h, { fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
      total += statSync(out).size;
      console.log(`${id}-${kind}${tag}.jpg ${(statSync(out).size / 1024).toFixed(0)} KB`);
    }
  }
}
console.log(`total ${(total / 1048576).toFixed(2)} MB`);
