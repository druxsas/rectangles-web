"use client";

import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";
import { STORE_H, STORE_W, StorePage } from "@/components/store/StorePage";
import { SCREEN } from "@/scenes/store/imacPose";
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

export function ImacScreen() {
  const isOpen = useCheckout((s) => s.isOpen);
  const texture = useShopScreenTexture();
  const [arrived, setArrived] = useState(false);
  const live = isOpen && arrived;

  // Bring the live page in once the camera has nearly arrived; drop it
  // immediately on close so the texture shows during the pull-back.
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => setArrived(true), 650);
    return () => {
      window.clearTimeout(t);
      setArrived(false);
    };
  }, [isOpen]);

  return (
    <group position={SCREEN.offset} rotation={[SCREEN.tilt, 0, 0]}>
      <mesh>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial map={texture} color="#c9c9c9" toneMapped={false} />
      </mesh>
      {isOpen && (
        <Html
          transform
          distanceFactor={DISTANCE_FACTOR}
          position={[0, 0, 0.0015]}
          zIndexRange={[20, 0]}
          style={{
            width: STORE_W,
            height: STORE_H,
            opacity: live ? 1 : 0,
            transition: "opacity 320ms ease",
            pointerEvents: live ? "auto" : "none",
          }}
        >
          <StorePage />
        </Html>
      )}
    </group>
  );
}
