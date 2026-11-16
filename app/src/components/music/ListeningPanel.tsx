"use client";

import { useEffect, useRef, useState } from "react";
import { PLAYLIST_ID, setController, togglePlayback, useListening, type SpotifyController } from "@/stores/listening";

/**
 * The playlist window that opens when the visitor clicks the turntable.
 *
 * It is Spotify's own embedded player for the Rectangle's Sessions playlist:
 * the visitor picks a track from the list and it plays right here (full
 * tracks when they're signed in to Spotify, previews otherwise) — no API
 * keys or login flow on our side.
 *
 * Once opened, the player stays mounted while the window is closed, so the
 * music keeps going during the walkthrough; a small pill brings it back.
 */

const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

type IFrameAPI = {
  createController: (el: HTMLElement, options: Record<string, unknown>, cb: (c: SpotifyController) => void) => void;
};
let apiPromise: Promise<IFrameAPI> | null = null;
/** Loads Spotify's iFrame API once. */
function loadApi() {
  apiPromise ??= new Promise<IFrameAPI>((resolve) => {
    (window as unknown as { onSpotifyIframeApiReady: (api: IFrameAPI) => void }).onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = API_SRC;
    script.async = true;
    document.body.appendChild(script);
  });
  return apiPromise;
}

/**
 * Spotify's embedded player, created through their iFrame API so the page
 * can pause/resume it and know when audio is playing. (That API offers no
 * volume or mute — browsers don't let a page change another site's audio —
 * so pause is our "silence".)
 */
function SpotifyPlayer() {
  const host = useRef<HTMLDivElement>(null);
  const setPlayback = useListening((s) => s.setPlayback);
  const setReady = useListening((s) => s.setReady);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let gone = false;
    let mine: SpotifyController | null = null;
    // The API swaps the node it is given for an iframe, so hand it a child
    // React doesn't manage.
    const slot = document.createElement("div");
    el.appendChild(slot);
    loadApi().then((api) => {
      if (gone) return;
      api.createController(slot, { uri: `spotify:playlist:${PLAYLIST_ID}`, width: "100%", height: "100%", theme: "dark" }, (c) => {
        if (gone) return c.destroy();
        mine = c;
        setController(c);
        setReady(true);
        c.addListener("playback_update", (e) => setPlayback(!e.data.isPaused));
      });
    });
    return () => {
      gone = true;
      mine?.destroy();
      setController(null);
      setReady(false);
      setPlayback(false);
      el.replaceChildren();
    };
  }, [setPlayback, setReady]);

  return <div ref={host} className="spotify-host" style={{ flex: 1, minHeight: 232, borderRadius: 12, overflow: "hidden", background: "#121212" }} />;
}
const LINK = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
/** Spotify's own sign-in page; it lands on the playlist afterwards. */
const LOGIN = `https://accounts.spotify.com/login?continue=${encodeURIComponent(LINK)}`;
const NOTICE_KEY = "rectangles:spotify-notice";

const display = "var(--font-display), Anton, Impact, sans-serif";

export function ListeningPanel() {
  const isOpen = useListening((s) => s.isOpen);
  const started = useListening((s) => s.started);
  const open = useListening((s) => s.open);
  const close = useListening((s) => s.close);
  const playing = useListening((s) => s.playing);
  const ready = useListening((s) => s.ready);

  // Spotify only plays full tracks to listeners signed in to Spotify in this
  // browser (we can't see whether they are — the player is cross-origin), so
  // the window explains the 30-second previews and offers the sign-in. After
  // they come back from signing in, the player is reloaded to pick it up.
  // Safari (and every iOS browser) never shares Spotify's sign-in with players
  // embedded in other sites, so signing in can't help there: point those
  // visitors straight to Spotify instead of a sign-in that changes nothing.
  const [notice, setNotice] = useState<"hint" | "waiting" | "refreshed" | "blocked" | "off">("hint");
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(NOTICE_KEY) === "off") return queueMicrotask(() => setNotice("off"));
    } catch {}
    const ua = navigator.userAgent;
    const webkitOnly = /iP(hone|ad|od)/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua));
    if (webkitOnly) queueMicrotask(() => setNotice("blocked"));
  }, []);

  const popup = useRef<Window | null>(null);
  const refresh = () => {
    setPlayerKey((k) => k + 1);
    setNotice("refreshed");
  };

  // While the sign-in window is open: reload the player as soon as it is
  // closed, or when the visitor comes back to this page.
  useEffect(() => {
    if (notice !== "waiting") return;
    const poll = window.setInterval(() => {
      if (popup.current?.closed) refresh();
    }, 600);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", refresh);
    };
  }, [notice]);

  const signIn = () => {
    const w = 480;
    const h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    popup.current = window.open(LOGIN, "spotify-login", `width=${w},height=${h},left=${left},top=${top}`);
    setNotice("waiting");
  };
  const dismiss = () => {
    setNotice("off");
    try {
      localStorage.setItem(NOTICE_KEY, "off");
    } catch {}
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isOpen) root.dataset.listening = "";
    else delete root.dataset.listening;
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!started) return null;

  return (
    <>
      <aside
        role="dialog"
        aria-label="Rectangle's Sessions playlist"
        aria-hidden={!isOpen}
        className="listening-panel fixed z-50 flex flex-col"
        style={{
          background: "rgba(12,13,15,0.94)",
          border: "1px solid rgba(247,247,243,0.14)",
          backdropFilter: "blur(10px)",
          color: "#f7f7f3",
          padding: 18,
          gap: 14,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "none" : "translateY(14px)",
          // Kept in the tree (not display:none) so playback continues when closed.
          visibility: isOpen ? "visible" : "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          transition: isOpen
            ? "opacity 320ms ease 520ms, transform 420ms cubic-bezier(.2,.7,.2,1) 520ms, visibility 0s"
            : "opacity 200ms ease, transform 200ms ease, visibility 0s 200ms",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-mono-sm uppercase" style={{ color: "#8e9196" }}>
            <span style={{ color: "#165dfa" }}>05</span> · Music · Now on the turntable
          </span>
          <button
            type="button"
            onClick={close}
            tabIndex={isOpen ? 0 : -1}
            aria-label="Close the playlist and go back to the space"
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 16, border: "1.5px solid rgba(247,247,243,0.5)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center" style={{ gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/music/sessions-cover.webp" alt="Rectangle's Sessions cover" width={84} height={84} style={{ display: "block", flexShrink: 0 }} />
          <div>
            <h2 style={{ fontFamily: display, fontSize: 34, lineHeight: 0.95, textTransform: "uppercase", margin: 0 }}>Rectangle&apos;s Sessions</h2>
            <p style={{ fontSize: 14, lineHeight: 1.35, margin: "6px 0 0", color: "#b9bcc0" }}>
              The shop playlist. Pick a track — it keeps playing while you look around.
            </p>
          </div>
        </div>

        {notice !== "off" && (
          <div
            role="status"
            className="flex items-center"
            style={{ gap: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(22,93,250,0.14)", border: "1px solid rgba(22,93,250,0.5)", fontSize: 13, lineHeight: 1.35 }}
          >
            <p style={{ margin: 0, flex: 1, color: "#dfe3ea" }}>
              {notice === "blocked" ? (
                <>
                  <strong style={{ color: "#f7f7f3" }}>This browser plays 30-second previews here.</strong> For full tracks, open the playlist in Spotify or
                  visit in Chrome.
                </>
              ) : notice === "refreshed" ? (
                <>
                  Player refreshed. Still on previews? Your browser is keeping Spotify&apos;s sign-in out of other sites —{" "}
                  <a href={LINK} target="_blank" rel="noreferrer" style={{ color: "#f7f7f3", textDecoration: "underline" }}>
                    listen in Spotify
                  </a>
                  .
                </>
              ) : notice === "waiting" ? (
                <>Sign in on the Spotify window, then close it — the player refreshes on its own.</>
              ) : (
                <>
                  <strong style={{ color: "#f7f7f3" }}>Hearing 30-second previews?</strong> Sign in to Spotify to play full tracks.
                </>
              )}
            </p>
            {notice === "blocked" && (
              <a
                href={LINK}
                target="_blank"
                rel="noreferrer"
                tabIndex={isOpen ? 0 : -1}
                style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 16, background: "#f7f7f3", color: "#0c0d0f", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
              >
                Open in Spotify
              </a>
            )}
            {notice === "waiting" && (
              <button
                type="button"
                onClick={refresh}
                tabIndex={isOpen ? 0 : -1}
                style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 16, background: "#f7f7f3", color: "#0c0d0f", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
              >
                Refresh player
              </button>
            )}
            {notice === "hint" && (
              <button
                type="button"
                onClick={signIn}
                tabIndex={isOpen ? 0 : -1}
                style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 16, background: "#f7f7f3", color: "#0c0d0f", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
              >
                Sign in to Spotify
              </button>
            )}
            <button type="button" onClick={dismiss} tabIndex={isOpen ? 0 : -1} aria-label="Dismiss this notice" style={{ flexShrink: 0, width: 22, height: 22, color: "#b9bcc0" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        <SpotifyPlayer key={playerKey} />

        <div className="flex items-center justify-between font-mono text-mono-sm uppercase" style={{ color: "#8e9196" }}>
          <button type="button" onClick={close} tabIndex={isOpen ? 0 : -1} style={{ textTransform: "uppercase" }}>
            ← Back to the space
          </button>
          <a href={LINK} target="_blank" rel="noreferrer" tabIndex={isOpen ? 0 : -1} style={{ color: "#f7f7f3" }}>
            Open in Spotify ↗
          </a>
        </div>
      </aside>

      {/* Always-on audio control (while the window is closed): pause/resume
          the music from anywhere in the store, or reopen the playlist. */}
      <div
        className="fixed z-40 flex items-center font-mono text-mono-sm uppercase"
        style={{
          right: 20,
          bottom: 76,
          gap: 4,
          padding: 5,
          borderRadius: 24,
          background: "rgba(12,13,15,0.86)",
          border: "1px solid rgba(247,247,243,0.22)",
          backdropFilter: "blur(6px)",
          color: "#f7f7f3",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          transition: "opacity 260ms ease",
        }}
      >
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!ready}
          aria-label={playing ? "Pause the music" : "Play the music"}
          aria-pressed={playing}
          tabIndex={isOpen ? -1 : 0}
          className="flex items-center justify-center"
          style={{ width: 34, height: 34, borderRadius: 17, background: playing ? "#165dfa" : "rgba(247,247,243,0.12)", opacity: ready ? 1 : 0.5 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            {playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M3 1l8 5-8 5z" />}
          </svg>
        </button>
        <button
          type="button"
          onClick={open}
          aria-label="Open the Rectangle's Sessions playlist"
          tabIndex={isOpen ? -1 : 0}
          className="flex items-center"
          style={{ gap: 8, padding: "0 10px 0 4px", height: 34, borderRadius: 17, textTransform: "uppercase" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/music/sessions-cover.webp" alt="" width={24} height={24} style={{ borderRadius: 12, display: "block" }} />
          <span>{playing ? "Playing" : "Sessions"}</span>
          {playing && (
            <span className="eq" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          )}
        </button>
      </div>

      <style>{`
        .listening-panel{top:84px;right:24px;bottom:24px;width:min(440px,calc(100vw - 48px))}
        @media (max-width: 767px){.listening-panel{top:auto;left:10px;right:10px;bottom:10px;width:auto;height:min(66vh,560px)}}
        .spotify-host iframe{display:block;width:100%;height:100%;border:0}
        .eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px}
        .eq i{width:2px;height:100%;background:#165dfa;transform-origin:bottom;animation:eq 900ms ease-in-out infinite}
        .eq i:nth-child(2){animation-delay:-300ms}.eq i:nth-child(3){animation-delay:-600ms}
        @keyframes eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
        @media (prefers-reduced-motion: reduce){.eq i{animation:none}}
        @media (prefers-reduced-motion: reduce){.listening-panel{transition:none!important;transform:none!important}}
      `}</style>
    </>
  );
}
