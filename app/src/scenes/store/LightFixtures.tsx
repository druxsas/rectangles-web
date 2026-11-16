"use client";

import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide, Object3D, Quaternion, ShaderMaterial, Vector3 } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useQuality } from "@/canvas/quality";

/**
 * Light fixtures + their light:
 *
 *  - LightBeam: a soft, fake volumetric cone (additive, fades along its
 *    length and toward its silhouette) so spots read as light in the air.
 *    Pure shading — it adds no real light cost.
 *  - CounterLights: continuous linear lights (ceiling fixture + LED strip
 *    under the top's lip) across the whole counter.
 *  - FacadeLights: recessed downlights under the sign band washing the
 *    sidewalk, plus (desktop) wall sconces grazing the building face.
 */

const WARM = "#ffcf9e";

const beamVertex = /* glsl */ `
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vAlong = uv.y; // 1 at the source, 0 at the far end
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float along = pow(vAlong, 1.8);
    float edge = pow(abs(dot(normalize(vNormal), normalize(vView))), 1.4);
    gl_FragColor = vec4(uColor, along * edge * uOpacity);
  }
`;

const UP = new Vector3(0, 1, 0);

/** Soft light cone from `from` toward `to` (cone radius at the far end = `spread`). */
export function LightBeam({
  from,
  to,
  spread,
  color = WARM,
  opacity = 0.09,
}: {
  from: [number, number, number];
  to: [number, number, number];
  spread: number;
  color?: string;
  opacity?: number;
}) {
  const key = `${from.join(",")}|${to.join(",")}`;
  const { position, quaternion, length, material } = useMemo(() => {
    const [a, b] = key.split("|").map((v) => new Vector3(...(v.split(",").map(Number) as [number, number, number])));
    const dir = a.clone().sub(b);
    const len = dir.length();
    const q = new Quaternion().setFromUnitVectors(UP, dir.normalize());
    const mat = new ShaderMaterial({
      uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: opacity } },
      vertexShader: beamVertex,
      fragmentShader: beamFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    return { position: a.clone().add(b).multiplyScalar(0.5), quaternion: q, length: len, material: mat };
  }, [key, color, opacity]);

  return (
    <mesh position={position} quaternion={quaternion} material={material} renderOrder={10} raycast={() => null}>
      <cylinderGeometry args={[0.05, spread, length, 32, 1, true]} />
    </mesh>
  );
}

/** Real spotlight aimed at a point (target object managed here). */
export function AimedSpot({
  from,
  to,
  intensity,
  angle,
  distance,
  color = WARM,
  penumbra = 0.8,
}: {
  from: [number, number, number];
  to: [number, number, number];
  intensity: number;
  angle: number;
  distance: number;
  color?: string;
  penumbra?: number;
}) {
  const target = useMemo(() => new Object3D(), []);
  return (
    <>
      <primitive object={target} position={to} />
      <spotLight position={from} target={target} color={color} intensity={intensity} distance={distance} angle={angle} penumbra={penumbra} decay={1.5} />
    </>
  );
}

// ---------------------------------------------------------------- counter

let rectAreaReady = false;
function useRectAreaLights() {
  // RectAreaLight needs its LTC lookup textures registered once.
  if (!rectAreaReady && typeof window !== "undefined") {
    RectAreaLightUniformsLib.init();
    rectAreaReady = true;
  }
}

/**
 * Counter lighting: a slim ceiling fixture with one wide soft spot washing
 * the whole steel top, and a continuous LED strip (RectAreaLight) under the
 * top's lip grazing the full width of the perforated front.
 */
export function CounterLights({ z, top, front, width }: { z: number; top: number; front: number; width: number }) {
  useRectAreaLights();
  const y = 4.12; // fixture body just under the 4.2 m ceiling
  return (
    <group>
      {/* Ceiling: slim black linear fixture with a glowing diffuser */}
      <mesh position={[0, y, z]}>
        <boxGeometry args={[width - 0.6, 0.06, 0.12]} />
        <meshStandardMaterial color="#0b0c0d" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, y - 0.031, z]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 0.7, 0.07]} />
        <meshBasicMaterial color="#fff1dc" toneMapped={false} />
      </mesh>
      {/* One wide, soft spot covers the whole top (a second area light would cost every pixel in the scene) */}
      <AimedSpot from={[0, y - 0.05, z]} to={[0, top, z + 0.05]} intensity={24} angle={0.95} penumbra={1} distance={6} color="#fff0dc" />
      <LightBeam from={[0, y - 0.05, z]} to={[0, top, z + 0.05]} spread={0.7} color="#fff0dc" opacity={0.035} />

      {/* LED strip under the top's lip, full counter width */}
      <mesh position={[0, top - 0.06, front + 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 0.1, 0.02]} />
        <meshBasicMaterial color="#ffe3c2" toneMapped={false} />
      </mesh>
      {/* Tilted slightly back so it washes the face instead of running parallel to it */}
      <rectAreaLight position={[0, top - 0.065, front + 0.1]} rotation={[-Math.PI / 2 + 0.35, 0, 0]} width={width - 0.1} height={0.04} intensity={34} color="#ffd9b0" />
    </group>
  );
}

// ---------------------------------------------------------------- facade

function Sconce({ x, z, high }: { x: number; z: number; high: boolean }) {
  const y = 2.7;
  return (
    <group>
      <mesh position={[x, y, z + 0.06]}>
        <boxGeometry args={[0.14, 0.34, 0.12]} />
        <meshStandardMaterial color="#0b0c0d" roughness={0.45} metalness={0.5} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[x, y + s * 0.172, z + 0.06]} rotation={[s * -Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 0.08]} />
          <meshBasicMaterial color={WARM} toneMapped={false} />
        </mesh>
      ))}
      {/* Up/down washes are drawn (no real lights) — every real light costs the whole scene */}
      <LightBeam from={[x, y + 0.2, z + 0.12]} to={[x, y + 2.2, z + 0.12]} spread={0.6} opacity={high ? 0.09 : 0.07} />
      <LightBeam from={[x, y - 0.2, z + 0.12]} to={[x, 0.2, z + 0.12]} spread={0.6} opacity={high ? 0.09 : 0.07} />
    </group>
  );
}

export function FacadeLights({ front, underside }: { front: number; underside: number }) {
  const high = useQuality((s) => s.tier) === "high";
  const discs = [-4.5, -1.5, 1.5, 4.5];
  return (
    <group>
      {/* Recessed downlights under the sign band */}
      {discs.map((x) => (
        <mesh key={x} position={[x, underside - 0.005, front + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 24]} />
          <meshBasicMaterial color="#fff1dc" toneMapped={false} />
        </mesh>
      ))}
      {/* One wide real spot lights the sidewalk; the per-downlight cones are drawn */}
      <AimedSpot from={[0, underside + 0.4, front + 0.4]} to={[0, 0, front + 1.9]} intensity={30} angle={1.15} penumbra={1} distance={9} />
      {[-3, 3].map((x) => (
        <LightBeam key={x} from={[x, underside - 0.05, front + 0.15]} to={[x * 1.05, 0, front + 1.6]} spread={1.6} opacity={0.045} />
      ))}
      {/* Wall sconces on the building face either side of the shop */}
      {[-8.2, 8.2].map((x) => (
        <Sconce key={x} x={x} z={front} high={high} />
      ))}
    </group>
  );
}
