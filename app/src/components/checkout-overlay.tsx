"use client";

import { useEffect, useState } from "react";
import { useCheckout } from "@/stores/checkout";

/**
 * Demo checkout overlay — the portfolio "money shot".
 *
 * Shown when the iMac G3 is clicked at the counter. Mimics a tiny CRT-era
 * product page + confirm flow without ever requesting a real payment, per
 * brandbook §18 ("Demo purchase; enable bag handover only after simulated
 * confirmation"). Dismisses with Esc or the close button.
 */
export function CheckoutOverlay() {
  const isOpen = useCheckout((s) => s.isOpen);
  const close = useCheckout((s) => s.close);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmed(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close checkout"
        onClick={close}
        className="absolute inset-0 w-full h-full"
        style={{ background: "rgba(10, 11, 13, 0.78)", backdropFilter: "blur(6px)" }}
      />

      {/* iMac-ish window */}
      <div
        className="relative w-full max-w-md rounded-sm overflow-hidden"
        style={{
          background: "#f7f7f3",
          color: "#17191b",
          boxShadow: "0 24px 72px rgba(0,0,0,0.6), 0 0 0 1px #17191b",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {/* Title bar — pretending to be a classic OS window */}
        <div
          className="flex items-center justify-between px-3 py-2 font-mono text-mono-sm uppercase tracking-wide"
          style={{ background: "#17191b", color: "#f7f7f3" }}
        >
          <span>Rectangle&apos;s · demo checkout</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-5 h-5 flex items-center justify-center hover:opacity-80"
            style={{ background: "#f7f7f3", color: "#17191b" }}
          >
            ×
          </button>
        </div>

        {confirmed ? (
          // Post-purchase confirmation state
          <div className="p-6 text-center space-y-4">
            <div
              className="mx-auto w-14 h-14 flex items-center justify-center font-display text-3xl"
              style={{ background: "#165dfa", color: "#fff" }}
            >
              ✓
            </div>
            <h2 id="checkout-title" className="font-display text-display-md font-black uppercase tracking-tight">
              Bag ready
            </h2>
            <p className="text-body-sm" style={{ color: "#565c62" }}>
              Demo purchase confirmed. Bag Rectangle&apos;s placed on the counter.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-2 inline-flex items-center justify-center min-h-[44px] px-6 font-sans font-semibold uppercase tracking-wide text-body-sm"
              style={{ background: "#17191b", color: "#fff" }}
            >
              Keep exploring
            </button>
          </div>
        ) : (
          <>
            {/* Product preview */}
            <div className="p-6 border-b" style={{ borderColor: "#d6d8d5" }}>
              <p className="font-mono text-mono-sm uppercase tracking-wide" style={{ color: "#565c62" }}>
                01 / Skate · Rectangle&apos;s Complete
              </p>
              <div
                className="mt-3 aspect-[4/3] w-full flex items-center justify-center"
                style={{ background: "#17191b" }}
              >
                {/* Hero deck placeholder */}
                <div
                  className="w-24 h-56 rounded-sm flex flex-col items-center justify-start p-2"
                  style={{ background: "#241a13", color: "#f7f7f3", transform: "rotate(10deg)" }}
                >
                  <span
                    className="w-20 h-6 flex items-center justify-center font-display font-black uppercase text-xs"
                    style={{ background: "#f7f7f3", color: "#17191b" }}
                  >
                    R&apos;S
                  </span>
                </div>
              </div>
              <h2
                id="checkout-title"
                className="mt-4 font-display text-heading-lg font-black uppercase tracking-tight leading-none"
              >
                Rectangle&apos;s Complete
              </h2>
              <p className="mt-1 text-body-sm" style={{ color: "#565c62" }}>
                Deck + trucks + wheels + bearings. Ready to ride out of the shop.
              </p>
            </div>

            {/* Summary */}
            <div className="p-6 space-y-3 text-body-sm" style={{ color: "#565c62" }}>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span style={{ color: "#17191b" }}>$120.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span style={{ color: "#17191b" }}>Pick-up in store</span>
              </div>
              <div
                className="flex items-center justify-between pt-3 mt-3 border-t"
                style={{ borderColor: "#d6d8d5" }}
              >
                <span className="font-display uppercase font-bold text-body-md" style={{ color: "#17191b" }}>
                  Total
                </span>
                <span
                  className="font-display font-black uppercase text-heading-md tracking-tight"
                  style={{ color: "#17191b" }}
                >
                  $120.00
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="inline-flex items-center justify-center min-h-[48px] px-6 font-sans font-semibold uppercase tracking-wide text-body-sm"
                style={{ background: "#17191b", color: "#f7f7f3" }}
              >
                Complete demo purchase
              </button>
              <p
                className="text-center font-mono text-mono-sm uppercase tracking-wide"
                style={{ color: "#8e9196" }}
              >
                No real card is requested
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
