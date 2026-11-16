"use client";

import { Environment, Lightformer, Stats } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { CameraRig } from "@/canvas/CameraRig";
import { PostProcessing } from "@/canvas/PostProcessing";
import { detectTier, useQuality } from "@/canvas/quality";
import { SceneSkeleton, useSceneReady } from "@/components/scene-skeleton";
import { Store } from "@/scenes/store/Store";
import { useScroll } from "@/stores/scroll";

/**
 * Global persistent R3F canvas — the store is here and nothing else.
 * Scroll drives the camera through the brandbook §15 storyboard.
 *
 * Quality tier (canvas/quality.ts) is detected before the canvas mounts so
 * shadows, lights and post-processing are set once, without recompiles.
 */
/** Mounted after <Store/> inside Suspense: flags the scene as ready a few frames after it first renders. */
/**
 * The shadow map is re-rendered only when something that casts can have
 * moved, instead of every frame: the scene is static except the entrance
 * doors (scroll-driven, facade → entrance). A slow heartbeat picks up
 * anything that streams in late. Skipping the pass saves drawing every
 * shadow caster a second time per frame.
 */
function StaticShadows() {
  const gl = useThree((s) => s.gl);
  const frame = useRef(0);
  const lastStop = useRef(-1);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
  useFrame(() => {
    const stop = useScroll.getState().stop;
    const doorsMoving = stop < 1.2 && Math.abs(stop - lastStop.current) > 1e-4;
    lastStop.current = stop;
    frame.current += 1;
    if (frame.current < 120 || doorsMoving || frame.current % 120 === 0) gl.shadowMap.needsUpdate = true;
  });
  return null;
}

function SceneReady() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 4) useSceneReady.getState().setReady();
  });
  return null;
}

export function SceneCanvas() {
  const ready = useQuality((s) => s.ready);
  const tier = useQuality((s) => s.tier);
  const dpr = useQuality((s) => s.dpr);
  const high = tier === "high";
  // `?debug=1`: FPS / frame-time panel for measuring on real devices.
  const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

  useEffect(() => {
    useQuality.getState().setTier(detectTier());
  }, []);

  if (!ready)
    return (
      <div className="fixed inset-0 z-0" style={{ background: "#0a0b0d" }}>
        <SceneSkeleton />
      </div>
    );

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, dpr]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false }}
        shadows={high ? "soft" : false}
        camera={{ position: [0, 1.75, 15], fov: 56, near: 0.05, far: 80 }}
        onCreated={(state) => {
          // Expose the renderer for profiling: always in dev, `?debug=1` in production.
          if (process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("debug"))
            (window as unknown as { __r3f: unknown }).__r3f = state;
        }}
      >
        <color attach="background" args={["#0a0b0d"]} />
        <fog attach="fog" args={["#0a0b0d", 14, 34]} />

        <Suspense fallback={null}>
          {/* Procedural environment (no HDR download): a few soft warm/cool
              panels for reflections on metal, glass and lacquer. */}
          <Environment resolution={high ? 128 : 32} environmentIntensity={0.35} frames={1}>
            <Lightformer form="rect" intensity={2} color="#ffd2a0" position={[0, 4, -3]} scale={[8, 1.5, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#ffbc7a" position={[-5, 3, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#8bb3e0" position={[5, 2, 4]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
            <Lightformer form="rect" intensity={0.6} color="#f1dfc6" position={[0, 2, 8]} rotation-y={Math.PI} scale={[10, 3, 1]} />
            {/* Soft ceiling panel on the visitor side: gives the steel counter its sheen */}
            <Lightformer form="rect" intensity={1.4} color="#fff3e2" position={[0, 3.8, -1.2]} rotation-x={Math.PI / 2} scale={[5, 2.2, 1]} />
          </Environment>
          <ambientLight intensity={high ? 0.3 : 0.42} color="#5a3f2a" />
          <hemisphereLight args={["#2a3b5a", "#1d1710", high ? 0.5 : 0.65]} />
          <directionalLight
            position={[4, 9, 7]}
            intensity={0.55}
            color="#f1dfc6"
            castShadow={high}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={24}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-6}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[0, 5, 14]} intensity={0.6} color="#8bb3e0" />
          <Store />
          {high && <StaticShadows />}
          <SceneReady />
        </Suspense>
        <CameraRig />
        <PostProcessing />
        {debug && <Stats showPanel={0} />}
      </Canvas>
      <SceneSkeleton />
    </div>
  );
}
