import { SceneCanvas } from "@/canvas/SceneCanvas";
import { CheckoutOverlay } from "@/components/checkout-overlay";
import { ScrollProgress, ScrollSections } from "@/components/scroll-sections";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <>
      {/* 3D world sits behind everything */}
      <SceneCanvas />

      {/* Fixed way-finder */}
      <ScrollProgress />

      {/* Persistent top navigation — basement-style strip */}
      <SiteNav />

      {/* Scroll driver — seven 100vh slots, one per camera keyframe */}
      <main className="relative z-10 pointer-events-none">
        <ScrollSections />
      </main>

      {/* Final hint */}
      <footer
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 font-mono text-mono-sm uppercase pointer-events-none"
        style={{ color: "#8e9196" }}
      >
        Scroll to walk through · click the iMac G3 to try checkout
      </footer>

      {/* Click-triggered demo checkout — never appears on the scroll path */}
      <CheckoutOverlay />
    </>
  );
}
