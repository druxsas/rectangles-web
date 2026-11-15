import { SceneCanvas } from "@/canvas/SceneCanvas";
import { ScrollProgress, ScrollSections } from "@/components/scroll-sections";

export default function Home() {
  return (
    <>
      {/* 3D world sits behind everything */}
      <SceneCanvas />

      {/* Fixed way-finder */}
      <ScrollProgress />

      {/* Persistent header — wordmark only. The home experience is cinematic
          and theme-independent; the theme toggle lives on /styleguide where
          UI chrome actually benefits from it. */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-12 py-4 pointer-events-none">
        <span className="font-display text-heading-md font-black uppercase tracking-tight text-paper pointer-events-auto">
          Rectangle&apos;s
        </span>
        <span className="font-mono text-mono-sm uppercase hidden sm:inline" style={{ color: "#8e9196" }}>
          V0.1 · MVP
        </span>
      </header>

      {/* Scroll driver — seven 100vh slots, one per camera keyframe */}
      <main className="relative z-10 pointer-events-none">
        <ScrollSections />
      </main>

      {/* Final hint */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 font-mono text-mono-sm uppercase pointer-events-none" style={{ color: "#8e9196" }}>
        Scroll to walk through
      </footer>
    </>
  );
}
