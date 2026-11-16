"use client";

import { Text, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { SRGBColorSpace, type Group, type Texture } from "three";
import { FramedMark } from "@/scenes/store/FramedMark";
import { Deck } from "@/scenes/store/DeckArt";
import { PlantBigHQ, PlantTallHQ } from "@/scenes/store/models";
import { useScroll } from "@/stores/scroll";
import { useQuality } from "@/canvas/quality";

/**
 * Storefront street dressing, after storyboard frames 01–02:
 *   - double glass door — black frames, steel bar handles, framed mark on
 *     the glass — closed at the facade stop and swinging open as the scroll
 *     carries the visitor toward the entrance
 *   - SKATE / MUSIC / GAMES / APPAREL stacked on the building face
 *     (mirrored to the right so it never sits under the stop caption)
 *   - potted plants on the sidewalk, a bench under the window, a complete
 *     leaning on the pier and an A-frame board with the framed mark
 */

/** Display face for 3D text (troika needs the font file, not the CSS family). */
const ANTON_TTF = "/fonts/Anton-Regular.ttf";

const FRONT_Z = 5;
const DOOR_HALF = 0.85;
const DOOR_H = 2.68;
const OPEN = (72 * Math.PI) / 180;

/**
 * Door opening driven by scroll: closed while lingering on the facade, fully
 * open before the camera reaches the threshold (it crosses the door line at
 * roughly 75% of the facade → entrance segment).
 */
function doorOpenAmount(stop: number) {
  const f = stop; // 0 = facade, 1 = entrance
  const t = Math.min(Math.max((f - 0.12) / 0.4, 0), 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const ink = "#0b0c0d";
const paper = "#f7f7f3";

function DoorLeaf({ side, decal }: { side: -1 | 1; decal?: boolean }) {
  // side = -1: hinge on the left jamb, leaf runs +x; side = 1: mirror.
  const w = DOOR_HALF - 0.01;
  const stile = 0.055;
  const dir = -side; // direction from hinge toward the free edge (local x)
  const cx = (dir * w) / 2;
  const frame = <meshStandardMaterial color={ink} roughness={0.4} metalness={0.5} />;
  const leaf = useRef<Group>(null);
  useFrame(() => {
    if (!leaf.current) return;
    leaf.current.rotation.y = side * OPEN * doorOpenAmount(useScroll.getState().stop);
  });
  return (
    <group ref={leaf} position={[side * DOOR_HALF, 0, FRONT_Z]}>
      {/* Stiles + rails */}
      <mesh position={[cx - (dir * w) / 2 + (dir * stile) / 2, DOOR_H / 2, 0]}>
        <boxGeometry args={[stile, DOOR_H, 0.05]} />
        {frame}
      </mesh>
      <mesh position={[cx + (dir * w) / 2 - (dir * stile) / 2, DOOR_H / 2, 0]}>
        <boxGeometry args={[stile, DOOR_H, 0.05]} />
        {frame}
      </mesh>
      <mesh position={[cx, DOOR_H - stile / 2, 0]}>
        <boxGeometry args={[w, stile, 0.05]} />
        {frame}
      </mesh>
      <mesh position={[cx, 0.09, 0]}>
        <boxGeometry args={[w, 0.18, 0.05]} />
        {frame}
      </mesh>
      {/* Glass */}
      <mesh position={[cx, DOOR_H / 2 + 0.06, 0]}>
        <planeGeometry args={[w - stile * 2, DOOR_H - 0.24]} />
        <meshPhysicalMaterial color="#0d1218" roughness={0.04} transparent opacity={0.16} clearcoat={1} side={2} />
      </mesh>
      {/* Vertical bar handle near the free edge, on the street face */}
      {[1, -1].map((face) => (
        <group key={face} position={[cx + (dir * w) / 2 - dir * 0.13, 1.05, face * 0.07]}>
          <mesh>
            <cylinderGeometry args={[0.016, 0.016, 0.95, 16]} />
            <meshStandardMaterial color="#c9ccd0" roughness={0.25} metalness={1} />
          </mesh>
          {[0.38, -0.38].map((y) => (
            <mesh key={y} position={[0, y, -face * 0.035]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.07, 8]} />
              <meshStandardMaterial color="#c9ccd0" roughness={0.25} metalness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Framed mark on the glass (storyboard 02) */}
      {decal && (
        <group position={[cx, 1.6, 0.004]}>
          <FramedMark width={0.36} color={paper} stroke={0.07} />
        </group>
      )}
    </group>
  );
}

function Bench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.03, 0.03].map((dz, i) => (
        <mesh key={i} position={[0, 0.45, dz * 3]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.04, 0.16]} />
          <meshStandardMaterial color="#5a3d26" roughness={0.75} />
        </mesh>
      ))}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]} castShadow>
          <boxGeometry args={[0.05, 0.44, 0.36]} />
          <meshStandardMaterial color={ink} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

const POSTER_W = 0.56;

function configurePoster(t: Texture | Texture[]) {
  for (const tex of Array.isArray(t) ? t : [t]) {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
  }
}

/** Sidewalk A-frame with the entrance poster (/Images → optimized WebP). */
function AFrameBoard({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const poster = useTexture("/textures/posters/entrance-aframe.webp", configurePoster);
  const h = 0.95;
  const w = 0.6;
  const tilt = 0.24;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, Math.PI].map((yaw) => (
        // Each panel hangs from the shared top hinge and kicks its foot out.
        <group key={yaw} rotation={[0, yaw, 0]}>
          <group position={[0, h * Math.cos(tilt), 0]} rotation={[-tilt, 0, 0]}>
            <mesh position={[0, -h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, 0.025]} />
              <meshStandardMaterial color={ink} roughness={0.6} />
            </mesh>
            {/* Entrance poster (2:3) — faint self-light keeps it readable at night */}
            <mesh position={[0, -h / 2 + 0.02, 0.0135]}>
              <planeGeometry args={[POSTER_W, POSTER_W * 1.5]} />
              <meshStandardMaterial map={poster} emissiveMap={poster} emissive="#ffffff" emissiveIntensity={0.14} roughness={0.85} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

export function Exterior() {
  const high = useQuality((s) => s.tier) === "high";
  return (
    <group>
      <DoorLeaf side={-1} />
      <DoorLeaf side={1} decal />

      {/* Lettering on the building face, right of the storefront */}
      {["SKATE", "MUSIC", "GAMES", "APPAREL"].map((w, i) => (
        <Text
          key={w}
          position={[6.4, 2.75 - i * 0.34, FRONT_Z + 0.04]}
          font={ANTON_TTF}
          fontSize={0.3}
          color={paper}
          letterSpacing={0.04}
          anchorX="left"
          anchorY="middle"
          material-toneMapped={false}
        >
          {w}
        </Text>
      ))}

      {/* Warm graze so the lettering reads as painted on the wall, not floating */}
      {high && <pointLight position={[7.1, 3.4, FRONT_Z + 0.9]} color="#ffbc7a" intensity={2.2} distance={4.5} decay={1.6} />}

      {/* Sidewalk dressing */}
      {/* Black-pot plants: tall ones under the wall sconces, large planters flanking the door */}
      <PlantTallHQ position={[-8.2, 0, FRONT_Z + 0.45]} rotation={[0, 0.6, 0]} />
      <PlantTallHQ position={[8.2, 0, FRONT_Z + 0.45]} rotation={[0, -0.8, 0]} />
      <PlantBigHQ position={[-1.42, 0, FRONT_Z + 0.48]} rotation={[0, 0.3, 0]} />
      <PlantBigHQ position={[1.42, 0, FRONT_Z + 0.48]} rotation={[0, -1.9, 0]} />
      <Bench position={[-3.3, 0, FRONT_Z + 0.45]} />
      {/* A complete leaning against the left pier */}
      <group position={[-5.45, 0, FRONT_Z + 0.32]} rotation={[0, 0.2, 0]}>
        {/* Tail on the ground, nose tipped back against the wall */}
        <group rotation={[-Math.PI / 2 - 0.22, 0, 0]} position={[0, 0.02, 0]}>
          <Deck art="11-sticker-composition" position={[0, 0, 0.4]} />
        </group>
      </group>
      <AFrameBoard position={[2.3, 0, FRONT_Z + 1.2]} rotation={-0.35} />
    </group>
  );
}
