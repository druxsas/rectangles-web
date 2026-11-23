"use client";

import { useEffect, useRef } from "react";
import { controlLabels, keyLayout, listPads, live, padFor, readPad, resetLive, PAD_LABELS } from "@/components/games/arcadeInput";
import { GAMES } from "@/games";
import { CABINETS, useArcade, type CabinetId, type InputKind } from "@/stores/arcade";

/**
 * The window that opens when the visitor picks a cabinet: who plays and
 * with what. One or two players; each on the keyboard or on a controller
 * (PlayStation DualShock 4 / DualSense, Xbox One / Series X|S — whatever
 * the browser's Gamepad API reports). Each choice shows its control layout,
 * and the layout lights up as the controls are pressed, like the cabinet's
 * own stick and buttons do.
 */

const display = "var(--font-display), Anton, Impact, sans-serif";
const COBALT = "#165dfa";

/** Feeds `live` from the keyboard and the controllers while a cabinet is open. */
function useArcadeInput(active: boolean) {
  const close = useArcade((s) => s.close);
  useEffect(() => {
    if (!active) return;
    const held = new Set<string>();
    const sync = () => {
      const { players, inputs } = useArcade.getState();
      for (const p of [0, 1] as const) {
        const keys = keyLayout(p, players, inputs);
        if (!keys) continue;
        const c = live[p];
        c.x = (held.has(keys.right) ? 1 : 0) - (held.has(keys.left) ? 1 : 0);
        c.y = (held.has(keys.up) ? 1 : 0) - (held.has(keys.down) ? 1 : 0);
        keys.buttons.forEach((code, i) => (c.buttons[i] = held.has(code)));
        c.start = held.has(keys.start);
      }
    };
    const used = (code: string) => {
      const { players, inputs } = useArcade.getState();
      return ([0, 1] as const).some((p) => {
        const k = keyLayout(p, players, inputs);
        return !!k && (code === k.up || code === k.down || code === k.left || code === k.right || code === k.start || k.buttons.includes(code));
      });
    };
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!used(e.code)) return;
      // Game keys must not scroll the page or press a focused button.
      e.preventDefault();
      if (!e.repeat) {
        // Latch the press so a tap shorter than a frame still reaches the game.
        const { players, inputs } = useArcade.getState();
        for (const p of [0, 1] as const) {
          const k = keyLayout(p, players, inputs);
          if (!k) continue;
          const b = k.buttons.indexOf(e.code);
          if (b >= 0) live[p].tapped[b] = true;
          if (e.code === k.start) live[p].tapped[6] = true;
        }
      }
      held.add(e.code);
      sync();
    };
    const up = (e: KeyboardEvent) => {
      if (held.delete(e.code)) sync();
    };
    const blur = () => {
      held.clear();
      sync();
    };

    // Controllers are polled; the browser only lists one after a button press.
    let raf = 0;
    let known = "";
    const poll = () => {
      raf = requestAnimationFrame(poll);
      const pads = listPads();
      const sig = pads.map((p) => `${p.index}:${p.id}`).join("|");
      if (sig !== known) {
        known = sig;
        useArcade.getState().setPads(pads);
      }
      const { players, inputs } = useArcade.getState();
      for (const p of [0, 1] as const) {
        const pad = padFor(p, players, inputs, pads);
        if (pad) readPad(pad.index, live[p]);
      }
    };
    poll();

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      resetLive();
    };
  }, [active, close]);
}

/** Arcade control layout for one player, labelled with their keys / controller buttons; lights up live. */
function Layout({ player, game }: { player: 0 | 1; game: CabinetId }) {
  const actions = GAMES[game].controls;
  const players = useArcade((s) => s.players);
  const inputs = useArcade((s) => s.inputs);
  const pads = useArcade((s) => s.pads);
  const labels = controlLabels(player, players, inputs, pads);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = root.current;
      if (!el) return;
      const c = live[player];
      el.querySelectorAll<HTMLElement>("[data-b]").forEach((b) => b.toggleAttribute("data-on", c.buttons[Number(b.dataset.b)]));
      el.querySelector<HTMLElement>("[data-start]")?.toggleAttribute("data-on", c.start);
      const knob = el.querySelector<HTMLElement>("[data-knob]");
      if (knob) knob.style.transform = `translate(${c.x * 9}px, ${-c.y * 9}px)`;
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [player]);

  if (!labels) return null;
  return (
    <div ref={root} className="arcade-layout" data-player={player + 1}>
      <div className="arcade-stick">
        <div className="arcade-stick-well">
          <span data-knob className="arcade-knob" />
        </div>
        <span className="arcade-key">{labels.stick}</span>
        <span className="arcade-caption">{actions.stickShort}</span>
      </div>
      {/* Each button shows its key (or controller button) and, under it, what it does in this game */}
      <div className="arcade-buttons">
        {labels.buttons.map((label, i) => (
          <div key={i} className="arcade-cell" data-off={actions.buttons[i] === "—" || undefined}>
            <span data-b={i} className="arcade-btn">
              {label}
            </span>
            <span className="arcade-caption">{actions.buttons[i] === "—" ? "Not used" : actions.buttons[i]}</span>
          </div>
        ))}
      </div>
      <div className="arcade-start">
        <span data-start className="arcade-btn arcade-btn-start">
          {labels.start}
        </span>
        <span className="arcade-caption">Start game</span>
      </div>
    </div>
  );
}

function PlayerSetup({ player, game }: { player: 0 | 1; game: CabinetId }) {
  const players = useArcade((s) => s.players);
  const inputs = useArcade((s) => s.inputs);
  const pads = useArcade((s) => s.pads);
  const setInput = useArcade((s) => s.setInput);
  const kind = inputs[player];
  const pad = padFor(player, players, inputs, pads);
  const shared = players === 2 && inputs[0] === "keyboard" && inputs[1] === "keyboard";
  const option = (value: InputKind, label: string) => (
    <button type="button" className="arcade-seg" data-on={kind === value || undefined} aria-pressed={kind === value} onClick={() => setInput(player, value)}>
      {label}
    </button>
  );
  return (
    <section className="arcade-player">
      <div className="arcade-row">
        <h3 style={{ fontFamily: display, fontSize: 22, lineHeight: 1, margin: 0, textTransform: "uppercase" }}>
          Player {player + 1}
          <span style={{ color: player === 0 ? COBALT : "#d9d6cd", marginLeft: 8 }}>●</span>
        </h3>
        <div className="arcade-segs" role="group" aria-label={`Player ${player + 1} plays with`}>
          {option("keyboard", "Keyboard")}
          {option("gamepad", "Controller")}
        </div>
      </div>
      <p className="arcade-note">
        {kind === "keyboard"
          ? shared
            ? player === 0
              ? "Left side of the keyboard."
              : "Right side of the keyboard."
            : "Arrow keys move the stick."
          : pad
            ? `${PAD_LABELS[pad.family].name} connected${pad.standard ? "" : " — this browser reports a non-standard layout; Chrome or Edge map it correctly"}.`
            : "Press any button on the controller to connect it."}
      </p>
      <Layout player={player} game={game} />
    </section>
  );
}

export function ArcadePanel() {
  const cabinet = useArcade((s) => s.cabinet);
  const players = useArcade((s) => s.players);
  const inputs = useArcade((s) => s.inputs);
  const open = useArcade((s) => s.open);
  const close = useArcade((s) => s.close);
  const setPlayers = useArcade((s) => s.setPlayers);
  const isOpen = cabinet !== null;
  useArcadeInput(isOpen);

  // Remember the last cabinet so the window can fade out with its content.
  const last = useRef<CabinetId>(0);
  useEffect(() => {
    if (cabinet !== null) last.current = cabinet;
    const root = document.documentElement;
    if (isOpen) root.dataset.arcade = "";
    else delete root.dataset.arcade;
  }, [cabinet, isOpen]);
  // eslint-disable-next-line react-hooks/refs -- only read to keep the title while the window fades out
  const shown = cabinet ?? last.current;
  const other = (shown === 0 ? 1 : 0) as CabinetId;
  const usesPad = inputs[0] === "gamepad" || (players === 2 && inputs[1] === "gamepad");

  return (
    <aside
      role="dialog"
      aria-label="Arcade setup"
      aria-hidden={!isOpen}
      className="arcade-panel fixed z-50 flex flex-col"
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "none" : "translateY(14px)",
        visibility: isOpen ? "visible" : "hidden",
        pointerEvents: isOpen ? "auto" : "none",
        transition: isOpen
          ? "opacity 320ms ease 520ms, transform 420ms cubic-bezier(.2,.7,.2,1) 520ms, visibility 0s"
          : "opacity 200ms ease, transform 200ms ease, visibility 0s 200ms",
      }}
    >
      <div className="arcade-row">
        <span className="font-mono text-mono-sm uppercase" style={{ color: "#8e9196" }}>
          <span style={{ color: COBALT }}>03</span> · Games · Cabinet {String(shown + 1).padStart(2, "0")}
        </span>
        <button type="button" onClick={close} tabIndex={isOpen ? 0 : -1} aria-label="Leave the cabinet and go back to the space" className="arcade-close">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div>
        <h2 style={{ fontFamily: display, fontSize: 34, lineHeight: 0.95, textTransform: "uppercase", margin: 0 }}>{CABINETS[shown].title}</h2>
        <p className="arcade-note" style={{ marginTop: 6 }}>
          Set up your controls, then press <strong style={{ color: "#f7f7f3" }}>Start</strong> to play. The stick and buttons on the cabinet move with
          yours.
        </p>
      </div>

      <div className="arcade-how">
        <span className="arcade-label">How to play</span>
        <p className="arcade-note">{GAMES[shown].controls.stick}</p>
      </div>

      <div className="arcade-row">
        <span className="arcade-label">Players</span>
        <div className="arcade-segs" role="group" aria-label="Number of players">
          {([1, 2] as const).map((n) => (
            <button key={n} type="button" className="arcade-seg" data-on={players === n || undefined} aria-pressed={players === n} onClick={() => setPlayers(n)}>
              {n === 1 ? "1 player" : "2 players"}
            </button>
          ))}
        </div>
      </div>

      <PlayerSetup player={0} game={shown} />
      {players === 2 && <PlayerSetup player={1} game={shown} />}

      {usesPad && (
        <p className="arcade-note" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(22,93,250,0.14)", border: "1px solid rgba(22,93,250,0.5)", color: "#dfe3ea" }}>
          <strong style={{ color: "#f7f7f3" }}>Controllers:</strong> PS4 DualShock 4, PS5 DualSense, Xbox One and Xbox Series X|S, by USB or Bluetooth. Works best
          in Chrome or Edge.
        </p>
      )}

      <div className="arcade-row" style={{ marginTop: "auto" }}>
        <button type="button" className="arcade-link" onClick={() => open(other)} tabIndex={isOpen ? 0 : -1}>
          Switch to cabinet {String(other + 1).padStart(2, "0")} — {CABINETS[other].title}
        </button>
        <span className="font-mono text-mono-sm uppercase" style={{ color: "#8e9196" }}>
          Esc to leave
        </span>
      </div>

      <style>{`
.arcade-panel{top:84px;right:24px;bottom:24px;width:min(450px,calc(100vw - 48px));overflow-y:auto;gap:16px;padding:18px;
  background:rgba(12,13,15,.94);border:1px solid rgba(247,247,243,.14);backdrop-filter:blur(10px);color:#f7f7f3}
.arcade-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.arcade-close{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:16px;border:1.5px solid rgba(247,247,243,.5)}
.arcade-label{font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#b9bcc0}
.arcade-note{font-size:13px;line-height:1.4;margin:0;color:#b9bcc0}
.arcade-segs{display:flex;border:1px solid rgba(247,247,243,.28);border-radius:8px;overflow:hidden}
.arcade-seg{padding:7px 12px;font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#b9bcc0;cursor:pointer}
.arcade-seg[data-on]{background:#f7f7f3;color:#101113}
.arcade-player{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:12px;background:rgba(247,247,243,.05);border:1px solid rgba(247,247,243,.1)}
.arcade-layout{display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:10px;background:#6f747a;color:#101113}
.arcade-stick,.arcade-start{display:flex;flex-direction:column;align-items:center;gap:6px}
.arcade-stick-well{display:flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:50%;background:#101113;box-shadow:0 0 0 3px #a9adb2}
.arcade-knob{width:26px;height:26px;border-radius:50%;background:${COBALT};box-shadow:inset -3px -4px 6px rgba(0,0,0,.35);transition:transform 70ms ease-out}
.arcade-key{font-family:var(--font-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.05em;color:#101113;white-space:nowrap}
.arcade-caption{max-width:62px;font-size:10px;line-height:1.15;font-weight:600;text-align:center;color:#101113}
.arcade-buttons{display:grid;grid-template-columns:repeat(3,62px);gap:10px 4px;margin-left:auto}
.arcade-cell{display:flex;flex-direction:column;align-items:center;gap:5px}
.arcade-cell[data-off]{opacity:.38}
.arcade-btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#101113;color:#f7f7f3;
  font-family:var(--font-display),Anton,Impact,sans-serif;font-size:17px;line-height:1;box-shadow:0 3px 0 #000;transition:transform 60ms ease-out,box-shadow 60ms ease-out}
.arcade-cell:nth-child(-n+3) .arcade-btn{background:${COBALT}}
.arcade-layout[data-player="2"] .arcade-knob,.arcade-layout[data-player="2"] .arcade-cell:nth-child(n+4) .arcade-btn,.arcade-layout[data-player="2"] .arcade-btn-start{background:#d9d6cd;color:#101113}
.arcade-btn[data-on]{transform:translateY(3px);box-shadow:0 0 0 #000,0 0 0 3px #f7f7f3}
.arcade-btn-start{width:auto;min-width:40px;height:32px;padding:0 10px;border-radius:16px;font-size:13px;text-transform:uppercase}
.arcade-how{display:flex;flex-direction:column;gap:6px}
.arcade-link{font-size:13px;color:#f7f7f3;text-decoration:underline;text-underline-offset:3px;text-align:left;cursor:pointer}
`}</style>
    </aside>
  );
}
