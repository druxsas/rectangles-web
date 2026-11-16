import { SceneCanvas } from "@/canvas/SceneCanvas";
import { CustomCursor } from "@/components/custom-cursor";
import { EditorialSections, ScrollProgress } from "@/components/editorial-sections";
import { LoadingReveal } from "@/components/loading-reveal";
import { LookArrows } from "@/components/look-arrows";
import { SiteNav } from "@/components/site-nav";
import { HideWhenShopping } from "@/components/store/HideWhenShopping";
import { ShoppingMode } from "@/components/store/ShoppingMode";

/**
 * Home — immersive 3D walkthrough of the Rectangle's store.
 *
 * Scroll drives a cinematic camera path through seven stops from the
 * brandbook §15 storyboard. Chrome layered on top: intro reveal, custom
 * cursor, nav with section jumps + theme toggle, scroll progress bar,
 * minimal DOM captions. Clicking the iMac zooms onto its display, where the
 * online store runs live (scenes/store/ImacStore + components/store).
 */
export default function Home() {
  return (
    <>
      <LoadingReveal />
      <CustomCursor />
      <ShoppingMode />
      <LookArrows />
      <HideWhenShopping>
        <ScrollProgress />
        <SiteNav />
      </HideWhenShopping>

      {/* 3D world — fills the viewport, drives the whole experience */}
      <SceneCanvas />

      {/* Minimal DOM overlay — seven scroll anchors with captions */}
      <HideWhenShopping className="relative z-10 pointer-events-none">
        <main>
          <EditorialSections />
        </main>
      </HideWhenShopping>


      <footer
        className="relative z-30 px-6 md:px-12 py-6 font-mono text-mono-sm uppercase tracking-wide flex items-center justify-between"
        style={{ background: "rgba(10,11,13,0.72)", color: "#565c62", backdropFilter: "blur(4px)" }}
      >
        <span>Rectangle&apos;s — fictional portfolio project by Daniel Rolón · V0.1</span>
        <a href="/styleguide" data-cursor="hover" className="underline-offset-4 hover:underline" style={{ color: "#f7f7f3" }}>
          Styleguide
        </a>
      </footer>
    </>
  );
}
