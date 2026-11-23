import { create } from "zustand";

/**
 * "Playing at a cabinet": clicking an arcade moves the camera onto it and
 * opens the setup window (components/games/ArcadePanel) — one or two
 * players, and what each one plays with. While it is open the cabinet's
 * joysticks and buttons follow the players' keyboard / controller input.
 */

export type CabinetId = 0 | 1;
export type InputKind = "keyboard" | "gamepad";
export type PadFamily = "playstation" | "xbox" | "generic";
export type ConnectedPad = { index: number; id: string; family: PadFamily; standard: boolean };

/** The two cabinets (Store.tsx GamesZone): where they stand and the game each runs (games/index.ts). */
export const CABINETS: { z: number; title: string }[] = [
  { z: 2.55, title: "Rooftop Rumble" },
  { z: 1.7, title: "Night Drive" },
];

type ArcadeState = {
  /** Cabinet being played, or null while walking the shop. */
  cabinet: CabinetId | null;
  players: 1 | 2;
  inputs: [InputKind, InputKind];
  /** Controllers the browser currently reports, in connection order. */
  pads: ConnectedPad[];
  open: (cabinet: CabinetId) => void;
  close: () => void;
  setPlayers: (players: 1 | 2) => void;
  setInput: (player: 0 | 1, kind: InputKind) => void;
  setPads: (pads: ConnectedPad[]) => void;
};

export const useArcade = create<ArcadeState>((set) => ({
  cabinet: null,
  players: 1,
  inputs: ["keyboard", "keyboard"],
  pads: [],
  open: (cabinet) => set({ cabinet }),
  close: () => set({ cabinet: null }),
  setPlayers: (players) => set({ players }),
  setInput: (player, kind) => set((s) => ({ inputs: player === 0 ? [kind, s.inputs[1]] : [s.inputs[0], kind] })),
  setPads: (pads) => set({ pads }),
}));
