"use client";

import { useEffect, useState } from "react";
import { scrollToSection } from "@/components/smooth-scroll";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { HIDDEN_IN_MENU, useScroll } from "@/stores/scroll";
import { useTravel } from "@/stores/travel";

/**
 * Persistent top navigation — basement-studio-style strip.
 *
 * - Left: logo (back to the facade).
 * - Desktop: section jumps that glide (via Lenis) to the matching stop.
 * - Mobile: the same items inside a hamburger menu (full-screen sheet).
 * - Right: version tag.
 *
 * The bag handoff is never a menu item — it's reached by completing the
 * demo checkout on the iMac.
 *
 * The scene underneath is always dark; the nav picks its colors from the
 * overlay palette (Paper/Muted), not the theme tokens, so it stays readable.
 */

const ITEMS = KEYFRAMES.map((kf, i) => ({ ...kf, index: i })).filter((kf) => !HIDDEN_IN_MENU.has(kf.id));

export function SiteNav() {
  const stopNow = useScroll((s) => Math.round(s.stop));
  const travel = useTravel();
  // While flying straight to a stop, highlight the destination.
  const section = travel.active ? travel.to : stopNow;
  const [open, setOpen] = useState(false);

  const go = (i: number) => {
    setOpen(false);
    scrollToSection(i);
  };

  // Close the sheet with Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav aria-label="Primary" className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div
        className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur-sm"
        style={{ background: "linear-gradient(180deg, rgba(10,11,13,0.72) 0%, rgba(10,11,13,0) 100%)" }}
      >
        {/* Logo */}
        <a
          href="#section-facade"
          onClick={(e) => {
            e.preventDefault();
            go(0);
          }}
          aria-label="Rectangle's — back to the facade"
          className="pointer-events-auto block relative z-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/horizontal-white.svg" alt="Rectangle's" style={{ height: 22, width: "auto", display: "block" }} />
        </a>

        {/* Desktop: section jumps */}
        <ol className="hidden md:flex items-center gap-1 pointer-events-auto font-mono text-mono-sm uppercase">
          {ITEMS.map((kf, n) => {
            const active = kf.index === section;
            return (
              <li key={kf.id}>
                <button
                  type="button"
                  onClick={() => go(kf.index)}
                  aria-current={active ? "step" : undefined}
                  className="px-2.5 py-1.5 tracking-wide transition-opacity"
                  style={{ color: active ? "#f7f7f3" : "#8e9196", opacity: active ? 1 : 0.85 }}
                >
                  <span style={{ color: active ? "#165dfa" : "#565c62" }}>{String(n + 1).padStart(2, "0")}</span>
                  <span className="ml-1.5">{kf.id}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Right cluster */}
        <div className="flex items-center gap-4 pointer-events-auto relative z-10">
          <span className="font-mono text-mono-sm uppercase hidden sm:inline" style={{ color: "#565c62" }}>
            V0.1
          </span>
          {/* Mobile: hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center gap-[6px]"
            style={{ width: 44, height: 44 }}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: 24,
                  height: 2,
                  background: "#f7f7f3",
                  transition: "transform 220ms ease, opacity 160ms ease",
                  transform: open ? (i === 0 ? "translateY(8px) rotate(45deg)" : i === 2 ? "translateY(-8px) rotate(-45deg)" : "none") : "none",
                  opacity: open && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile: menu sheet */}
      <div
        id="mobile-menu"
        className="md:hidden fixed inset-0 flex flex-col justify-center px-8"
        aria-hidden={!open}
        style={{
          background: "rgba(10,11,13,0.96)",
          backdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 260ms ease",
        }}
      >
        <ol className="flex flex-col gap-2">
          {ITEMS.map((kf, n) => {
            const active = kf.index === section;
            return (
              <li key={kf.id}>
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => go(kf.index)}
                  aria-current={active ? "step" : undefined}
                  className="flex items-baseline gap-4 w-full text-left py-1"
                >
                  <span className="font-mono text-mono-sm" style={{ color: active ? "#165dfa" : "#565c62" }}>
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-display uppercase leading-[0.95]"
                    style={{ fontSize: 44, color: active ? "#f7f7f3" : "#8e9196" }}
                  >
                    {kf.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="font-mono text-mono-sm uppercase mt-10" style={{ color: "#565c62" }}>
          Rectangle&apos;s · V0.1
        </p>
      </div>
    </nav>
  );
}
