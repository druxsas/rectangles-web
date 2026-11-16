"use client";

import { HokasuTrack } from "@/scenes/store/models";
import { AimedSpot, LightBeam } from "@/scenes/store/LightFixtures";
import { useQuality } from "@/canvas/quality";

/**
 * Ceiling track lighting (HOKASU Tube Clip modules), replacing the old
 * pendants — storyboard 03/07/12 show black tracks with clip spots.
 *
 * Each module = 3 rails along Z with one head per rail aiming toward -X.
 * Modules on the left keep that heading (skate wall, arcades, posters);
 * modules on the right are turned 180° to wash the music wall. Each module
 * carries one real spotLight aimed at its wall; a soft warm fill keeps the
 * centre aisle readable.
 */

const CEILING = 4.2;
const MODULE_H = 0.31; // normalized height of the module (rail top → head)
const MOUNT_Y = CEILING - MODULE_H;

type ModuleSpec = { x: number; z: number; side: -1 | 1; target: [number, number, number] };

const MODULES: ModuleSpec[] = [
  { x: -3.4, z: -1.6, side: -1, target: [-6, 1.6, -1.8] }, // skate lightbox
  { x: -3.4, z: 1.9, side: -1, target: [-6, 1.8, 2.1] }, // arcades + games poster
  { x: 3.4, z: -1.6, side: 1, target: [6, 1.5, -1.0] }, // speakers + music poster
  { x: 3.4, z: 1.9, side: 1, target: [6, 1.4, 2.4] }, // right wall, plants by the window
];

function TrackSpot({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  return (
    <>
      <AimedSpot from={from} to={to} intensity={20} distance={10} angle={0.6} penumbra={0.7} />
      {/* Visible beam so the spot reads as light in the air */}
      <LightBeam from={from} to={to} spread={1.15} opacity={0.08} />
    </>
  );
}

export function TrackLighting() {
  const high = useQuality((s) => s.tier) === "high";
  return (
    <group>
      {MODULES.map((m, i) => (
        <group key={i}>
          <HokasuTrack position={[m.x, MOUNT_Y, m.z]} rotation={[0, m.side === -1 ? 0 : Math.PI, 0]} />
          <TrackSpot from={[m.x + m.side * 0.9, MOUNT_Y, m.z]} to={m.target} />
        </group>
      ))}
      {/* Warm fill for the centre aisle (no visible fixture) — high tier only */}
      {high && (
        <>
          <pointLight position={[0, 3.6, 0.2]} color="#ffbc7a" intensity={2.2} distance={9} decay={1.5} />
          <pointLight position={[0, 3.6, -2.6]} color="#ffbc7a" intensity={1.4} distance={6} decay={1.6} />
        </>
      )}
    </group>
  );
}
