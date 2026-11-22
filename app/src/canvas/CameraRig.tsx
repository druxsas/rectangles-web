"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { setScrollLocked } from "@/components/smooth-scroll";
import { ARROW_DEG, MAX_DEG, isInside, mouseYawDeg, pointer, useLook } from "@/canvas/lookAround";
import { SCREEN, ZOOM_SECONDS, screenFrame } from "@/scenes/store/imacPose";
import { DOOR_CLEAR, DOOR_PASS, KEYFRAMES } from "@/scenes/store/keyframes";
import { useCheckout } from "@/stores/checkout";
import { useListening } from "@/stores/listening";
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
const doorPos = new Vector3(...DOOR_PASS);
const doorLook = new Vector3();
const doorTan = new Vector3();
const lookSpan = new Vector3();
const tanA = new Vector3();
const tanB = new Vector3();
/** Seconds to ease from an interrupted flight back onto the scroll path. */
const TRAVEL_RELEASE = 1.2;

/** Cubic Hermite from p0 to p1 with tangents m0 / m1 (in units per segment). */
function hermite(out: Vector3, p0: Vector3, p1: Vector3, m0: Vector3, m1: Vector3, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return out
    .copy(p0)
    .multiplyScalar(2 * t3 - 3 * t2 + 1)
    .addScaledVector(m0, t3 - 2 * t2 + t)
    .addScaledVector(p1, -2 * t3 + 3 * t2)
    .addScaledVector(m1, t3 - t2);
}

/**
 * `?cam=x,y,z,lookX,lookY,lookZ[,fov]` pins the camera to a fixed pose
 * (measurement / screenshot aid, like `?debug=1`).
 */
const CAM_OVERRIDE = (() => {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("cam")?.split(",").map(Number);
  if (!v || v.length < 6 || v.some(Number.isNaN)) return null;
  return { pos: new Vector3(v[0], v[1], v[2]), look: new Vector3(v[3], v[4], v[5]), fov: v[6] ?? 50 };
})();

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Listening pose: close on the turntable. On landscape screens the playlist
 * window covers the right side, so the view is aimed to the player's right
 * and it lands left of centre; on portrait the window is a bottom sheet, so
 * the view is aimed below it and it lands in the upper part.
 */
const LISTEN_SECONDS = 1.2;
const LISTEN_FOV = 40;
const LISTEN_WIDE = { pos: new Vector3(4.55, 1.28, -0.8), look: new Vector3(5.63, 0.78, -0.62) };
const LISTEN_TALL = { pos: new Vector3(4.2, 1.15, -1.0), look: new Vector3(5.63, 0.3, -1.0) };

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
  travelFrom: number;
  travelTo: number;
  travelStartFov: number;
  travelLastFov: number;
  /** Flight crosses the storefront away from the door → go via the doorway. */
  travelViaDoor: boolean;
  /** Share of the flight (0–1) spent before reaching the doorway. */
  travelSplit: number;
  /** 1 right after a flight ends, decaying to 0 — blends back onto the path. */
  travelRelease: number;
  /** 0 walking → 1 close on the turntable. */
  listen: number;
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
  // A flight between the street and the shop goes through the doorway (a
  // straight line would cut through the storefront glass).
  const travel = useTravel.getState();
  if (travel.active) {
    const k = KEYFRAMES[travel.to];
    travelTargetPos.set(...k.position);
    travelTargetLook.set(...k.lookAt);
    if (!rig.traveling || rig.travelFrom !== travel.from || rig.travelTo !== travel.to) {
      // A new flight: start from the path, or from mid-air if one was under way.
      if (rig.traveling) {
        travelStartPos.copy(travelLastPos);
        travelStartLook.copy(travelLastLook);
        rig.travelStartFov = rig.travelLastFov;
      } else {
        travelStartPos.copy(pathPos);
        travelStartLook.copy(pathLook);
        rig.travelStartFov = pathFov;
      }
      rig.traveling = true;
      rig.travelFrom = travel.from;
      rig.travelTo = travel.to;

      const z0 = travelStartPos.z - doorPos.z;
      const z1 = travelTargetPos.z - doorPos.z;
      rig.travelViaDoor = false;
      if (z0 * z1 < 0) {
        const xCross = MathUtils.lerp(travelStartPos.x, travelTargetPos.x, z0 / (z0 - z1));
        if (Math.abs(xCross - doorPos.x) > DOOR_CLEAR) {
          const before = travelStartPos.distanceTo(doorPos);
          const after = doorPos.distanceTo(travelTargetPos);
          rig.travelViaDoor = true;
          rig.travelSplit = before / (before + after);
          // Cross the doorway square to the facade, at the flight's speed.
          doorTan.set(0, 0, Math.sign(z1) * (before + after));
          // In the doorway, look ahead into the shop, already turning toward
          // (or still turning away from) the stop inside.
          doorLook.set(...KEYFRAMES[1].lookAt).lerp(z1 < 0 ? travelTargetLook : travelStartLook, 0.5);
        }
      }
    }
    const span = travel.to - travel.from;
    const u = span === 0 ? 1 : MathUtils.clamp((stop - travel.from) / span, 0, 1);
    if (rig.travelViaDoor) {
      const s = rig.travelSplit;
      lookSpan.copy(travelTargetLook).sub(travelStartLook);
      if (u < s) {
        const t = u / s;
        hermite(pathPos, travelStartPos, doorPos, tanA.copy(doorPos).sub(travelStartPos), tanB.copy(doorTan).multiplyScalar(s), t);
        hermite(pathLook, travelStartLook, doorLook, tanA.copy(doorLook).sub(travelStartLook), tanB.copy(lookSpan).multiplyScalar(s), t);
      } else {
        const t = (u - s) / (1 - s);
        hermite(pathPos, doorPos, travelTargetPos, tanA.copy(doorTan).multiplyScalar(1 - s), tanB.copy(travelTargetPos).sub(doorPos), t);
        hermite(pathLook, doorLook, travelTargetLook, tanA.copy(lookSpan).multiplyScalar(1 - s), tanB.copy(travelTargetLook).sub(doorLook), t);
      }
    } else {
      pathPos.copy(travelStartPos).lerp(travelTargetPos, u);
      pathLook.copy(travelStartLook).lerp(travelTargetLook, u);
    }
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
  const listening = useListening.getState().isOpen;
  const open0 = useCheckout.getState().isOpen || listening;
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
  if ((open || listening) !== rig.locked) {
    rig.locked = open || listening;
    setScrollLocked(rig.locked);
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

  // --- Listening blend (turntable close-up)
  const listenTarget = listening ? 1 : 0;
  rig.listen = reducedMotion
    ? listenTarget
    : MathUtils.clamp(rig.listen + Math.sign(listenTarget - rig.listen) * (dt / LISTEN_SECONDS), 0, 1);
  const wl = ease(rig.listen);
  if (wl > 0) {
    const pose = aspect < 1 ? LISTEN_TALL : LISTEN_WIDE;
    outPos.lerp(pose.pos, wl);
    outLook.lerp(pose.look, wl);
  }

  if (CAM_OVERRIDE) {
    camera.position.copy(CAM_OVERRIDE.pos);
    camera.up.copy(WORLD_UP);
    camera.lookAt(CAM_OVERRIDE.look);
    if (camera.fov !== CAM_OVERRIDE.fov) {
      camera.fov = CAM_OVERRIDE.fov;
      camera.updateProjectionMatrix();
    }
    return;
  }

  camera.position.copy(outPos);
  camera.up.copy(outUp);
  camera.lookAt(outLook);

  const fov = MathUtils.lerp(MathUtils.lerp(pathFov, SCREEN_FOV, w), LISTEN_FOV, wl);
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
    listen: 0,
    locked: false,
    yaw: 0,
    traveling: false,
    travelFrom: 0,
    travelTo: 0,
    travelViaDoor: false,
    travelSplit: 0,
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
