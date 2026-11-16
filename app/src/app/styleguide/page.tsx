import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Styleguide — Rectangle's",
  description: "Design foundations and component showcase.",
};

// ----- Data drives the showcase. Keep in sync with tokens/*.json -----

const INK_SCALE = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const COBALT_SCALE = INK_SCALE;

const SEMANTIC_SWATCHES = [
  { name: "bg.canvas",          cssVar: "--theme-bg-canvas" },
  { name: "bg.surface",         cssVar: "--theme-bg-surface" },
  { name: "bg.muted",           cssVar: "--theme-bg-muted" },
  { name: "bg.inverse",         cssVar: "--theme-bg-inverse" },
  { name: "fg.primary",         cssVar: "--theme-fg-primary" },
  { name: "fg.secondary",       cssVar: "--theme-fg-secondary" },
  { name: "fg.muted",           cssVar: "--theme-fg-muted" },
  { name: "fg.on-accent",       cssVar: "--theme-fg-on-accent" },
  { name: "accent.default",     cssVar: "--theme-accent-default" },
  { name: "accent.emphasis",    cssVar: "--theme-accent-emphasis" },
  { name: "accent.muted",       cssVar: "--theme-accent-muted" },
  { name: "line.default",       cssVar: "--theme-line-default" },
  { name: "line.strong",        cssVar: "--theme-line-strong" },
  { name: "focus.ring",         cssVar: "--theme-focus-ring" },
  { name: "status.success",     cssVar: "--theme-status-success" },
  { name: "status.warning",     cssVar: "--theme-status-warning" },
  { name: "status.error",       cssVar: "--theme-status-error" },
  { name: "status.info",        cssVar: "--theme-status-info" },
];

const TYPE_SAMPLES: Array<{ cls: string; name: string; sample: string }> = [
  { cls: "font-display text-display-xl font-black uppercase leading-[0.9]", name: "display-xl / display", sample: "Play. Listen. Ride." },
  { cls: "font-display text-display-lg font-black uppercase leading-[0.9]", name: "display-lg / display", sample: "Cultures that connect" },
  { cls: "font-display text-display-md font-black uppercase leading-[0.9]", name: "display-md / display", sample: "One more game" },
  { cls: "font-display text-heading-lg font-bold uppercase leading-tight",   name: "heading-lg / heading", sample: "Collect. Ride. Repeat." },
  { cls: "font-display text-heading-md font-bold uppercase leading-tight",   name: "heading-md / heading", sample: "Night Shift — a game about persistence" },
  { cls: "font-sans text-body-lg leading-relaxed",                           name: "body-lg / body",       sample: "The quick brown fox jumps over the lazy dog." },
  { cls: "font-sans text-body-md leading-relaxed",                           name: "body-md / body",       sample: "The quick brown fox jumps over the lazy dog." },
  { cls: "font-sans text-body-sm leading-relaxed text-fg-secondary",         name: "body-sm / body",       sample: "The quick brown fox jumps over the lazy dog." },
  { cls: "font-mono text-mono-sm uppercase tracking-wide text-fg-muted",      name: "mono-sm / tight",      sample: "R / 01 • SKATE COLLECTION" },
];

const SPACE_STEPS = [
  { tok: "space-1",  px: "4" },
  { tok: "space-2",  px: "8" },
  { tok: "space-3",  px: "12" },
  { tok: "space-4",  px: "16" },
  { tok: "space-6",  px: "24" },
  { tok: "space-8",  px: "32" },
  { tok: "space-12", px: "48" },
  { tok: "space-16", px: "64" },
  { tok: "space-24", px: "96" },
];

const RADII = ["none", "xs", "sm", "md", "lg", "full"];

// --------------------------------------------------------------------

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-12 border-t border-line first:border-t-0 first:pt-0">
      <header className="mb-8 flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-heading-lg font-black uppercase tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-body-sm text-fg-secondary max-w-xl">{subtitle}</p> : null}
        </div>
        <code className="font-mono text-mono-sm text-fg-muted uppercase">#{id}</code>
      </header>
      {children}
    </section>
  );
}

function PrimitiveScale({ label, prefix, stops }: { label: string; prefix: string; stops: string[] }) {
  return (
    <div>
      <h3 className="font-mono text-mono-sm text-fg-muted uppercase mb-3">{label}</h3>
      <div className="grid grid-cols-11 gap-1 min-w-[640px]">
        {stops.map((stop) => (
          <div key={stop} className="flex flex-col items-start">
            <div
              className="w-full aspect-square rounded-xs border border-line"
              style={{ background: `var(--color-${prefix}-${stop})` }}
            />
            <span className="mt-1 font-mono text-[10px] text-fg-muted">{stop}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SemanticGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {SEMANTIC_SWATCHES.map((s) => (
        <div key={s.name} className="flex items-center gap-3 p-3 border border-line rounded-sm bg-surface">
          <div
            className="w-10 h-10 rounded-xs border border-line shrink-0"
            style={{ background: `var(${s.cssVar})` }}
          />
          <div className="min-w-0">
            <div className="font-mono text-mono-sm truncate">{s.name}</div>
            <div className="font-mono text-[10px] text-fg-muted truncate">{s.cssVar}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <main className="relative z-10 min-h-screen max-w-6xl mx-auto px-6 md:px-12 py-10 pointer-events-auto">
      <header className="flex items-center justify-between gap-4 pb-10 border-b border-line">
        <div>
          <p className="font-mono text-mono-sm text-fg-muted uppercase tracking-wide">Rectangle&apos;s · V0.1</p>
          <h1 className="font-display text-display-md font-black uppercase tracking-tight mt-2">Styleguide</h1>
          <p className="mt-2 text-body-md text-fg-secondary max-w-xl">
            Foundations and components built from the brandbook tokens. Every color here is validated against WCAG 2.2 AA.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <nav className="my-8 flex flex-wrap gap-2">
        {["color-primitives", "color-semantic", "typography", "spacing", "radius", "components", "status"].map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="font-mono text-mono-sm uppercase px-2.5 py-1 border border-line rounded-xs text-fg-secondary hover:text-fg hover:border-line-strong"
          >
            {id}
          </a>
        ))}
      </nav>

      <Section id="color-primitives" title="Color primitives" subtitle="Full 50-950 scales. These are the raw values that semantic tokens reference.">
        <div className="space-y-6 overflow-x-auto">
          <PrimitiveScale label="ink-scale (anchors: Paper 50, Line 200, Muted 500, Ink 900)" prefix="ink-scale" stops={INK_SCALE} />
          <PrimitiveScale label="cobalt-scale (brand accent, anchor: 500)" prefix="cobalt-scale" stops={COBALT_SCALE} />
          <PrimitiveScale label="green-scale (success)" prefix="green-scale" stops={INK_SCALE} />
          <PrimitiveScale label="amber-scale (warning + warm store lamps)" prefix="amber-scale" stops={INK_SCALE} />
          <PrimitiveScale label="red-scale (error)" prefix="red-scale" stops={INK_SCALE} />
        </div>
      </Section>

      <Section id="color-semantic" title="Semantic palette" subtitle="Roles used by components. Swatches below reflect the current theme.">
        <SemanticGrid />
      </Section>

      <Section id="typography" title="Typography" subtitle="Display = Anton (heavy, condensed grotesque). Body = Inter. Mono = JetBrains Mono.">
        <div className="space-y-6">
          {TYPE_SAMPLES.map((t) => (
            <div key={t.name} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <code className="font-mono text-mono-sm text-fg-muted uppercase">{t.name}</code>
              </div>
              <div className={t.cls}>{t.sample}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="spacing" title="Spacing" subtitle="4px base scale from the brandbook §09. Start components at 16-24.">
        <div className="space-y-2">
          {SPACE_STEPS.map((s) => (
            <div key={s.tok} className="flex items-center gap-4">
              <code className="font-mono text-mono-sm text-fg-muted w-24 shrink-0">{s.tok}</code>
              <div className="h-6 bg-accent" style={{ width: `var(--${s.tok})` }} />
              <span className="font-mono text-mono-sm text-fg-secondary">{s.px}px</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="radius" title="Radius" subtitle="Discreet by default — a brand named Rectangle's keeps corners sharp.">
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 bg-surface-muted border border-line"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <code className="font-mono text-mono-sm text-fg-muted">radius-{r}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section id="components" title="Components" subtitle="Button and tag variants following brandbook §16.">
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="font-mono text-mono-sm text-fg-muted uppercase">Button · primary</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button>View product</Button>
              <Button className="hover:scale-100">Default</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-mono text-mono-sm text-fg-muted uppercase">Button · secondary</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="secondary">Explore</Button>
              <Button variant="secondary" disabled>Disabled</Button>
              <Button variant="secondary" size="sm">Small</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-mono text-mono-sm text-fg-muted uppercase">Button · ghost</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="ghost">Skip tour</Button>
              <Button variant="ghost" disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section id="status" title="Status chips" subtitle="All status combinations pass WCAG 2.2 AA (verified by pnpm a11y:contrast).">
        <div className="flex flex-wrap gap-3">
          <Chip tone="neutral">R / 01 · Skate</Chip>
          <Chip tone="accent">New</Chip>
          <Chip tone="success">In stock</Chip>
          <Chip tone="warning">Low stock</Chip>
          <Chip tone="error">Sold out</Chip>
          <Chip tone="info">Demo only</Chip>
        </div>
      </Section>

      <footer className="mt-16 pt-8 border-t border-line font-mono text-mono-sm text-fg-muted uppercase">
        <p>Source: tokens/*.json · Rebuild with pnpm tokens:build</p>
      </footer>
    </main>
  );
}
