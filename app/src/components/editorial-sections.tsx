"use client";

import { Suspense, type ReactNode } from "react";
import { HeroCanvas } from "@/hero/HeroCanvas";
import { GamesScene } from "@/hero/scenes/Games";
import { MusicScene } from "@/hero/scenes/Music";
import { RetroScene } from "@/hero/scenes/Retro";
import { ShopScene } from "@/hero/scenes/Shop";
import { SkateScene } from "@/hero/scenes/Skate";
import { WordmarkScene } from "@/hero/scenes/Wordmark";
import { Marquee } from "@/components/marquee";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";

/**
 * Editorial home — basement-inspired, brandbook-aligned.
 *
 * Every section is a full-bleed poster: an enormous display number acts
 * as the backdrop, the collection name sits on top of it, the 3D hero
 * floats over both, and the metadata is corner-pinned. Marquee bands of
 * brand mantras break the sections. Shop section is full cobalt.
 */

const INK = "#0a0b0d";
const PAPER = "#f7f7f3";
const COBALT = "#165dfa";

// ---------- Hero -----------------------------------------------------------

function HeroSection() {
  const open = useCheckout((s) => s.open);
  return (
    <section
      id="section-hero"
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: INK, color: PAPER }}
    >
      {/* Corner metadata */}
      <div className="absolute top-24 left-6 md:left-12 right-6 md:right-12 flex items-start justify-between gap-6 z-10">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: "#565c62" }}>
          R / V0.1 · 2026
        </p>
        <p className="hidden md:block font-mono text-mono-sm uppercase tracking-wide max-w-xs text-right" style={{ color: "#565c62" }}>
          Independent cultural store · Skate · Music · Games · Retro
        </p>
      </div>

      {/* Massive extruded 3D wordmark — the whole frame is the hero */}
      <div className="absolute inset-0 top-0">
        <Suspense fallback={null}>
          <HeroCanvas cameraPos={[0, 0, 7.5]} cameraFov={32} bloom={1.1}>
            <WordmarkScene />
          </HeroCanvas>
        </Suspense>
      </div>

      {/* Bottom caption + CTA pinned over the canvas */}
      <div className="relative mt-auto z-10 px-6 md:px-12 pb-10">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="font-mono text-mono-sm uppercase tracking-wide mb-2" style={{ color: "#8e9196" }}>
              Cultures that connect
            </p>
            <p className="font-display font-black uppercase leading-[0.9] tracking-tight text-4xl md:text-5xl max-w-xl">
              Skate. Music. Games.<br />
              Retro <span style={{ color: COBALT }}>computing.</span>
            </p>
          </div>
          <button
            type="button"
            data-cursor="hover"
            onClick={open}
            className="inline-flex items-center justify-center min-h-[60px] px-10 font-display font-black uppercase tracking-wide text-body-md shrink-0"
            style={{ background: PAPER, color: INK }}
          >
            Enter the shop →
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------- Collection poster section --------------------------------------

type PosterProps = {
  id: string;
  number: string;      // "01"
  title: string;       // "SKATE"
  tagline: string;     // short
  caption: string;     // mantra
  accent?: string;     // overrides cobalt
  scene: ReactNode;    // the HeroCanvas with its scene
};

function CollectionPoster({ id, number, title, tagline, caption, accent = COBALT, scene }: PosterProps) {
  return (
    <section
      id={`section-${id}`}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: INK, color: PAPER }}
    >
      {/* Giant backdrop number — fills the viewport, sits behind everything */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[2vh] font-display font-black uppercase leading-none tracking-tight select-none pointer-events-none text-center"
        style={{ color: "#141618", fontSize: "min(70vh, 48vw)" }}
      >
        {number}
      </div>

      {/* 3D hero — positioned on the right, overlapping the number */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[65%] opacity-[0.98] pointer-events-auto">
        <Suspense fallback={null}>{scene}</Suspense>
      </div>

      {/* Top corners metadata */}
      <div className="absolute top-24 left-6 md:left-12 right-6 md:right-12 flex items-start justify-between z-10 pointer-events-none">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: "#8e9196" }}>
          R / {number} · Collection
        </p>
        <div
          className="inline-flex items-center justify-center px-2.5 py-1 font-display font-black uppercase text-body-sm tracking-tight"
          style={{ background: PAPER, color: INK }}
        >
          Rectangle&apos;s
        </div>
      </div>

      {/* Collection name — pinned bottom-left, monstrous */}
      <div className="absolute bottom-24 md:bottom-28 left-6 md:left-12 z-10 pointer-events-none">
        <h2
          className="font-display font-black uppercase leading-[0.85] tracking-tight"
          style={{
            color: PAPER,
            fontSize: "min(30vh, 22vw)",
            textShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {title}
          <span style={{ color: accent }}>.</span>
        </h2>
        <p className="mt-2 max-w-md font-mono text-mono-sm uppercase tracking-wide" style={{ color: "#8e9196" }}>
          {tagline}
        </p>
      </div>

      {/* Bottom caption bar */}
      <div
        className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-6 md:px-12 py-3 font-mono text-mono-sm uppercase tracking-wide pointer-events-none"
        style={{ background: "rgba(10,11,13,0.72)", borderTop: "1px solid rgba(214,216,213,0.1)", color: "#8e9196" }}
      >
        <span style={{ color: PAPER }}>{caption}</span>
        <span>{title.toLowerCase()}.rectangles.store</span>
      </div>
    </section>
  );
}

// ---------- Shop ----------------------------------------------------------

function ShopSection() {
  const open = useCheckout((s) => s.open);
  return (
    <section
      id="section-shop"
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: COBALT, color: PAPER }}
    >
      {/* 3D bag on the right */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[55%]">
        <Suspense fallback={null}>
          <HeroCanvas cameraPos={[2.5, 1.5, 3.5]} cameraFov={38} bloom={0.6}>
            <ShopScene />
          </HeroCanvas>
        </Suspense>
      </div>

      {/* Top row */}
      <div className="absolute top-24 left-6 md:left-12 right-6 md:right-12 flex items-start justify-between z-10 pointer-events-none">
        <p className="font-mono text-mono-sm uppercase tracking-wide">R / Shop · Demo</p>
        <div
          className="inline-flex items-center justify-center px-2.5 py-1 font-display font-black uppercase text-body-sm tracking-tight"
          style={{ background: PAPER, color: COBALT }}
        >
          Rectangle&apos;s
        </div>
      </div>

      {/* Massive CTA type */}
      <div className="absolute bottom-24 md:bottom-28 left-6 md:left-12 z-10">
        <h2
          className="font-display font-black uppercase leading-[0.85] tracking-tight"
          style={{ color: PAPER, fontSize: "min(28vh, 20vw)" }}
        >
          Pick<br />
          your bag.
        </h2>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <button
            type="button"
            data-cursor="hover"
            onClick={open}
            className="inline-flex items-center justify-center min-h-[60px] px-10 font-display font-black uppercase tracking-wide text-body-md shrink-0"
            style={{ background: INK, color: PAPER }}
          >
            Open demo checkout →
          </button>
          <p className="font-mono text-mono-sm uppercase tracking-wide max-w-xs">
            Browse → add → confirm. The vendor hands you the bag. No real card is ever requested.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------- Compose the page ----------------------------------------------

export function EditorialSections() {
  return (
    <div className="relative">
      <HeroSection />

      <Marquee
        items={[
          "Cultures that connect",
          "Collect. Ride. Repeat",
          "Play. Listen. Ride",
          "One more game",
          "Old hardware. New connections",
        ]}
        speed={45}
      />

      <CollectionPoster
        id="skate"
        number="01"
        title="Skate"
        tagline="Decks, trucks, wheels, bearings — ready to ride out of the shop."
        caption="Collect. Ride. Repeat."
        scene={
          <HeroCanvas cameraPos={[2, 1, 3.5]} cameraFov={42} background={INK}>
            <SkateScene />
          </HeroCanvas>
        }
      />

      <Marquee
        items={["Records · Sound · People", "A brighter tomorrow", "Longer sessions. Bigger ideas"]}
        speed={52}
        reverse
        variant="paper"
      />

      <CollectionPoster
        id="music"
        number="02"
        title="Music"
        tagline="Rectangle's Sessions on vinyl. Floor speakers, formats, grooves."
        caption="Listen closely."
        scene={
          <HeroCanvas cameraPos={[1, 1.5, 3.5]} cameraFov={40} background={INK}>
            <MusicScene />
          </HeroCanvas>
        }
      />

      <Marquee
        items={["Night Shift · a game about persistence", "Games · people · play longer", "Same machines. New people"]}
        speed={48}
      />

      <CollectionPoster
        id="games"
        number="03"
        title="Games"
        tagline="Arcade, consoles, cartridges. Night Shift running at the back cabinet."
        caption="One more game."
        scene={
          <HeroCanvas cameraPos={[1.8, 0.8, 3.5]} cameraFov={40} background={INK}>
            <GamesScene />
          </HeroCanvas>
        }
      />

      <Marquee
        items={["Old hardware. New connections", "Desktop culture", "Computers connect people"]}
        speed={55}
        reverse
        variant="cobalt"
      />

      <CollectionPoster
        id="retro"
        number="04"
        title="Retro"
        tagline="Desktop culture. Click the iMac to boot the shop."
        caption="Click to shop."
        scene={
          <HeroCanvas cameraPos={[2, 1.4, 3]} cameraFov={38} background={INK}>
            <RetroScene />
          </HeroCanvas>
        }
      />

      <ShopSection />
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
