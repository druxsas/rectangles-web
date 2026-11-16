"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { Color, SRGBColorSpace, type Texture } from "three";

/**
 * Official Rectangle's logo as a flat 3D plane (art from /Images/Logo,
 * served from /public/logo). Two lock-ups per the brandbook:
 *   - "horizontal": wordmark + empty rectangle — signage, interfaces;
 *   - "framed":     wordmark inside the rectangle — objects and packaging.
 * `glow` > 1 pushes the art past the bloom threshold for lit signs.
 */

export type LogoVariant = "horizontal" | "framed";
export type LogoTone = "white" | "black";

/** width / height of each lock-up (from the source SVG viewBoxes). */
export const LOGO_ASPECT: Record<LogoVariant, number> = {
  horizontal: 1715.1591 / 248,
  framed: 1247.1591 / 340,
};

export function logoSrc(variant: LogoVariant, tone: LogoTone, ext: "png" | "svg" = "png") {
  return `/logo/${variant}-${tone}.${ext}`;
}

function configure(t: Texture | Texture[]) {
  for (const tex of Array.isArray(t) ? t : [t]) {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
  }
}

export function LogoPlane({
  variant,
  tone,
  width,
  tint,
  glow = 1,
  opacity = 1,
}: {
  variant: LogoVariant;
  tone: LogoTone;
  width: number;
  /** Multiplies the art colour (e.g. grey a white logo for a woven mat). */
  tint?: string;
  glow?: number;
  opacity?: number;
}) {
  const map = useTexture(logoSrc(variant, tone), configure);
  const height = width / LOGO_ASPECT[variant];
  // >1 multiplier pushes lit signs past the bloom threshold.
  const color = useMemo(() => new Color(tint ?? "#ffffff").multiplyScalar(glow), [tint, glow]);
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={map}
        transparent
        alphaTest={0.05}
        opacity={opacity}
        color={color}
        toneMapped={glow === 1}
        depthWrite={false}
      />
    </mesh>
  );
}

useTexture.preload(logoSrc("horizontal", "white"));
useTexture.preload(logoSrc("framed", "black"));
useTexture.preload(logoSrc("framed", "white"));
