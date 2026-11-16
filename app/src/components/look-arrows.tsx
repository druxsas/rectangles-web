"use client";

import { useEffect, useState } from "react";
import { isInside, useLook } from "@/canvas/lookAround";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";

/**
 * Desktop-only edge arrows that turn the view left/right inside the store,
 * revealing what sits far to the sides of a stop (arcades, music wall…).
 * Also bound to the ← / → keys. Vertical scroll is untouched.
 */
export function LookArrows() {
  const [desktop, setDesktop] = useState(false);
  const inside = useScroll((s) => isInside(s.stop));
  const shopping = useCheckout((s) => s.isOpen);
  const step = useLook((s) => s.step);
  const left = useLook((s) => s.left);
  const right = useLook((s) => s.right);
  const visible = desktop && inside && !shopping;

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setDesktop(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") left();
      if (e.key === "ArrowRight") right();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, left, right]);

  if (!desktop) return null;

  const arrow = (dir: "left" | "right", enabled: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      data-cursor="hover"
      aria-label={dir === "left" ? "Look left" : "Look right"}
      tabIndex={visible && enabled ? 0 : -1}
      className="look-arrow fixed z-20 flex items-center justify-center"
      style={{
        top: "62%",
        [dir]: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        border: "1.5px solid rgba(247,247,243,0.55)",
        background: "rgba(10,11,13,0.45)",
        backdropFilter: "blur(4px)",
        color: "#f7f7f3",
        opacity: visible && enabled ? 1 : 0,
        pointerEvents: visible && enabled ? "auto" : "none",
        transition: "opacity 260ms ease, transform 160ms ease, border-color 160ms ease",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dir === "left" ? <path d="M15 5 8 12l7 7" /> : <path d="m9 5 7 7-7 7" />}
      </svg>
    </button>
  );

  return (
    <>
      {arrow("left", step < 1, left)}
      {arrow("right", step > -1, right)}
      <style>{`.look-arrow:hover{transform:scale(1.08);border-color:#165dfa}`}</style>
    </>
  );
}
