import { create } from "zustand";

type ScrollState = {
  /** Normalized scroll progress 0..1 across the whole page. */
  progress: number;
  /**
   * Last-known section index derived from `progress`. Updated at the same
   * tick as progress so DOM overlays and the camera rig stay in sync.
   */
  section: number;
  setProgress: (p: number, section: number) => void;
};

export const useScroll = create<ScrollState>((set) => ({
  progress: 0,
  section: 0,
  setProgress: (progress, section) => set({ progress, section }),
}));
