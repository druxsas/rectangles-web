# Rectangle's — Web

Fictional portfolio project. Immersive web experience that walks the visitor through the Rectangle's store — skate, music, video games, and retro computing.

**Concept direction:** Daniel Rolón · **Version:** 0.1 (MVP)

## Structure

```
.
├── app/            Next.js 16 · React 19 · R3F · Tailwind v4
├── Brandbook/      Brand guidelines PDF + Markdown transcription
└── tokens/         Design tokens (source of truth)
```

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components)
- **React Three Fiber + drei + postprocessing** — 3D scene
- **GSAP + Lenis** — scroll choreography
- **Zustand** — shared state
- **Howler** — positional audio
- **Tailwind CSS v4** — styles + brand tokens
- **Vercel** — deployment

## Development

```bash
cd app
pnpm install
pnpm dev
```

## Roadmap

- [x] Base setup (Next.js, stack, tokens, global canvas)
- [ ] Low-poly 3D store (MVP phase)
- [ ] Scroll choreography (7 narrative cameras from the storyboard)
- [ ] Night Shift mini-game on the arcade screen
- [ ] Positional audio per zone
- [ ] Demo checkout on the iMac G3
- [ ] Phase 2 — detailed Blender modeling
