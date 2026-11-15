"use client";

import { useEffect, type ReactNode } from "react";
import {
  PRODUCTS,
  productById,
  useCheckout,
  type Product,
} from "@/stores/checkout";

/**
 * iMac G3 demo marketplace — mirrors the brandbook §15 storyboard end-to-end:
 *
 *   products → detail → cart → checkout → confirmed (vendor hands you the bag)
 *
 * Opened by clicking the iMac in the Counter zone. Esc or the X dismisses
 * at any point; the cart persists across close/reopen within the session.
 * No real payment is ever requested.
 */

// ---------- Visuals -----------------------------------------------------

const PAPER = "#f7f7f3";
const INK = "#17191b";
const MUTED = "#565c62";
const LINE = "#d6d8d5";
const COBALT = "#165dfa";

function DeckArt({ accent }: { accent: string }) {
  // Pixel-ish stylized skate deck — plane of color + white brand rectangle.
  return (
    <div
      className="w-28 h-56 rounded-sm flex flex-col items-center justify-start p-2"
      style={{ background: accent, color: PAPER, transform: "rotate(10deg)" }}
    >
      <span
        className="w-20 h-6 flex items-center justify-center font-display font-black uppercase text-xs"
        style={{ background: PAPER, color: INK }}
      >
        R&apos;S
      </span>
    </div>
  );
}

function VinylArt({ accent }: { accent: string }) {
  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: accent,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      />
      {[72, 60, 48, 36, 24].map((d) => (
        <div
          key={d}
          className="absolute rounded-full border"
          style={{
            width: `${d}%`,
            height: `${d}%`,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />
      ))}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{ width: "28%", height: "28%", background: PAPER, color: INK }}
      >
        <span className="font-display font-black text-xs uppercase">R / 02</span>
      </div>
      <div
        className="absolute rounded-full"
        style={{ width: "4%", height: "4%", background: INK }}
      />
    </div>
  );
}

function CartridgeArt({ accent }: { accent: string }) {
  return (
    <div className="flex items-end gap-2">
      <div
        className="w-28 h-40 rounded-sm flex flex-col"
        style={{ background: accent, color: PAPER }}
      >
        <div
          className="h-6 w-full flex items-center justify-center font-display font-black uppercase text-[10px]"
          style={{ background: PAPER, color: INK }}
        >
          RECTANGLE&apos;S
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="font-display text-lg leading-none text-center">
            NIGHT
            <br />
            SHIFT
          </span>
        </div>
        <div
          className="h-2 w-full"
          style={{ background: COBALT }}
        />
      </div>
      <div
        className="w-6 h-20 rounded-t-sm"
        style={{ background: INK, border: `1px solid ${PAPER}` }}
      />
    </div>
  );
}

function StickersArt({ accent }: { accent: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 w-56">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-14 rounded-sm flex items-center justify-center font-display font-black uppercase text-[9px]"
          style={{
            background: i % 2 === 0 ? accent : PAPER,
            color: i % 2 === 0 ? PAPER : INK,
            transform: `rotate(${(i % 2 === 0 ? -4 : 4)}deg)`,
          }}
        >
          R / 0{i}
        </div>
      ))}
    </div>
  );
}

function ProductHero({ product }: { product: Product }) {
  const dark = { background: INK };
  switch (product.collection) {
    case "skate":
      return (
        <div className="aspect-[4/3] flex items-center justify-center" style={dark}>
          <DeckArt accent={product.accent} />
        </div>
      );
    case "music":
      return (
        <div className="aspect-[4/3] flex items-center justify-center" style={dark}>
          <VinylArt accent={product.accent} />
        </div>
      );
    case "games":
      return (
        <div className="aspect-[4/3] flex items-center justify-center" style={dark}>
          <CartridgeArt accent={product.accent} />
        </div>
      );
    case "retro":
      return (
        <div className="aspect-[4/3] flex items-center justify-center" style={dark}>
          <StickersArt accent={product.accent} />
        </div>
      );
  }
}

function VendorHandingBag() {
  // A tiny stylized scene: counter + vendor silhouette + bag with Rectangle's wordmark.
  return (
    <div
      className="relative w-full aspect-[4/3] flex items-end justify-center overflow-hidden"
      style={{ background: INK }}
    >
      {/* Vendor silhouette */}
      <div className="absolute left-[18%] bottom-10 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full" style={{ background: PAPER }} />
        <div className="w-16 h-28 -mt-2 rounded-t-sm" style={{ background: PAPER }} />
      </div>
      {/* Counter */}
      <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: "#3a2510" }} />
      {/* Bag — Kraft with Rectangle's wordmark */}
      <div
        className="absolute right-[18%] bottom-10 w-28 h-32 flex items-center justify-center"
        style={{
          background: "#b78a53",
          borderRadius: "2px 2px 0 0",
          boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="w-20 h-6 flex items-center justify-center font-display font-black uppercase text-[10px]"
          style={{ background: INK, color: PAPER }}
        >
          RECTANGLE&apos;S
        </div>
        {/* Bag handles */}
        <div
          className="absolute -top-3 left-3 w-4 h-4 rounded-full border-2"
          style={{ borderColor: "#6c4a1f", background: "transparent" }}
        />
        <div
          className="absolute -top-3 right-3 w-4 h-4 rounded-full border-2"
          style={{ borderColor: "#6c4a1f", background: "transparent" }}
        />
      </div>
      {/* Warm lamp spill */}
      <div
        className="absolute inset-x-0 top-0 h-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(255,180,100,0.18), transparent 60%)",
        }}
      />
    </div>
  );
}

// ---------- Shared chrome ------------------------------------------------

function Window({ children, title, cartBadge }: { children: ReactNode; title: string; cartBadge?: number }) {
  const close = useCheckout((s) => s.close);
  const goTo = useCheckout((s) => s.goTo);
  return (
    <div
      className="relative w-full max-w-xl rounded-sm overflow-hidden"
      style={{
        background: PAPER,
        color: INK,
        boxShadow: "0 24px 72px rgba(0,0,0,0.6), 0 0 0 1px #17191b",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 font-mono text-mono-sm uppercase tracking-wide"
        style={{ background: INK, color: PAPER }}
      >
        <span className="truncate">Rectangle&apos;s · {title}</span>
        <div className="flex items-center gap-2">
          {cartBadge !== undefined && cartBadge > 0 ? (
            <button
              type="button"
              onClick={() => goTo("cart")}
              aria-label={`Open cart (${cartBadge})`}
              className="h-5 min-w-5 px-1.5 flex items-center justify-center"
              style={{ background: COBALT, color: PAPER }}
            >
              {cartBadge}
            </button>
          ) : null}
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-5 h-5 flex items-center justify-center hover:opacity-80"
            style={{ background: PAPER, color: INK }}
          >
            ×
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button";
  disabled?: boolean;
  full?: boolean;
}) {
  const primary = { background: INK, color: PAPER };
  const ghost = { background: "transparent", color: INK, border: `1px solid ${INK}` };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center min-h-[44px] px-5 font-sans font-semibold uppercase tracking-wide text-body-sm disabled:opacity-40 ${
        full ? "w-full" : ""
      }`}
      style={variant === "primary" ? primary : ghost}
    >
      {children}
    </button>
  );
}

// ---------- Screens ------------------------------------------------------

function ProductsScreen() {
  const select = useCheckout((s) => s.select);
  return (
    <div className="divide-y" style={{ borderColor: LINE }}>
      <div className="p-6">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
          Shop · R / collections
        </p>
        <h2 className="font-display text-display-md font-black uppercase leading-[0.9] tracking-tight mt-1">
          Browse the shop
        </h2>
        <p className="text-body-sm mt-2 max-w-md" style={{ color: MUTED }}>
          Pick an item, add it to the bag, and finish the simulated purchase.
        </p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2">
        {PRODUCTS.map((p) => (
          <li key={p.id} className="border-t sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(2n)]:border-l" style={{ borderColor: LINE }}>
            <button
              type="button"
              onClick={() => select(p.id)}
              className="w-full text-left p-5 hover:bg-[rgba(0,0,0,0.03)] transition-colors"
            >
              <div className="aspect-[4/3] flex items-center justify-center overflow-hidden" style={{ background: INK }}>
                <ProductHero product={p} />
              </div>
              <p className="mt-3 font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
                R / {p.index} · {p.collection}
              </p>
              <p className="mt-1 font-display font-bold uppercase text-heading-sm leading-tight tracking-tight">
                {p.title}
              </p>
              <p className="mt-2 font-display font-black text-heading-md tracking-tight">
                ${p.price}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailScreen() {
  const selectedId = useCheckout((s) => s.selectedId);
  const product = productById(selectedId);
  const goTo = useCheckout((s) => s.goTo);
  const addToCart = useCheckout((s) => s.addToCart);
  if (!product) {
    return (
      <div className="p-6">
        <p>No product selected.</p>
        <Button onClick={() => goTo("products")}>Back</Button>
      </div>
    );
  }
  return (
    <>
      <ProductHero product={product} />
      <div className="p-6 space-y-4">
        <div>
          <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
            R / {product.index} · {product.collection}
          </p>
          <h2 className="mt-1 font-display text-heading-lg font-black uppercase tracking-tight leading-none">
            {product.title}
          </h2>
          <p className="text-body-sm mt-2" style={{ color: MUTED }}>{product.tagline}</p>
        </div>
        <ul className="space-y-1 text-body-sm">
          {product.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span style={{ color: COBALT }}>+</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="font-display font-black text-heading-lg tracking-tight">${product.price}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => goTo("products")}>Back</Button>
          <Button
            full
            onClick={() => {
              addToCart(product.id);
              goTo("cart");
            }}
          >
            Add to bag
          </Button>
        </div>
      </div>
    </>
  );
}

function CartScreen() {
  const cart = useCheckout((s) => s.cart);
  const totalPrice = useCheckout((s) => s.totalPrice());
  const goTo = useCheckout((s) => s.goTo);
  const inc = useCheckout((s) => s.incQty);
  const dec = useCheckout((s) => s.decQty);
  const rm = useCheckout((s) => s.removeFromCart);

  if (cart.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>Bag</p>
        <h2 className="font-display text-heading-lg font-black uppercase tracking-tight">Empty bag</h2>
        <p className="text-body-sm" style={{ color: MUTED }}>Pick something from the shop.</p>
        <Button onClick={() => goTo("products")}>Back to shop</Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 pb-3">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>Bag</p>
        <h2 className="font-display text-display-md font-black uppercase tracking-tight leading-[0.9] mt-1">Your bag</h2>
      </div>
      <ul className="divide-y" style={{ borderColor: LINE }}>
        {cart.map((item) => {
          const p = productById(item.productId);
          if (!p) return null;
          return (
            <li key={p.id} className="p-5 flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center" style={{ background: INK }}>
                <span className="font-display font-black uppercase text-mono-sm" style={{ color: PAPER }}>
                  {p.index}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold uppercase text-body-md truncate">{p.title}</p>
                <p className="font-mono text-mono-sm" style={{ color: MUTED }}>${p.price} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => dec(p.id)} aria-label="Decrease" className="w-7 h-7 flex items-center justify-center border" style={{ borderColor: INK }}>−</button>
                <span className="w-6 text-center font-mono text-mono-sm">{item.qty}</span>
                <button type="button" onClick={() => inc(p.id)} aria-label="Increase" className="w-7 h-7 flex items-center justify-center border" style={{ borderColor: INK }}>+</button>
              </div>
              <button
                type="button"
                onClick={() => rm(p.id)}
                aria-label={`Remove ${p.title}`}
                className="font-mono text-mono-sm uppercase"
                style={{ color: MUTED }}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <div className="p-6 border-t flex items-center justify-between gap-4" style={{ borderColor: LINE }}>
        <div>
          <p className="font-mono text-mono-sm uppercase" style={{ color: MUTED }}>Subtotal</p>
          <p className="font-display font-black text-display-md leading-none tracking-tight">${totalPrice}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => goTo("products")}>Keep shopping</Button>
          <Button onClick={() => goTo("checkout")}>Checkout</Button>
        </div>
      </div>
    </>
  );
}

function CheckoutScreen() {
  const cart = useCheckout((s) => s.cart);
  const totalPrice = useCheckout((s) => s.totalPrice());
  const goTo = useCheckout((s) => s.goTo);
  return (
    <>
      <div className="p-6 pb-3">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>Checkout</p>
        <h2 className="font-display text-display-md font-black uppercase tracking-tight leading-[0.9] mt-1">Review</h2>
      </div>
      <ul className="divide-y text-body-sm" style={{ borderColor: LINE }}>
        {cart.map((item) => {
          const p = productById(item.productId);
          if (!p) return null;
          return (
            <li key={p.id} className="px-6 py-3 flex items-center justify-between">
              <span>
                <span className="font-mono" style={{ color: MUTED }}>{p.index}</span> · {p.title} × {item.qty}
              </span>
              <span>${p.price * item.qty}</span>
            </li>
          );
        })}
      </ul>
      <div className="px-6 py-4 border-t space-y-2 text-body-sm" style={{ borderColor: LINE, color: MUTED }}>
        <div className="flex items-center justify-between">
          <span>Pickup</span>
          <span style={{ color: INK }}>In store · counter</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span style={{ color: INK }}>Free</span>
        </div>
      </div>
      <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: LINE }}>
        <span className="font-display font-black uppercase text-heading-sm">Total</span>
        <span className="font-display font-black text-heading-lg tracking-tight">${totalPrice}</span>
      </div>
      <div className="p-6 pt-3 space-y-2">
        <Button full onClick={() => goTo("confirmed")}>Complete demo purchase</Button>
        <p className="text-center font-mono text-mono-sm uppercase tracking-wide" style={{ color: "#8e9196" }}>
          No real card is requested
        </p>
        <Button full variant="ghost" onClick={() => goTo("cart")}>Back to bag</Button>
      </div>
    </>
  );
}

function ConfirmedScreen() {
  const totalPrice = useCheckout((s) => s.totalPrice());
  const close = useCheckout((s) => s.close);
  const clear = useCheckout((s) => s.clear);
  return (
    <>
      <VendorHandingBag />
      <div className="p-6 text-center space-y-4">
        <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: MUTED }}>
          Demo purchase confirmed · ${totalPrice}
        </p>
        <h2 className="font-display text-display-md font-black uppercase tracking-tight leading-[0.9]">
          Here&apos;s your bag.
        </h2>
        <p className="text-body-sm" style={{ color: MUTED }}>
          The vendor hands you the Rectangle&apos;s bag over the counter. Keep exploring the store.
        </p>
        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            full
            onClick={() => {
              clear();
            }}
          >
            Start another order
          </Button>
          <Button
            full
            onClick={() => {
              clear();
              close();
            }}
          >
            Keep exploring
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------- Overlay root -------------------------------------------------

export function CheckoutOverlay() {
  const isOpen = useCheckout((s) => s.isOpen);
  const screen = useCheckout((s) => s.screen);
  const close = useCheckout((s) => s.close);
  const totalItems = useCheckout((s) => s.totalItems());

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const title =
    screen === "products" ? "shop" :
    screen === "detail"   ? "product" :
    screen === "cart"     ? "bag" :
    screen === "checkout" ? "checkout" :
    "bag ready";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 w-full h-full"
        style={{ background: "rgba(10, 11, 13, 0.78)", backdropFilter: "blur(6px)" }}
      />
      <div className="relative w-full flex justify-center max-h-[90vh] overflow-auto">
        <Window title={title} cartBadge={totalItems}>
          {screen === "products" && <ProductsScreen />}
          {screen === "detail" && <DetailScreen />}
          {screen === "cart" && <CartScreen />}
          {screen === "checkout" && <CheckoutScreen />}
          {screen === "confirmed" && <ConfirmedScreen />}
        </Window>
      </div>
    </div>
  );
}
