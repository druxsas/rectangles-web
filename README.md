# Rectangle's — Web

Proyecto digital ficticio de portfolio. Experiencia web inmersiva que recorre el local Rectangle's — skate, música, videojuegos y computadoras retro.

**Dirección conceptual:** Daniel Rolón · **Versión:** 0.1 (MVP)

## Estructura

```
.
├── app/            Next.js 16 · React 19 · R3F · Tailwind v4
├── Brandbook/      PDF + MD de la guía de marca
└── tokens/         Tokens de diseño exportados
```

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components)
- **React Three Fiber + drei + postprocessing** — escena 3D
- **GSAP + Lenis** — coreografía de scroll
- **Zustand** — estado compartido
- **Howler** — audio posicional
- **Tailwind CSS v4** — estilos + tokens de marca
- **Vercel** — deploy

## Desarrollo

```bash
cd app
pnpm install
pnpm dev
```

## Hoja de ruta

- [x] Setup base (Next.js, stack, tokens, canvas global)
- [ ] Local 3D low-poly (fase MVP)
- [ ] Scroll coreografiado (7 cámaras del storyboard)
- [ ] Mini-juego Night Shift en arcade
- [ ] Audio posicional por zona
- [ ] Checkout demo en iMac G3
- [ ] Fase 2 — modelado Blender detallado
