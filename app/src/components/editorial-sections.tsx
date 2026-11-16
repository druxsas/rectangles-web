"use client";

import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";

/**
 * Editorial scroll — the home page as a sequence of bold typographic
 * sections, one per brandbook collection. Deliberately non-3D: the
 * brand (Rectangle's → rectangles, typography, cobalt accent) is carried
 * by the layout and type system we already built.
 */

const INK = "#0a0b0d";
const PAPER = "#f7f7f3";
const MUTED = "#8e9196";
const COBALT = "#165dfa";

function HeroSection() {
  const open = useCheckout((s) => s.open);
  return (
    <section
      id="section-hero"
      className="relative min-h-screen flex flex-col justify-end px-6 md:px-16 pt-32 pb-16"
      style={{ background: INK, color: PAPER }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[42vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,188,122,0.18), transparent 70%)",
        }}
      />
      <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
        R / V0.1 · Fictional portfolio project
      </p>
      <h1 className="mt-4 font-display font-black uppercase leading-[0.85] tracking-tight text-[14vw] md:text-[10.5vw]">
        Cultures<br />
        that <span style={{ color: COBALT }}>connect.</span>
      </h1>
      <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 max-w-5xl">
        <p className="text-body-lg md:text-body-xl max-w-xl" style={{ color: "#c8cacf" }}>
          An independent cultural store. Skate, music, video games, and retro computing — one
          shared identity, four ways to take part.
        </p>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center justify-center min-h-[56px] px-8 font-sans font-semibold uppercase tracking-wider text-body-md shrink-0 pointer-events-auto"
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
  k,
}: {
  index: number;
  total: number;
  k: (typeof KEYFRAMES)[number];
}) {
  // Each collection uses the same layout but swaps hero art + accent panel.
  const bg = index % 2 === 0 ? INK : "#0d0e11";

  return (
    <section
      id={`section-${k.id}`}
      className="relative min-h-screen grid md:grid-cols-12 items-center gap-8 px-6 md:px-16 py-24"
      style={{ background: bg, color: PAPER }}
    >
      {/* Left column: metadata + copy */}
      <div className="md:col-span-5 md:col-start-1 space-y-6">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
          R / {String(index).padStart(2, "0")} · Collection{" "}
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h2 className="font-display font-black uppercase leading-[0.9] tracking-tight text-[14vw] md:text-[8vw]">
          {k.title}
        </h2>
        <p className="max-w-md text-body-md" style={{ color: "#c8cacf" }}>
          {k.body}
        </p>
      </div>

      {/* Right column: collection "stage" — bold geometric composition */}
      <div className="md:col-span-7 md:col-start-6">
        <CollectionStage collection={k.collection ?? "skate"} />
      </div>
    </section>
  );
}

function CollectionStage({ collection }: { collection: "skate" | "music" | "games" | "retro" }) {
  // A square-ish editorial stage. Pure CSS; reads like a poster framing
  // the brand's material of the moment.
  return (
    <div
      className="relative aspect-[5/4] w-full overflow-hidden border"
      style={{ background: "#141618", borderColor: "#1d1f22" }}
    >
      {/* Brand mark overlay — framed rectangle, always visible */}
      <div
        className="absolute top-6 left-6 inline-flex items-center justify-center px-3 py-1 font-display font-black uppercase text-body-md tracking-tight"
        style={{ background: PAPER, color: INK }}
      >
        Rectangle&apos;s
      </div>
      <div
        className="absolute top-6 right-6 font-mono text-mono-sm uppercase tracking-wide"
        style={{ color: MUTED }}
      >
        R / 0{labelIndex(collection)}
      </div>

      {/* Stage content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {collection === "skate" && <SkateStage />}
        {collection === "music" && <MusicStage />}
        {collection === "games" && <GamesStage />}
        {collection === "retro" && <RetroStage />}
      </div>

      {/* Caption at the bottom */}
      <div
        className="absolute bottom-0 inset-x-0 px-6 py-4 flex items-center justify-between font-mono text-mono-sm uppercase tracking-wide"
        style={{ background: INK, color: PAPER, borderTop: "1px solid #1d1f22" }}
      >
        <span>{captionFor(collection)}</span>
        <span style={{ color: COBALT }}>Collect · Ride · Repeat</span>
      </div>
    </div>
  );
}

function labelIndex(c: string) {
  return { skate: 1, music: 2, games: 3, retro: 4 }[c as "skate"] ?? 1;
}

function captionFor(c: "skate" | "music" | "games" | "retro") {
  return {
    skate: "Decks, trucks, wheels, bearings",
    music: "Vinyl, speakers, formats",
    games: "Arcade, consoles, cartridges",
    retro: "Desktop culture, machines, ideas",
  }[c];
}

// ---- Collection stage visuals (pure CSS / SVG) ---------------------------

function SkateStage() {
  // A grid of 6 rectangular decks in different colors — reads as the
  // deck wall from the brandbook storyboard.
  const colors = ["#f7f7f3", "#b91c1c", "#17191b", "#d19d00", "#15803d", "#204fad"];
  return (
    <div className="w-[70%] grid grid-cols-3 gap-3">
      {colors.map((c, i) => (
        <div
          key={i}
          className="aspect-[1/3] rounded-sm flex items-start justify-center pt-3"
          style={{ background: c }}
        >
          <div
            className="w-[70%] h-4 flex items-center justify-center font-display font-black uppercase text-[9px]"
            style={{ background: i === 0 || c === "#f7f7f3" ? INK : PAPER, color: i === 0 || c === "#f7f7f3" ? PAPER : INK }}
          >
            R&apos;S
          </div>
        </div>
      ))}
    </div>
  );
}

function MusicStage() {
  return (
    <div className="relative w-[70%] aspect-square flex items-center justify-center">
      {/* Record */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "#0b0b0b",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />
      {[72, 60, 48, 36, 24].map((d) => (
        <div
          key={d}
          className="absolute rounded-full border"
          style={{
            width: `${d}%`,
            height: `${d}%`,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        />
      ))}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{ width: "30%", height: "30%", background: PAPER, color: INK }}
      >
        <span className="font-display font-black text-sm uppercase">R / 02</span>
      </div>
      <div className="absolute rounded-full" style={{ width: "4%", height: "4%", background: INK }} />
      {/* Tonearm hint */}
      <div
        className="absolute top-[20%] right-[8%] w-[45%] h-[6px]"
        style={{ background: "#3a3d42", transform: "rotate(-18deg)", transformOrigin: "100% 50%" }}
      />
    </div>
  );
}

function GamesStage() {
  // A pixel-art cartridge silhouette with "NIGHT SHIFT" label and a hint
  // of CRT lines.
  return (
    <div className="flex items-end gap-6">
      <div
        className="w-36 h-52 rounded-sm flex flex-col shadow-2xl"
        style={{ background: "#1d1d1f" }}
      >
        <div
          className="h-7 flex items-center justify-center font-display font-black uppercase text-[10px]"
          style={{ background: PAPER, color: INK }}
        >
          RECTANGLE&apos;S
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ color: PAPER }}>
          <span className="font-display font-black leading-[0.85] text-xl text-center">
            NIGHT
            <br />
            SHIFT
          </span>
        </div>
        <div className="h-2 w-full" style={{ background: COBALT }} />
      </div>
      <div
        className="w-20 h-28 rounded-t-sm border"
        style={{
          background: "#0a0b0d",
          borderColor: "#1d1f22",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}

function RetroStage() {
  // A boxy classic Mac silhouette with a cobalt screen.
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-56 h-56 rounded-md flex items-center justify-center flex-col gap-2"
        style={{ background: "#e8e0cf", color: INK }}
      >
        <div
          className="w-40 h-28"
          style={{
            background: COBALT,
            boxShadow: "inset 0 0 0 4px #0a0b0d",
          }}
        />
        <div className="font-mono text-mono-sm uppercase">Rectangle&apos;s OS 7.5</div>
        <div className="w-16 h-1" style={{ background: INK }} />
      </div>
      {/* Keyboard */}
      <div className="w-48 h-5 rounded-sm" style={{ background: "#e8e0cf" }} />
    </div>
  );
}

function ShopSection() {
  const open = useCheckout((s) => s.open);
  return (
    <section
      id="section-shop"
      className="relative min-h-screen flex flex-col justify-center px-6 md:px-16 py-24"
      style={{ background: INK, color: PAPER }}
    >
      <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
        R / shop · demo
      </p>
      <h2 className="mt-4 font-display font-black uppercase leading-[0.85] tracking-tight text-[14vw] md:text-[10vw]">
        Pick<br />
        your <span style={{ color: COBALT }}>bag.</span>
      </h2>
      <div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 max-w-5xl">
        <p className="max-w-xl text-body-lg" style={{ color: "#c8cacf" }}>
          Walk through the demo purchase: browse the four collections, add to the bag, review and
          confirm. The vendor hands you a Rectangle&apos;s bag over the counter. No real card is
          ever requested.
        </p>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center justify-center min-h-[56px] px-8 font-sans font-semibold uppercase tracking-wider text-body-md shrink-0 pointer-events-auto"
          style={{ background: COBALT, color: PAPER }}
        >
          Open demo checkout
        </button>
      </div>
    </section>
  );
}

export function EditorialSections() {
  const total = KEYFRAMES.filter((k) => k.collection).length;
  let collectionIndex = 0;
  return (
    <div className="relative">
      {KEYFRAMES.map((k) => {
        if (k.id === "hero") return <HeroSection key={k.id} />;
        if (k.id === "shop") return <ShopSection key={k.id} />;
        collectionIndex++;
        return (
          <CollectionSection key={k.id} index={collectionIndex} total={total} k={k} />
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
