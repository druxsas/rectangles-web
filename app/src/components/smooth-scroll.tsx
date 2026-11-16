"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { SECTION_COUNT } from "@/scenes/store/keyframes";
import { useScroll } from "@/stores/scroll";

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
 * progress i / (SECTION_COUNT - 1) — so the camera settles on the framing.
 * Under reduced motion it cuts straight to the stop.
 */
export function scrollToSection(index: number) {
  const doc = document.documentElement;
  const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
  const target = (max * index) / (SECTION_COUNT - 1);

  if (!lenisInstance) {
    window.scrollTo({ top: target, behavior: "auto" });
    return;
  }
  const from = useScroll.getState().progress * (SECTION_COUNT - 1);
  const distance = Math.abs(index - from); // in stops
  const duration = Math.min(1.6 + distance * 0.9, 5);
  lenisInstance.scrollTo(target, { duration, easing: easeInOutCubic });
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
    const setProgress = useScroll.getState().setProgress;

    const emit = () => {
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(window.scrollY / max, 0), 1);
      const section = Math.min(
        SECTION_COUNT - 1,
        Math.floor(p * SECTION_COUNT * 0.999),
      );
      setProgress(p, section);
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

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    emit();

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
