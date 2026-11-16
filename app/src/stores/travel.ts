import { create } from "zustand";

/**
 * A direct jump between stops (menu / hotspot click).
 *
 * While active, the camera flies in a straight line from where it was to
 * the target stop instead of following the scroll path through every stop
 * in between; captions only show the origin and destination. The page
 * scroll still moves underneath (so the scroll position ends on the target)
 * — `stop` progress is used only as the flight's 0→1 timeline.
 */
type TravelState = {
  active: boolean;
  from: number;
  to: number;
  start: (from: number, to: number) => void;
  end: () => void;
};

export const useTravel = create<TravelState>((set) => ({
  active: false,
  from: 0,
  to: 0,
  start: (from, to) => set({ active: true, from, to }),
  end: () => set({ active: false }),
}));
