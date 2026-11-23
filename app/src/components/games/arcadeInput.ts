import type { ConnectedPad, InputKind, PadFamily } from "@/stores/arcade";

/**
 * Arcade controls: one stick, six buttons (two rows of three) and Start per
 * player, fed by the keyboard or a controller.
 *
 * `live` is the current state of both players' controls. It is plain mutable
 * data, written by the input listeners and read every frame by the 3D
 * cabinet (and, later, the games) — it never goes through React.
 */

export type Controls = {
  /** Stick: -1 left … 1 right, -1 down … 1 up. */
  x: number;
  y: number;
  /** Top row left→right, then bottom row left→right. */
  buttons: [boolean, boolean, boolean, boolean, boolean, boolean];
  start: boolean;
  /**
   * Presses not yet seen by the game (six buttons, then Start): a quick tap
   * can go down and up between two frames, so key-downs are latched here
   * and cleared by whoever consumes them.
   */
  tapped: boolean[];
};

const blank = (): Controls => ({ x: 0, y: 0, buttons: [false, false, false, false, false, false], start: false, tapped: Array(7).fill(false) });
export const live: [Controls, Controls] = [blank(), blank()];
export function resetLive() {
  live[0] = blank();
  live[1] = blank();
}

// ----------------------------------------------------------------
// Keyboard — by physical key (KeyboardEvent.code), so it works the same on
// any layout; only letters, arrows, Enter and Space are used because they
// sit in the same place on every Latin keyboard.
// ----------------------------------------------------------------
export type KeyLayout = { up: string; down: string; left: string; right: string; buttons: string[]; start: string };

/** One player on the keyboard. */
const SOLO: KeyLayout = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  buttons: ["KeyA", "KeyS", "KeyD", "KeyZ", "KeyX", "KeyC"],
  start: "Enter",
};
/** Two players sharing it: player 1 on the left hand side, player 2 on the right. */
const SHARED: [KeyLayout, KeyLayout] = [
  { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", buttons: ["KeyR", "KeyT", "KeyY", "KeyF", "KeyG", "KeyH"], start: "Space" },
  { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", buttons: ["KeyU", "KeyI", "KeyO", "KeyJ", "KeyK", "KeyL"], start: "Enter" },
];

/** The key layout a player uses, or null if they are on a controller / not playing. */
export function keyLayout(player: 0 | 1, players: 1 | 2, inputs: [InputKind, InputKind]): KeyLayout | null {
  if (player === 1 && players === 1) return null;
  if (inputs[player] !== "keyboard") return null;
  const other = player === 0 ? 1 : 0;
  const shared = players === 2 && inputs[other] === "keyboard";
  return shared ? SHARED[player] : SOLO;
}

/** What is printed on a key: "KeyA" → "A", "ArrowUp" → "↑". */
export function keyLabel(code: string) {
  if (code.startsWith("Key")) return code.slice(3);
  return { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Enter: "Enter", Space: "Space" }[code] ?? code;
}

// ----------------------------------------------------------------
// Controllers — the Gamepad API's "standard" layout, which is what browsers
// report for PlayStation (DualShock 4, DualSense) and Xbox (One, Series X|S)
// controllers.
// ----------------------------------------------------------------
/** Standard-layout button index for each arcade button, and for Start. */
export const PAD_BUTTONS = [2, 3, 5, 0, 1, 7];
export const PAD_START = 9;
const PAD_DPAD = { up: 12, down: 13, left: 14, right: 15 };
const DEADZONE = 0.4;

export const PAD_LABELS: Record<PadFamily, { buttons: string[]; start: string; stick: string; name: string }> = {
  playstation: { buttons: ["□", "△", "R1", "✕", "○", "R2"], start: "Options", stick: "Left stick / D-pad", name: "PlayStation controller" },
  xbox: { buttons: ["X", "Y", "RB", "A", "B", "RT"], start: "Menu", stick: "Left stick / D-pad", name: "Xbox controller" },
  generic: { buttons: ["3", "4", "R1", "1", "2", "R2"], start: "Start", stick: "Left stick / D-pad", name: "Controller" },
};

export function padFamily(id: string): PadFamily {
  const s = id.toLowerCase();
  if (/054c|dualsense|dualshock|playstation|wireless controller/.test(s)) return "playstation";
  if (/045e|xbox|xinput/.test(s)) return "xbox";
  return "generic";
}

export function listPads(): ConnectedPad[] {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return [];
  return [...navigator.getGamepads()]
    .filter((p): p is Gamepad => !!p && p.connected)
    .map((p) => ({ index: p.index, id: p.id, family: padFamily(p.id), standard: p.mapping === "standard" }));
}

/** Which connected controller a player gets: controller players take them in order. */
export function padFor(player: 0 | 1, players: 1 | 2, inputs: [InputKind, InputKind], pads: ConnectedPad[]): ConnectedPad | null {
  if (player === 1 && players === 1) return null;
  if (inputs[player] !== "gamepad") return null;
  const slot = player === 1 && inputs[0] === "gamepad" ? 1 : 0;
  return pads[slot] ?? null;
}

export function readPad(index: number, into: Controls) {
  const pad = navigator.getGamepads()[index];
  if (!pad) return;
  const pressed = (i: number) => !!pad.buttons[i]?.pressed;
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  into.x = pressed(PAD_DPAD.left) ? -1 : pressed(PAD_DPAD.right) ? 1 : Math.abs(ax) > DEADZONE ? Math.sign(ax) : 0;
  into.y = pressed(PAD_DPAD.up) ? 1 : pressed(PAD_DPAD.down) ? -1 : Math.abs(ay) > DEADZONE ? -Math.sign(ay) : 0;
  PAD_BUTTONS.forEach((b, i) => (into.buttons[i] = pressed(b)));
  into.start = pressed(PAD_START);
}

/** Labels for a player's six buttons and Start with their current input, or null if they aren't playing. */
export function controlLabels(
  player: 0 | 1,
  players: 1 | 2,
  inputs: [InputKind, InputKind],
  pads: ConnectedPad[],
): { buttons: string[]; start: string; stick: string } | null {
  if (player === 1 && players === 1) return null;
  const keys = keyLayout(player, players, inputs);
  if (keys) {
    return {
      buttons: keys.buttons.map(keyLabel),
      start: keyLabel(keys.start),
      stick: [keys.up, keys.left, keys.down, keys.right].map(keyLabel).join(" "),
    };
  }
  const pad = padFor(player, players, inputs, pads);
  return PAD_LABELS[pad?.family ?? "generic"];
}
