"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { setScrollLocked } from "@/components/smooth-scroll";
import { SCREEN, screenFrame } from "@/scenes/store/imacPose";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";

const SEGMENTS = KEYFRAMES.length - 1;

const pathPos = new Vector3();
const pathLook = new Vector3();
const nextPos = new Vector3();
const nextLook = new Vector3();
const outPos = new Vector3();
const outLook = new Vector3();
const outUp = new Vector3();
const WORLD_UP = new Vector3(0, 1, 0);

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Field of view used when looking at the iMac display. */
const SCREEN_FOV = 34;
/** Share of the viewport the display should fill — leaves the bezel visible. */
const SCREEN_FILL = 0.8;
/** Seconds for the zoom in / out. */
const ZOOM_SECONDS = 1.3;

type RigState = { blend: number; locked: boolean };

/** One frame of camera motion (module-level so hook values aren't mutated in render scope). */
function step(
  camera: PerspectiveCamera,
  aspect: number,
  dt: number,
  rig: RigState,
  screen: ReturnType<typeof screenFrame>,
  reducedMotion: boolean,
) {
  // --- Walkthrough pose from scroll
  const p = useScroll.getState().progress;
  const f = Math.min(p * SEGMENTS, SEGMENTS);
  const i = Math.min(Math.floor(f), SEGMENTS - 1);
  const t = ease(f - i);
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  pathPos.set(...a.position).lerp(nextPos.set(...b.position), t);
  pathLook.set(...a.lookAt).lerp(nextLook.set(...b.lookAt), t);
  const pathFov = MathUtils.lerp(a.fov, b.fov, t);

  // --- Shopping blend
  const open = useCheckout.getState().isOpen;
  if (open !== rig.locked) {
    rig.locked = open;
    setScrollLocked(open);
  }
  const target = open ? 1 : 0;
  rig.blend = reducedMotion
    ? target
    : MathUtils.clamp(rig.blend + Math.sign(target - rig.blend) * (dt / ZOOM_SECONDS), 0, 1);
  const w = ease(rig.blend);

  // Distance so the display fits SCREEN_FILL of the viewport (height or width).
  const half = Math.tan(MathUtils.degToRad(SCREEN_FOV / 2));
  const fitH = SCREEN.height / SCREEN_FILL / (2 * half);
  const fitW = SCREEN.width / SCREEN_FILL / (2 * half * aspect);
  const dist = Math.max(fitH, fitW);

  outPos.copy(pathPos).lerp(nextPos.copy(screen.center).addScaledVector(screen.normal, dist), w);
  outLook.copy(pathLook).lerp(screen.center, w);
  outUp.copy(WORLD_UP).lerp(screen.up, w).normalize();

  camera.position.copy(outPos);
  camera.up.copy(outUp);
  camera.lookAt(outLook);

  const fov = MathUtils.lerp(pathFov, SCREEN_FOV, w);
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

/**
 * Drives the default Canvas camera.
 *
 * - Walking: follows the keyframe path from scroll progress (position,
 *   lookAt and fov with a cubic ease).
 * - Shopping: when the store is open, blends to a head-on view of the iMac
 *   display, framed so the whole screen fits with the bezel and chin still
 *   visible. Scroll is locked meanwhile; closing blends back to the path.
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const rig = useRef<RigState>({ blend: 0, locked: false });
  const screen = useMemo(() => screenFrame(), []);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useFrame((_, dt) => step(camera as PerspectiveCamera, size.width / size.height, dt, rig.current, screen, reducedMotion));

  return null;
}
