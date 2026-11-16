"use client";

import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useReachableStops, useScroll } from "@/stores/scroll";
import { useTravel } from "@/stores/travel";

/**
 * Minimal DOM overlay for the immersive walkthrough.
 *
 * Stacked 100vh anchors (one per reachable keyframe — the handoff joins
 * after the demo checkout) give Lenis something to
 * scroll and the camera rig its progress. Each anchor shows a small
 * caption with the keyframe's title + body that fades based on how
 * centered the camera is on that stop.
 */

const PAPER = "#f7f7f3";
const MUTED = "#8e9196";
const COBALT = "#165dfa";

export function EditorialSections() {
  const stop = useScroll((s) => s.stop);
  const total = useReachableStops();
  const travel = useTravel();
  const section = travel.active ? travel.to : Math.round(stop);

  return (
    <div className="relative w-full pointer-events-none">
      {KEYFRAMES.slice(0, total).map((k, i) => {
        // 1 when the camera sits on this stop, 0 half a stop away.
        // During a direct jump only the origin and destination captions show.
        const skipped = travel.active && i !== travel.to && i !== Math.round(travel.from);
        const closeness = skipped ? 0 : Math.max(0, 1 - Math.abs(stop - i) * 2);
        const active = i === section;

        return (
          <section
            key={k.id}
            id={`section-${k.id}`}
            aria-current={active ? "step" : undefined}
            className="relative h-screen w-full flex items-end md:items-center"
          >
            <div
              className="max-w-xl mx-6 md:mx-12 mb-14 md:mb-0 transition-opacity duration-500 ease-out"
              style={{
                opacity: closeness * 0.35 + (active ? 0.65 : 0),
                transform: `translateY(${(1 - closeness) * 8}px)`,
              }}
            >
              <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
                {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} ·{" "}
                <span style={{ color: COBALT }}>{k.id}</span>
              </p>
              <h2
                className="font-display font-black uppercase leading-[0.9] tracking-tight text-5xl md:text-7xl mt-2"
                style={{ color: PAPER, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
              >
                {k.title}
              </h2>
              <p className="mt-3 text-body-md max-w-md" style={{ color: "#c8cacf" }}>
                {k.body}
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Progress bar pinned to the top. */
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
        style={{ transform: `scaleX(${progress})`, background: COBALT }}
      />
    </div>
  );
}
