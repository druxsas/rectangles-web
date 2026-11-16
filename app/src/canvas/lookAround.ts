"use client";

import { create } from "zustand";
import { useScroll } from "@/stores/scroll";

/**
 * Desktop "look around" inside the store.
 *
 *  - Mouse: moving toward the left/right edge turns the camera that way
 *    (dead zone in the middle so reading the captions stays still).
 *  - Arrows: step the view a further ±ARROW_DEG to reveal what sits far to
 *    the sides of a stop. Resets when the visitor moves to another stop.
 *
 * Only active once the camera has walked through the door and while not
 * shopping on the iMac. Touch devices never use it.
 */

export const MOUSE_DEG = 40;
export const ARROW_DEG = 50;
export const MAX_DEG = 80;

/** Camera position (in stops) past which it is inside the shop. */
const INSIDE_AT = 0.8;

export function isInside(stop: number) {
  return stop >= INSIDE_AT;
}

type LookState = {
  /** -1 = looking right, 0 = front, 1 = looking left (arrow steps). */
  step: -1 | 0 | 1;
  left: () => void;
  right: () => void;
  reset: () => void;
};

export const useLook = create<LookState>((set) => ({
  step: 0,
  left: () => set((s) => ({ step: Math.min(1, s.step + 1) as LookState["step"] })),
  right: () => set((s) => ({ step: Math.max(-1, s.step - 1) as LookState["step"] })),
  reset: () => set({ step: 0 }),
}));

/**
 * Normalized pointer x in [-1, 1] (0 = centre), updated by CameraRig.
 * `hold` is set while the mouse rests on a hotspot: the view stops turning
 * so the target doesn't slide out from under the cursor.
 */
export const pointer = { x: 0, active: false, hold: false };

/** Mouse contribution in degrees: dead zone, then eased toward the edge. */
export function mouseYawDeg(x: number) {
  const dead = 0.25;
  const a = Math.abs(x);
  if (a <= dead) return 0;
  const t = (a - dead) / (1 - dead);
  const eased = t * t * (3 - 2 * t);
  return -Math.sign(x) * eased * MOUSE_DEG; // mouse left → turn left (+yaw)
}

// Return to the front whenever the visitor reaches a different stop.
if (typeof window !== "undefined") {
  let last = -1;
  useScroll.subscribe((s) => {
    const stop = Math.round(s.stop);
    if (stop !== last) {
      last = stop;
      useLook.getState().reset();
    }
  });
}
