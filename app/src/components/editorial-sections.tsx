"use client";

import { Suspense } from "react";
import { HeroCanvas } from "@/hero/HeroCanvas";
import { GamesScene } from "@/hero/scenes/Games";
import { MusicScene } from "@/hero/scenes/Music";
import { RetroScene } from "@/hero/scenes/Retro";
import { ShopScene } from "@/hero/scenes/Shop";
import { SkateScene } from "@/hero/scenes/Skate";
import { WordmarkScene } from "@/hero/scenes/Wordmark";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";

/**
 * Editorial scroll — one section per brandbook collection. Each section
 * pairs a tight typographic layout with ONE dedicated R3F canvas hosting
 * a single 3D hero element (shared lighting + bloom stack).
 *
 * Not a diorama: every section is about one object and one idea.
 */

const INK = "#0a0b0d";
const PAPER = "#f7f7f3";
const MUTED = "#8e9196";
const COBALT = "#165dfa";

function CanvasFrame({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  return (
    <div
      className={`relative w-full ${fullBleed ? "h-[70vh] md:h-[80vh]" : "aspect-[5/4]"} overflow-hidden`}
      style={{ background: "#141618" }}
    >
      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-fg-muted font-mono text-mono-sm uppercase">Loading…</div>}>
        {children}
      </Suspense>
    </div>
  );
}

function HeroSection() {
  const open = useCheckout((s) => s.open);
  return (
    <section
      id="section-hero"
      className="relative min-h-screen flex flex-col justify-between px-6 md:px-16 pt-28 pb-10"
      style={{ background: INK, color: PAPER }}
    >
      {/* Metadata header */}
      <div className="flex items-start justify-between gap-6">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
          R / V0.1 · Fictional portfolio project
        </p>
        <p className="hidden md:block font-mono text-mono-sm uppercase tracking-wide max-w-xs text-right" style={{ color: MUTED }}>
          An independent cultural store — skate, music, games, retro computing. One shared identity, four ways to take part.
        </p>
      </div>

      {/* Hero canvas — extruded 3D wordmark fills the frame */}
      <div className="w-full h-[55vh] md:h-[62vh] my-6">
        <HeroCanvas cameraPos={[0, 0, 7.5]} cameraFov={32} bloom={1.1}>
          <WordmarkScene />
        </HeroCanvas>
      </div>

      {/* CTA row */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <p className="font-display font-black uppercase leading-none tracking-tight text-4xl md:text-6xl max-w-2xl">
          Cultures<br />
          that <span style={{ color: COBALT }}>connect.</span>
        </p>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center justify-center min-h-[56px] px-8 font-sans font-semibold uppercase tracking-wider text-body-md shrink-0"
          style={{ background: PAPER, color: INK }}
        >
          Enter the shop →
        </button>
      </div>
    </section>
  );
}

function CollectionSection({
  index,
  total,
  id,
  title,
  body,
  children,
  reverse = false,
}: {
  index: number;
  total: number;
  id: string;
  title: string;
  body: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section
      id={`section-${id}`}
      className="relative min-h-screen grid md:grid-cols-12 items-center gap-10 px-6 md:px-16 py-24"
      style={{ background: INK, color: PAPER }}
    >
      {/* Typographic column */}
      <div className={`md:col-span-5 ${reverse ? "md:col-start-8" : "md:col-start-1"} space-y-6 order-2 md:order-1`}>
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
          R / {String(index).padStart(2, "0")} · Collection {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h2 className="font-display font-black uppercase leading-[0.9] tracking-tight text-[14vw] md:text-[8vw]">
          {title}
        </h2>
        <p className="max-w-md text-body-md" style={{ color: "#c8cacf" }}>
          {body}
        </p>
      </div>

      {/* Hero canvas column */}
      <div className={`md:col-span-7 ${reverse ? "md:col-start-1" : "md:col-start-6"} order-1 md:order-2`}>
        <CanvasFrame>{children}</CanvasFrame>
      </div>
    </section>
  );
}

function ShopSection() {
  const open = useCheckout((s) => s.open);
  return (
    <section
      id="section-shop"
      className="relative min-h-screen grid md:grid-cols-12 items-center gap-10 px-6 md:px-16 py-24"
      style={{ background: INK, color: PAPER }}
    >
      <div className="md:col-span-5 md:col-start-1 space-y-6 order-2 md:order-1">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
          R / shop · demo
        </p>
        <h2 className="font-display font-black uppercase leading-[0.9] tracking-tight text-[14vw] md:text-[8vw]">
          Pick<br />your <span style={{ color: COBALT }}>bag.</span>
        </h2>
        <p className="max-w-md text-body-md" style={{ color: "#c8cacf" }}>
          Walk through the demo purchase: browse, add to the bag, confirm. The vendor hands you a Rectangle&apos;s bag over the counter. No real card is ever requested.
        </p>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center justify-center min-h-[56px] px-8 font-sans font-semibold uppercase tracking-wider text-body-md shrink-0"
          style={{ background: COBALT, color: PAPER }}
        >
          Open demo checkout
        </button>
      </div>
      <div className="md:col-span-7 md:col-start-6 order-1 md:order-2">
        <CanvasFrame>
          <HeroCanvas cameraPos={[2.5, 1.5, 3.5]} cameraFov={38}>
            <ShopScene />
          </HeroCanvas>
        </CanvasFrame>
      </div>
    </section>
  );
}

export function EditorialSections() {
  const collectionKeys = KEYFRAMES.filter((k) => k.collection);
  const total = collectionKeys.length;

  const stageFor = (id: string) => {
    if (id === "skate") return (
      <HeroCanvas cameraPos={[1.8, 1.4, 3.2]} cameraFov={42}>
        <SkateScene />
      </HeroCanvas>
    );
    if (id === "music") return (
      <HeroCanvas cameraPos={[0, 1.8, 3.2]} cameraFov={40}>
        <MusicScene />
      </HeroCanvas>
    );
    if (id === "games") return (
      <HeroCanvas cameraPos={[1.5, 0.6, 3.2]} cameraFov={40}>
        <GamesScene />
      </HeroCanvas>
    );
    if (id === "retro") return (
      <HeroCanvas cameraPos={[1.8, 1.4, 3]} cameraFov={38}>
        <RetroScene />
      </HeroCanvas>
    );
    return null;
  };

  let collectionIndex = 0;
  return (
    <div className="relative">
      {KEYFRAMES.map((k, i) => {
        if (k.id === "hero") return <HeroSection key={k.id} />;
        if (k.id === "shop") return <ShopSection key={k.id} />;
        collectionIndex++;
        return (
          <CollectionSection
            key={k.id}
            index={collectionIndex}
            total={total}
            id={k.id}
            title={k.title}
            body={k.body}
            reverse={collectionIndex % 2 === 0}
          >
            {stageFor(k.id)}
          </CollectionSection>
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
