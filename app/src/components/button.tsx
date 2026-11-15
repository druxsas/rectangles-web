import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const BASE =
  "inline-flex items-center justify-center font-sans font-semibold uppercase tracking-wide transition-[background-color,color,border-color] duration-[var(--duration-fast)] ease-[var(--easing-out)] disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-action-bg text-action-fg hover:bg-action-bg-hover active:bg-action-bg-pressed disabled:bg-action-bg-disabled disabled:text-action-fg-disabled",
  secondary:
    "bg-transparent text-fg border border-line-strong hover:bg-surface-muted disabled:text-fg-muted disabled:border-line",
  ghost:
    "bg-transparent text-fg hover:text-accent disabled:text-fg-muted",
};

const SIZES: Record<Size, string> = {
  md: "min-h-[44px] text-body-sm px-5 py-2.5 rounded-sm",
  sm: "min-h-[36px] text-mono-sm px-3 py-1.5 rounded-xs",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
