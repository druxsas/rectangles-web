"use client";

/**
 * Horizontal ticker — basement-style band of brand mantras that scrolls
 * forever. Pauses on hover. Repeats content twice so the loop seams.
 */
import { useEffect, useRef } from "react";

export function Marquee({
  items,
  speed = 40,
  reverse = false,
  variant = "ink",
}: {
  items: string[];
  /** seconds for one full loop */
  speed?: number;
  reverse?: boolean;
  variant?: "ink" | "cobalt" | "paper";
}) {
  const bg =
    variant === "cobalt" ? "#165dfa" :
    variant === "paper"  ? "#f7f7f3" :
    "#0a0b0d";
  const fg = variant === "paper" ? "#0a0b0d" : "#f7f7f3";
  const border = variant === "paper" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";

  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!track.current) return;
    track.current.style.animationDuration = `${speed}s`;
  }, [speed]);

  const content = (
    <>
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-10 px-10 font-display font-black uppercase tracking-tight text-[8vw] md:text-[6vw] leading-none"
        >
          <span>{item}</span>
          <span aria-hidden="true" style={{ color: "#165dfa" }}>
            ×
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      style={{ background: bg, color: fg, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}
    >
      <div
        ref={track}
        className={`inline-flex whitespace-nowrap will-change-transform py-4 ${reverse ? "marquee-reverse" : "marquee-forward"}`}
      >
        {content}
        {content}
      </div>
      <style jsx>{`
        .marquee-forward {
          animation: marquee-x linear infinite;
        }
        .marquee-reverse {
          animation: marquee-x-reverse linear infinite;
        }
        @keyframes marquee-x {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-x-reverse {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-forward, .marquee-reverse { animation: none; }
        }
      `}</style>
    </div>
  );
}
