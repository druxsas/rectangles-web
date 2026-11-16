"use client";

import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";
import { STORE_H, STORE_W, StorePage } from "@/components/store/StorePage";
import { SCREEN, ZOOM_SECONDS } from "@/scenes/store/imacPose";
import { useShopScreenTexture } from "@/scenes/store/ShopScreen";
import { useCheckout } from "@/stores/checkout";

/**
 * The counter iMac's display.
 *
 *  - Idle (walking through the store): a canvas texture of the store home,
 *    so the screen reads as a live website from anywhere in the room.
 *  - Open (the visitor clicked the iMac and the camera zoomed in): the real,
 *    interactive store page (StorePage) is laid onto the display with a CSS
 *    3D transform. It is still the iMac — bezel, chin and keyboard stay in
 *    frame — but the page is crisp HTML you can scroll, click and type in.
 *
 * Must be mounted inside the iMac's group so it inherits its transform.
 */

/** drei <Html transform>: 1 CSS px = distanceFactor / 400 world units. */
const DISTANCE_FACTOR = (400 * SCREEN.width) / STORE_W;

/** Live page fade-in, ms. */
const FADE_MS = 220;

export function ImacScreen() {
  const isOpen = useCheckout((s) => s.isOpen);
  const texture = useShopScreenTexture();
  // 0 idle → 1 live page fading in (preview still underneath) → 2 live only.
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const live = isOpen && stage > 0;
  const previewHidden = isOpen && stage === 2;

  // The live page appears only once the zoom has fully settled: while the
  // camera moves, the CSS-3D page can trail the WebGL frame by a frame on
  // phones, which read as two overlapping copies. Once it's opaque the
  // preview is hidden so both are never visible together; on close the
  // preview returns first and the page is removed.
  useEffect(() => {
    if (!isOpen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const settle = reduced ? 0 : ZOOM_SECONDS * 1000 + 60;
    const t1 = window.setTimeout(() => setStage(1), settle);
    const t2 = window.setTimeout(() => setStage(2), settle + FADE_MS + 40);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      setStage(0);
    };
  }, [isOpen]);

  return (
    <>
      {/* Trim over the bezel/chin seam: the model's two front panels meet on
          the same plane there and the join renders as a bright dashed line. */}
      <mesh position={[0, 0.1338, -0.0318]} rotation={[SCREEN.tilt, 0, 0]}>
        <planeGeometry args={[0.619, 0.0036]} />
        <meshStandardMaterial color="#050506" roughness={0.6} />
      </mesh>
    <group position={SCREEN.offset} rotation={[SCREEN.tilt, 0, 0]}>
      <mesh visible={!previewHidden}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial map={texture} color="#c9c9c9" toneMapped={false} />
      </mesh>
      {live && (
        <Html
          transform
          distanceFactor={DISTANCE_FACTOR}
          position={[0, 0, 0.0015]}
          zIndexRange={[20, 0]}
          style={{
            width: STORE_W,
            height: STORE_H,
            opacity: stage === 0 ? 0 : 1,
            transition: `opacity ${FADE_MS}ms ease`,
            pointerEvents: "auto",
          }}
        >
          <StorePage />
        </Html>
      )}
    </group>
    </>
  );
}
