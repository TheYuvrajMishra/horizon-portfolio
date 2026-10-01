# Horizon — a field journal of skies

Portfolio site for **Yuvraj Mishra**, freelance 3D environment artist.
Concept: *"Every environment starts as weather — the ground is just where the
light lands."* A light, editorial, Craft.do-inspired field journal whose hero
is a living WebGL landscape the visitor can conduct.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (tsc + eslint clean)
npm start        # serve the production build
```

## Stack

- Next.js 16.3.8 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (theme tokens in `src/app/globals.css`)
- `motion` for editorial reveals, marquee, counters
- three.js + React Three Fiber for the hero stage (lazy-loaded, `ssr: false`)

## The hero — SkyStage (`src/components/SkyStage.tsx`)

A procedural island diorama (terrain, water, cabin, instanced trees/rocks,
sprite clouds, stars, fireflies, shader sky dome) with a **24-hour time rail**:

- Drag / arrow-key the rail → sun position, sky gradient, fog, water color,
  ambient light, cabin window glow, stars and fireflies all interpolate
  together through a keyframed palette (`src/lib/skyPalette.ts`).
- Leave it alone ~9s → the day drifts forward on its own.
- Cursor parallax on the camera; `IntersectionObserver` pauses the loop
  off-screen; WebGL failure falls back to a static artwork image.
- Fully keyboard-operable (`role="slider"`) and honors
  `prefers-reduced-motion` (no drift, no parallax, instant final states).

## Sections

Preloader → hero → marquee → manifesto (word-by-word scroll reveal) →
five-world project index (AI-generated 16:9 environment art in
`public/worlds/`, floating cursor preview on desktop, thumbnails on mobile) →
"Atmosphere, engineered" 4-step process → about with animated counters →
contact footer with real email + LinkedIn.

## Notes

- Portfolio copy (project names, stats, process details) is **concept/demo
  copy** written for the design brief — treat it as placeholder until Yuvraj
  confirms real credits.
- Per project `AGENTS.md`: when touching version-sensitive Next.js APIs,
  consult the version-matched docs at
  `node_modules/next/dist/docs/` (the local install is the source of truth).
- No browser-driven visual QA was used for this build (owner preference).
