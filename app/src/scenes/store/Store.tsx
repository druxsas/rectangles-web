"use client";

import { Billboard, Text } from "@react-three/drei";
import type { ReactNode } from "react";
import { NightShiftScreen } from "@/scenes/store/NightShift";
import {
  ArcadeCabinetModel,
  BassSpeakersModel,
  CounterStraightModel,
  HifiStereoModel,
  MacClassicModel,
  MonsteraModel,
  RetroSystemsModel,
  SkateboardModel,
  TurntableModel,
  VendorCharacterModel,
} from "@/scenes/store/models";
import { useShellTextures, type PbrSet } from "@/scenes/store/useShellTextures";
import { useCheckout } from "@/stores/checkout";

/**
 * Rectangle's store interior — rebuilt around real low-poly models from
 * Poly Pizza (CC-BY, see CREDITS.md). The scene composition matches the
 * two approved reference stills: illuminated RECTANGLE'S wordmark on the
 * back wall above a counter with the vendor behind it, floor speakers
 * flanking, skate decks on the right wall backlit in cobalt, arcade
 * cabinet on the left wall, central merch area with plants + Persian rug.
 */

// ---------- Palette ----------
const COL = {
  ceiling: "#0e1012",
  signInk: "#f7f7f3",
  signBg: "#17191b",
  rug: "#5a1f12",
  cobalt: "#165dfa",
  warm: "#ffbc7a",
  plant: "#2a4a1a",
} as const;

// ---------- Helpers ----------
function Box({
  pos,
  size,
  color,
  roughness = 0.8,
  metalness = 0,
  emissive,
  emissiveIntensity,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
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
      />
    </mesh>
  );
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
// Shell — floor + walls + ceiling with PBR concrete textures
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
      {/* Ceiling */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color={COL.ceiling} roughness={1} />
      </mesh>
      {/* Back wall — hosts the RECTANGLE'S wordmark */}
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

      {/* Facade awning + side pillars (storefront approach) */}
      <Box pos={[0, 7.4, 7]} size={[20, 1.2, 0.3]} color={COL.signBg} />
      <Box pos={[-9.3, 3.5, 7]} size={[1.4, 7, 0.3]} color={COL.signBg} />
      <Box pos={[9.3, 3.5, 7]} size={[1.4, 7, 0.3]} color={COL.signBg} />
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

// ================================================================
// Back wall hero — illuminated RECTANGLE'S + counter + vendor + Mac
// ================================================================
function BackWallHero() {
  const openCheckout = useCheckout((s) => s.open);
  return (
    <group>
      {/* Illuminated wordmark on the back wall */}
      <Text
        position={[0, 4.6, -6.88]}
        fontSize={1.3}
        color={COL.signInk}
        fontWeight={900}
        material-toneMapped={false}
        {...TEXT_DEFAULTS}
      >
        RECTANGLE&apos;S
      </Text>
      {/* Warm halo backlighting the wordmark */}
      <pointLight position={[0, 4.5, -6]} color={COL.warm} intensity={7} distance={10} decay={1.4} />
      <pointLight position={[-2.5, 4.5, -6]} color={COL.warm} intensity={3} distance={6} decay={1.4} />
      <pointLight position={[2.5, 4.5, -6]} color={COL.warm} intensity={3} distance={6} decay={1.4} />

      {/* Counter — three Quaternius counter segments across the back */}
      {[-3, 0, 3].map((x) => (
        <group key={x} position={[x, 0, -5.5]} rotation={[0, Math.PI, 0]}>
          <CounterStraightModel scale={3} />
        </group>
      ))}

      {/* Vendor behind the counter (slightly left-of-center per reference) */}
      <group position={[0.8, 0, -6.3]} rotation={[0, Math.PI, 0]}>
        <VendorCharacterModel scale={1.1} />
      </group>

      {/* Classic Mac on the counter — clickable to open the marketplace */}
      <group
        position={[-2.2, 1.15, -5.3]}
        rotation={[0, 0.3, 0]}
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
        <MacClassicModel scale={1.4} />
      </group>

      {/* Retro systems cluster beside the Mac */}
      <group position={[3.2, 1.15, -5.5]} rotation={[0, -0.3, 0]}>
        <RetroSystemsModel scale={1.2} />
      </group>

      {/* Floor speakers flanking the counter (HiFi stereo pair) */}
      <group position={[-4.8, 0, -4.5]} rotation={[0, Math.PI / 2 + 0.1, 0]}>
        <HifiStereoModel scale={1.4} />
      </group>
      <group position={[4.8, 0, -4.5]} rotation={[0, -Math.PI / 2 - 0.1, 0]}>
        <HifiStereoModel scale={1.4} />
      </group>
    </group>
  );
}

// ================================================================
// Skate wall — right wall with cobalt backlight + deck grid
// ================================================================
function SkateWall() {
  return (
    <group>
      {/* Cobalt backlight panel */}
      <mesh position={[9.85, 3.2, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[7.5, 4.2]} />
        <meshBasicMaterial color={COL.cobalt} toneMapped={false} />
      </mesh>
      <pointLight position={[9.3, 3.2, -1]} color={COL.cobalt} intensity={5} distance={9} decay={1.3} />

      {/* Deck grid — real low-poly skateboards hung vertical on the wall */}
      {Array.from({ length: 6 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const z = -2.6 + col * 1.5;
        const y = 4 - row * 1.8;
        return (
          <group key={i} position={[9.6, y, z]} rotation={[0, -Math.PI / 2, Math.PI / 2]}>
            <SkateboardModel scale={1.2} />
          </group>
        );
      })}
    </group>
  );
}

// ================================================================
// Left wall — arcade cabinet + speakers rack + turntable
// ================================================================
function LeftWallZone() {
  return (
    <group>
      {/* Arcade cabinet from Poly by Google, facing right (toward viewer when
          approaching from entrance) */}
      <group position={[-8.8, 0, -2]} rotation={[0, Math.PI / 2, 0]}>
        <ArcadeCabinetModel scale={2.2} />
        {/* Live Night Shift screen overlaid on the arcade's face. Position
            tuned to sit roughly on the cabinet's screen area. */}
        <NightShiftScreen position={[0, 1.85, 0.5]} rotation={[0, 0, 0]} width={0.9} height={0.7} />
        <pointLight position={[0, 1.85, 0.8]} color={COL.cobalt} intensity={2.2} distance={4} decay={1.5} />
      </group>

      {/* A turntable on a small pedestal mid-wall */}
      <Box pos={[-8.5, 0.85, 2.2]} size={[1.4, 1.7, 1.1]} color="#231710" roughness={0.7} />
      <group position={[-8.5, 1.72, 2.2]} rotation={[0, Math.PI / 2, 0]}>
        <TurntableModel scale={1.8} />
      </group>

      {/* Bass speakers rack to the right of the arcade */}
      <group position={[-7.3, 0, -0.6]} rotation={[0, Math.PI / 2, 0]}>
        <BassSpeakersModel scale={1.8} />
      </group>
    </group>
  );
}

// ================================================================
// Center merch + rug + plants
// ================================================================
function CenterDisplays() {
  return (
    <group>
      {/* Persian-ish rug (warm red plane) centered between the counters and
          the entrance */}
      <mesh position={[0, 0.01, -1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.5, 3.5]} />
        <meshStandardMaterial color={COL.rug} roughness={0.95} />
      </mesh>

      {/* A single clothing rail with t-shirt silhouettes (hangers) */}
      <Box pos={[0, 1.4, -1]} size={[2.6, 0.03, 0.04]} color="#3a3d42" metalness={0.6} roughness={0.3} />
      {[-1, -0.3, 0.3, 1].map((x) => (
        <group key={x} position={[x, 1.1, -1]}>
          <Box pos={[0, 0, 0]} size={[0.4, 0.55, 0.02]} color="#141518" />
          <Box pos={[0, 0.05, 0.015]} size={[0.16, 0.055, 0.001]} color={COL.signInk} />
        </group>
      ))}

      {/* Monstera plants per reference */}
      <group position={[-6.5, 0, -5.2]}>
        <MonsteraModel scale={2.4} />
      </group>
      <group position={[6.5, 0, -5.2]}>
        <MonsteraModel scale={2.4} />
      </group>
      <group position={[-7, 0, 4]}>
        <MonsteraModel scale={2.2} />
      </group>
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

      {/* Wayfinding labels */}
      <ZoneLabel position={[-8.5, 5.2, -1.6]} text="03 GAMES" />
      <ZoneLabel position={[9, 5.2, -1]} text="01 SKATE" />
      <ZoneLabel position={[-8.3, 3.2, 2.2]} text="02 MUSIC" size={0.25} />
      <ZoneLabel position={[-2.2, 2.5, -5.3]} text="04 RETRO · CLICK Mac" size={0.22} />
    </group>
  );
}
