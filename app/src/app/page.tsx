import { CheckoutOverlay } from "@/components/checkout-overlay";
import { CustomCursor } from "@/components/custom-cursor";
import { EditorialSections, ScrollProgress } from "@/components/editorial-sections";
import { GridOverlay } from "@/components/grid-overlay";
import { LoadingReveal } from "@/components/loading-reveal";
import { SiteNav } from "@/components/site-nav";

/**
 * Home — editorial posters driven by massive typography + per-section
 * R3F heroes. Each section is a full-bleed composition in the brandbook's
 * voice; marquee bands of brand mantras stitch them together. Basement-
 * inspired chrome: custom cursor, intro reveal, subtle grid overlay.
 */
export default function Home() {
  return (
    <>
      <LoadingReveal />
      <CustomCursor />
      <GridOverlay />
      <ScrollProgress />
      <SiteNav />

      <main className="relative z-10">
        <EditorialSections />
      </main>

      <CheckoutOverlay />

      <footer
        className="px-6 md:px-12 py-10 font-mono text-mono-sm uppercase tracking-wide flex items-center justify-between"
        style={{ background: "#0a0b0d", color: "#565c62" }}
      >
        <span>Rectangle&apos;s — fictional portfolio project by Daniel Rolón · V0.1</span>
        <a
          href="/styleguide"
          data-cursor="hover"
          className="underline-offset-4 hover:underline"
          style={{ color: "#f7f7f3" }}
        >
          Styleguide
        </a>
      </footer>
    </>
  );
}
