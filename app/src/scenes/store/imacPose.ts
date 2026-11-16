import { Euler, Matrix4, Quaternion, Vector3 } from "three";

/**
 * Single source of truth for where the counter iMac and its display live.
 * Used by Store.tsx (placement), ImacStore.tsx (the live store page laid on
 * the display) and CameraRig.tsx (the zoom onto the screen).
 */

export const IMAC = {
  position: [-1.15, 1.0, -3.7] as [number, number, number],
  /** Faces the vendor side of the counter (storyboard 08). */
  yaw: Math.PI - 0.3,
};

/** Display area in the iMac's local (normalized-model) space. */
export const SCREEN = {
  offset: [0, 0.313, -0.052] as [number, number, number],
  /** The panel leans back ~9.7°. */
  tilt: -0.17,
  width: 0.564,
  height: 0.316,
};

/** World-space centre, outward normal and up vector of the display. */
export function screenFrame() {
  const imac = new Matrix4().compose(
    new Vector3(...IMAC.position),
    new Quaternion().setFromEuler(new Euler(0, IMAC.yaw, 0)),
    new Vector3(1, 1, 1),
  );
  const panel = new Matrix4().compose(
    new Vector3(...SCREEN.offset),
    new Quaternion().setFromEuler(new Euler(SCREEN.tilt, 0, 0)),
    new Vector3(1, 1, 1),
  );
  const world = imac.multiply(panel);
  const center = new Vector3().setFromMatrixPosition(world);
  const q = new Quaternion().setFromRotationMatrix(world);
  const normal = new Vector3(0, 0, 1).applyQuaternion(q);
  const up = new Vector3(0, 1, 0).applyQuaternion(q);
  return { center, normal, up };
}
