"use client";

import { useTheme } from "@/components/theme-provider";
import type { ThemeMode } from "@/lib/theme";

const LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ICONS: Record<ThemeMode, string> = {
  light: "☀",
  dark: "☾",
  system: "◐",
};

/**
 * Three-state cycle button: System → Light → Dark → System.
 * Announces state to assistive tech via `aria-label`.
 */
export function ThemeToggle() {
  const { mode, cycle } = useTheme();
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[mode]}. Click to switch.`}
      className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] font-mono text-mono-sm uppercase border border-line hover:border-line-strong transition-[border-color,color,background] duration-[var(--duration-fast)] ease-[var(--easing-out)] text-fg-secondary hover:text-fg pointer-events-auto"
    >
      <span aria-hidden="true">{ICONS[mode]}</span>
      <span>{LABELS[mode]}</span>
    </button>
  );
}
