import { create } from "zustand";

/**
 * "Listening on the turntable": clicking the record player moves the camera
 * onto it and opens the playlist window (components/music/ListeningPanel).
 * `started` stays true after the first open so the player keeps running —
 * and the music keeps playing — while the visitor walks the store.
 */
type ListeningState = {
  isOpen: boolean;
  started: boolean;
  /** True while Spotify reports audio playing (drives the always-on control). */
  playing: boolean;
  /** Player is loaded and can be paused/resumed from our UI. */
  ready: boolean;
  open: () => void;
  close: () => void;
  setPlayback: (playing: boolean) => void;
  setReady: (ready: boolean) => void;
};

/** Spotify's embed controller (iFrame API) — the only handle we get on the audio. */
export type SpotifyController = {
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
  addListener: (event: string, cb: (e: { data: { isPaused: boolean; isBuffering: boolean } }) => void) => void;
};
let controller: SpotifyController | null = null;
export const setController = (c: SpotifyController | null) => {
  controller = c;
};
export const togglePlayback = () => controller?.togglePlay();

export const useListening = create<ListeningState>((set) => ({
  isOpen: false,
  started: false,
  playing: false,
  ready: false,
  open: () => set({ isOpen: true, started: true }),
  close: () => set({ isOpen: false }),
  setPlayback: (playing) => set({ playing }),
  setReady: (ready) => set({ ready }),
}));

/** Rectangle's Sessions — the shop playlist. */
export const PLAYLIST_ID = "4K5PZkx4TQo95LJQwMsq01";
