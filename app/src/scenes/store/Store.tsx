"use client";

import { Billboard, RoundedBox, Text } from "@react-three/drei";
import type { ReactNode } from "react";
import { NightShiftScreen } from "@/scenes/store/NightShift";
import { useCheckout } from "@/stores/checkout";

// Shared text defaults so every 3D label in the scene is tuned the same.
const TEXT_DEFAULTS = {
  anchorX: "center" as const,
  anchorY: "middle" as const,
  letterSpacing: -0.02,
};

/**
 * Small billboard label that always faces the camera. Used to mark each zone
 * so the scene reads clearly before Phase 2 brings in real signage/assets.
 */
function ZoneLabel({
  position,
  text,
  size = 0.35,
}: {
  position: [number, number, number];
  text: string;
  size?: number;
}) {
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={size}
        color="#f7f7f3"
        outlineColor="#0a0b0d"
        outlineWidth={0.012}
        fontWeight={900}
        {...TEXT_DEFAULTS}
      >
        {text}
      </Text>
    </Billboard>
  );
}

/**
 * Low-poly Rectangle's store — MVP.
 *
 * Everything here is composed from primitives (boxes, planes, cylinders).
 * Phase 2 will replace the hero objects (iMac G3, arcade cabinet, skate deck)
 * with Blender-authored meshes; the scene layout will not change.
 *
 * Coordinate layout:
 *   +X: right   +Z: toward viewer   +Y: up
 *   Store box: 20 × 8 × 14, centered on X/Z, floor at Y=0.
 *   Facade at Z = +7 (sign only). Back wall at Z = -7.
 */

// ---------- Palette ----------
// Tuned so every material reads against the near-black background. Concrete
// is kept neutral-dark but noticeably lighter than the bg so walls/floor
// show silhouette under the warm hanging lamps.
const COL = {
  concreteFloor: "#3a3f45",
  concreteWall:  "#2c3137",
  ceiling:       "#15181c",
  wood:          "#4a3621",
  woodDark:      "#2d1f12",
  metal:         "#4a4d52",
  signBg:        "#2a2f35",
  signInk:       "#f7f7f3",
  deck:          "#241a13",
  deckLabel:     "#f7f7f3",
  speakerCone:   "#1a1a1a",
  vinyl:         "#0b0b0b",
  arcadeFrame:   "#1d1d1f",
  screenCobalt:  "#165dfa",
  screenPhosph:  "#4ade80",
  imacBody:      "#5a90ff",
  imacBack:      "#2a4fa0",
  counterTop:    "#3a2510",
} as const;

// ---------- Small helpers ----------
function Box({
  pos,
  size,
  color,
  roughness = 0.8,
  metalness = 0,
  emissive,
  emissiveIntensity,
  opacity,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity !== undefined}
        opacity={opacity}
      />
    </mesh>
  );
}

function Group({ pos = [0, 0, 0], rotY = 0, children }: { pos?: [number, number, number]; rotY?: number; children: ReactNode }) {
  return <group position={pos} rotation={[0, rotY, 0]}>{children}</group>;
}

// ================================================================
// Shell
// ================================================================
function Shell() {
  return (
    <group>
      {/* Floor (extends past facade to form a sidewalk) */}
      <mesh position={[0, 0, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 21]} />
        <meshStandardMaterial color={COL.concreteFloor} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color={COL.ceiling} roughness={1} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 4, -7]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color={COL.concreteWall} roughness={0.85} />
      </mesh>
      {/* Left wall (skate wall) */}
      <mesh position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color={COL.concreteWall} roughness={0.85} />
      </mesh>
      {/* Right wall */}
      <mesh position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color={COL.concreteWall} roughness={0.85} />
      </mesh>

      {/* Facade — awning/sign across the top, side pillars, open shopfront */}
      <Box pos={[0, 6.8, 7]}   size={[20, 2.4, 0.3]} color={COL.signBg} />
      <Box pos={[-9.3, 3, 7]}  size={[1.4, 6, 0.3]}  color={COL.signBg} />
      <Box pos={[9.3, 3, 7]}   size={[1.4, 6, 0.3]}  color={COL.signBg} />
      {/* Backlit sign plate — flat matte-white panel that catches the lamps.
          Sits a hair in front of the awning strip so there's no z-fighting. */}
      <mesh position={[-1.2, 6.8, 7.21]}>
        <planeGeometry args={[12, 1.6]} />
        <meshBasicMaterial color="#f7f7f3" toneMapped={false} />
      </mesh>
      {/* Rectangle's wordmark — cut-out in the sign (ink on the white plate) */}
      <Text
        position={[-1.2, 6.8, 7.22]}
        fontSize={1.4}
        color="#0a0b0d"
        {...TEXT_DEFAULTS}
      >
        RECTANGLE&apos;S
      </Text>
      {/* Framed-mark glyph next to the wordmark, drawn on the white plate */}
      <mesh position={[5.3, 6.8, 7.22]}>
        <planeGeometry args={[2.4, 1]} />
        <meshBasicMaterial color="#0a0b0d" toneMapped={false} />
      </mesh>
      <Text
        position={[5.3, 6.8, 7.23]}
        fontSize={0.42}
        color="#f7f7f3"
        {...TEXT_DEFAULTS}
      >
        R / 01
      </Text>
      {/* Warm halo so the sign reads like it's lit from above */}
      <pointLight position={[-1, 7.2, 8]} color="#ffbc7a" intensity={3.2} distance={9} decay={1.4} />
      <pointLight position={[5.5, 7.2, 8]} color="#ffbc7a" intensity={2.4} distance={7} decay={1.4} />
      {/* Framed-mark rectangle (brandbook variant B) — four edges, no fill */}
      <Group pos={[5.5, 6.8, 7.17]}>
        <Box pos={[0, 0.43, 0]}   size={[2.4, 0.04, 0.02]} color={COL.signInk} />
        <Box pos={[0, -0.43, 0]}  size={[2.4, 0.04, 0.02]} color={COL.signInk} />
        <Box pos={[-1.18, 0, 0]}  size={[0.04, 0.9, 0.02]} color={COL.signInk} />
        <Box pos={[1.18, 0, 0]}   size={[0.04, 0.9, 0.02]} color={COL.signInk} />
      </Group>
    </group>
  );
}

// ================================================================
// Skate zone — left wall
// ================================================================
function SkateZone() {
  const deckGap = 1.6;
  const decks = [-3, -1.4, 0.2, 1.8];
  return (
    <Group pos={[-9.75, 0, 0]}>
      {decks.map((z) => (
        <Group key={z} pos={[0, 3, z * deckGap]} rotY={Math.PI / 2}>
          {/* Deck */}
          <Box pos={[0, 0, 0.05]} size={[2.1, 0.55, 0.06]} color={COL.deck} roughness={0.55} />
          {/* Deck label (Rectangle's rectangle) */}
          <Box pos={[0, 0, 0.09]} size={[0.8, 0.28, 0.01]} color={COL.deckLabel} />
        </Group>
      ))}
      {/* Workbench with parts */}
      <Group pos={[0.9, 0, -4]}>
        <Box pos={[0, 0.9, 0]}   size={[0.7, 0.08, 2]}   color={COL.wood}      roughness={0.7} />
        <Box pos={[0, 0.45, -0.9]} size={[0.06, 0.9, 0.06]} color={COL.woodDark} />
        <Box pos={[0, 0.45, 0.9]}  size={[0.06, 0.9, 0.06]} color={COL.woodDark} />
        {/* Trucks */}
        <Box pos={[0.1, 0.98, -0.3]} size={[0.3, 0.1, 0.1]} color={COL.metal} metalness={0.7} roughness={0.35} />
        <Box pos={[0.1, 0.98, 0.1]}  size={[0.3, 0.1, 0.1]} color={COL.metal} metalness={0.7} roughness={0.35} />
        {/* Wheels */}
        {[-0.4, -0.2, 0.0, 0.2].map((z) => (
          <mesh key={z} position={[0, 0.98, z + 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 20]} />
            <meshStandardMaterial color={COL.signInk} roughness={0.5} />
          </mesh>
        ))}
      </Group>
    </Group>
  );
}

// ================================================================
// Music zone — right side
// ================================================================
function MusicZone() {
  return (
    <Group pos={[8, 0, -4]}>
      {/* Low cabinet with turntable */}
      <Box pos={[0, 0.7, 0]} size={[2.8, 1.4, 1.6]} color={COL.wood} roughness={0.7} />
      {/* Turntable base */}
      <Box pos={[0, 1.45, 0]} size={[1.8, 0.1, 1.2]} color={COL.metal} metalness={0.5} roughness={0.4} />
      {/* Platter */}
      <mesh position={[0, 1.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.04, 40]} />
        <meshStandardMaterial color={COL.vinyl} roughness={0.9} />
      </mesh>
      {/* Tonearm */}
      <Box pos={[0.6, 1.57, -0.35]} size={[0.6, 0.03, 0.04]} color={COL.metal} metalness={0.7} roughness={0.2} />

      {/* Speakers flanking the cabinet */}
      <Box pos={[-2, 1.2, 0]} size={[0.9, 2.4, 1]}   color={COL.woodDark} roughness={0.6} />
      <Box pos={[-2, 1.6, 0.51]} size={[0.5, 0.5, 0.01]} color={COL.speakerCone} />
      <Box pos={[-2, 0.8, 0.51]} size={[0.6, 0.6, 0.01]} color={COL.speakerCone} />
      <Box pos={[2, 1.2, 0]}  size={[0.9, 2.4, 1]}   color={COL.woodDark} roughness={0.6} />
      <Box pos={[2, 1.6, 0.51]} size={[0.5, 0.5, 0.01]} color={COL.speakerCone} />
      <Box pos={[2, 0.8, 0.51]} size={[0.6, 0.6, 0.01]} color={COL.speakerCone} />

      {/* Vinyl stack on the floor */}
      <Box pos={[-2.9, 0.4, 1.3]} size={[0.8, 0.8, 0.8]} color={COL.woodDark} />
    </Group>
  );
}

// ================================================================
// Arcade / games zone — back-right
// ================================================================
function ArcadeZone() {
  return (
    <Group pos={[7.5, 0, -6.5]}>
      {/* Cabinet body */}
      <Box pos={[0, 1.1, 0]} size={[1.6, 2.2, 1]} color={COL.arcadeFrame} roughness={0.8} />
      {/* Marquee */}
      <Box pos={[0, 2.35, 0.1]} size={[1.5, 0.35, 0.8]} color={COL.signBg} />
      <Box pos={[0, 2.35, 0.51]} size={[1.3, 0.22, 0.01]} color={COL.signInk} emissive={COL.signInk} emissiveIntensity={0.3} />
      {/* Screen — Night Shift pixel-art game running live */}
      <NightShiftScreen position={[0, 1.7, 0.51]} width={1.2} height={0.9} />
      {/* Control deck */}
      <Box pos={[0, 1.08, 0.57]} size={[1.4, 0.08, 0.5]} color={COL.signBg} />
      {/* Joystick + buttons (tiny cylinders/box) */}
      <mesh position={[-0.25, 1.2, 0.72]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 12]} />
        <meshStandardMaterial color={COL.signInk} roughness={0.5} />
      </mesh>
      {[0.2, 0.33, 0.46].map((x) => (
        <mesh key={x} position={[x, 1.13, 0.72]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
          <meshStandardMaterial color={COL.screenCobalt} emissive={COL.screenCobalt} emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Cobalt rim light behind the screen */}
      <pointLight position={[0, 1.7, 0.6]} color={COL.screenCobalt} intensity={2.4} distance={5} />
    </Group>
  );
}

// ================================================================
// Counter + iMac G3 — back-left (hero object + checkout trigger)
// ================================================================
function CounterZone() {
  const openCheckout = useCheckout((s) => s.open);

  return (
    <Group pos={[-5, 0, -6]}>
      {/* Counter base */}
      <Box pos={[0, 0.55, 0]} size={[4, 1.1, 1.2]} color={COL.woodDark} roughness={0.75} />
      {/* Counter top */}
      <Box pos={[0, 1.13, 0]} size={[4.1, 0.08, 1.3]} color={COL.counterTop} roughness={0.5} />

      {/* iMac G3 — rounded teardrop body approximated with RoundedBox.
          Clickable: opens the demo checkout overlay. onPointerOver sets
          the cursor so visitors notice it's interactive. */}
      <RoundedBox
        args={[0.95, 1, 1.05]}
        radius={0.28}
        smoothness={6}
        position={[-0.5, 1.72, -0.05]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          openCheckout();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <meshPhysicalMaterial
          color={COL.imacBody}
          roughness={0.25}
          metalness={0.05}
          transmission={0.55}
          thickness={0.6}
          ior={1.4}
          attenuationColor={COL.imacBody}
          attenuationDistance={1.4}
          clearcoat={0.3}
          clearcoatRoughness={0.3}
          transparent
        />
      </RoundedBox>
      {/* iMac rear bulge (opaque) */}
      <RoundedBox args={[0.7, 0.75, 0.6]} radius={0.22} smoothness={6} position={[-0.5, 1.72, -0.5]}>
        <meshStandardMaterial color={COL.imacBack} roughness={0.6} />
      </RoundedBox>
      {/* iMac bezel (dark front plate) */}
      <Box pos={[-0.5, 1.72, 0.49]} size={[0.75, 0.75, 0.01]} color={COL.signBg} />
      {/* iMac screen (emissive cobalt — hero element) */}
      <mesh position={[-0.5, 1.72, 0.5]}>
        <planeGeometry args={[0.6, 0.45]} />
        <meshStandardMaterial
          color={COL.screenCobalt}
          emissive={COL.screenCobalt}
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
      {/* iMac base/stand */}
      <Box pos={[-0.5, 1.2, 0]} size={[0.7, 0.08, 0.5]} color={COL.imacBack} />

      {/* Keyboard + mouse */}
      <Box pos={[0.6, 1.19, 0.15]}  size={[1.1, 0.04, 0.35]} color={COL.signInk} />
      <Box pos={[0.6, 1.195, 0.14]} size={[1,   0.01, 0.3]}  color={COL.signBg} />
      <Box pos={[1.6, 1.19, 0.15]}  size={[0.3, 0.05, 0.22]} color={COL.signInk} />

      {/* Cobalt glow from the screen */}
      <pointLight position={[-0.5, 1.72, 0.9]} color={COL.screenCobalt} intensity={1.6} distance={4} />
    </Group>
  );
}

// ================================================================
// Complete store
// ================================================================
export function Store() {
  return (
    <group>
      <Shell />
      <SkateZone />
      <MusicZone />
      <ArcadeZone />
      <CounterZone />

      {/* Wayfinding — each zone announces itself. Placed in world space so
          they sit above the zone fixtures regardless of composition. */}
      <ZoneLabel position={[-8.3, 5, -2.5]} text="01 SKATE" />
      <ZoneLabel position={[8, 4, -4]}      text="02 MUSIC" />
      <ZoneLabel position={[7.5, 3.5, -5.5]} text="03 NIGHT SHIFT" size={0.32} />
      <ZoneLabel position={[-5, 2.8, -5.5]} text="04 RETRO" />
    </group>
  );
}
