"use client";

/**
 * Store lighting — matches brandbook §15:
 *   "Dark concrete, metal, contained blue light, warm lamps."
 *
 * Two layers:
 *   - Warm tungsten from hanging lamps across the ceiling.
 *   - Cool amber ambient + a soft hemispheric fill so dark walls don't crush.
 * Cobalt accent lights for arcade and iMac screens live inside their own zones.
 */

const WARM = "#ffb070";
const SKY = "#334055";
const GROUND = "#2b1d11";

function HangingLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Cord */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Shade — small cone-ish box */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.12, 0.18, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={WARM} emissive={WARM} emissiveIntensity={3} />
      </mesh>
      {/* Cast warm light down */}
      <pointLight color={WARM} intensity={3.5} distance={14} decay={1.3} position={[0, -0.2, 0]} />
    </group>
  );
}

export function Lighting() {
  return (
    <group>
      <ambientLight intensity={0.5} color="#6a4f36" />
      <hemisphereLight args={[SKY, GROUND, 0.7]} />

      {/* Ceiling-hung lamps spread across the store. Stronger intensity and
          lower decay so the warm pools reach floor and walls. */}
      <HangingLamp position={[-5, 6.6, 3]} />
      <HangingLamp position={[0, 6.6, 1]} />
      <HangingLamp position={[5, 6.6, 3]} />
      <HangingLamp position={[-3, 6.6, -3]} />
      <HangingLamp position={[4, 6.6, -3]} />

      {/* Key fill with shadows. Only one directional casts shadows to
          keep the perf budget sane — other lights contribute brightness
          but not shadow passes. */}
      <directionalLight
        position={[6, 9, 6]}
        intensity={0.7}
        color="#f1dfc6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0005}
      />

      {/* Soft sidewalk + facade fill from the viewer's side */}
      <directionalLight position={[0, 5, 14]} intensity={0.6} color="#8bb3e0" />

      {/* Back-wall accent — lets the back of the store read even when dim */}
      <pointLight position={[0, 5, -6]} color="#6080b0" intensity={1.2} distance={10} decay={1.6} />
    </group>
  );
}
