#!/usr/bin/env node
/**
 * WCAG 2.2 contrast validator for Rectangle's semantic color tokens.
 *
 * Loads primitives + the light and dark semantic palettes, resolves
 * `{alias}` references, and checks every meaningful foreground/background
 * pairing against the WCAG target ratio:
 *
 *   - 4.5:1 for normal body text         (AA)
 *   - 3.0:1 for large text / UI elements (AA)
 *
 * Exits non-zero if any pairing fails so it can gate CI.
 *
 * Run with `pnpm a11y:contrast`.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS = resolve(__dirname, "..", "..", "tokens");

// ---------- Token loading & reference resolution ----------

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Deep merge sources into one tree, later values winning. */
function merge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      !("$value" in source[key])
    ) {
      target[key] = merge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/** Walk a dotted path through the token tree. */
function getAt(tree, path) {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), tree);
}

/**
 * Resolve a token value. Handles `{token.path}` references and returns a
 * normalized 6-digit hex string. Throws on unresolved references.
 */
function resolveColor(tree, value, seen = new Set()) {
  if (typeof value !== "string") throw new Error(`Non-string color: ${JSON.stringify(value)}`);
  const ref = value.match(/^\{([^}]+)\}$/);
  if (!ref) return value.toLowerCase();
  const key = ref[1];
  if (seen.has(key)) throw new Error(`Cyclic reference: ${key}`);
  seen.add(key);
  const node = getAt(tree, key);
  if (!node || !("$value" in node)) throw new Error(`Unresolved reference: ${key}`);
  return resolveColor(tree, node.$value, seen);
}

// ---------- WCAG math ----------

function hexToRgb(hex) {
  let h = hex.replace("#", "").trim().toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/.test(h)) throw new Error(`Invalid hex: ${hex}`);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function channelLuma(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * channelLuma(r) + 0.7152 * channelLuma(g) + 0.0722 * channelLuma(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  const [a, b] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

// ---------- Build per-theme resolved color maps ----------

const primitives = loadJson(`${TOKENS}/color.primitives.json`);

function buildTheme(semanticFile) {
  const semantic = loadJson(semanticFile);
  const tree = merge(JSON.parse(JSON.stringify(primitives)), semantic);
  const flat = {};
  for (const [bucket, group] of Object.entries(semantic.theme)) {
    for (const [name, def] of Object.entries(group)) {
      flat[`${bucket}.${name}`] = resolveColor(tree, def.$value);
    }
  }
  return flat;
}

const themes = {
  light: buildTheme(`${TOKENS}/color.semantic.light.json`),
  dark: buildTheme(`${TOKENS}/color.semantic.dark.json`),
};

// ---------- Checks ----------

/**
 * Each check: [foreground, background, minRatio, label].
 * minRatio 4.5 = normal text, 3.0 = large text or UI.
 */
const CHECKS = [
  // Body text on primary surfaces
  ["fg.primary",   "bg.canvas",  4.5, "Primary text on canvas"],
  ["fg.primary",   "bg.surface", 4.5, "Primary text on surface"],
  ["fg.primary",   "bg.muted",   4.5, "Primary text on muted bg"],
  ["fg.secondary", "bg.canvas",  4.5, "Secondary text on canvas"],
  ["fg.secondary", "bg.surface", 4.5, "Secondary text on surface"],

  // Accent + inverse
  ["fg.on-accent", "accent.default", 4.5, "Text on accent (Cobalt)"],
  ["fg.inverse",   "bg.inverse",     4.5, "Inverse text on inverse bg"],

  // Action / CTA. Disabled states are exempt per WCAG 2.2 §1.4.11, so no row.
  ["action.fg", "action.bg",       4.5, "CTA text"],
  ["action.fg", "action.bg-hover", 4.5, "CTA text on hover"],

  // Focus ring must be visible against canvas (3:1 UI per WCAG 1.4.11)
  ["focus.ring", "bg.canvas", 3.0, "Focus ring vs canvas"],

  // Status chips
  ["status.success", "status.success-bg", 4.5, "Success text"],
  ["status.warning", "status.warning-bg", 4.5, "Warning text"],
  ["status.error",   "status.error-bg",   4.5, "Error text"],
  ["status.info",    "status.info-bg",    4.5, "Info text"],
];

// ---------- Run ----------

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

let failed = 0;
let total = 0;

for (const [theme, colors] of Object.entries(themes)) {
  console.log(`\n${YELLOW}▸ ${theme.toUpperCase()}${RESET}`);
  for (const [fgKey, bgKey, min, label] of CHECKS) {
    total++;
    const fg = colors[fgKey];
    const bg = colors[bgKey];
    if (!fg || !bg) {
      console.log(`  ${RED}MISSING${RESET} ${fgKey} → ${bgKey}  (${label})`);
      failed++;
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    const pass = ratio >= min;
    const mark = pass ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    const detail = `${fg} on ${bg} = ${ratio.toFixed(2)}:1 (min ${min})`;
    console.log(`  ${mark}  ${label.padEnd(32)} ${DIM}${detail}${RESET}`);
    if (!pass) failed++;
  }
}

console.log(
  `\n${failed === 0 ? GREEN : RED}${failed === 0 ? "✓" : "✗"} ${total - failed}/${total} passed${RESET}\n`,
);

process.exit(failed === 0 ? 0 : 1);
