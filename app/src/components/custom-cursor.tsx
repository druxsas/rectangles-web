"use client";

import { useEffect, useState } from "react";

/**
 * Small square cursor that follows the mouse. Grows and flips color when
 * hovering anything with `data-cursor="hover"`. Uses mix-blend-difference
 * so it inverts over any background. Hidden on touch devices.
 */
export function CustomCursor() {
  const [pos, setPos] = useState({ x: -50, y: -50 });
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const hovered = target?.closest("a, button, [data-cursor='hover']");
      setActive(!!hovered);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const size = active ? 44 : 12;
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[60] pointer-events-none transition-[width,height,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hidden md:block"
      style={{
        width: size,
        height: size,
        transform: `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`,
        background: "#165dfa",
        mixBlendMode: "difference",
        opacity: visible ? 1 : 0,
        willChange: "transform",
      }}
    />
  );
}
