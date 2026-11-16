"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { create } from "zustand";
import { scrollToSection } from "@/components/smooth-scroll";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import {
  COLLECTION_LABEL,
  DECK_GRAPHICS,
  PRODUCTS,
  SETUP_PARTS,
  keyOf,
  productById,
  useCheckout,
  type Collection,
  type DeckGraphic,
  type Product,
} from "@/stores/checkout";

/**
 * Rectangle's online store — the page that runs on the counter iMac.
 *
 * Rendered inside the iMac display (scenes/store/ImacStore.tsx) at a fixed
 * 1280×720 logical viewport, so it is laid out like a real desktop site.
 * Screens follow the approved mockups in /Storyboard/store-mockups:
 *   home (01) · product page (02) · Build your setup (03) · cart · checkout
 *   · confirmed. Demo only — no real payment data is ever requested.
 */

export const STORE_W = 1280;
export const STORE_H = 720;

const C = {
  paper: "#f4f3ef",
  card: "#fbfbf9",
  ink: "#17191b",
  muted: "#565c62",
  line: "#d6d8d5",
  cobalt: "#165dfa",
} as const;

const display = "var(--font-display), Anton, Impact, sans-serif";
const sans = "var(--font-sans), Inter, system-ui, sans-serif";

// ---- Building blocks ------------------------------------------------------------

function Display({ children, size, as: Tag = "h2" }: { children: ReactNode; size: number; as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag
      style={{
        fontFamily: display,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: "-0.01em",
        textTransform: "uppercase",
        margin: 0,
      }}
    >
      {children}
    </Tag>
  );
}

function PrimaryButton({
  children,
  onClick,
  full,
  size = "md",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  size?: "md" | "lg";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-cursor="hover"
      className="transition-opacity hover:opacity-90 disabled:opacity-40"
      style={{
        background: C.ink,
        color: "#fff",
        fontFamily: size === "lg" ? display : sans,
        fontWeight: size === "lg" ? 800 : 600,
        fontSize: size === "lg" ? 26 : 15,
        textTransform: size === "lg" ? "uppercase" : "none",
        padding: size === "lg" ? "12px 24px" : "10px 22px",
        width: full ? "100%" : undefined,
        borderRadius: 2,
      }}
    >
      {children}
    </button>
  );
}

function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} data-cursor="hover" className="hover:underline underline-offset-4" style={{ fontFamily: sans, fontWeight: 600, fontSize: 15 }}>
      {children}
    </button>
  );
}

function Header() {
  const goTo = useCheckout((s) => s.goTo);
  const count = useCheckout((s) => s.cart.reduce((n, c) => n + c.qty, 0));
  const setFilter = useStoreFilter((s) => s.set);
  const go = (f: Collection | "all") => {
    setFilter(f);
    goTo("home");
  };
  return (
    <header>
      <div
        style={{
          background: "#e9e8e3",
          textAlign: "center",
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          padding: "5px 0",
        }}
      >
        DEMO STORE — NO REAL PAYMENTS
      </div>
      <div className="flex items-center justify-between" style={{ padding: "16px 40px 10px" }}>
        <button type="button" onClick={() => go("all")} className="flex items-center gap-4" aria-label="Rectangle's store home" data-cursor="hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/horizontal-black.svg" alt="Rectangle's" style={{ height: 44, width: "auto", display: "block" }} />
        </button>
        <nav className="flex items-center gap-9" style={{ fontFamily: sans, fontWeight: 600, fontSize: 17 }}>
          <button type="button" onClick={() => go("all")} data-cursor="hover" className="hover:opacity-70">Shop</button>
          {(Object.keys(COLLECTION_LABEL) as Collection[]).map((c) => (
            <button key={c} type="button" onClick={() => go(c)} data-cursor="hover" className="hover:opacity-70">
              {COLLECTION_LABEL[c]}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-7" style={{ fontFamily: sans, fontWeight: 600, fontSize: 17 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" aria-hidden>
            <circle cx="10.5" cy="10.5" r="7" />
            <path d="m16 16 5 5" />
          </svg>
          <button type="button" onClick={() => goTo("cart")} data-cursor="hover" className="hover:opacity-70">
            Cart ({count})
          </button>
        </div>
      </div>
    </header>
  );
}

function BackToSpace({ right }: { right?: ReactNode }) {
  const close = useCheckout((s) => s.close);
  return (
    <div className="flex items-center justify-between" style={{ padding: "0 40px" }}>
      <TextLink onClick={close}>← Back to the space</TextLink>
      {right}
    </div>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <span style={{ fontFamily: sans, fontSize: 15 }}>
      {items.map((it, i) => (
        <span key={it}>
          {i > 0 && " / "}
          <span style={{ fontWeight: i === items.length - 1 ? 600 : 400 }}>{it}</span>
        </span>
      ))}
    </span>
  );
}

// Tiny local store for the home filter so the header nav can drive it.
const useStoreFilter = create<{ value: Collection | "all"; set: (v: Collection | "all") => void }>((set) => ({
  value: "all",
  set: (value) => set({ value }),
}));

// ---- Screens ---------------------------------------------------------------------

function ProductCard({ p }: { p: Product }) {
  const select = useCheckout((s) => s.select);
  const add = useCheckout((s) => s.addToCart);
  const goTo = useCheckout((s) => s.goTo);
  // One click adds one; after that the button shows the quantity and opens
  // the cart (where it can be changed) instead of piling more on.
  const inCart = useCheckout((s) => s.cart.reduce((n, c) => (c.productId === p.id ? n + c.qty : n), 0));
  const quickAdd = () => {
    if (inCart) return goTo("cart");
    if (p.configurable) add(p.id, "Black Frame");
    else if (p.sizes) add(p.id, `${p.colors?.[0].label} · M`);
    else add(p.id);
  };
  return (
    <li style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <button type="button" onClick={() => select(p.id)} data-cursor="hover" className="block w-full" aria-label={`View ${p.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt="" style={{ width: "100%", aspectRatio: "356 / 223", objectFit: "cover", display: "block" }} />
      </button>
      <div style={{ padding: "12px 14px 14px" }}>
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontFamily: sans, fontWeight: 600, fontSize: 17, margin: 0 }}>{p.shortTitle}</p>
            <p style={{ fontFamily: sans, fontWeight: 700, fontSize: 22, margin: "2px 0 0" }}>${p.price}</p>
          </div>
          <button
            type="button"
            onClick={quickAdd}
            aria-label={inCart ? `${p.shortTitle}: ${inCart} in cart — view cart` : `Add ${p.shortTitle} to cart`}
            data-cursor="hover"
            className="hover:bg-black hover:text-white transition-colors"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              minWidth: 24,
              height: 24,
              padding: inCart ? "0 6px" : 0,
              borderRadius: 12,
              border: `1.5px solid ${C.ink}`,
              lineHeight: 1,
              fontSize: 13,
              fontWeight: inCart ? 700 : 400,
              background: inCart ? C.ink : undefined,
              color: inCart ? "#fff" : undefined,
            }}
          >
            {inCart || (
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <path d="M5 0.5v9M0.5 5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <PrimaryButton full onClick={() => select(p.id)}>
            View product
          </PrimaryButton>
        </div>
      </div>
    </li>
  );
}

function HomeScreen() {
  const filter = useStoreFilter((s) => s.value);
  const setFilter = useStoreFilter((s) => s.set);
  const select = useCheckout((s) => s.select);
  const items = PRODUCTS.filter((p) => filter === "all" || p.collection === filter);
  const tabs: (Collection | "all")[] = ["all", "skate", "music", "games", "retro"];
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: "430px 1fr", gap: 28, padding: "4px 40px 0" }}>
        <div>
          <BackToSpaceInline />
          <div style={{ marginTop: 30 }}>
            <Display as="h1" size={88}>
              Find your next obsession.
            </Display>
          </div>
          <p style={{ fontFamily: sans, fontSize: 18, lineHeight: 1.35, margin: "16px 0 22px" }}>
            Boards, records, games and old machines.
            <br />
            Same place. Your next find.
          </p>
          <PrimaryButton size="md" onClick={() => document.getElementById("selected-finds")?.scrollIntoView({ behavior: "smooth" })}>
            <span style={{ fontSize: 18, padding: "4px 18px", display: "inline-block" }}>Explore the collection</span>
          </PrimaryButton>
        </div>
        <button type="button" onClick={() => select("complete-01")} data-cursor="hover" aria-label="Build your setup" style={{ alignSelf: "end" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shop/hero.jpg" alt="Rectangle's Complete, Sessions Vol. 01, a game controller and an iMac G3" style={{ width: "100%", display: "block" }} />
        </button>
      </div>

      <section id="selected-finds" style={{ padding: "34px 40px 0" }}>
        <div className="flex items-end justify-between">
          <Display size={52}>Selected finds</Display>
          <div className="flex gap-10" role="tablist" style={{ fontFamily: sans, fontSize: 19 }}>
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={filter === t}
                onClick={() => setFilter(t)}
                data-cursor="hover"
                style={{
                  fontWeight: filter === t ? 700 : 500,
                  paddingBottom: 6,
                  borderBottom: `4px solid ${filter === t ? C.cobalt : "transparent"}`,
                }}
              >
                {t === "all" ? "All" : t === "retro" ? "Retro" : COLLECTION_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 14, listStyle: "none", padding: 0 }}>
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </ul>
      </section>

      <Mantra text="Play. Listen. Ride. Repeat." />
    </>
  );
}

function BackToSpaceInline() {
  const close = useCheckout((s) => s.close);
  return <TextLink onClick={close}>← Back to the space</TextLink>;
}

function Mantra({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-8" style={{ padding: "28px 40px 34px" }}>
      <Display size={46}>{text}</Display>
      <span style={{ flex: 1, height: 2, background: C.ink }} />
      <span style={{ width: 42, height: 16, background: C.cobalt }} />
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${C.ink}` }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        data-cursor="hover"
        className="w-full flex items-center justify-between"
        style={{ fontFamily: sans, fontWeight: 600, fontSize: 19, padding: "11px 0" }}
      >
        {title}
        <span style={{ transform: `rotate(${open ? 180 : 0}deg)`, transition: "transform 180ms" }}>⌄</span>
      </button>
      {open && <div style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.5, paddingBottom: 12, color: C.muted }}>{children}</div>}
    </div>
  );
}

function OptionChip({ selected, onClick, children, width }: { selected: boolean; onClick: () => void; children: ReactNode; width?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-cursor="hover"
      className="flex items-center justify-center gap-3"
      style={{
        width,
        minWidth: 72,
        height: 42,
        padding: "0 14px",
        border: `${selected ? 2 : 1}px solid ${selected ? C.cobalt : C.ink}`,
        borderRadius: 2,
        fontFamily: sans,
        fontWeight: 600,
        fontSize: 16,
        background: "#fff",
      }}
    >
      {children}
    </button>
  );
}

function ProductScreen() {
  const id = useCheckout((s) => s.selectedId);
  const setLine = useCheckout((s) => s.setLineQty);
  const goTo = useCheckout((s) => s.goTo);
  const p = productById(id) ?? PRODUCTS[3];
  const gallery = p.gallery ?? [p.image];
  const [shot, setShot] = useState(0);
  const [color, setColor] = useState(p.colors?.[0].id);
  const [size, setSize] = useState(p.sizes ? "M" : undefined);
  const variant = [p.colors?.find((c) => c.id === color)?.label, size].filter(Boolean).join(" · ") || undefined;
  // The counter IS the cart quantity for this variant: adding sets the line
  // to the counter's value, so repeated clicks never stack extra units.
  const lineKey = keyOf(p.id, variant);
  const inCart = useCheckout((s) => s.cart.find((c) => c.key === lineKey)?.qty ?? 0);
  // A pending edit lives only until the variant or the cart line changes.
  const [draft, setDraft] = useState<{ key: string; base: number; qty: number } | null>(null);
  const qty = draft && draft.key === lineKey && draft.base === inCart ? draft.qty : inCart || 1;
  const setQty = (n: number) => setDraft({ key: lineKey, base: inCart, qty: n });
  const synced = inCart > 0 && inCart === qty;

  return (
    <>
      <BackToSpace right={<Breadcrumb items={["Shop", COLLECTION_LABEL[p.collection], p.shortTitle]} />} />
      <div style={{ margin: "10px 40px 0", borderTop: `1px solid ${C.ink}` }} />
      <div className="grid" style={{ gridTemplateColumns: "1.18fr 1fr", gap: 40, padding: "22px 40px 0" }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[shot]} alt={p.title} style={{ width: "100%", aspectRatio: "853 / 513", objectFit: "cover", display: "block" }} />
          {gallery.length > 1 && (
            <div className="grid" style={{ gridTemplateColumns: `repeat(${gallery.length}, 1fr)`, gap: 12, marginTop: 12 }}>
              {gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setShot(i)}
                  aria-label={`Image ${i + 1}`}
                  data-cursor="hover"
                  style={{ outline: i === shot ? `3px solid ${C.cobalt}` : "none", outlineOffset: -3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" style={{ width: "100%", aspectRatio: "208 / 142", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p style={{ fontFamily: sans, fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", color: C.cobalt, margin: 0 }}>
            {COLLECTION_LABEL[p.collection].toUpperCase()} / COLLECTION {p.index}
          </p>
          <div style={{ marginTop: 8 }}>
            <Display as="h1" size={66}>
              {p.title}
            </Display>
          </div>
          <p style={{ fontFamily: display, fontWeight: 900, fontSize: 40, margin: "6px 0 2px" }}>${p.price}</p>
          <p style={{ fontFamily: sans, fontSize: 18, lineHeight: 1.35, margin: 0 }}>{p.tagline}</p>

          <div className="grid items-center" style={{ gridTemplateColumns: "96px 1fr", rowGap: 18, marginTop: 22, fontFamily: sans, fontWeight: 600, fontSize: 18 }}>
            {p.colors && (
              <>
                <span>Color</span>
                <div className="flex gap-4">
                  {p.colors.map((c) => (
                    <OptionChip key={c.id} selected={color === c.id} onClick={() => setColor(c.id)} width={150}>
                      <span style={{ width: 28, height: 20, background: c.swatch, border: `1px solid ${C.line}` }} />
                      {c.label}
                    </OptionChip>
                  ))}
                </div>
              </>
            )}
            {p.sizes && (
              <>
                <span>Size</span>
                <div className="flex items-center gap-3">
                  {p.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      aria-pressed={size === s}
                      data-cursor="hover"
                      style={{
                        width: 70,
                        height: 42,
                        border: `1px solid ${C.ink}`,
                        background: size === s ? C.ink : "#fff",
                        color: size === s ? "#fff" : C.ink,
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                  <span style={{ fontSize: 15, textDecoration: "underline", marginLeft: 10 }}>Size guide</span>
                </div>
              </>
            )}
            <span>Quantity</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-between" style={{ width: 140, height: 46, border: `1px solid ${C.ink}`, padding: "0 14px", borderRadius: 2, background: "#fff" }}>
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} data-cursor="hover" style={{ fontSize: 22 }}>
                  −
                </button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty(qty + 1)} data-cursor="hover" style={{ fontSize: 22 }}>
                  +
                </button>
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  data-cursor="hover"
                  onClick={() => {
                    if (synced) goTo("cart");
                    else setLine(p.id, variant, qty);
                  }}
                  className="w-full hover:opacity-90"
                  style={{ height: 48, background: C.ink, color: "#fff", fontFamily: sans, fontWeight: 700, fontSize: 20, borderRadius: 2 }}
                >
                  {synced ? `In cart (${inCart}) — view cart` : inCart ? `Update cart to ${qty}` : "Add to cart"}
                </button>
              </div>
            </div>
          </div>
          {inCart > 0 && (
            <div style={{ marginTop: 8, textAlign: "right" }}>
              <TextLink onClick={() => goTo("cart")}>Go to cart →</TextLink>
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <Accordion title="Details">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {p.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Accordion>
            {p.sizes && <Accordion title="Fit & sizing">Relaxed fit. Model is 1.80 m and wears M.</Accordion>}
            <Accordion title="Demo purchase info">This is a concept store. Checkout is simulated and never asks for real card details.</Accordion>
            <div style={{ borderTop: `1px solid ${C.ink}` }} />
          </div>
          <p style={{ fontFamily: sans, fontStyle: "italic", fontSize: 15, color: C.muted, marginTop: 14 }}>Concept product. Checkout is simulated.</p>
        </div>
      </div>
      {p.id === "desktop-tee" && (
        <div className="grid items-center" style={{ gridTemplateColumns: "380px 1fr 1fr", gap: 18, padding: "34px 40px 0" }}>
          <Display size={52}>Details that matter</Display>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shop/tee-detail-1.jpg" alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shop/tee-detail-2.jpg" alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
        </div>
      )}
      <Mantra text={p.collection === "retro" ? "Old hardware. New connections." : "Play. Listen. Ride. Repeat."} />
    </>
  );
}

function SetupScreen() {
  const add = useCheckout((s) => s.addToCart);
  const goTo = useCheckout((s) => s.goTo);
  const [view, setView] = useState<"assembled" | "exploded">("exploded");
  const [graphic, setGraphic] = useState<DeckGraphic>("black-frame");
  const [open, setOpen] = useState("deck");
  const total = SETUP_PARTS.reduce((s, p) => s + p.price, 0);
  const graphicLabel = DECK_GRAPHICS.find((g) => g.id === graphic)!.label;
  const added = useCheckout((s) => s.cart.some((c) => c.key === keyOf("complete-01", graphicLabel)));

  return (
    <>
      <BackToSpace />
      <div className="flex items-center gap-8" style={{ padding: "10px 40px 18px" }}>
        <Display as="h1" size={76}>
          Build your setup.
        </Display>
        <span style={{ width: 1, height: 40, background: C.ink }} />
        <Breadcrumb items={["Shop", "Skate", "Custom setup"]} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 18, padding: "0 28px" }}>
        <div style={{ position: "relative", background: "#2b2b2b" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={view === "exploded" ? "/shop/setup-exploded.jpg" : "/shop/card-complete.jpg"}
            alt={view === "exploded" ? "Exploded view: deck, grip, trucks, wheels, bearings and hardware" : "Assembled complete"}
            style={{ width: "100%", aspectRatio: "905 / 496", objectFit: "cover", display: "block" }}
          />
          <div className="flex gap-3" style={{ position: "absolute", top: 22, left: 26 }}>
            {(["assembled", "exploded"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                data-cursor="hover"
                style={{
                  background: C.ink,
                  color: "#fff",
                  border: `2px solid ${view === v ? C.cobalt : "#3a3c40"}`,
                  padding: "6px 22px",
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: 3,
                  textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-8" style={{ background: "#1c1d1f", color: "#fff", padding: "14px 26px", fontFamily: sans, fontWeight: 600, fontSize: 15 }}>
            Deck graphic:
            {DECK_GRAPHICS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGraphic(g.id)}
                aria-pressed={graphic === g.id}
                data-cursor="hover"
                className="flex flex-col items-center gap-1"
                style={{ padding: 6, border: `2px solid ${graphic === g.id ? C.cobalt : "transparent"}`, borderRadius: 4 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image} alt="" style={{ width: 210, height: 58, objectFit: "contain" }} />
                <span style={{ fontSize: 14 }}>{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }}>
            {SETUP_PARTS.map((part) => (
              <div key={part.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(open === part.id ? "" : part.id)}
                  aria-expanded={open === part.id}
                  data-cursor="hover"
                  className="w-full grid items-center"
                  style={{ gridTemplateColumns: "118px 1fr 34px 58px 20px", padding: "9px 16px", textAlign: "left" }}
                >
                  <span style={{ fontFamily: display, fontWeight: 800, fontSize: 28 }}>{part.label}</span>
                  <span style={{ fontFamily: sans, fontSize: 14 }}>{part.id === "deck" ? `${graphicLabel} · ${part.option}` : part.option}</span>
                  <span style={{ fontFamily: sans, fontSize: 15 }}>1 ×</span>
                  <span style={{ fontFamily: display, fontWeight: 900, fontSize: 28 }}>${part.price}</span>
                  <span>{open === part.id ? "⌃" : "⌄"}</span>
                </button>
                {open === part.id && part.id === "deck" && (
                  <div className="flex gap-4" style={{ padding: "0 16px 12px" }}>
                    {DECK_GRAPHICS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGraphic(g.id)}
                        data-cursor="hover"
                        className="flex flex-col items-center"
                        style={{ border: `2px solid ${graphic === g.id ? C.cobalt : "transparent"}`, borderRadius: 4, padding: 4, fontFamily: sans, fontSize: 13 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.image} alt="" style={{ width: 170, height: 46, objectFit: "contain" }} />
                        {g.label} · 8.25 in
                      </button>
                    ))}
                  </div>
                )}
                {open === part.id && part.id !== "deck" && (
                  <p style={{ fontFamily: sans, fontSize: 14, color: C.muted, padding: "0 16px 10px", margin: 0 }}>
                    Standard Rectangle&apos;s spec — included in every complete.
                  </p>
                )}
              </div>
            ))}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, padding: "14px 16px 10px" }}>
            <div className="flex items-center justify-between">
              <Display size={40}>Your setup total</Display>
              <span style={{ fontFamily: display, fontWeight: 900, fontSize: 48 }}>${total}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <PrimaryButton
                full
                size="lg"
                onClick={() => {
                  if (added) return goTo("cart");
                  add("complete-01", graphicLabel);
                }}
              >
                {added ? "View cart" : "Add setup to cart"}
              </PrimaryButton>
            </div>
            <p style={{ fontFamily: sans, fontSize: 13, textAlign: "center", margin: "8px 0 0" }}>Complete setup. Demo purchase only.</p>
          </div>
        </div>
      </div>
      <Mantra text="Every part. Your choice." />
    </>
  );
}

function CartScreen() {
  const cart = useCheckout((s) => s.cart);
  const inc = useCheckout((s) => s.incQty);
  const dec = useCheckout((s) => s.decQty);
  const remove = useCheckout((s) => s.removeFromCart);
  const goTo = useCheckout((s) => s.goTo);
  const total = useCheckout((s) => s.totalPrice());
  return (
    <>
      <BackToSpace right={<Breadcrumb items={["Shop", "Cart"]} />} />
      <div style={{ padding: "18px 40px 0" }}>
        <Display as="h1" size={76}>
          Your bag.
        </Display>
      </div>
      {cart.length === 0 ? (
        <div style={{ padding: "26px 40px", fontFamily: sans, fontSize: 18 }}>
          <p>Nothing here yet.</p>
          <div style={{ marginTop: 14 }}>
            <PrimaryButton onClick={() => goTo("home")}>Browse the shop</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 32, padding: "22px 40px 0" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `1px solid ${C.ink}` }}>
            {cart.map((c) => {
              const p = productById(c.productId)!;
              return (
                <li key={c.key} className="grid items-center" style={{ gridTemplateColumns: "150px 1fr 140px 90px 28px", gap: 18, padding: "14px 0", borderBottom: `1px solid ${C.line}`, fontFamily: sans }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" style={{ width: 150, aspectRatio: "356 / 223", objectFit: "cover" }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{p.title}</p>
                    <p style={{ fontSize: 14, color: C.muted, margin: "2px 0 0" }}>
                      {COLLECTION_LABEL[p.collection]}
                      {c.variant ? ` · ${c.variant}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between" style={{ height: 40, border: `1px solid ${C.ink}`, padding: "0 12px", background: "#fff" }}>
                    <button type="button" aria-label="Decrease" onClick={() => dec(c.key)} data-cursor="hover" style={{ fontSize: 20 }}>
                      −
                    </button>
                    <span>{c.qty}</span>
                    <button type="button" aria-label="Increase" onClick={() => inc(c.key)} data-cursor="hover" style={{ fontSize: 20 }}>
                      +
                    </button>
                  </div>
                  <span style={{ fontFamily: display, fontWeight: 900, fontSize: 28, textAlign: "right" }}>${p.price * c.qty}</span>
                  <button type="button" aria-label={`Remove ${p.title}`} onClick={() => remove(c.key)} data-cursor="hover" style={{ fontSize: 20, color: C.muted }}>
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <Summary total={total} cta="Checkout" onCta={() => goTo("checkout")} />
        </div>
      )}
    </>
  );
}

function Summary({ total, cta, onCta }: { total: number; cta: string; onCta: () => void }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, padding: 20, alignSelf: "start" }}>
      {[
        ["Subtotal", `$${total}`],
        ["Shipping", "Pick up in store"],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between" style={{ fontFamily: sans, fontSize: 16, padding: "4px 0" }}>
          <span>{k}</span>
          <span>{v}</span>
        </div>
      ))}
      <div className="flex items-center justify-between" style={{ borderTop: `1px solid ${C.ink}`, marginTop: 10, paddingTop: 10 }}>
        <Display size={36}>Total</Display>
        <span style={{ fontFamily: display, fontWeight: 900, fontSize: 44 }}>${total}</span>
      </div>
      <div style={{ marginTop: 12 }}>
        <PrimaryButton full size="lg" onClick={onCta}>
          {cta}
        </PrimaryButton>
      </div>
      <p style={{ fontFamily: sans, fontSize: 13, textAlign: "center", margin: "8px 0 0" }}>Demo purchase. No real card is ever requested.</p>
    </div>
  );
}

function CheckoutScreen() {
  const total = useCheckout((s) => s.totalPrice());
  const complete = useCheckout((s) => s.completePurchase);
  const goTo = useCheckout((s) => s.goTo);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const field = { width: "100%", height: 46, border: `1px solid ${C.ink}`, padding: "0 14px", fontFamily: sans, fontSize: 16, background: "#fff", borderRadius: 2 };
  return (
    <>
      <BackToSpace right={<Breadcrumb items={["Shop", "Cart", "Checkout"]} />} />
      <div style={{ padding: "18px 40px 0" }}>
        <Display as="h1" size={76}>
          Checkout.
        </Display>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 32, padding: "22px 40px 0" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            complete();
          }}
          className="flex flex-col gap-4"
          style={{ fontFamily: sans, fontWeight: 600, fontSize: 16 }}
        >
          <label className="flex flex-col gap-2">
            Name for pick-up
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" style={field} />
          </label>
          <label className="flex flex-col gap-2">
            Email for the receipt
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={field} />
          </label>
          <div style={{ border: `1px dashed ${C.muted}`, padding: 16, fontWeight: 400, color: C.muted, lineHeight: 1.5 }}>
            <strong style={{ color: C.ink }}>Payment — demo.</strong> This is a concept store. No card details are requested or stored; confirming completes a
            simulated purchase and your bag is waiting at the counter.
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => goTo("cart")} data-cursor="hover" style={{ height: 48, padding: "0 22px", border: `1px solid ${C.ink}`, borderRadius: 2, fontWeight: 600 }}>
              Back to cart
            </button>
            <button type="submit" data-cursor="hover" className="flex-1 hover:opacity-90" style={{ height: 48, background: C.ink, color: "#fff", fontWeight: 700, fontSize: 18, borderRadius: 2 }}>
              Complete demo purchase
            </button>
          </div>
        </form>
        <Summary total={total} cta="Complete demo purchase" onCta={complete} />
      </div>
    </>
  );
}

function ConfirmedScreen() {
  const close = useCheckout((s) => s.close);
  const goTo = useCheckout((s) => s.goTo);
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: "70px 40px", gap: 18 }}>
      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{ width: 84, height: 84, borderRadius: 42, background: C.cobalt, color: "#fff", fontSize: 44 }}
      >
        ✓
      </span>
      <Display as="h1" size={84}>
        Demo purchase confirmed.
      </Display>
      <p style={{ fontFamily: sans, fontSize: 19, maxWidth: 560, margin: 0 }}>Your Rectangle&apos;s bag is ready at the counter. No real payment was taken.</p>
      <div className="flex gap-4" style={{ marginTop: 10 }}>
        <PrimaryButton
          size="lg"
          onClick={() => {
            // Storyboard 10 → 11: leave the iMac and walk to the bag handoff.
            close();
            const handoff = KEYFRAMES.findIndex((k) => k.id === "handoff");
            window.setTimeout(() => scrollToSection(handoff), 250);
          }}
        >
          Pick up your bag
        </PrimaryButton>
        <button type="button" onClick={() => goTo("home")} data-cursor="hover" style={{ padding: "0 24px", border: `1px solid ${C.ink}`, borderRadius: 2, fontFamily: sans, fontWeight: 600, fontSize: 16 }}>
          Keep browsing
        </button>
      </div>
    </div>
  );
}

// ---- Page shell ------------------------------------------------------------------

/** Page transition timings, ms. */
const PAGE_OUT_MS = 150;
const PAGE_IN_MS = 380;

export function StorePage() {
  const screen = useCheckout((s) => s.screen);
  const scroller = useRef<HTMLDivElement>(null);
  // Page transition: the current screen eases out, then the next one starts
  // at the top (like a page navigation) and eases in.
  const [shown, setShown] = useState(screen);
  const leaving = shown !== screen;

  useEffect(() => {
    if (shown === screen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(
      () => {
        scroller.current?.scrollTo({ top: 0 });
        setShown(screen);
      },
      reduced ? 0 : PAGE_OUT_MS,
    );
    return () => window.clearTimeout(t);
  }, [screen, shown]);

  return (
    <div
      ref={scroller}
      data-lenis-prevent
      data-store-root
      style={{
        position: "relative",
        width: STORE_W,
        height: STORE_H,
        overflowY: "auto",
        overflowX: "hidden",
        background: C.paper,
        color: C.ink,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    >
      <Header />
      <div key={shown} className={leaving ? "store-page store-page-out" : "store-page"}>
        {shown === "home" && <HomeScreen />}
        {shown === "product" && <ProductScreen />}
        {shown === "setup" && <SetupScreen />}
        {shown === "cart" && <CartScreen />}
        {shown === "checkout" && <CheckoutScreen />}
        {shown === "confirmed" && <ConfirmedScreen />}
      </div>
      <style>{`
        .store-page{animation:store-page-in ${PAGE_IN_MS}ms cubic-bezier(.2,.7,.2,1) both}
        .store-page-out{animation:none;opacity:0;transform:translateY(-8px);transition:opacity ${PAGE_OUT_MS}ms ease,transform ${PAGE_OUT_MS}ms ease;pointer-events:none}
        @keyframes store-page-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.store-page,.store-page-out{animation:none;transition:none;transform:none}}
      `}</style>
    </div>
  );
}
