import { CheckoutOverlay } from "@/components/checkout-overlay";
import { EditorialSections, ScrollProgress } from "@/components/editorial-sections";
import { SiteNav } from "@/components/site-nav";

/**
 * Home — editorial scroll. One hero, four collection stages, a shop CTA.
 * The 3D store scene is parked (see scenes/store/) and will come back as
 * an optional accent in later iterations, not as the main experience.
 */
export default function Home() {
  return (
    <>
      <ScrollProgress />
      <SiteNav />

      <main className="relative z-10">
        <EditorialSections />
      </main>

      {/* The iMac G3 shop remains available via the nav CTAs */}
      <CheckoutOverlay />

      <footer
        className="px-6 md:px-16 py-10 font-mono text-mono-sm uppercase tracking-wide flex items-center justify-between"
        style={{ background: "#0a0b0d", color: "#565c62" }}
      >
        <span>Rectangle&apos;s — fictional portfolio project by Daniel Rolón · V0.1</span>
        <a href="/styleguide" className="underline-offset-4 hover:underline" style={{ color: "#f7f7f3" }}>
          Styleguide
        </a>
      </footer>
    </>
  );
}
