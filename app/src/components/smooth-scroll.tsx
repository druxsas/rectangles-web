"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { SECTION_COUNT } from "@/scenes/store/keyframes";
import { useScroll } from "@/stores/scroll";

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
    };
  }, []);

  return <>{children}</>;
}
