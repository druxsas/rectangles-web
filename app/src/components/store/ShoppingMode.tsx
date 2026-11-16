"use client";

import { useEffect } from "react";
import { useCheckout } from "@/stores/checkout";

/**
 * Global side-effects of "shopping on the iMac":
 *  - flags <html data-shopping> (chrome fading lives in HideWhenShopping);
 *  - Esc leaves the store and returns the camera to the space.
 */
export function ShoppingMode() {
  const isOpen = useCheckout((s) => s.isOpen);
  const close = useCheckout((s) => s.close);

  useEffect(() => {
    const root = document.documentElement;
    if (isOpen) root.dataset.shopping = "";
    else delete root.dataset.shopping;
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return null;
}
