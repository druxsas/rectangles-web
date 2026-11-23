"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, MathUtils, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, Quaternion, SRGBColorSpace, Vector3, type Group, type Texture } from "three";
import { controlLabels, live } from "@/components/games/arcadeInput";
import { displayFont } from "@/scenes/store/brandCanvas";
import { useArcade, type CabinetId } from "@/stores/arcade";
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
 * What each deck button is: which player's, and which of their controls.
 * Per player the far row is buttons 0–2 and the near row 3–5, left to right
 * as the player sees them (+z is their right); the one set apart is Start.
 */
const BUTTON_ROLE = BUTTONS.map(([x, z]) => {
  const player = (z < 0 ? 0 : 1) as 0 | 1;
  if (x > -0.2) return { player, start: true, index: -1 };
  const far = x > -0.24;
  const row = BUTTONS.filter(([bx, bz]) => bz < 0 === z < 0 && bx <= -0.2 && bx > -0.24 === far)
    .map(([, bz]) => bz)
    .sort((p, q) => p - q);
  return { player, start: false, index: (far ? 0 : 3) + row.indexOf(z) };
});

/** How far a stick leans and a plunger sinks. */
const STICK_TILT = 0.36;
const PRESS = 0.0032;

const labelCache = new Map<string, CanvasTexture>();
/** A key / button name printed on a plunger cap (canvas, so PlayStation's shapes can be drawn). */
function capLabel(text: string, ink: string) {
  const key = `${text}|${ink}`;
  let tex = labelCache.get(key);
  if (tex) return tex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = ctx.fillStyle = ink;
  ctx.lineWidth = 11;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (text === "□") ctx.strokeRect(38, 38, 52, 52);
  else if (text === "○") {
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0, Math.PI * 2);
    ctx.stroke();
  } else if (text === "△") {
    ctx.beginPath();
    ctx.moveTo(64, 32);
    ctx.lineTo(96, 90);
    ctx.lineTo(32, 90);
    ctx.closePath();
    ctx.stroke();
  } else if (text === "✕") {
    ctx.beginPath();
    ctx.moveTo(38, 38);
    ctx.lineTo(90, 90);
    ctx.moveTo(90, 38);
    ctx.lineTo(38, 90);
    ctx.stroke();
  } else {
    const label = text.length > 3 ? text.slice(0, 3).toUpperCase() : text.toUpperCase();
    let size = 78;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    do {
      ctx.font = `400 ${size}px ${displayFont()}`;
      size -= 4;
    } while (ctx.measureText(label).width > 92 && size > 20);
    const m = ctx.measureText(label);
    ctx.fillText(label, 64, 64 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  }
  tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  labelCache.set(key, tex);
  return tex;
}

/** Push-button colours by position: the far row is cobalt for both players;
 * the start button and the near row are black for player 1 (left, z < 0)
 * and ivory for player 2.
 */
type ButtonTone = "cobalt" | "ink" | "ivory";
function buttonTone(x: number, z: number): ButtonTone {
  const second = z > 0 ? "ivory" : "ink";
  if (x > -0.2) return second; // start button, set apart at the back
  return x > -0.24 ? "cobalt" : second;
}

/**
 * Joysticks and push buttons, built from primitives (solid, unlike the
 * source model's) and proportioned like real arcade parts: a ball-top stick
 * with a shaft cover and dust washer on a steel mounting ring, and
 * convex-plunger buttons in a threaded-style rim — cobalt, black and ivory.
 * Laid out in the deck's own frame: x across the cabinet, y up the slope,
 * z out of the deck.
 *
 * While this cabinet is being played (stores/arcade.ts) the sticks lean and
 * the plungers sink with the players' input, and each plunger shows the key
 * or controller button that works it.
 */
function Controls({ position, quaternion, cabinet }: { position: Vector3; quaternion: Quaternion; cabinet: CabinetId }) {
  const slope = new Vector3(...DECK.up).normalize();
  // Deck-frame coordinates of a point given by its cabinet-space x and z.
  const at = (x: number, z: number): [number, number] => [z, (x - DECK.center[0]) / slope.x];
  const upright: [number, number, number] = [Math.PI / 2, 0, 0];
  const mat = useMemo(() => {
    const gloss = (color: string) => new MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 0.9 });
    return {
      cobalt: gloss(COBALT),
      ink: gloss("#101113"),
      // A touch under pure ivory: the deck sits under a ceiling spot.
      ivory: gloss("#d9d6cd"),
      rubber: new MeshStandardMaterial({ color: "#0b0c0d", roughness: 0.85 }),
      steel: new MeshStandardMaterial({ color: "#a9adb2", roughness: 0.35, metalness: 0.9, envMapIntensity: 1.2 }),
    };
  }, []);

  const active = useArcade((s) => s.cabinet === cabinet);
  const players = useArcade((s) => s.players);
  const inputs = useArcade((s) => s.inputs);
  const pads = useArcade((s) => s.pads);
  const labels = useMemo(
    () => (active ? ([0, 1] as const).map((p) => controlLabels(p, players, inputs, pads)) : [null, null]),
    [active, players, inputs, pads],
  );

  const sticks = useRef<(Group | null)[]>([]);
  const plungers = useRef<(Group | null)[]>([]);
  useFrame((_, dt) => {
    const on = useArcade.getState().cabinet === cabinet;
    sticks.current.forEach((stick, p) => {
      if (!stick) return;
      const c = live[p];
      // Right leans the ball toward +x of the deck, up toward +y (away from the player).
      stick.rotation.y = MathUtils.damp(stick.rotation.y, on ? c.x * STICK_TILT : 0, 22, dt);
      stick.rotation.x = MathUtils.damp(stick.rotation.x, on ? -c.y * STICK_TILT : 0, 22, dt);
    });
    plungers.current.forEach((plunger, i) => {
      if (!plunger) return;
      const role = BUTTON_ROLE[i];
      const c = live[role.player];
      const down = on && (role.start ? c.start : c.buttons[role.index]);
      plunger.position.z = MathUtils.damp(plunger.position.z, down ? -PRESS : 0, 40, dt);
    });
  });

  return (
    <group position={position} quaternion={quaternion}>
      {STICKS.map(([x, z], player) => {
        const [u, v] = at(x, z);
        return (
          <group key={`s${z}`} position={[u, v, 0]}>
            {/* Steel mounting ring */}
            <mesh position={[0, 0, 0.0012]} rotation={upright} material={mat.steel}>
              <cylinderGeometry args={[0.03, 0.031, 0.0024, 36]} />
            </mesh>
            {/* Dust washer */}
            <mesh position={[0, 0, 0.0036]} rotation={upright} material={mat.rubber}>
              <cylinderGeometry args={[0.024, 0.026, 0.0026, 36]} />
            </mesh>
            {/* The lever pivots just under the deck */}
            <group
              ref={(g) => {
                sticks.current[player] = g;
              }}
              position={[0, 0, -0.01]}
            >
              {/* Shaft cover, flaring toward the deck */}
              <mesh position={[0, 0, 0.031]} rotation={upright} material={mat.ink} castShadow>
                <cylinderGeometry args={[0.0095, 0.0145, 0.034, 24]} />
              </mesh>
              {/* Shaft */}
              <mesh position={[0, 0, 0.056]} rotation={upright} material={mat.steel} castShadow>
                <cylinderGeometry args={[0.0068, 0.0068, 0.03, 16]} />
              </mesh>
              {/* Ball top: player 1 cobalt, player 2 ivory */}
              <mesh position={[0, 0, 0.084]} material={player === 0 ? mat.cobalt : mat.ivory} castShadow>
                <sphereGeometry args={[0.0225, 32, 24]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {BUTTONS.map(([x, z], i) => {
        const [u, v] = at(x, z);
        const tone = buttonTone(x, z);
        const role = BUTTON_ROLE[i];
        const set = labels[role.player];
        const text = set ? (role.start ? set.start : set.buttons[role.index]) : null;
        return (
          <group key={`b${x}:${z}`} position={[u, v, 0]}>
            {/* Rim: a low collar with a rounded lip */}
            <mesh position={[0, 0, 0.002]} rotation={upright} material={mat.ink}>
              <cylinderGeometry args={[0.0188, 0.02, 0.004, 32]} />
            </mesh>
            <mesh position={[0, 0, 0.004]} material={mat.ink}>
              <torusGeometry args={[0.0162, 0.0028, 10, 32]} />
            </mesh>
            {/* Plunger: short barrel with a convex cap */}
            <group
              ref={(g) => {
                plungers.current[i] = g;
              }}
            >
              <mesh position={[0, 0, 0.0055]} rotation={upright} material={mat[tone]}>
                <cylinderGeometry args={[0.0132, 0.0132, 0.007, 32]} />
              </mesh>
              <mesh position={[0, 0, 0.009]} scale={[1, 1, 0.3]} material={mat[tone]}>
                <sphereGeometry args={[0.0132, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
              {/* The key / controller button that works it, printed on the cap */}
              {text && (
                <mesh position={[0, 0, 0.0133]}>
                  <circleGeometry args={[0.0118, 24]} />
                  <meshBasicMaterial map={capLabel(text, tone === "ivory" ? "#101113" : "#f7f7f3")} transparent depthWrite={false} toneMapped={false} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}

/**
 * The screen opening in the bezel art (940 × 794 px of its 1390 × 1242
 * canvas, 6 px above centre), in metres. The game's picture is a flat plane
 * filling it: the model's own screen sits deep in the cabinet with stretched
 * UVs, which distorted the picture and hid its bottom edge behind the bezel.
 */
const SCREEN = { width: 0.474, height: 0.401, up: 0.003 };

export function ArcadeArt({ set, cabinet, screen }: { set: ArcadeArtSet; cabinet: CabinetId; screen: Texture }) {
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
      {/* The game's picture, just behind the bezel art */}
      <group position={b.position} quaternion={b.quaternion}>
        <mesh position={[0, SCREEN.up, -LIFT * 0.5]}>
          <planeGeometry args={[SCREEN.width, SCREEN.height]} />
          <meshBasicMaterial map={screen} color="#d6d6d6" toneMapped={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-2} />
        </mesh>
      </group>
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
      <Controls position={steel.deck.position} quaternion={steel.deck.quaternion} cabinet={cabinet} />
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
