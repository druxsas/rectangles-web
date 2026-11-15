import { SceneCanvas } from "@/canvas/SceneCanvas";

export default function Home() {
  return (
    <>
      <SceneCanvas />
      <main className="relative flex-1 flex flex-col justify-between p-6 md:p-12">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl tracking-tight font-black uppercase">
            Rectangle&apos;s
          </span>
          <span className="font-mono text-xs text-[color:var(--color-muted)] uppercase">
            V0.1 · MVP
          </span>
        </header>

        <section className="max-w-3xl">
          <h1 className="font-display font-black uppercase leading-[0.9] text-6xl md:text-8xl tracking-tight">
            Culturas que conectan.
          </h1>
          <p className="mt-6 max-w-md text-[color:var(--color-muted)]">
            Skate, música, videojuegos y computadoras retro. Una identidad
            compartida, cuatro maneras de participar.
          </p>
        </section>

        <footer className="font-mono text-xs text-[color:var(--color-muted)] uppercase">
          Smoke test · scroll y universo próximo
        </footer>
      </main>
    </>
  );
}
