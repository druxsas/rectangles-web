"use client";

/**
 * The brand rectangle on its own (no wordmark) — e.g. the decal on the
 * storefront door glass (storyboard 02). For the full logo use LogoPlane.
 */
export function FramedMark({ width, color, stroke = 0.08 }: { width: number; color: string; stroke?: number }) {
  const h = width * 0.62;
  const t = width * stroke;
  const mat = <meshBasicMaterial color={color} toneMapped={false} />;
  return (
    <group>
      <mesh position={[0, h / 2 - t / 2, 0]}>
        <planeGeometry args={[width, t]} />
        {mat}
      </mesh>
      <mesh position={[0, -h / 2 + t / 2, 0]}>
        <planeGeometry args={[width, t]} />
        {mat}
      </mesh>
      <mesh position={[-width / 2 + t / 2, 0, 0]}>
        <planeGeometry args={[t, h]} />
        {mat}
      </mesh>
      <mesh position={[width / 2 - t / 2, 0, 0]}>
        <planeGeometry args={[t, h]} />
        {mat}
      </mesh>
    </group>
  );
}
