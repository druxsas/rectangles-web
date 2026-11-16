"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { SKELETON_PATHS, SKELETON_VERTICES, SKELETON_VIEWBOX } from "@/components/scene-skeleton.data";

/** Set by <SceneReady/> inside the canvas once the store has rendered. */
export const useSceneReady = create<{ ready: boolean; setReady: () => void }>((set) => ({
  ready: false,
  setReady: () => set({ ready: true }),
}));

/**
 * Polygon skeleton loader: the storefront as a wireframe mesh, projected
 * with the same camera as the first stop (scripts/generate-skeleton.mjs),
 * drawing itself in, then breathing, while the 3D assets load. It cross-fades
 * into the real render, which lands on the same lines.
 *
 * Pure SVG + CSS (~4 KB gzipped). Reduced motion: static lines, no pulse.
 */
export function SceneSkeleton() {
  const ready = useSceneReady((s) => s.ready);
  const progress = useProgress((s) => s.progress);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setGone(true), 900);
    return () => window.clearTimeout(t);
  }, [ready]);

  if (gone) return null;

  const layers: { key: keyof typeof SKELETON_PATHS; stroke: string; width: number; delay: number; dur: number }[] = [
    { key: "floor", stroke: "rgba(247,247,243,0.16)", width: 1, delay: 0, dur: 2.4 },
    { key: "interior", stroke: "rgba(247,247,243,0.22)", width: 1, delay: 0.5, dur: 2.2 },
    { key: "building", stroke: "rgba(247,247,243,0.5)", width: 1.4, delay: 0.2, dur: 1.8 },
    { key: "props", stroke: "rgba(247,247,243,0.38)", width: 1.2, delay: 0.9, dur: 1.8 },
    { key: "sign", stroke: "#165dfa", width: 1.8, delay: 0.6, dur: 1.4 },
  ];

  return (
    <div
      aria-hidden={ready}
      role={ready ? undefined : "status"}
      aria-label={ready ? undefined : "Loading the store"}
      className="scene-skeleton absolute inset-0 pointer-events-none"
      style={{ background: "#0a0b0d", opacity: ready ? 0 : 1, transition: "opacity 800ms ease" }}
    >
      <svg viewBox={SKELETON_VIEWBOX} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
        <g>
          {layers.map((l) => (
            <path
              key={l.key}
              className="sk-line"
              d={SKELETON_PATHS[l.key]}
              fill="none"
              stroke={l.stroke}
              strokeWidth={l.width}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              pathLength={1}
              style={{
                animation: `sk-draw ${l.dur}s cubic-bezier(0.65,0,0.35,1) ${l.delay}s forwards, sk-breathe 2.6s ease-in-out ${l.delay + l.dur}s infinite`,
              }}
            />
          ))}
          {SKELETON_VERTICES.map(([x, y], i) => (
            <circle key={i} className="sk-dot" cx={x} cy={y} r={2.2} fill="#f7f7f3" style={{ animationDelay: `${1.2 + (i % 17) * 0.11}s` }} />
          ))}
        </g>
      </svg>

      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-10 font-mono text-mono-sm uppercase tracking-wide flex items-center gap-3"
        style={{ color: "#8e9196" }}
      >
        <span>Building the store</span>
        <span style={{ display: "inline-block", width: 120, height: 2, background: "rgba(247,247,243,0.15)", position: "relative" }}>
          <span style={{ position: "absolute", inset: 0, width: `${Math.round(progress)}%`, background: "#165dfa", transition: "width 300ms ease" }} />
        </span>
        <span style={{ minWidth: 34, textAlign: "right" }}>{Math.round(progress)}%</span>
      </div>

      <style>{`
        .scene-skeleton .sk-line {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        .scene-skeleton .sk-dot { opacity: 0; animation: sk-dot 2.4s ease-in-out infinite; }
        @keyframes sk-draw { to { stroke-dashoffset: 0; } }
        @keyframes sk-dot { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.9; } }
        @keyframes sk-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @media (prefers-reduced-motion: reduce) {
          .scene-skeleton .sk-line { animation: none !important; stroke-dashoffset: 0; }
          .scene-skeleton .sk-dot { animation: none; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
