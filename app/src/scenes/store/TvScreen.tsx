"use client";

import { useEffect, useMemo, useState } from "react";
import { displayFont, drawLogo, whenBrandReady } from "@/scenes/store/brandCanvas";
import { useScroll } from "@/stores/scroll";
import { useQuality } from "@/canvas/quality";
import { CanvasTexture, LinearFilter, SRGBColorSpace, VideoTexture, type Texture } from "three";

/**
 * Licensed stock clips, re-encoded from the ProRes masters in /Video with
 * macOS `avconvert -p Preset640x480` (→ 640×360 H.264, ~3 MB each).
 * They play in sequence and the playlist loops.
 */
export const TV_PLAYLIST = ["/video/skate-rail.mp4", "/video/skate-pole.mp4"];

/** The TV panel is wider than 16:9 — crop the 16:9 clips to cover it. */
export const TV_SCREEN_ASPECT = 1.31 / 0.634;

function cover(t: Texture, aspect: number) {
  const k = 16 / 9 / aspect; // visible fraction of the frame height
  t.repeat.set(1, k);
  t.offset.set(0, (1 - k) / 2);
}

/** Idle card shown until the clip loads (or if it is missing). */
function paintIdle(ctx: CanvasRenderingContext2D, logo?: HTMLImageElement) {
  ctx.fillStyle = "#0d0e10";
  ctx.fillRect(0, 0, 640, 360);
  if (logo) drawLogo(ctx, logo, "framed-white", 320, 160, 300);
  ctx.fillStyle = "#165dfa";
  ctx.font = `400 22px ${displayFont()}`;
  ctx.textAlign = "center";
  ctx.fillText("SKATE TV", 320, 262);
}

function makeIdleTexture() {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 360;
  const ctx = c.getContext("2d")!;
  paintIdle(ctx);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  cover(t, TV_SCREEN_ASPECT);
  whenBrandReady(["framed-white"], (logos) => {
    paintIdle(ctx, logos["framed-white"]);
    t.needsUpdate = true;
  });
  return t;
}

function useIdleTexture() {
  return useMemo(() => makeIdleTexture(), []);
}

export function useTvTexture(playlist: string[] = TV_PLAYLIST): Texture {
  const idle = useIdleTexture();
  const [video, setVideo] = useState<VideoTexture | null>(null);
  const [wanted, setWanted] = useState(false);

  // Don't compete with the 3D assets on first load: start fetching the clip
  // once the visitor begins walking in (or after a short idle at the facade).
  useEffect(() => {
    if (wanted) return;
    const go = () => setWanted(true);
    const t = window.setTimeout(go, 6000);
    const unsub = useScroll.subscribe((s) => {
      if (s.progress > 0.01) go();
    });
    return () => {
      window.clearTimeout(t);
      unsub();
    };
  }, [wanted]);

  useEffect(() => {
    if (!wanted) return;
    // Phones: one clip on loop. Desktop: the playlist, each clip fetched
    // once into a blob URL — swapping `src` to a network URL re-downloads
    // the whole file on every cycle.
    const clips = useQuality.getState().tier === "low" ? playlist.slice(0, 1) : playlist;
    const blobs: string[] = [];
    let cancelled = false;
    const el = document.createElement("video");
    let index = 0;
    el.crossOrigin = "anonymous";
    el.loop = clips.length === 1;
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tex: VideoTexture | null = null;

    const onReady = () => {
      tex = new VideoTexture(el);
      tex.colorSpace = SRGBColorSpace;
      tex.minFilter = LinearFilter;
      tex.magFilter = LinearFilter;
      cover(tex, TV_SCREEN_ASPECT);
      setVideo(tex);
      if (!reduced) el.play().catch(() => {});
    };
    const onEnded = () => {
      index = (index + 1) % clips.length;
      el.src = blobs[index];
      el.play().catch(() => {});
    };
    el.addEventListener("loadeddata", onReady, { once: true });
    el.addEventListener("ended", onEnded);

    // Fetch clips sequentially; start playback as soon as the first one lands.
    (async () => {
      for (const url of clips) {
        const res = await fetch(url);
        const blob = await res.blob();
        if (cancelled) return;
        blobs.push(URL.createObjectURL(blob));
        if (blobs.length === 1) {
          el.src = blobs[0];
          el.load();
        }
      }
    })().catch(() => {});

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("ended", onEnded);
      el.pause();
      el.removeAttribute("src");
      el.load();
      tex?.dispose();
      blobs.forEach((b) => URL.revokeObjectURL(b));
    };
  }, [playlist, wanted]);

  return video ?? idle;
}
