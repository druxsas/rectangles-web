"use client";

import type { ReactNode } from "react";
import { useCheckout } from "@/stores/checkout";
import { useArcade } from "@/stores/arcade";
import { useListening } from "@/stores/listening";

/** Fades walkthrough chrome out while the visitor is shopping on the iMac, listening at the turntable or playing at a cabinet. */
export function HideWhenShopping({ children, className }: { children: ReactNode; className?: string }) {
  const shopping = useCheckout((s) => s.isOpen);
  const listening = useListening((s) => s.isOpen);
  const playing = useArcade((s) => s.cabinet !== null);
  const isOpen = shopping || listening || playing;
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
