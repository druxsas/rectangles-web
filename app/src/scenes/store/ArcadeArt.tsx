"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { Matrix4, Quaternion, SRGBColorSpace, Vector3, type Texture } from "three";
import { PERF_PER_METRE, perforatedTexture } from "@/scenes/store/perforated";

/**
 * Printed artwork for the arcade cabinets (Images/Arcade_Art, optimized by
 * scripts/optimize-arcade-art.mjs): marquee, monitor bezel and both flanks.
 * Each piece is a plane laid a hair off the cabinet's own panel, in the
 * model's normalized space — mount it inside the same group as <ArcadeHQ />.
 *
 * Panel positions were measured on the source mesh (front faces -X, the
 * cabinet is 1.82 m tall, centred on X/Z):
 *   - marquee and bezel lean back, so each has its own "up" direction;
 *   - the flanks are flat, at z = ±0.3527.
 * The side art has the cabinet's front on its left, which suits the +Z
 * flank; the -Z flank uses the mirrored-silhouette version.
 */

export type ArcadeArtSet = "01" | "02";

const src = (set: ArcadeArtSet, piece: string) => `/textures/arcade/${set}-${piece}.webp`;

/**
 * The fronts lean back under a ceiling spot: printed at full white, the
 * ivory areas clip and bloom until the lettering washes out.
 */
const FRONT_TINT = "#8f8f8c";

/** Distance the prints sit off the panels. */
const LIFT = 0.0012;

type Panel = { center: [number, number, number]; up: [number, number, number]; width: number; height: number };

const MARQUEE: Panel = { center: [0.1862, 1.694, 0], up: [0.507, 0.862, 0], width: 0.692, height: 0.2007 };
const BEZEL: Panel = { center: [0.0271, 1.2939, 0], up: [0.4839, 0.8751, 0], width: 0.6956, height: 0.6219 };
// Panels the artwork doesn't cover take the counter's finishes: perforated
// steel on the lower front and the strip under the controls, matte brushed
// steel on the control deck (joysticks and buttons stand proud of it).
const KICK: Panel = { center: [-0.2218, 0.401, 0], up: [0, 1, 0], width: 0.6926, height: 0.766 };
const STRIP: Panel = { center: [-0.3286, 0.911, 0], up: [0, 1, 0], width: 0.6926, height: 0.168 };
const DECK: Panel = { center: [-0.2235, 1.0228, 0], up: [0.9887, 0.1497, 0], width: 0.6724, height: 0.2225 };

/**
 * Controls on the deck, [x, z] in the cabinet's space (from the source
 * model's layout): per player one stick, a start button and six buttons.
 */
const STICKS: [number, number][] = [
  [-0.2324, -0.2597],
  [-0.2324, 0.0889],
];
const BUTTONS: [number, number][] = [
  [-0.154, -0.1039],
  [-0.2576, -0.2102],
  [-0.2161, -0.1858],
  [-0.2161, -0.1336],
  [-0.2594, -0.1561],
  [-0.2161, -0.0831],
  [-0.2594, -0.1039],
  [-0.154, 0.0683],
  [-0.2576, 0.1475],
  [-0.2161, 0.1718],
  [-0.2161, 0.2241],
  [-0.2594, 0.2016],
  [-0.2161, 0.2746],
  [-0.2603, 0.2538],
];
const COBALT = "#165dfa";

const SIDE = { y: 0.9098, z: 0.3527, width: 0.6918, height: 1.8146 };

/** Orientation of a front panel: image right → +Z, image up → the panel's slope. */
function frontPanel(p: Panel) {
  const y = new Vector3(...p.up).normalize();
  const x = new Vector3(0, 0, 1);
  const z = new Vector3().crossVectors(x, y);
  const quaternion = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
  const position = new Vector3(...p.center).addScaledVector(z, LIFT);
  return { quaternion, position };
}

function configure(t: Texture | Texture[]) {
  for (const tex of Array.isArray(t) ? t : [t]) {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
  }
}

/**
 * Joysticks and push buttons, built from primitives (solid, unlike the
 * source model's). Laid out in the deck's own frame: x across the cabinet,
 * y up the slope, z out of the deck.
 */
function Controls({ position, quaternion }: { position: Vector3; quaternion: Quaternion }) {
  const slope = new Vector3(...DECK.up).normalize();
  // Deck-frame coordinates of a point given by its cabinet-space x and z.
  const at = (x: number, z: number): [number, number] => [z, (x - DECK.center[0]) / slope.x];
  const upright: [number, number, number] = [Math.PI / 2, 0, 0];
  return (
    <group position={position} quaternion={quaternion}>
      {STICKS.map(([x, z]) => {
        const [u, v] = at(x, z);
        return (
          <group key={`s${z}`} position={[u, v, 0]}>
            <mesh position={[0, 0, 0.002]} rotation={upright}>
              <cylinderGeometry args={[0.024, 0.026, 0.004, 28]} />
              <meshStandardMaterial color="#0d0e10" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.036]} rotation={upright} castShadow>
              <cylinderGeometry args={[0.0048, 0.0048, 0.068, 12]} />
              <meshStandardMaterial color="#b9bcc0" roughness={0.3} metalness={1} />
            </mesh>
            <mesh position={[0, 0, 0.084]} castShadow>
              <sphereGeometry args={[0.0195, 28, 20]} />
              <meshStandardMaterial color={COBALT} roughness={0.32} />
            </mesh>
          </group>
        );
      })}
      {BUTTONS.map(([x, z]) => {
        const [u, v] = at(x, z);
        return (
          <group key={`b${x}:${z}`} position={[u, v, 0]}>
            <mesh position={[0, 0, 0.0025]} rotation={upright}>
              <cylinderGeometry args={[0.0185, 0.0195, 0.005, 28]} />
              <meshStandardMaterial color="#0d0e10" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.007]} rotation={upright}>
              <cylinderGeometry args={[0.0128, 0.0138, 0.008, 28]} />
              <meshStandardMaterial color={COBALT} roughness={0.38} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function ArcadeArt({ set }: { set: ArcadeArtSet }) {
  const [marquee, bezel, side, sideMirror] = useTexture(
    [src(set, "marquee"), src(set, "bezel"), src(set, "side"), src(set, "side-mirror")],
    configure,
  );
  const steel = useMemo(() => {
    const perf = (p: Panel) => perforatedTexture([Math.round(p.width * PERF_PER_METRE), Math.max(1, Math.round(p.height * PERF_PER_METRE))]);
    return { kick: { ...frontPanel(KICK), map: perf(KICK) }, strip: { ...frontPanel(STRIP), map: perf(STRIP) }, deck: frontPanel(DECK) };
  }, []);
  const m = useMemo(() => frontPanel(MARQUEE), []);
  const b = useMemo(() => frontPanel(BEZEL), []);
  return (
    <group>
      {/* Marquee: a backlit translite, so it carries a little light of its own */}
      <mesh position={m.position} quaternion={m.quaternion}>
        <planeGeometry args={[MARQUEE.width, MARQUEE.height]} />
        <meshStandardMaterial map={marquee} color={FRONT_TINT} emissiveMap={marquee} emissive="#ffffff" emissiveIntensity={0.1} roughness={0.5} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-4} />
      </mesh>
      {/* Bezel: the art's transparent window leaves the screen showing */}
      <mesh position={b.position} quaternion={b.quaternion}>
        <planeGeometry args={[BEZEL.width, BEZEL.height]} />
        <meshStandardMaterial map={bezel} color={FRONT_TINT} alphaTest={0.5} roughness={0.6} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-4} />
      </mesh>
      {/* Lower front and the strip under the controls: perforated steel, as on the counter front */}
      {[
        [KICK, steel.kick] as const,
        [STRIP, steel.strip] as const,
      ].map(([panel, s], i) => (
        <mesh key={i} position={s.position} quaternion={s.quaternion}>
          <planeGeometry args={[panel.width, panel.height]} />
          {/* The fascias sit in the cabinet's own shadow, where bare metal goes
              black: less metallic than the counter, plus a faint lift so the
              perforation still reads. */}
          <meshStandardMaterial map={s.map} color="#c9ccd1" roughness={0.5} metalness={0.3} envMapIntensity={1.6} emissiveMap={s.map} emissive="#8c9097" emissiveIntensity={0.55} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-4} />
        </mesh>
      ))}
      {/* Control deck: matte brushed steel, as on the counter top */}
      <mesh position={steel.deck.position} quaternion={steel.deck.quaternion}>
        <planeGeometry args={[DECK.width, DECK.height]} />
        <meshStandardMaterial color="#6f747a" roughness={0.78} metalness={0.35} envMapIntensity={0.45} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-4} />
      </mesh>
      <Controls position={steel.deck.position} quaternion={steel.deck.quaternion} />
      {/* Flanks: cut to the cabinet's silhouette by the art's alpha */}
      <mesh position={[0, SIDE.y, SIDE.z + LIFT]}>
        <planeGeometry args={[SIDE.width, SIDE.height]} />
        <meshStandardMaterial map={side} alphaTest={0.5} roughness={0.55} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-4} />
      </mesh>
      <mesh position={[0, SIDE.y, -SIDE.z - LIFT]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SIDE.width, SIDE.height]} />
        <meshStandardMaterial map={sideMirror} alphaTest={0.5} roughness={0.55} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-4} />
      </mesh>
    </group>
  );
}

for (const set of ["01", "02"] as const) for (const piece of ["marquee", "bezel", "side", "side-mirror"]) useTexture.preload(src(set, piece));
