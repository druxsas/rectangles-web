"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useScroll } from "@/stores/scroll";

const SEGMENTS = KEYFRAMES.length - 1;

const current = new Vector3();
const target = new Vector3();
const nextPos = new Vector3();
const nextLook = new Vector3();

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Drives the default Canvas camera along the keyframe path based on the
 * global scroll progress. Interpolates position, lookAt and fov with a
 * cubic ease so motion feels cinematic, not mechanical.
 */
export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new Vector3(...KEYFRAMES[0].lookAt));

  useFrame(() => {
    const p = useScroll.getState().progress;
    const f = Math.min(p * SEGMENTS, SEGMENTS);
    const i = Math.min(Math.floor(f), SEGMENTS - 1);
    const t = ease(f - i);

    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];

    current.set(...a.position);
    nextPos.set(...b.position);
    current.lerp(nextPos, t);
    camera.position.copy(current);

    target.set(...a.lookAt);
    nextLook.set(...b.lookAt);
    target.lerp(nextLook, t);
    look.current.copy(target);
    camera.lookAt(look.current);

    const perspective = camera as PerspectiveCamera;
    const fov = MathUtils.lerp(a.fov, b.fov, t);
    if (Math.abs(perspective.fov - fov) > 0.01) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}
