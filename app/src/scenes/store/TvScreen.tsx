"use client";

import { useEffect, useMemo, useState } from "react";
import { displayFont, drawLogo, whenBrandReady } from "@/scenes/store/brandCanvas";
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

  useEffect(() => {
    const el = document.createElement("video");
    let index = 0;
    el.src = playlist[index];
    el.crossOrigin = "anonymous";
    el.loop = playlist.length === 1;
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
      index = (index + 1) % playlist.length;
      el.src = playlist[index];
      el.play().catch(() => {});
    };
    el.addEventListener("loadeddata", onReady, { once: true });
    el.addEventListener("ended", onEnded);
    el.load();

    return () => {
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("ended", onEnded);
      el.pause();
      el.removeAttribute("src");
      el.load();
      tex?.dispose();
    };
  }, [playlist]);

  return video ?? idle;
}
