"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

function model(path: string) {
  function Model({ position, rotation, scale }: Props) {
    const { scene } = useGLTF(path);
    const instance = useMemo(() => scene.clone(true), [scene]);
    return <primitive object={instance} position={position} rotation={rotation} scale={scale} />;
  }
  useGLTF.preload(path);
  return Model;
}

// User-supplied HQ (Draco-compressed) models — the heroes of the scene.
export const SkateHQ = model("/models/skate_hq/skate_hq.glb");
export const ImacHQ = model("/models/imac_hq/imac_hq.glb");
export const ArcadeHQ = model("/models/arcade_hq/arcade_hq.glb");
export const SpeakerHQ = model("/models/speaker_hq/speaker_hq.glb");

// Poly Pizza CC-BY supporting models.
export const VendorModel = model("/models/vendor_character/vendor_character.glb");
export const MonsteraModel = model("/models/monstera/monstera.glb");
export const TurntableModel = model("/models/turntable/turntable.glb");
export const CounterModel = model("/models/counter_straight/counter_straight.glb");
