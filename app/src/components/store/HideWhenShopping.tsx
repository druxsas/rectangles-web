"use client";

import type { ReactNode } from "react";
import { useCheckout } from "@/stores/checkout";

/** Fades walkthrough chrome out while the visitor is shopping on the iMac. */
export function HideWhenShopping({ children, className }: { children: ReactNode; className?: string }) {
  const isOpen = useCheckout((s) => s.isOpen);
  return (
    <div
      className={className}
      aria-hidden={isOpen || undefined}
      style={{ opacity: isOpen ? 0 : 1, transition: "opacity 320ms ease", pointerEvents: isOpen ? "none" : undefined }}
    >
      {children}
    </div>
  );
}
