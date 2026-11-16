"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor (desktop only).
 *
 *  - Free: a small cobalt square that follows the mouse (difference blend,
 *    so it inverts over any background).
 *  - Over something interactive (`a`, `button`, `[data-cursor="hover"]`): it
 *    morphs into that element's own shape — an outline that takes its size
 *    and corner radius (a circle around a hotspot ring, a pill around a
 *    button…) and leans slightly toward the pointer.
 *  - Elements too large to frame (full cards, big panels) get the previous
 *    behaviour: the square simply grows.
 *
 * Geometry is eased in a rAF loop and written straight to the node, so the
 * outline keeps tracking elements that move with the 3D scene.
 */

const BLUE = "#165dfa";
const FREE = 12;
const GROWN = 44;
/** Outline gap around the element, px. */
const PAD = 5;
/** Largest element the cursor will wrap, px. */
const MAX_W = 520;
const MAX_H = 320;
/** How far the outline leans toward the pointer (share of the offset from centre). */
const LEAN = 0.1;
/** Morph time constant, ms (≈95% settled after 3×). Time-based, so it is as quick at 30 fps as at 120. */
const TAU = 28;

export function CustomCursor() {
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = node.current;
    if (!el) return;

    const mouse = { x: -50, y: -50 };
    // Current eased box (centre + size + radius).
    const box = { x: -50, y: -50, w: FREE, h: FREE, r: 0 };
    let hovered: Element | null = null;
    let visible = false;
    let mode: "free" | "grown" | "shape" = "free";
    let raf = 0;
    let last = performance.now();

    const write = () => {
      el.style.width = `${box.w}px`;
      el.style.height = `${box.h}px`;
      el.style.borderRadius = `${box.r}px`;
      el.style.transform = `translate(${box.x - box.w / 2}px, ${box.y - box.h / 2}px)`;
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) {
        // First sighting: start at the pointer instead of flying in.
        box.x = mouse.x;
        box.y = mouse.y;
        visible = true;
        el.style.opacity = "1";
      }
      // The free square moves with the event itself, not on the next frame:
      // the 3D scene can run below the display rate and would make it trail.
      if (mode !== "shape") {
        box.x = mouse.x;
        box.y = mouse.y;
        write();
      }
    };
    const onOver = (e: MouseEvent) => {
      hovered = (e.target as HTMLElement | null)?.closest("a, button, [data-cursor='hover']") ?? null;
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const radiusOf = (target: Element, w: number, h: number) => {
      const raw = getComputedStyle(target).borderTopLeftRadius;
      const v = parseFloat(raw) || 0;
      const px = raw.endsWith("%") ? (v / 100) * Math.min(w, h) : v;
      return Math.min(px, Math.min(w, h) / 2);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const ease = 1 - Math.exp(-Math.min(now - last, 100) / TAU);
      last = now;
      if (hovered && !hovered.isConnected) hovered = null;

      let tx = mouse.x;
      let ty = mouse.y;
      let tw = FREE;
      let th = FREE;
      let tr = 0;
      let next: typeof mode = "free";

      if (hovered) {
        const r = hovered.getBoundingClientRect();
        if (r.width > 0 && r.width <= MAX_W && r.height <= MAX_H) {
          next = "shape";
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          tx = cx + (mouse.x - cx) * LEAN;
          ty = cy + (mouse.y - cy) * LEAN;
          tw = r.width + PAD * 2;
          th = r.height + PAD * 2;
          const base = radiusOf(hovered, r.width, r.height);
          // Keep circles circular and pills pill-shaped once padded.
          tr = base >= Math.min(r.width, r.height) / 2 - 0.5 ? Math.min(tw, th) / 2 : base + (base > 0 ? PAD : 2);
        } else {
          next = "grown";
          tw = th = GROWN;
        }
      }

      // The free square sticks to the pointer; shapes ease into place.
      const k = next === "shape" ? ease : 1;
      box.x += (tx - box.x) * k;
      box.y += (ty - box.y) * k;
      box.w += (tw - box.w) * ease;
      box.h += (th - box.h) * ease;
      box.r += (tr - box.r) * ease;

      if (next !== mode) {
        mode = next;
        const shape = mode === "shape";
        el.style.background = shape ? "rgba(22,93,250,0.08)" : BLUE;
        el.style.boxShadow = shape ? `inset 0 0 0 2px ${BLUE}` : "none";
        el.style.mixBlendMode = shape ? "normal" : "difference";
      }
      write();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={node}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[60] pointer-events-none hidden md:block"
      style={{
        width: FREE,
        height: FREE,
        background: BLUE,
        mixBlendMode: "difference",
        opacity: 0,
        // Fill/outline switch is instant: fading the solid fill while the box grows read as a flash.
        transition: "opacity 200ms ease",
        willChange: "transform, width, height",
      }}
    />
  );
}
