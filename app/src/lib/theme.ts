/**
 * Theme utilities for Rectangle's.
 *
 * Mode `"system"` follows the OS `prefers-color-scheme`.
 * Modes `"light"` / `"dark"` override the OS preference.
 * Persistence is in `localStorage` under STORAGE_KEY.
 *
 * The CSS cascade in `tokens.generated.css` handles the rest:
 *   - `:root`                                              → light defaults
 *   - `[data-theme="dark"]`                                → forced dark
 *   - `@media (prefers-color-scheme: dark) [data-theme="system"]` → system-dark
 */

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const DEFAULT_THEME: ThemeMode = "system";
export const STORAGE_KEY = "rectangles:theme";

/**
 * Inline script that runs before React hydrates. It reads the stored theme
 * and stamps `data-theme` on <html> to avoid flash-of-unstyled-content.
 *
 * Returned as a string so it can be injected via `dangerouslySetInnerHTML`.
 * Keep it as compact as possible — it blocks rendering.
 */
export const themeInitScript = `
(function(){try{
  var k="${STORAGE_KEY}";
  var m=localStorage.getItem(k);
  var ok=m==="light"||m==="dark"||m==="system";
  document.documentElement.setAttribute("data-theme", ok?m:"${DEFAULT_THEME}");
}catch(_){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}");}})();
`.trim();
