"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { setScrollLocked } from "@/components/smooth-scroll";
import { ARROW_DEG, MAX_DEG, isInside, mouseYawDeg, pointer, useLook } from "@/canvas/lookAround";
import { SCREEN, ZOOM_SECONDS, screenFrame } from "@/scenes/store/imacPose";
import { KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";
import { useScroll } from "@/stores/scroll";
import { useQuality } from "@/canvas/quality";
import { useTravel } from "@/stores/travel";

const SEGMENTS = KEYFRAMES.length - 1;

const pathPos = new Vector3();
const pathLook = new Vector3();
const nextPos = new Vector3();
const nextLook = new Vector3();
const outPos = new Vector3();
const outLook = new Vector3();
const outUp = new Vector3();
const WORLD_UP = new Vector3(0, 1, 0);
const lookDir = new Vector3();
const travelStartPos = new Vector3();
const travelStartLook = new Vector3();
const travelLastPos = new Vector3();
const travelLastLook = new Vector3();
const travelTargetPos = new Vector3();
const travelTargetLook = new Vector3();
/** Seconds to ease from an interrupted flight back onto the scroll path. */
const TRAVEL_RELEASE = 1.2;

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Field of view used when looking at the iMac display. */
const SCREEN_FOV = 34;
/** Share of the viewport the display should fill — leaves the bezel visible. */
const SCREEN_FILL = 0.8;

/**
 * Adaptive resolution: the scene is fill-rate bound (per-pixel lighting +
 * post), so while the camera moves it renders at a reduced pixel ratio —
 * motion hides it — and snaps back to full resolution as soon as the view
 * settles, so still frames (posters, the iMac) stay crisp. DOM text and the
 * live store page are never affected.
 */
const MOTION_SCALE = 0.6;
const MOTION_MIN_DPR = 0.75;
const SETTLE_MS = 220;

type RigState = {
  /** Last camera pose, to detect motion. */
  lastPos: Vector3;
  lastLook: Vector3;
  stillSince: number;
  lowRes: boolean;
  blend: number;
  locked: boolean;
  yaw: number;
  /** Direct-flight bookkeeping (menu / hotspot jumps). */
  traveling: boolean;
  travelStartFov: number;
  travelLastFov: number;
  /** 1 right after a flight ends, decaying to 0 — blends back onto the path. */
  travelRelease: number;
};

/** Keyframe fovs are authored for a 16:10 desktop viewport. */
const AUTHORED_ASPECT = 1.6;
const MAX_FOV = 80;

/**
 * On narrower (portrait / mobile) viewports widen the vertical fov so the
 * horizontal framing of each stop is preserved, up to MAX_FOV.
 */
function portraitFov(fov: number, aspect: number) {
  if (aspect >= AUTHORED_ASPECT) return fov;
  const half = Math.tan(MathUtils.degToRad(fov / 2)) * (AUTHORED_ASPECT / aspect);
  return Math.min(MAX_FOV, MathUtils.radToDeg(2 * Math.atan(half)));
}

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
  const stop = useScroll.getState().stop;
  const f = Math.min(Math.max(stop, 0), SEGMENTS);
  const i = Math.min(Math.floor(f), SEGMENTS - 1);
  const t = ease(f - i);
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  pathPos.set(...a.position).lerp(nextPos.set(...b.position), t);
  pathLook.set(...a.lookAt).lerp(nextLook.set(...b.lookAt), t);
  let pathFov = portraitFov(MathUtils.lerp(a.fov, b.fov, t), aspect);

  // --- Direct flight between stops (menu / hotspot click): straight line
  // from where the camera was to the target, skipping the stops between.
  // The scroll still advances underneath and serves as the flight timeline.
  const travel = useTravel.getState();
  if (travel.active) {
    if (!rig.traveling) {
      rig.traveling = true;
      travelStartPos.copy(pathPos);
      travelStartLook.copy(pathLook);
      rig.travelStartFov = pathFov;
    }
    const k = KEYFRAMES[travel.to];
    travelTargetPos.set(...k.position);
    travelTargetLook.set(...k.lookAt);
    const span = travel.to - travel.from;
    const u = span === 0 ? 1 : MathUtils.clamp((stop - travel.from) / span, 0, 1);
    pathPos.copy(travelStartPos).lerp(travelTargetPos, u);
    pathLook.copy(travelStartLook).lerp(travelTargetLook, u);
    pathFov = MathUtils.lerp(rig.travelStartFov, portraitFov(k.fov, aspect), u);
    travelLastPos.copy(pathPos);
    travelLastLook.copy(pathLook);
    rig.travelLastFov = pathFov;
    rig.travelRelease = 1;
  } else {
    rig.traveling = false;
    if (rig.travelRelease > 0) {
      // Interrupted (e.g. the visitor scrolled mid-flight): ease back onto the path.
      rig.travelRelease = Math.max(0, rig.travelRelease - dt / TRAVEL_RELEASE);
      // Smoothstep (gentler at the start than the cubic ease).
      const r = rig.travelRelease;
      const w = r * r * (3 - 2 * r);
      pathPos.lerp(travelLastPos, w);
      pathLook.lerp(travelLastLook, w);
      pathFov = MathUtils.lerp(pathFov, rig.travelLastFov, w);
    }
  }

  // --- Desktop look-around (mouse + arrows), inside the shop only
  const open0 = useCheckout.getState().isOpen;
  const yawTarget =
    pointer.active && isInside(stop) && !open0
      ? MathUtils.clamp(useLook.getState().step * ARROW_DEG + mouseYawDeg(pointer.x), -MAX_DEG, MAX_DEG)
      : 0;
  // Freeze the turn while a hotspot is under the mouse.
  if (!pointer.hold) rig.yaw = MathUtils.damp(rig.yaw, MathUtils.degToRad(yawTarget), 3.2, dt);
  if (Math.abs(rig.yaw) > 1e-4) {
    lookDir.copy(pathLook).sub(pathPos).applyAxisAngle(WORLD_UP, rig.yaw);
    pathLook.copy(pathPos).add(lookDir);
  }

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
  const rig = useRef<RigState>({
    lastPos: new Vector3(),
    lastLook: new Vector3(),
    stillSince: 0,
    lowRes: false,
    blend: 0,
    locked: false,
    yaw: 0,
    traveling: false,
    travelStartFov: 0,
    travelLastFov: 0,
    travelRelease: 0,
  });

  // Track the mouse on fine-pointer (desktop) devices only.
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    pointer.active = true;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    };
    const leave = () => (pointer.x = 0);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      pointer.active = false;
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);
  const screen = useMemo(() => screenFrame(), []);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const setDpr = useThree((s) => s.setDpr);
  const fullDpr = useQuality((s) => Math.min(s.dpr, typeof window === "undefined" ? 1 : window.devicePixelRatio));

  useFrame((_, dt) => {
    const r = rig.current;
    step(camera as PerspectiveCamera, size.width / size.height, dt, r, screen, reducedMotion);

    // --- Adaptive resolution
    const moved = camera.position.distanceToSquared(r.lastPos) > 1e-7 || outLook.distanceToSquared(r.lastLook) > 1e-7;
    r.lastPos.copy(camera.position);
    r.lastLook.copy(outLook);
    const now = performance.now();
    if (moved) r.stillSince = now;
    const wantLow = now - r.stillSince < SETTLE_MS;
    if (wantLow !== r.lowRes) {
      r.lowRes = wantLow;
      setDpr(wantLow ? Math.max(MOTION_MIN_DPR, fullDpr * MOTION_SCALE) : fullDpr);
    }
  });

  return null;
}
