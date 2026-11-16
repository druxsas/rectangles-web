"use client";

import { Text } from "@react-three/drei";
import { useNightShiftTexture } from "@/scenes/store/NightShift";
import {
  ArcadeHQ,
  ImacHQ,
  MonsteraModel,
  SkateHQ,
  SpeakerHQ,
  TurntableModel,
  VendorModel,
} from "@/scenes/store/models";
import { useShellTextures, type PbrSet } from "@/scenes/store/useShellTextures";
import { useCheckout } from "@/stores/checkout";

/**
 * Rectangle's store interior — the immersive walkthrough scene.
 *
 * Built around user-supplied HQ Draco-compressed GLBs:
 *   - skate_hq.glb   (SkateHQ)   on a stand against the left wall
 *   - arcade_hq.glb  (ArcadeHQ)  at the back-center with Night Shift live
 *   - speaker_hq.glb (SpeakerHQ) x2 flanking the back counter
 *   - imac_hq.glb    (ImacHQ)    on the counter — clickable to open shop
 *
 * Plus CC-BY supporting: vendor behind the counter, monstera plants,
 * turntable near the music area. Shell uses Poly Haven CC0 PBR concrete.
 */

const COL = {
  ceiling: "#0e1012",
  signInk: "#f7f7f3",
  signBg: "#17191b",
  rug: "#5a1f12",
  cobalt: "#165dfa",
  warm: "#ffbc7a",
  woodDark: "#231710",
} as const;

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
// Shell — floor + walls + ceiling + facade
// ================================================================
function Shell() {
  const tex = useShellTextures();
  return (
    <group>
      {/* Floor extends past facade to form a sidewalk */}
      <mesh position={[0, 0, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 21]} />
        <PbrMat set={tex.floor} roughness={0.55} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color={COL.ceiling} roughness={1} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 4, -7]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <PbrMat set={tex.wall} />
      </mesh>
      {/* Left + right walls */}
      <mesh position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <PbrMat set={tex.wall} />
      </mesh>
      <mesh position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <PbrMat set={tex.wall} />
      </mesh>

      {/* Facade awning + side pillars + wordmark */}
      <mesh position={[0, 7.4, 7]} castShadow>
        <boxGeometry args={[20, 1.2, 0.3]} />
        <meshStandardMaterial color={COL.signBg} roughness={0.8} />
      </mesh>
      <mesh position={[-9.3, 3.5, 7]} castShadow>
        <boxGeometry args={[1.4, 7, 0.3]} />
        <meshStandardMaterial color={COL.signBg} roughness={0.8} />
      </mesh>
      <mesh position={[9.3, 3.5, 7]} castShadow>
        <boxGeometry args={[1.4, 7, 0.3]} />
        <meshStandardMaterial color={COL.signBg} roughness={0.8} />
      </mesh>
      <Text
        position={[0, 7.4, 7.17]}
        fontSize={0.9}
        color={COL.signInk}
        fontWeight={900}
        letterSpacing={-0.02}
        material-toneMapped={false}
        anchorX="center"
        anchorY="middle"
      >
        RECTANGLE&apos;S
      </Text>
    </group>
  );
}

// ================================================================
// Back wall hero — illuminated wordmark + counter + vendor
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
        letterSpacing={-0.02}
        material-toneMapped={false}
        anchorX="center"
        anchorY="middle"
      >
        RECTANGLE&apos;S
      </Text>
      <pointLight position={[0, 4.5, -6]} color={COL.warm} intensity={7} distance={10} decay={1.4} />
      <pointLight position={[-2.5, 4.5, -6]} color={COL.warm} intensity={3} distance={6} decay={1.4} />
      <pointLight position={[2.5, 4.5, -6]} color={COL.warm} intensity={3} distance={6} decay={1.4} />

      {/* Counter — single wide dark wood block */}
      <mesh position={[0, 0.55, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[9, 1.1, 1.3]} />
        <meshStandardMaterial color={COL.woodDark} roughness={0.75} />
      </mesh>
      {/* Counter top plank */}
      <mesh position={[0, 1.13, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#3a2510" roughness={0.5} />
      </mesh>

      {/* Vendor behind the counter */}
      <group position={[1.4, 0, -6.3]} rotation={[0, Math.PI, 0]}>
        <VendorModel scale={1.1} />
      </group>

      {/* iMac G3 on the counter — clickable */}
      <group
        position={[-2.3, 1.17, -5.3]}
        rotation={[0, 0.25, 0]}
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
        <ImacHQ scale={1.0} />
      </group>
    </group>
  );
}

// ================================================================
// Hanging pendant lamps across the ceiling
// ================================================================
function PendantLamps() {
  const positions: [number, number, number][] = [
    [-5, 6.6, 3],
    [0, 6.6, 1],
    [5, 6.6, 3],
    [-3, 6.6, -3],
    [4, 6.6, -3],
  ];
  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.12, 0.18, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={COL.warm} emissive={COL.warm} emissiveIntensity={4} />
          </mesh>
          <pointLight color={COL.warm} intensity={4} distance={14} decay={1.3} position={[0, -0.2, 0]} />
        </group>
      ))}
    </group>
  );
}

// ================================================================
// Skate zone — left wall
// ================================================================
function SkateZone() {
  return (
    <group>
      {/* Cobalt backlight panel */}
      <mesh position={[-9.85, 2.4, -1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3.2]} />
        <meshBasicMaterial color={COL.cobalt} toneMapped={false} />
      </mesh>
      <pointLight position={[-9.3, 2.4, -1]} color={COL.cobalt} intensity={4.5} distance={8} decay={1.3} />

      {/* Deck stand — a low plinth to display the skate */}
      <mesh position={[-8.5, 0.6, -1]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.2, 1.4]} />
        <meshStandardMaterial color={COL.woodDark} roughness={0.75} />
      </mesh>
      {/* Hero skate deck on the stand, tilted dramatically */}
      <group position={[-8.5, 1.25, -1]} rotation={[0, 0, Math.PI / 2]}>
        <SkateHQ scale={1.0} />
      </group>
    </group>
  );
}

// ================================================================
// Music zone — right wall, speaker pair + turntable
// ================================================================
function MusicZone() {
  return (
    <group>
      {/* Pair of tower speakers */}
      <group position={[8.2, 0, 0]} rotation={[0, -Math.PI / 2 + 0.2, 0]}>
        <SpeakerHQ scale={1.0} />
      </group>
      <group position={[8.2, 0, -3]} rotation={[0, -Math.PI / 2 - 0.1, 0]}>
        <SpeakerHQ scale={1.0} />
      </group>
      {/* Turntable on a short plinth between them */}
      <mesh position={[7.5, 0.6, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.2, 1.4]} />
        <meshStandardMaterial color={COL.woodDark} roughness={0.75} />
      </mesh>
      <group position={[7.5, 1.3, -1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <TurntableModel scale={1.8} />
      </group>
    </group>
  );
}

// ================================================================
// Games — arcade cabinet at back-center with Night Shift live
// ================================================================
function GamesZone() {
  const nightShift = useNightShiftTexture();
  return (
    <group>
      {/* Arcade cabinet (HQ), facing the viewer */}
      <group position={[1, 0, -6.2]} rotation={[0, Math.PI, 0]}>
        <ArcadeHQ scale={1.0} />
        {/* Night Shift live screen overlay — floats in front of the cabinet
            face so bloom reads it as a glowing CRT. */}
        <mesh position={[0, 1.55, -0.52]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.8, 0.6]} />
          <meshBasicMaterial map={nightShift} toneMapped={false} />
        </mesh>
        {/* Cobalt spill */}
        <pointLight position={[0, 1.55, -0.9]} color={COL.cobalt} intensity={2.8} distance={4.5} decay={1.4} />
      </group>
    </group>
  );
}

// ================================================================
// Center area — persian rug + plants
// ================================================================
function CenterArea() {
  return (
    <group>
      {/* Warm rug underneath the central space */}
      <mesh position={[0, 0.005, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 3.6]} />
        <meshStandardMaterial color={COL.rug} roughness={0.95} />
      </mesh>

      {/* Monstera plants in corners */}
      <group position={[-6.5, 0, -5.4]}>
        <MonsteraModel scale={2.4} />
      </group>
      <group position={[6.5, 0, -5.4]}>
        <MonsteraModel scale={2.4} />
      </group>
      <group position={[-6.5, 0, 3.5]}>
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
      <PendantLamps />
      <BackWallHero />
      <SkateZone />
      <MusicZone />
      <GamesZone />
      <CenterArea />
    </group>
  );
}
