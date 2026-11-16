"use client";

import { useEffect, useState } from "react";

/**
 * Loading reveal — black overlay with the RECTANGLE'S wordmark that
 * exits upward after the initial paint. Runs once per session (sessionStorage).
 */
export function LoadingReveal() {
  const [open, setOpen] = useState(true);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("rectangles:intro-done") === "1") {
      setOpen(false);
      return;
    }
    const t1 = setTimeout(() => setExit(true), 900);
    const t2 = setTimeout(() => {
      setOpen(false);
      sessionStorage.setItem("rectangles:intro-done", "1");
    }, 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[70] pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
      style={{
        background: "#0a0b0d",
        transform: exit ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            className="font-display font-black uppercase leading-none tracking-tight"
            style={{ color: "#f7f7f3", fontSize: "min(18vw, 220px)" }}
          >
            Rectangle&apos;s
            <span style={{ color: "#165dfa" }}>.</span>
          </div>
          <div
            className="absolute bottom-0 left-0 h-[2px] origin-left"
            style={{
              width: "100%",
              background: "#165dfa",
              animation: "intro-bar 900ms cubic-bezier(0.76,0,0.24,1) forwards",
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes intro-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
