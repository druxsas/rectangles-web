"use client";

import { KEYFRAMES } from "@/scenes/store/keyframes";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScroll } from "@/stores/scroll";

/**
 * Persistent top navigation — basement-studio-style strip.
 *
 * - Left: wordmark that doubles as "go to top".
 * - Center: section jumps that scroll to the matching keyframe anchor.
 *   Current section is highlighted via `useScroll` state.
 * - Right: version tag + theme toggle.
 *
 * The scene underneath is always dark; the nav picks its colors from the
 * overlay palette (Paper/Muted), not the theme tokens, so it stays readable.
 */
export function SiteNav() {
  const section = useScroll((s) => s.section);

  const goToSection = (i: number) => {
    const el = document.getElementById(`section-${KEYFRAMES[i].id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
    >
      <div
        className="flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur-sm"
        style={{
          background: "linear-gradient(180deg, rgba(10,11,13,0.72) 0%, rgba(10,11,13,0) 100%)",
        }}
      >
        {/* Wordmark */}
        <a
          href="#section-facade"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="font-display text-heading-md font-black uppercase tracking-tight pointer-events-auto"
          style={{ color: "#f7f7f3" }}
        >
          Rectangle&apos;s<span style={{ color: "#165dfa" }}>.</span>
        </a>

        {/* Section jumps (hidden on small screens) */}
        <ol className="hidden md:flex items-center gap-1 pointer-events-auto font-mono text-mono-sm uppercase">
          {KEYFRAMES.map((kf, i) => {
            const active = i === section;
            return (
              <li key={kf.id}>
                <button
                  type="button"
                  onClick={() => goToSection(i)}
                  aria-current={active ? "step" : undefined}
                  className="px-2.5 py-1.5 tracking-wide transition-opacity"
                  style={{
                    color: active ? "#f7f7f3" : "#8e9196",
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  <span style={{ color: active ? "#165dfa" : "#565c62" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ml-1.5">{kf.id}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Right cluster */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <span className="font-mono text-mono-sm uppercase hidden sm:inline" style={{ color: "#565c62" }}>
            V0.1
          </span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
