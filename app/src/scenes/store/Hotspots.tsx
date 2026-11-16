"use client";

import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";
import { isInside, pointer } from "@/canvas/lookAround";
import { scrollToSection } from "@/components/smooth-scroll";
import { IMAC, SCREEN } from "@/scenes/store/imacPose";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";

/**
 * Desktop-only hotspots: a pulsing cobalt ring (/Images/rectangles-hotspot-
 * pulse.gif → public/ui/hotspot.webp) over each interactive area once the
 * camera is inside the shop; from the street a single ring sits on the door
 * ("Enter"). Hovering freezes the look-around and floats the section title
 * above the ring. Clicking
 * glides to that stop; on the shop stop the iMac ring opens the store.
 * Scroll navigation is unchanged. Hidden on touch devices and while shopping.
 */

type Spot = { stop: string; label: string; at: [number, number, number]; title?: string };

/** Shown only from the street: the door, leading inside. */
const DOOR: Spot = { stop: "entrance", label: "Enter the store", title: "Enter", at: [0, 1.45, 5.05] };

const SPOTS: Spot[] = [
  { stop: "games", label: "Games", at: [-5.45, 1.45, 2.1] },
  { stop: "skate", label: "Skate wall", at: [-5.75, 2.6, -2.0] },
  { stop: "music", label: "Music", at: [5.6, 1.05, -1.0] },
  { stop: "shop", label: "Open the store", at: [IMAC.position[0], IMAC.position[1] + SCREEN.offset[1] + 0.02, IMAC.position[2]] },
  { stop: "handoff", label: "Pick up your bag", at: [1.15, 1.32, -3.6] },
];

const SIZE = 56;
const HOVER_CSS = `
.hotspot-wrap{position:relative;--mx:0px;--my:0px}
.hotspot{transition:transform 160ms ease}
.hotspot-wrap:hover .hotspot,.hotspot:focus-visible{transform:scale(1.15)}
.hotspot-label{position:absolute;left:50%;bottom:${SIZE + 10}px;opacity:0;pointer-events:none;white-space:nowrap;
  font-family:var(--font-display),Anton,Impact,sans-serif;font-size:34px;line-height:1;letter-spacing:-0.01em;text-transform:uppercase;
  color:#f7f7f3;text-shadow:0 2px 18px rgba(0,0,0,.75);
  transform:translate(calc(-50% + var(--mx)), calc(8px + var(--my)));
  transition:opacity 180ms ease, transform 420ms cubic-bezier(.2,.8,.2,1)}
.hotspot-wrap:hover .hotspot-label,.hotspot:focus-visible+.hotspot-label{opacity:1;transform:translate(calc(-50% + var(--mx)), var(--my))}
`;

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    // Touch-first devices (phones / tablets) keep the scroll-only experience.
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setDesktop(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function Hotspots() {
  // Never leave the view frozen if a hotspot disappears under the mouse.
  useEffect(() => () => void (pointer.hold = false), []);
  const desktop = useIsDesktop();
  const shopping = useCheckout((s) => s.isOpen);
  const open = useCheckout((s) => s.open);
  // Nearest camera stop (keyframes sit at progress i / (n − 1)).
  const section = useScroll((s) => Math.round(s.stop));
  const inside = useScroll((s) => isInside(s.stop));
  const purchased = useCheckout((s) => s.purchased);

  // A ring can vanish under the cursor (new stop, store opened) without a
  // pointerleave — release the frozen view whenever that can happen.
  useEffect(() => {
    pointer.hold = false;
  }, [section, shopping, inside]);

  if (!desktop || shopping) return null;

  // From the street only the door ring shows; inside, the shop's areas.
  const spots = inside ? SPOTS : [DOOR];

  return (
    <group>
      {spots.map((spot) => {
        const index = KEYFRAMES.findIndex((k) => k.id === spot.stop);
        const here = index === section;
        // At the current stop only the iMac keeps its ring (it opens the store).
        if (here && spot.stop !== "shop") return null;
        // The bag handoff only exists after the demo checkout.
        if (spot.stop === "handoff" && !purchased) return null;
        return (
          <Html key={spot.stop} position={spot.at} center zIndexRange={[15, 0]}>
            <div
              className="hotspot-wrap"
              onPointerEnter={() => (pointer.hold = true)}
              onPointerLeave={(e) => {
                pointer.hold = false;
                e.currentTarget.style.setProperty("--mx", "0px");
                e.currentTarget.style.setProperty("--my", "0px");
              }}
              onPointerMove={(e) => {
                // The title floats above the ring, trailing the mouse a little.
                const r = e.currentTarget.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                e.currentTarget.style.setProperty("--mx", `${(dx * 0.45).toFixed(1)}px`);
                e.currentTarget.style.setProperty("--my", `${(dy * 0.3).toFixed(1)}px`);
              }}
            >
            <button
              type="button"
              data-cursor="hover"
              aria-label={here || spot.title ? spot.label : `Go to ${KEYFRAMES[index].title}`}
              title={here ? spot.label : KEYFRAMES[index].title}
              onClick={() => {
                pointer.hold = false;
                if (here) open();
                else scrollToSection(index);
              }}
              className="hotspot block"
              style={{ width: SIZE, height: SIZE, padding: 0, background: "none", border: 0, borderRadius: "50%", cursor: "pointer" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ui/hotspot.webp" alt="" width={SIZE} height={SIZE} draggable={false} style={{ display: "block", pointerEvents: "none" }} />
            </button>
            {/* Section name as a title on hover (brandbook display type) */}
            <span className="hotspot-label" aria-hidden>
              {spot.title ?? KEYFRAMES[index].title}
            </span>
            </div>
            <style>{HOVER_CSS}</style>
          </Html>
        );
      })}
    </group>
  );
}
