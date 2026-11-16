"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { SRGBColorSpace, type Texture } from "three";

/**
 * Framed collection posters — the hero posters from brandbook §11–14,
 * cropped at native resolution from the brandbook PDF (pdftoppm -r 173)
 * into /public/textures/posters/. Placement follows the §15 storyboard:
 * frames above the arcades, over the speakers and a pair on the back wall
 * flanking the counter.
 */

type PosterSpec = {
  key: "skate" | "music" | "games" | "retro";
  /** width / height of the cropped artwork */
  aspect: number;
  /** printed width in meters (frame adds a border) */
  width: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

const WALL_X = 6;
const WALL_Z = 5;
const OFF = 0.025; // stand-off from the wall

const POSTERS: PosterSpec[] = [
  // Left wall, over the arcade cabinets (storyboard 03 / 12)
  { key: "games", aspect: 420 / 713, width: 0.62, position: [-WALL_X + OFF, 2.42, 2.12], rotation: [0, Math.PI / 2, 0] },
  // Right wall, above the speaker pair
  { key: "music", aspect: 432 / 630, width: 0.66, position: [WALL_X - OFF, 1.95, -1.0], rotation: [0, -Math.PI / 2, 0] },
  // Back wall, right of the counter — mirrors the retro poster
  { key: "skate", aspect: 458 / 754, width: 0.66, position: [3.3, 2.05, -WALL_Z + OFF], rotation: [0, 0, 0] },
  // Back wall, left of the counter — next to the iMac it talks about
  { key: "retro", aspect: 405 / 718, width: 0.66, position: [-3.3, 2.05, -WALL_Z + OFF], rotation: [0, 0, 0] },
];

const BORDER = 0.028;
const DEPTH = 0.03;

function Poster({ map, spec }: { map: Texture; spec: PosterSpec }) {
  const h = spec.width / spec.aspect;
  const fw = spec.width + BORDER * 2;
  const fh = h + BORDER * 2;
  return (
    <group position={spec.position} rotation={spec.rotation}>
      {/* Black frame */}
      <mesh position={[0, 0, DEPTH / 2]} castShadow>
        <boxGeometry args={[fw, fh, DEPTH]} />
        <meshStandardMaterial color="#0b0c0d" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Print — faint self-light keeps it legible in the dark room */}
      <mesh position={[0, 0, DEPTH + 0.001]}>
        <planeGeometry args={[spec.width, h]} />
        <meshStandardMaterial
          map={map}
          emissiveMap={map}
          emissive="#ffffff"
          emissiveIntensity={0.16}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

export function WallPosters() {
  const textures = useTexture({
    skate: "/textures/posters/skate.jpg",
    music: "/textures/posters/music.jpg",
    games: "/textures/posters/games.jpg",
    retro: "/textures/posters/retro.jpg",
  });
  useMemo(() => {
    Object.values(textures).forEach((t) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
    });
  }, [textures]);

  return (
    <group>
      {POSTERS.map((p) => (
        <Poster key={p.key} map={textures[p.key]} spec={p} />
      ))}
    </group>
  );
}
