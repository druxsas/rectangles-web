import { SceneCanvas } from "@/canvas/SceneCanvas";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <>
      <SceneCanvas />
      <main className="relative z-10 flex-1 flex flex-col justify-between p-6 md:p-12 pointer-events-none">
        <header className="flex items-center justify-between">
          <span className="font-display text-heading-lg tracking-tight font-black uppercase">
            Rectangle&apos;s
          </span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-mono-sm text-fg-muted uppercase hidden sm:inline">
              V0.1 · MVP
            </span>
            <ThemeToggle />
          </div>
        </header>

        <section className="max-w-3xl">
          <h1 className="font-display font-black uppercase tracking-tight text-display-lg md:text-display-xl">
            Cultures that connect.
          </h1>
          <p className="mt-6 max-w-md text-fg-secondary">
            Skate, music, video games, and retro computing. One shared identity,
            four ways to take part.
          </p>
        </section>

        <footer className="font-mono text-mono-sm text-fg-muted uppercase">
          Smoke test · scroll and universe next
        </footer>
      </main>
    </>
  );
}
