"use client";

import { Billboard, RoundedBox, Text } from "@react-three/drei";
import type { ReactNode } from "react";
import { NightShiftScreen } from "@/scenes/store/NightShift";
import {
  ArcadeModel,
  ImacG3Model,
  ShelfModel,
  TelevisionModel,
} from "@/scenes/store/models";
import { useShellTextures, type PbrSet } from "@/scenes/store/useShellTextures";
import { useCheckout } from "@/stores/checkout";

/**
 * Rectangle's store interior — reworked to match the two approved reference
 * stills: dark concrete, warm pendant lamps, illuminated "RECTANGLE'S"
 * wordmark on the BACK WALL above a dark counter with the vendor behind
 * it, skate decks in a grid on the right wall with a cobalt backglow,
 * floor speakers flanking the counter area, arcade cabinet on the left
 * wall, polished concrete floor.
 *
 * Coord system: +X right, +Z toward viewer, +Y up.
 * Store box 20 × 8 × 14 centered on X/Z, floor at Y=0.
 */

// ---------- Palette ----------
const COL = {
  concreteFloor: "#2c2f33",
  concreteWall: "#2a2d31",
  ceiling: "#0e1012",
  wood: "#3b2a1a",
  woodDark: "#231710",
  metal: "#3a3d42",
  signBg: "#17191b",
  signInk: "#f7f7f3",
  deckDark: "#1a1512",
  deckWhite: "#f7f7f3",
  deckRed: "#b91c1c",
  deckYellow: "#d19d00",
  deckGreen: "#15803d",
  deckBlue: "#204fad",
  cobalt: "#165dfa",
  warm: "#ffbc7a",
  amber: "#f7a94a",
  vendor: "#141518",
  plant: "#2a4a1a",
} as const;

// ---------- Primitives helpers ----------
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

const TEXT_DEFAULTS = {
  anchorX: "center" as const,
  anchorY: "middle" as const,
  letterSpacing: -0.02,
};

function ZoneLabel({ position, text, size = 0.3 }: { position: [number, number, number]; text: string; size?: number }) {
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={size}
        color="#f7f7f3"
        outlineColor="#0a0b0d"
        outlineWidth={0.012}
        fontWeight={900}
        material-toneMapped={false}
        {...TEXT_DEFAULTS}
      >
        {text}
      </Text>
    </Billboard>
  );
}

// ================================================================
// Shell — floor + walls + ceiling with PBR concrete + wood textures
// ================================================================
function Shell() {
  const tex = useShellTextures();
  return (
    <group>
      {/* Floor — polished concrete, extends past facade to form sidewalk */}
      <mesh position={[0, 0, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 21]} />
        <PbrMat set={tex.floor} roughness={0.55} />
      </mesh>
      {/* Ceiling — dark, matte */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color={COL.ceiling} roughness={1} />
      </mesh>
      {/* Back wall — concrete, hosts the illuminated RECTANGLE'S wordmark */}
      <mesh position={[0, 4, -7]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <PbrMat set={tex.wall} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <PbrMat set={tex.wall} />
      </mesh>
      {/* Right wall */}
      <mesh position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <PbrMat set={tex.wall} />
      </mesh>

      {/* Facade awning strip + side pillars (storefront approach) */}
      <Box pos={[0, 7.4, 7]} size={[20, 1.2, 0.3]} color={COL.signBg} />
      <Box pos={[-9.3, 3.5, 7]} size={[1.4, 7, 0.3]} color={COL.signBg} />
      <Box pos={[9.3, 3.5, 7]} size={[1.4, 7, 0.3]} color={COL.signBg} />
      {/* Awning strip wordmark — simpler, bigger */}
      <Text
        position={[0, 7.4, 7.17]}
        fontSize={0.85}
        color={COL.signInk}
        fontWeight={900}
        material-toneMapped={false}
        {...TEXT_DEFAULTS}
      >
        RECTANGLE&apos;S
      </Text>
    </group>
  );
}

/** Shared PBR material builder for the shell planes. */
function PbrMat({ set, roughness = 0.8 }: { set: PbrSet; roughness?: number }) {
  return (
    <meshStandardMaterial
      map={set.map}
      normalMap={set.normal}
      aoMap={set.arm}
      roughnessMap={set.arm}
      metalnessMap={set.arm}
      roughness={roughness}
      metalness={0.05}
    />
  );
}

// ================================================================
// Back wall hero — illuminated RECTANGLE'S + counter + vendor + iMac
// (This is the brandbook storyboard hero frame.)
// ================================================================
function BackWallHero() {
  const openCheckout = useCheckout((s) => s.open);

  return (
    <group>
      {/* Illuminated RECTANGLE'S wordmark on the back wall */}
      <Text
        position={[0, 4.5, -6.88]}
        fontSize={1.3}
        color={COL.signInk}
        fontWeight={900}
        material-toneMapped={false}
        {...TEXT_DEFAULTS}
      >
        RECTANGLE&apos;S
      </Text>
      {/* Warm halo backlighting the wordmark */}
      <pointLight position={[0, 4.5, -6]} color={COL.warm} intensity={6} distance={9} decay={1.4} />
      <pointLight position={[-2.5, 4.5, -6]} color={COL.warm} intensity={2.8} distance={6} decay={1.4} />
      <pointLight position={[2.5, 4.5, -6]} color={COL.warm} intensity={2.8} distance={6} decay={1.4} />

      {/* Counter — wide, dark wood, sits in front of the back wall */}
      <Box pos={[0, 0.55, -5.2]} size={[9, 1.1, 1.3]} color={COL.woodDark} roughness={0.75} />
      <Box pos={[0, 1.13, -5.2]} size={[9.2, 0.08, 1.4]} color={COL.wood} roughness={0.5} />

      {/* Vendor silhouette behind the counter, head and torso */}
      <mesh position={[1.4, 2.0, -5.8]} castShadow>
        <sphereGeometry args={[0.22, 20, 16]} />
        <meshStandardMaterial color={COL.vendor} roughness={0.9} />
      </mesh>
      <mesh position={[1.4, 1.45, -5.85]} castShadow>
        <cylinderGeometry args={[0.38, 0.32, 0.9, 20]} />
        <meshStandardMaterial color={COL.vendor} roughness={0.9} />
      </mesh>

      {/* iMac G3 on the counter, slightly left — clickable to open shop */}
      <group
        position={[-2.2, 1.17, -5.3]}
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
        <ImacG3Model scale={1.0} />
      </group>

      {/* Vintage cash register next to the vendor */}
      <group position={[2.6, 1.17, -5.2]}>
        <TelevisionModel position={[0, 0.04, 0]} rotation={[0, -0.3, 0]} scale={0.0001} />
      </group>

      {/* Floor speakers flanking the counter (studio-monitor silhouettes) */}
      <Box pos={[-4.3, 0.9, -4.2]} size={[0.8, 1.8, 0.7]} color={COL.woodDark} roughness={0.6} />
      <Box pos={[-4.3, 1.25, -3.85]} size={[0.55, 0.55, 0.01]} color={COL.vendor} />
      <Box pos={[-4.3, 0.55, -3.85]} size={[0.65, 0.65, 0.01]} color={COL.vendor} />
      <Box pos={[4.3, 0.9, -4.2]} size={[0.8, 1.8, 0.7]} color={COL.woodDark} roughness={0.6} />
      <Box pos={[4.3, 1.25, -3.85]} size={[0.55, 0.55, 0.01]} color={COL.vendor} />
      <Box pos={[4.3, 0.55, -3.85]} size={[0.65, 0.65, 0.01]} color={COL.vendor} />
    </group>
  );
}

// ================================================================
// Skate deck wall grid — right wall, cobalt backglow (per reference)
// ================================================================
function SkateWall() {
  const deckColors = [
    COL.deckWhite, COL.deckRed, COL.deckDark, COL.deckYellow,
    COL.deckGreen, COL.deckBlue, COL.deckWhite, COL.deckDark,
  ];
  return (
    <group>
      {/* Cobalt backlight panel behind the decks */}
      <mesh position={[9.85, 3.2, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[7.5, 4.2]} />
        <meshBasicMaterial color={COL.cobalt} toneMapped={false} />
      </mesh>
      {/* Cobalt rim light so the glow spills onto the floor and decks */}
      <pointLight position={[9.3, 3.2, -1]} color={COL.cobalt} intensity={4.5} distance={9} decay={1.3} />

      {/* Deck grid — 2 rows × 4 cols */}
      {deckColors.map((c, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const z = -3.2 + col * 1.4;
        const y = 4.1 - row * 1.7;
        return (
          <Group key={i} pos={[9.65, y, z]} rotY={-Math.PI / 2}>
            {/* Deck body */}
            <Box pos={[0, 0, 0]} size={[0.5, 1.5, 0.05]} color={c} roughness={0.5} />
            {/* Framed-mark label on each deck */}
            <Box pos={[0, 0, 0.03]} size={[0.3, 0.1, 0.005]} color={COL.signInk} />
          </Group>
        );
      })}
    </group>
  );
}

// ================================================================
// Left wall — arcade cabinet (new Blender model) + retro TV
// ================================================================
function LeftWallZone() {
  return (
    <group>
      {/* Arcade cabinet from Blender, up against left wall facing right */}
      <group position={[-9, 0, -2]} rotation={[0, Math.PI / 2, 0]}>
        <ArcadeModel scale={1} />
        {/* Night Shift live screen overlay — sits on the recessed screen area */}
        <NightShiftScreen
          position={[0, 1.55, 0.26]}
          rotation={[0, 0, 0]}
          width={0.56}
          height={0.44}
        />
        {/* Cobalt spill from the arcade screen */}
        <pointLight position={[0, 1.6, 0.4]} color={COL.cobalt} intensity={1.8} distance={3} decay={1.5} />
      </group>

      {/* Retro CRT TV on a small plinth beside the arcade */}
      <Box pos={[-8.2, 0.6, 1.2]} size={[1.1, 1.2, 0.9]} color={COL.woodDark} />
      <TelevisionModel position={[-8.2, 1.3, 1.2]} rotation={[0, Math.PI / 2 - 0.3, 0]} scale={0.55} />
    </group>
  );
}

// ================================================================
// Central merch tables (per reference — t-shirts on hangers, vinyl crates)
// ================================================================
function CenterDisplays() {
  return (
    <group>
      {/* Low table with a persian rug suggestion underneath */}
      <mesh position={[0, 0.01, -1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.5, 3]} />
        <meshStandardMaterial color="#6b2a1a" roughness={0.95} />
      </mesh>
      {/* Clothing display — simple black t-shirts on a thin rail */}
      <Box pos={[0, 1.0, -1]} size={[2.4, 0.03, 0.04]} color={COL.metal} metalness={0.6} roughness={0.3} />
      {[-0.8, -0.3, 0.3, 0.8].map((x) => (
        <group key={x} position={[x, 0.75, -1]}>
          <Box pos={[0, 0, 0]} size={[0.35, 0.5, 0.02]} color={COL.vendor} />
          {/* Mini wordmark plate */}
          <Box pos={[0, 0.05, 0.015]} size={[0.14, 0.05, 0.001]} color={COL.signInk} />
        </group>
      ))}
      {/* Vinyl crate on the floor */}
      <Box pos={[-1.6, 0.35, -1.8]} size={[0.7, 0.7, 0.9]} color={COL.woodDark} roughness={0.6} />
      <Box pos={[1.6, 0.35, -1.8]} size={[0.7, 0.7, 0.9]} color={COL.woodDark} roughness={0.6} />

      {/* Plants in a corner for warmth (per reference) */}
      <Plant pos={[-7, 0, -5.5]} />
      <Plant pos={[7, 0, -5.5]} />
    </group>
  );
}

function Plant({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* Pot */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.28, 0.22, 0.5, 20]} />
        <meshStandardMaterial color="#2a1a0f" roughness={0.9} />
      </mesh>
      {/* Foliage (sphere cluster) */}
      {[
        [0, 0.9, 0, 0.42],
        [0.2, 1.2, 0.1, 0.3],
        [-0.15, 1.15, -0.15, 0.3],
        [0, 1.45, 0, 0.26],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#2d4a1a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ================================================================
// Complete store
// ================================================================
export function Store() {
  return (
    <group>
      <Shell />
      <BackWallHero />
      <SkateWall />
      <LeftWallZone />
      <CenterDisplays />

      {/* Shelving against the back wall, flanking the wordmark */}
      <ShelfModel position={[-6.2, 1.3, -6.5]} rotation={[0, 0, 0]} scale={1.0} />
      <ShelfModel position={[6.2, 1.3, -6.5]} rotation={[0, 0, 0]} scale={1.0} />

      {/* Wayfinding labels */}
      <ZoneLabel position={[-8.5, 5, -2]} text="03 GAMES" />
      <ZoneLabel position={[9, 5, -1]} text="01 SKATE" />
      <ZoneLabel position={[-4.3, 3.2, -4]} text="02 MUSIC" size={0.25} />
      <ZoneLabel position={[-2.2, 2.5, -5.3]} text="04 RETRO · CLICK iMac" size={0.22} />
    </group>
  );
}
