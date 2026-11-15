import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "error" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-muted text-fg border-line",
  accent:  "bg-accent-muted text-accent-emphasis border-transparent",
  success: "bg-success-bg text-success border-transparent",
  warning: "bg-warning-bg text-warning border-transparent",
  error:   "bg-error-bg text-error border-transparent",
  info:    "bg-info-bg text-info border-transparent",
};

export function Chip({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-xs font-mono text-mono-sm uppercase tracking-wide ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
