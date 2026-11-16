"use client";

/**
 * Subtle 12-column grid rendered over the page as a design accent.
 * Toggled off on mobile where it would feel busy.
 */
export function GridOverlay() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[5] pointer-events-none hidden md:block"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(247,247,243,0.035) 1px, transparent 1px)",
        backgroundSize: "calc(100% / 12) 100%",
      }}
    />
  );
}
