"use client";

import { useGLTF } from "@react-three/drei";
import { displayFont, drawLogo, sansFont, whenBrandReady } from "@/scenes/store/brandCanvas";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  Box3,
  CanvasTexture,
  Color,
  Euler,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  type Material,
  type Object3D,
  type Texture,
} from "three";

/**
 * GLB model factory with real-world normalization.
 *
 * The source assets come from different tools with wildly different unit
 * conventions (a speaker pair authored at ~18 units tall, a turntable at
 * 60 units wide, an iMac exported Z-up). Every model is therefore:
 *
 *   1. optionally pre-rotated to fix its up axis / facing,
 *   2. uniformly scaled so one bounding-box dimension matches a target
 *      size in meters,
 *   3. re-centered on X/Z and grounded so its lowest point sits at Y=0.
 *
 * Placement in the scene is then plain meters: position = where it stands.
 */

type Axis = "height" | "width" | "depth";

type MaterialOverride = (name: string, original: MeshStandardMaterial) => Material | undefined;

type ModelSpec = {
  /** Target size in meters along one axis of the (pre-rotated) bounding box. */
  fit: Partial<Record<Axis, number>>;
  /** Rotation applied before measuring, e.g. to fix a Z-up export. */
  preRotation?: [number, number, number];
  /** Node names (or prefixes) to drop from the scene graph. */
  hide?: string[];
  /** Node names to keep (mesh or parent group) — every other mesh is dropped (pick one piece of a set). */
  keep?: string[];
  /** Per-material replacement keyed by the source material name. */
  materials?: MaterialOverride;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Continuously spin one node about its local Y (e.g. a record). */
  spin?: { node: string; rpm: number };
};

export type ModelProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Extra per-instance texture overrides keyed by material name. */
  textures?: Record<string, Texture>;
  /** Glow of texture-override screens (default 1.4; lower for video). */
  screenIntensity?: number;
  /**
   * Per-instance base-colour maps keyed by material name — keeps the
   * original material (roughness, normals…) and only swaps its `map`
   * (e.g. a different graphic on each skate deck).
   */
  maps?: Record<string, Texture>;
  onClick?: (e: { stopPropagation: () => void }) => void;
  onPointerOver?: (e: { stopPropagation: () => void }) => void;
  onPointerOut?: () => void;
};

const AXIS_INDEX: Record<Axis, "x" | "y" | "z"> = { width: "x", height: "y", depth: "z" };

function normalize(
  source: Object3D,
  spec: ModelSpec,
  textures?: Record<string, Texture>,
  screenIntensity = 1.4,
  maps?: Record<string, Texture>,
): Group {
  const root = source.clone(true);

  if (spec.keep?.length) {
    const drop: Object3D[] = [];
    root.traverse((o) => {
      if (!(o as Mesh).isMesh) return;
      // Multi-material nodes load as a group of sub-meshes: match the mesh or any ancestor.
      let p: Object3D | null = o;
      while (p) {
        if (spec.keep!.includes(p.name)) return;
        p = p.parent;
      }
      drop.push(o);
    });
    drop.forEach((o) => o.removeFromParent());
  }

  if (spec.hide?.length) {
    const drop: Object3D[] = [];
    root.traverse((o) => {
      if (spec.hide!.some((h) => o.name.startsWith(h))) drop.push(o);
    });
    drop.forEach((o) => o.removeFromParent());
  }

  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = spec.castShadow ?? true;
    mesh.receiveShadow = spec.receiveShadow ?? true;
    const swap = (m: Material) => {
      const name = m.name;
      const tex = textures?.[name];
      if (tex) {
        return new MeshStandardMaterial({
          map: tex,
          emissive: new Color("#ffffff"),
          emissiveMap: tex,
          emissiveIntensity: screenIntensity,
          roughness: 0.25,
          toneMapped: false,
          name,
        });
      }
      const base = spec.materials?.(name, m as MeshStandardMaterial) ?? m;
      const map = maps?.[name];
      if (map && (base as MeshStandardMaterial).isMeshStandardMaterial) {
        const art = (base as MeshStandardMaterial).clone();
        art.map = map;
        art.color.set("#ffffff");
        return art;
      }
      return base;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
  });

  const oriented = new Group();
  if (spec.preRotation) oriented.rotation.copy(new Euler(...spec.preRotation));
  oriented.add(root);
  oriented.updateMatrixWorld(true);

  const box = new Box3().setFromObject(oriented);
  const size = box.getSize(new Vector3());
  const [axis, target] = Object.entries(spec.fit)[0] as [Axis, number];
  const s = target / size[AXIS_INDEX[axis]];

  const scaled = new Group();
  scaled.scale.setScalar(s);
  scaled.add(oriented);

  const center = box.getCenter(new Vector3());
  scaled.position.set(-center.x * s, -box.min.y * s, -center.z * s);

  const out = new Group();
  out.add(scaled);
  return out;
}

function model(path: string, spec: ModelSpec) {
  function Model({ position, rotation, textures, screenIntensity, maps, onClick, onPointerOver, onPointerOut }: ModelProps) {
    const { scene } = useGLTF(path);
    const instance = useMemo(
      () => normalize(scene, spec, textures, screenIntensity, maps),
      [scene, textures, screenIntensity, maps],
    );
    const spinning = useMemo(() => {
      if (!spec.spin || typeof window === "undefined") return null;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
      return instance.getObjectByName(spec.spin.node) ?? null;
    }, [instance]);
    useFrame((_, dt) => {
      if (spinning && spec.spin) spinning.rotation.y -= (dt * spec.spin.rpm * Math.PI * 2) / 60;
    });
    return (
      <primitive
        object={instance}
        position={position}
        rotation={rotation}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }
  useGLTF.preload(path);
  return Model;
}

// ----------------------------------------------------------------
// Shared materials for untextured sources
// ----------------------------------------------------------------
const lacquerInk = new MeshPhysicalMaterial({
  color: "#0d0e10",
  roughness: 0.32,
  clearcoat: 0.6,
  clearcoatRoughness: 0.25,
});
const lacquerCobalt = new MeshPhysicalMaterial({
  color: "#165dfa",
  roughness: 0.35,
  clearcoat: 0.8,
  clearcoatRoughness: 0.2,
});
const satinBlack = new MeshStandardMaterial({ color: "#121315", roughness: 0.55, metalness: 0.1 });
const brushedSteel = new MeshStandardMaterial({ color: "#b9bcc0", roughness: 0.3, metalness: 1 });
const aluminium = new MeshStandardMaterial({ color: "#c7c9cc", roughness: 0.28, metalness: 0.9 });
const glass = new MeshPhysicalMaterial({
  color: "#0b0d12",
  roughness: 0.05,
  metalness: 0,
  transmission: 0,
  transparent: true,
  opacity: 0.35,
  clearcoat: 1,
});
const kraft = new MeshStandardMaterial({ color: "#b58a5c", roughness: 0.92 });
const kraftInside = new MeshStandardMaterial({ color: "#9c7449", roughness: 0.95 });
const goldFoil = new MeshStandardMaterial({ color: "#c9a24a", roughness: 0.35, metalness: 1 });
const walnut = new MeshStandardMaterial({ color: "#1c120c", roughness: 0.6 });
const coneOrange = new MeshStandardMaterial({ color: "#8a3f12", roughness: 0.7 });
const leaf = new MeshStandardMaterial({ color: "#2c4a26", roughness: 0.55, side: 2 });
const stem = new MeshStandardMaterial({ color: "#4a5a2e", roughness: 0.7, side: 2 });
const ceramicInk = new MeshStandardMaterial({ color: "#1b1c1e", roughness: 0.45, metalness: 0.05 });
const soil = new MeshStandardMaterial({ color: "#20160f", roughness: 1 });
const marble = new MeshPhysicalMaterial({ color: "#dcd9d2", roughness: 0.25, clearcoat: 0.4 });

// ----------------------------------------------------------------
// User-supplied HQ (Draco-compressed) models — the heroes.
// ----------------------------------------------------------------

/** Complete skateboard, lying flat, wheels down. 0.81 m long in source. */
export const SkateHQ = model("/models/opt/skate_hq.glb", { fit: { depth: 0.81 } });

/**
 * Modern all-in-one iMac with keyboard + mouse, from the user's FBX
 * (converted with scripts/blender/fbx_character_to_glb.py). The FBX keeps
 * its 12 source materials, so each is finished by name. Keyboard/mouse
 * whites keep the key-legend texture. The display ("Mountail Lion") stays
 * dark — the store UI plane in Store.tsx sits over it.
 */
const bezelBlack = new MeshPhysicalMaterial({ color: "#050506", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 });
const graySatin = new MeshStandardMaterial({ color: "#8d9095", roughness: 0.5, metalness: 0.4 });
export const ImacHQ = model("/models/opt/imac.glb", {
  fit: { width: 0.62 },
  materials: (name, m) => {
    switch (name) {
      case "Aluminium":
        return aluminium;
      case "Black glossy":
        return bezelBlack;
      case "Glass glossy":
        return glass;
      case "Glossy White":
      case "Satin White":
        return m; // key-legend texture
      case "Stainless Steel":
      case "Sterling Silver":
        return brushedSteel;
      case "Gray satin":
        return graySatin;
      default:
        return satinBlack; // display, camera, ports, rubber feet
    }
  },
});

/**
 * Upright arcade cabinet, front facing -X in source. No MTL shipped — the
 * cabinet is finished in black lacquer with a cobalt control deck, and the
 * "Street_Fighter_II" screen plane accepts a live texture via `textures`.
 */
export const ArcadeHQ = model("/models/opt/arcade_hq.glb", {
  fit: { height: 1.82 },
  materials: (name) => {
    if (name === "Caja") return lacquerInk;
    if (name === "Cristal") return glass;
    if (name === "Joystick") return lacquerCobalt;
    if (name === "Monedero") return brushedSteel;
    if (name === "Street_Fighter_II") return satinBlack;
    return undefined;
  },
});

/**
 * Tower speaker PAIR in one file, fronts facing +Z. The left tower is a
 * merged copy; the right is built from parts — both are kept so the file
 * renders as a matched stereo pair. White MTL sides become black walnut.
 */
export const SpeakerPairHQ = model("/models/opt/speaker_hq.glb", {
  fit: { height: 1.12 },
  materials: (name, m) => {
    if (name.startsWith("material_wood_black_speaker")) return walnut;
    if (name.startsWith("Stainless_Steel")) return brushedSteel;
    if (name.startsWith("material_speaker")) return coneOrange;
    if (name.startsWith("Black_plastic_PL")) return satinBlack;
    return m;
  },
});

/** Rectangle's kraft shopping bag. Front faces ±X in source. */
export const PaperBagHQ = model("/models/opt/paper_bag.glb", {
  fit: { height: 0.44 },
  materials: (name) => {
    if (name === "Material_Paper") return kraft;
    if (name === "Material_Paper.001") return kraftInside;
    if (name === "Material_Gold") return goldFoil;
    return undefined;
  },
});

/**
 * Wall TV (user-supplied OBJ). The file holds two TVs plus a desk stand;
 * only the centred panel is kept. Its own "screen" mesh has inset UVs and
 * a chin strip that showed as lines under video, so it renders black and
 * the picture is a separate plane laid over it (see Store.tsx).
 */
export const TvHQ = model("/models/opt/tv.glb", {
  fit: { width: 1.35 },
  hide: ["TV001", "TV_1_Stand"],
  materials: (name) => {
    if (name === "screen" || name === "t.v." || name === "Material.002") return satinBlack;
    return undefined;
  },
});

/**
 * HOKASU Tube Clip TR4 — ceiling track module (user-supplied FBX, Corona
 * variant): three 2.6 m rails ~1.05 m apart along Z, one clip spot per rail,
 * heads tilted toward -X. The two material-preview spheres are dropped.
 * Rails/heads finish in black; the lens ("-007") glows warm.
 */
const lensWarm = new MeshStandardMaterial({
  color: "#ffd9b0",
  emissive: new Color("#ffbc7a"),
  emissiveIntensity: 3,
  toneMapped: false,
});
export const HokasuTrack = model("/models/opt/hokasu.glb", {
  fit: { depth: 2.61 },
  hide: ["HOKASU_Tube_Clip_TR4-001", "HOKASU_Tube_Clip_TR4-002"],
  castShadow: false,
  materials: (name) => {
    if (name.endsWith("TR4-007")) return lensWarm;
    return satinBlack;
  },
});

/**
 * Rectangle's Sessions — Vol. 01 record label (brandbook §12). Replaces the
 * source model's label, which carried a real commercial release.
 */
let sessionsLabel: CanvasTexture | null = null;
function paintSessionsLabel(ctx: CanvasRenderingContext2D, logo?: HTMLImageElement) {
  const S = 512;
  const display = displayFont();
  const sans = sansFont();
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = "#f7f7f3";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  // Official framed logo
  if (logo) drawLogo(ctx, logo, "framed-black", S / 2, 168, 250);
  ctx.fillStyle = "#17191b";
  ctx.textAlign = "center";
  ctx.font = `400 34px ${display}`;
  ctx.fillText("SESSIONS — VOL. 01", S / 2, 336);
  ctx.font = `500 15px ${sans}`;
  ctx.fillStyle = "#565c62";
  ctx.fillText("SIDE A  ·  33⅓ RPM  ·  STEREO", S / 2, 366);
  ctx.fillText("RECORDS / SOUND / PEOPLE", S / 2, 390);
  ctx.fillStyle = "#165dfa";
  ctx.fillRect(S / 2 + 110, 300, 40, 12);
  // Spindle hole
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, 9, 0, Math.PI * 2);
  ctx.fill();
}
function sessionsLabelTexture() {
  if (sessionsLabel) return sessionsLabel;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  paintSessionsLabel(ctx);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.flipY = false; // glTF UV convention
  tex.anisotropy = 8;
  sessionsLabel = tex;
  whenBrandReady(["framed-black"], (logos) => {
    paintSessionsLabel(ctx, logos["framed-black"]);
    tex.needsUpdate = true;
  });
  return tex;
}

/**
 * Vintage record player (user-supplied .blend, exported with
 * `scripts/blender/blend_to_glb.py`). Wooden plinth, turquoise platter,
 * front amp panel. Front faces +Z. The record spins at 33⅓ rpm.
 */
export const RecordPlayerHQ = model("/models/opt/record_player.glb", {
  fit: { width: 0.53 },
  spin: { node: "Cylinder010", rpm: 33.33 },
  materials: (name, m) => {
    if (name === "label") {
      return new MeshStandardMaterial({ map: sessionsLabelTexture(), roughness: 0.55, name });
    }
    return m;
  },
});

/**
 * Simla bordered rug (user-supplied, 3 × 4 m), "Snow Charcoal" colourway —
 * light field with a black frame, echoing the framed mark. Exported with
 * `obj_to_glb.py --keep Simla_Bordered_Rugs_004 --texture …Snow-Charcoal…`.
 */
export const RugHQ = model("/models/opt/rug.glb", {
  fit: { depth: 4.0 },
  castShadow: false,
});

// ----------------------------------------------------------------
// Poly Pizza CC-BY supporting models.
// ----------------------------------------------------------------
/**
 * William — the Rectangle's vendor. User-supplied rigged FBX, converted with
 * `scripts/blender/fbx_character_to_glb.py --arms-down 28` (pose baked into
 * the mesh, textures downscaled). The white tee is tinted to the storyboard's
 * black tee; eyelash/brow cards use alpha-tested PNG.
 */
export const WilliamHQ = model("/models/opt/william.glb", {
  fit: { height: 1.76 },
  materials: (name, m) => {
    if (name === "will_tshirt") {
      const tee = m.clone();
      tee.color = new Color("#1f2124");
      tee.roughness = 0.9;
      return tee;
    }
    if (name === "eyelabrows") {
      const brows = m.clone();
      brows.alphaTest = 0.5;
      brows.transparent = false;
      return brows;
    }
    return undefined;
  },
});
/**
 * Plant arrangement (4 bird-of-paradise in ceramic pots + 2 marble plinths),
 * user-supplied. Source textures were not shipped with the OBJ, so leaves,
 * stems, pots, soil and marble get brand-palette materials.
 */
const plantMaterials: ModelSpec["materials"] = (name) => {
  if (name === "Material__8") return leaf;
    if (name === "Material__7") return stem;
    if (name === "Material__4") return ceramicInk;
    if (name === "Material__5") return soil;
    if (name.startsWith("Marble_White")) return marble;
  return undefined;
};

export const PlantsHQ = model("/models/opt/plants_hq.glb", {
  fit: { height: 1.9 },
  materials: plantMaterials,
});

/** Single bird-of-paradise in its tall black ceramic pot (from the set). */
export const PlantTallHQ = model("/models/opt/plants_hq.glb", {
  fit: { height: 1.45 },
  keep: ["Bird_Of_ParadiseBird_Version04_4", "Bird_Of_ParadiseBird_Version04_2_Vase003"],
  materials: plantMaterials,
});

/** Same tall black planter, large — flanking the entrance door. */
export const PlantBigHQ = model("/models/opt/plants_hq.glb", {
  fit: { height: 1.8 },
  keep: ["Bird_Of_ParadiseBird_Version04_4", "Bird_Of_ParadiseBird_Version04_2_Vase003"],
  materials: plantMaterials,
});

/** Single bird-of-paradise in its low black ceramic pot (from the set). */
export const PlantLowHQ = model("/models/opt/plants_hq.glb", {
  fit: { height: 1.2 },
  keep: ["Bird_Of_ParadiseBird_Version04_3", "Bird_Of_ParadiseBird_Version04_2_Vase002"],
  materials: plantMaterials,
});
export const TurntableModel = model("/models/opt/turntable.glb", { fit: { width: 0.46 } });
