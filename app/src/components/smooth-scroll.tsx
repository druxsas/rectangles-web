"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { reachableStops, useScroll } from "@/stores/scroll";
import { useTravel } from "@/stores/travel";

/** The live Lenis instance (null before mount or under reduced motion). */
let lenisInstance: Lenis | null = null;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Freeze / release the walkthrough scroll (used while shopping on the iMac). */
export function setScrollLocked(locked: boolean) {
  if (lenisInstance) {
    if (locked) lenisInstance.stop();
    else lenisInstance.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/**
 * Glide to a walkthrough stop (brandbook §18 "Orient": soft acceleration,
 * duration adjusted to distance). Lands exactly on the stop's keyframe —
 * scroll position i / (stops − 1) — so the camera settles on the framing.
 * Under reduced motion it cuts straight to the stop.
 */
export function scrollToSection(index: number) {
  // The page can grow (the handoff section unlocks after checkout) —
  // make Lenis re-measure before computing the target.
  lenisInstance?.resize();
  const doc = document.documentElement;
  const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
  const last = reachableStops() - 1;
  const target = (max * Math.min(index, last)) / last;

  if (!lenisInstance) {
    window.scrollTo({ top: target, behavior: "auto" });
    return;
  }
  const from = useScroll.getState().stop;
  const to = Math.min(index, last);
  // Jumps of more than one stop fly straight to the target (no detour
  // through the stops in between); duration follows the real distance.
  const direct = Math.abs(to - from) > 1.05;
  const a = KEYFRAMES[Math.round(from)].position;
  const b = KEYFRAMES[to].position;
  const meters = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const duration = direct ? Math.min(Math.max(1.3 + meters * 0.12, 1.5), 3.2) : Math.min(1.6 + Math.abs(to - from) * 0.9, 5);
  if (direct) useTravel.getState().start(from, to);
  else useTravel.getState().end();
  lenisInstance.scrollTo(target, {
    duration,
    easing: easeInOutCubic,
    onComplete: () => useTravel.getState().end(),
  });
}

/**
 * Initializes Lenis smooth scroll and pipes scroll progress into the Zustand
 * `scroll` store. Also honors `prefers-reduced-motion`: when set, Lenis is
 * skipped and native scroll is used, but progress is still tracked.
 *
 * Mount once at the top of the app tree.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setScroll = useScroll.getState().setScroll;

    const emit = () => {
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(window.scrollY / max, 0), 1);
      setScroll(p, p * (reachableStops() - 1));
    };

    if (reduce) {
      window.addEventListener("scroll", emit, { passive: true });
      emit();
      return () => window.removeEventListener("scroll", emit);
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    lenis.on("scroll", emit);
    lenisInstance = lenis;

    // Any manual scroll input cancels a direct flight (the camera then
    // eases back onto the regular path from wherever it is).
    const cancelTravel = () => {
      if (useTravel.getState().active) useTravel.getState().end();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) cancelTravel();
    };
    window.addEventListener("wheel", cancelTravel, { passive: true });
    window.addEventListener("touchstart", cancelTravel, { passive: true });
    window.addEventListener("keydown", onKey);

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    emit();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", cancelTravel);
      window.removeEventListener("touchstart", cancelTravel);
      window.removeEventListener("keydown", onKey);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
