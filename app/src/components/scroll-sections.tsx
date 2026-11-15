"use client";

import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useScroll } from "@/stores/scroll";

/**
 * Seven stacked 100vh sections that give Lenis something to scroll and the
 * DOM overlay something to show. Each section matches one camera keyframe.
 *
 * The visual overlay card fades based on how close the current progress is
 * to this section's center — so copy breathes in and out as the camera moves.
 *
 * Text colors are hard-coded against the Paper/Muted scale instead of
 * theme-aware tokens because the home scene is always the dark store
 * interior; the overlay must stay readable regardless of the chrome theme.
 */
export function ScrollSections() {
  const section = useScroll((s) => s.section);
  const progress = useScroll((s) => s.progress);

  const total = KEYFRAMES.length;

  return (
    <div className="relative w-full pointer-events-none">
      {KEYFRAMES.map((kf, i) => {
        // How "centered" this section is in the current viewport (0..1).
        const sectionStart = i / total;
        const sectionEnd = (i + 1) / total;
        const sectionMid = (sectionStart + sectionEnd) / 2;
        const distance = Math.abs(progress - sectionMid);
        const halfSlot = 1 / total / 2;
        const closeness = Math.max(0, 1 - distance / halfSlot);
        const active = i === section;

        return (
          <section
            key={kf.id}
            id={`section-${kf.id}`}
            aria-current={active ? "step" : undefined}
            className="relative h-screen w-full flex items-end md:items-center"
          >
            <div
              className="max-w-xl mx-6 md:mx-12 mb-10 md:mb-0 transition-opacity duration-500 ease-out will-change-[opacity,transform]"
              style={{
                opacity: closeness * 0.35 + (active ? 0.65 : 0),
                transform: `translateY(${(1 - closeness) * 8}px)`,
              }}
            >
              <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: "#8e9196" }}>
                {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {kf.id}
              </p>
              <h2
                className="font-display font-black uppercase text-display-md md:text-display-lg tracking-tight leading-[0.9] mt-2"
                style={{ color: "#f7f7f3", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
              >
                {kf.title}
              </h2>
              <p className="mt-3 text-body-md max-w-md" style={{ color: "#c8cacf" }}>
                {kf.body}
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Progress bar pinned to the top — a tiny way-finder for the walkthrough. */
export function ScrollProgress() {
  const progress = useScroll((s) => s.progress);
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-40 pointer-events-none"
      style={{ background: "rgba(214, 216, 213, 0.15)" }}
    >
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${progress})`,
          background: "#165dfa",
        }}
      />
    </div>
  );
}
