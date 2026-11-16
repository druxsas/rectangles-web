"use client";

import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { useNightShiftTexture } from "@/scenes/store/NightShift";
import { ImacScreen } from "@/scenes/store/ImacStore";
import { IMAC } from "@/scenes/store/imacPose";
import { useTvTexture } from "@/scenes/store/TvScreen";
import { Exterior } from "@/scenes/store/Exterior";
import { LogoPlane } from "@/scenes/store/LogoPlane";
import { WallPosters } from "@/scenes/store/Posters";
import { TrackLighting } from "@/scenes/store/Lighting";
import {
  ArcadeHQ,
  ImacHQ,
  PaperBagHQ,
  PlantsHQ,
  RugHQ,
  SkateHQ,
  SpeakerPairHQ,
  RecordPlayerHQ,
  TvHQ,
  WilliamHQ,
} from "@/scenes/store/models";
import { useShellTextures, type PbrSet } from "@/scenes/store/useShellTextures";
import { useCheckout } from "@/stores/checkout";

/**
 * Rectangle's store interior — the immersive walkthrough scene.
 *
 * Everything is in real-world meters. The shop is a 12 × 10 m boutique
 * with a 4.2 m ceiling; every GLB is normalized to its real size in
 * `models.tsx`, so placement here is literal: position = where it stands.
 *
 *   x: -6 (left wall: arcades by the window, skate wall further in)
 *      +6 (right wall: music)
 *   z: -5 (back wall: sign, counter, vendor) … +5 (glass storefront)
 *
 * Layout follows the approved brandbook §15 storyboard: dark concrete,
 * metal, contained cobalt light, warm lamps; arcades near the entrance,
 * dark perforated-metal counter at the back, bag handover at the counter.
 */

export const ROOM = { w: 12, d: 10, h: 4.2 } as const;
const HALF_W = ROOM.w / 2;
const HALF_D = ROOM.d / 2;

const COL = {
  ceiling: "#0e1012",
  signInk: "#f7f7f3",
  signBg: "#121315",
  frame: "#0b0c0d",
  cobalt: "#165dfa",
  warm: "#ffbc7a",
  woodDark: "#231710",
} as const;

function PbrMat({ set, roughness = 0.8, color }: { set: PbrSet; roughness?: number; color?: string }) {
  return (
    <meshStandardMaterial
      map={set.map}
      normalMap={set.normal}
      aoMap={set.arm}
      roughnessMap={set.arm}
      metalnessMap={set.arm}
      roughness={roughness}
      metalness={0.05}
      color={color}
    />
  );
}

/** Dot-grid texture for the perforated steel counter front. */
function usePerforatedTexture(repeat: [number, number]) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#3a3d41";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#060607";
    ctx.beginPath();
    ctx.arc(32, 32, 11, 0, Math.PI * 2);
    ctx.fill();
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(...repeat);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [repeat]);
}

// ================================================================
// Shell — floor, walls, ceiling
// ================================================================
function Shell() {
  const tex = useShellTextures();
  return (
    <group>
      {/* Floor runs out past the storefront to form the sidewalk */}
      <mesh position={[0, 0, 4.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 19]} />
        <PbrMat set={tex.floor} roughness={0.5} />
      </mesh>
      <mesh position={[0, ROOM.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={COL.ceiling} roughness={1} />
      </mesh>
      <mesh position={[0, ROOM.h / 2, -HALF_D]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        <PbrMat set={tex.wall} />
      </mesh>
      <mesh position={[-HALF_W, ROOM.h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <PbrMat set={tex.wall} />
      </mesh>
      <mesh position={[HALF_W, ROOM.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <PbrMat set={tex.wall} />
      </mesh>
      {/* Thin black skirting where walls meet the floor */}
      {[
        { p: [0, 0.06, -HALF_D + 0.01] as const, r: 0, l: ROOM.w },
        { p: [-HALF_W + 0.01, 0.06, 0] as const, r: Math.PI / 2, l: ROOM.d },
        { p: [HALF_W - 0.01, 0.06, 0] as const, r: -Math.PI / 2, l: ROOM.d },
      ].map((s, i) => (
        <mesh key={i} position={[...s.p]} rotation={[0, s.r, 0]}>
          <boxGeometry args={[s.l, 0.12, 0.02]} />
          <meshStandardMaterial color={COL.frame} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ================================================================
// Storefront — building face, glazing, door opening, sign band
// ================================================================
function Storefront() {
  const tex = useShellTextures();
  const z = HALF_D;
  const doorHalf = 0.85;
  const doorTop = 2.7;
  const bandY = 3.75;
  const glassBottom = 0.45;
  const glassTop = bandY - 0.4;

  const glassMat = (
    <meshPhysicalMaterial color="#0d1218" roughness={0.04} metalness={0} transparent opacity={0.16} clearcoat={1} />
  );
  const frameMat = <meshStandardMaterial color={COL.frame} roughness={0.45} metalness={0.4} />;

  const paneW = HALF_W - 0.3 - doorHalf;
  const paneX = doorHalf + paneW / 2;

  return (
    <group>
      {/* Building face around the shop */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (HALF_W + 5), 4.5, z + 0.02]}>
          <planeGeometry args={[10, 9]} />
          <PbrMat set={tex.wall} color="#7a7a7a" />
        </mesh>
      ))}
      <mesh position={[0, ROOM.h + 2.4, z + 0.02]}>
        <planeGeometry args={[ROOM.w, 4.8]} />
        <PbrMat set={tex.wall} color="#7a7a7a" />
      </mesh>

      {/* Sign band + wordmark */}
      <mesh position={[0, bandY, z + 0.1]} castShadow>
        <boxGeometry args={[ROOM.w, 0.8, 0.2]} />
        <meshStandardMaterial color={COL.signBg} roughness={0.7} />
      </mesh>
      {/* Official horizontal lock-up, lit */}
      <group position={[0, bandY, z + 0.205]}>
        <LogoPlane variant="horizontal" tone="white" width={3.9} glow={1.6} />
      </group>
      <pointLight position={[0, bandY - 0.2, z + 1.2]} color={COL.warm} intensity={2.5} distance={5} decay={1.6} />

      {/* Pillars at both ends */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (HALF_W - 0.15), ROOM.h / 2, z + 0.05]} castShadow>
          <boxGeometry args={[0.3, ROOM.h, 0.3]} />
          {frameMat}
        </mesh>
      ))}

      {/* Bulkheads + glazing + mullions either side of the door */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * paneX, glassBottom / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[paneW, glassBottom, 0.25]} />
            <PbrMat set={tex.wall} color="#3a3a3a" />
          </mesh>
          <mesh position={[side * paneX, (glassBottom + glassTop) / 2, z]}>
            <planeGeometry args={[paneW, glassTop - glassBottom]} />
            {glassMat}
          </mesh>
          {/* Vertical mullions */}
          {[doorHalf, doorHalf + paneW / 2].map((x) => (
            <mesh key={x} position={[side * x, (glassBottom + glassTop) / 2, z]}>
              <boxGeometry args={[0.06, glassTop - glassBottom, 0.08]} />
              {frameMat}
            </mesh>
          ))}
          {/* Sill */}
          <mesh position={[side * paneX, glassBottom, z]}>
            <boxGeometry args={[paneW, 0.05, 0.12]} />
            {frameMat}
          </mesh>
        </group>
      ))}

      {/* Door mat with the framed mark, just inside the entrance */}
      <mesh position={[0, 0.006, z - 0.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, 0.95]} />
        <meshStandardMaterial color="#141516" roughness={1} />
      </mesh>
      {/* Woven framed logo — top of the logo points into the shop, so it reads upright for someone walking in */}
      <group position={[0, 0.008, z - 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <LogoPlane variant="framed" tone="white" width={1.1} tint="#6b6f74" />
      </group>

      {/* Transom over the door + head rail */}
      <mesh position={[0, doorTop, z]}>
        <boxGeometry args={[doorHalf * 2 + 0.06, 0.06, 0.1]} />
        {frameMat}
      </mesh>
      <mesh position={[0, (doorTop + glassTop) / 2, z]}>
        <planeGeometry args={[doorHalf * 2, glassTop - doorTop]} />
        {glassMat}
      </mesh>
      <mesh position={[0, glassTop, z]}>
        <boxGeometry args={[ROOM.w - 0.6, 0.06, 0.1]} />
        {frameMat}
      </mesh>
    </group>
  );
}

const PERF_REPEAT: [number, number] = [88, 19];

/**
 * Wall TV size. TvHQ is normalized to 1.35 m overall width, which gives a
 * 1.31 × 0.634 m picture (57.3" diagonal); scale the whole group to hit
 * the target diagonal so the picture plane stays aligned.
 */
const TV_DIAGONAL_IN = 100;
const TV_SCALE = (TV_DIAGONAL_IN * 0.0254) / Math.hypot(1.31, 0.634);

// ================================================================
// Back wall — illuminated wordmark, counter, vendor, iMac, bag
// ================================================================
function BackWallHero() {
  const perforated = usePerforatedTexture(PERF_REPEAT);
  const tvTexture = useTvTexture();
  const openCheckout = useCheckout((s) => s.open);
  const counterZ = -3.7;
  const counterH = 1.0;

  return (
    <group>
      {/* Illuminated sign — framed lock-up inside the store (facade uses horizontal) */}
      <group position={[0, 3.5, -HALF_D + 0.04]}>
        <LogoPlane variant="framed" tone="white" width={2.6} glow={1.8} />
      </group>
      {/* Wall-wash behind the sign */}
      <pointLight position={[0, 3.5, -HALF_D + 0.6]} color={COL.warm} intensity={3} distance={4.5} decay={1.6} />

      {/* Counter — dark steel carcass, perforated front, blackened-steel top */}
      <mesh position={[0, counterH / 2 - 0.02, counterZ]} castShadow receiveShadow>
        <boxGeometry args={[4.4, counterH - 0.04, 0.75]} />
        <meshStandardMaterial color="#1c1e21" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, counterH / 2 - 0.04, counterZ + 0.376]}>
        <planeGeometry args={[4.4, counterH - 0.12]} />
        <meshStandardMaterial map={perforated} roughness={0.45} metalness={0.8} />
      </mesh>
      <mesh position={[0, counterH - 0.02, counterZ + 0.03]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 0.04, 0.85]} />
        <meshStandardMaterial color="#141517" roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Toe-kick shadow gap */}
      <mesh position={[0, 0.04, counterZ + 0.33]}>
        <boxGeometry args={[4.4, 0.08, 0.02]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
      {/* Warm task light over the counter */}
      <pointLight position={[0, 2.2, counterZ + 0.6]} color={COL.warm} intensity={2.4} distance={3.5} decay={1.6} />

      {/* William, the vendor, behind the counter */}
      <WilliamHQ position={[0.6, 0, -4.35]} rotation={[0, -0.15, 0]} />

      {/* iMac on the counter, facing the vendor side (storyboard 08) — click to zoom into the store */}
      <group
        position={IMAC.position}
        rotation={[0, IMAC.yaw, 0]}
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
        <ImacHQ />
        {/* The online store: texture while walking, live page when zoomed in */}
        <ImacScreen />
      </group>

      {/* Wall-hung TV, centred under the sign — looping skate clip */}
      <group position={[0, 1.9, -HALF_D + 0.02]} scale={TV_SCALE}>
        <TvHQ />
        {/* Picture plane over the panel's screen area (normalized model coords) */}
        <mesh position={[0, 0.3406, 0.027]}>
          <planeGeometry args={[1.31, 0.634]} />
          <meshBasicMaterial map={tvTexture} color="#bdbdbd" toneMapped={false} />
        </mesh>
      </group>

      {/* A complete on the counter beside the bag (storyboard 11) */}
      <SkateHQ position={[1.85, counterH, counterZ + 0.05]} rotation={[0, 1.35, 0]} />

      {/* Rectangle's kraft bag waiting on the counter */}
      <group position={[1.15, counterH, counterZ + 0.1]} rotation={[0, -Math.PI / 2 + 0.25, 0]}>
        <PaperBagHQ />
      </group>
      <group position={[1.15, counterH, counterZ + 0.1]} rotation={[0, 0.25, 0]}>
        <group position={[0, 0.25, 0.073]}>
          <LogoPlane variant="framed" tone="black" width={0.16} />
        </group>
      </group>
    </group>
  );
}

// ================================================================
// Skate — backlit cobalt lightbox with a wall of decks (left wall)
// ================================================================
function SkateZone() {
  const wallX = -HALF_W;
  const cz = -2.0;
  const cy = 1.75;
  const decks = [-0.825, -0.275, 0.275, 0.825];

  return (
    <group>
      {/* Lightbox: black frame + glowing cobalt face */}
      <mesh position={[wallX + 0.04, cy, cz]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.9, 1.9, 0.06]} />
        <meshStandardMaterial color={COL.frame} roughness={0.5} />
      </mesh>
      <mesh position={[wallX + 0.075, cy, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.76, 1.76]} />
        <meshStandardMaterial color="#000" emissive={COL.cobalt} emissiveIntensity={0.55} toneMapped={false} />
      </mesh>
      <pointLight position={[wallX + 1.1, cy, cz]} color={COL.cobalt} intensity={2.2} distance={4} decay={1.6} />

      {/* Wall-mounted decks: graphic out, wheels toward the room */}
      {decks.map((dz) => (
        <group key={dz} position={[wallX + 0.24, cy, cz + dz]} rotation={[0, Math.PI / 2, 0]}>
          <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <SkateHQ />
          </group>
        </group>
      ))}

      {/* Low plinth with a hero deck in front of the wall */}
      <mesh position={[wallX + 1.25, 0.2, cz]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.4, 1.2]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.6} />
      </mesh>
      <SkateHQ position={[wallX + 1.25, 0.4, cz]} rotation={[0, 0.35, 0]} />
    </group>
  );
}

// ================================================================
// Music — speaker pair + turntable console (right wall)
// ================================================================
function MusicZone() {
  const wallX = HALF_W;
  const cz = -1.0;
  return (
    <group>
      <SpeakerPairHQ position={[wallX - 0.35, 0, cz]} rotation={[0, -Math.PI / 2, 0]} />
      {/* Console between the towers */}
      <mesh position={[wallX - 0.35, 0.36, cz]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.72, 0.58]} />
        <meshStandardMaterial color="#1c120c" roughness={0.6} />
      </mesh>
      <RecordPlayerHQ position={[wallX - 0.37, 0.72, cz]} rotation={[0, -Math.PI / 2, 0]} />
      {/* Warm accent grazing the speakers */}
      <pointLight position={[wallX - 1.4, 2.4, cz]} color={COL.warm} intensity={2.2} distance={4} decay={1.6} />
    </group>
  );
}

// ================================================================
// Games — two arcade cabinets running Night Shift (left wall, by the window)
// ================================================================
function GamesZone() {
  const nightShift = useNightShiftTexture();
  const screens = useMemo(() => ({ Street_Fighter_II: nightShift }), [nightShift]);
  const x = -HALF_W + 0.42;
  return (
    <group>
      {[2.55, 1.7].map((z) => (
        <ArcadeHQ key={z} position={[x, 0, z]} rotation={[0, Math.PI, 0]} textures={screens} />
      ))}
      <pointLight position={[x + 1.0, 1.35, 2.1]} color={COL.cobalt} intensity={1.8} distance={3} decay={1.6} />
    </group>
  );
}

// ================================================================
// Soft furnishings — rug + plant arrangements
// ================================================================
function Furnishings() {
  return (
    <group>
      {/* Simla bordered rug, laid landscape: long side across the shop */}
      <RugHQ position={[0, 0.001, 0.35]} rotation={[0, Math.PI / 2, 0]} />
      <PlantsHQ position={[-5.05, 0, -4.05]} rotation={[0, 0.6, 0]} />
      <PlantsHQ position={[4.95, 0, 3.95]} rotation={[0, -2.4, 0]} />
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
      <Storefront />
      <Exterior />
      <WallPosters />
      <TrackLighting />
      <BackWallHero />
      <SkateZone />
      <MusicZone />
      <GamesZone />
      <Furnishings />
    </group>
  );
}
