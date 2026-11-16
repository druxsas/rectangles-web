import { create } from "zustand";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";

/**
 * Walkthrough position.
 *
 * `stop` is the camera position measured in stops (0 = facade … n−1), so
 * everything that follows the walk (camera, captions, nav, hotspots, doors)
 * reads one shared value. `progress` (0..1) is only for the progress bar.
 *
 * The last stop — the bag handoff — is only reachable after the demo
 * checkout: until then the page has one section less and the walk ends at
 * the shop (iMac) stop.
 */
type ScrollState = {
  /** Normalized scroll progress 0..1 across the page (progress bar). */
  progress: number;
  /** Camera position in stops, 0 … reachableStops() − 1 (fractional while moving). */
  stop: number;
  setScroll: (progress: number, stop: number) => void;
};

export const useScroll = create<ScrollState>((set) => ({
  progress: 0,
  stop: 0,
  setScroll: (progress, stop) => set({ progress, stop }),
}));

/** Stops the visitor can currently walk to (the handoff unlocks after checkout). */
export function reachableStops(purchased = useCheckout.getState().purchased) {
  return purchased ? KEYFRAMES.length : KEYFRAMES.length - 1;
}

export function useReachableStops() {
  return useCheckout((s) => reachableStops(s.purchased));
}

/** Stop ids that never appear in the menu (reached through the story instead). */
export const HIDDEN_IN_MENU = new Set(["handoff"]);
