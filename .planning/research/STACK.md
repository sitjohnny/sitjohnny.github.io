# Stack Research

**Domain:** Frontend-only React tile exploration / capture mini-game (Pokémon Safari) on GitHub Pages  
**Researched:** 2026-07-25  
**Confidence:** HIGH (core toolchain versions verified via npm registry + official docs); MEDIUM (Canvas hybrid / Howler / PokéAPI caching patterns — community + docs, not a single SOTA standard)

> **Locked by PROJECT.md:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, localStorage, PokéAPI.  
> This document recommends **how to use that stack well** for tile maps + GH Pages — versions, supporting libs, and explicit anti-choices.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **React** + **react-dom** | **19.2.8** | UI shell, screens, HUD, capture mini-games | Current stable; Concurrent-friendly; kid-facing screens stay declarative while canvas owns the map | HIGH |
| **TypeScript** | **7.0.2** | Strict types for `game/` + `data/` | `latest` on npm as of 2026-07-25; enables typed encounter tables, save schema, PokéAPI DTOs without runtime surprises | HIGH |
| **Vite** | **8.1.5** | Dev server + static build | Official GH Pages deploy path; `base` rewrites asset URLs; fast HMR for UI iteration. Requires Node `^20.19.0 \|\| >=22.12.0` | HIGH |
| **@vitejs/plugin-react** | **6.0.4** | JSX/TSX transform | Current peer requires `vite: ^8.0.0` — pair with Vite 8 only | HIGH |
| **Tailwind CSS** + **@tailwindcss/vite** | **4.3.3** | Layout, HUD, mobile D-pad chrome | Official install is Vite plugin + `@import "tailwindcss"` — no PostCSS/tailwind.config.js for v1 | HIGH |
| **Zustand** | **5.0.14** | Session + persisted game state | Locked; `persist` + `version`/`migrate`/`partialize` is the right save pattern for localStorage Safari | HIGH |
| **react-router-dom** | **7.18.1** | Screen routing (`/`, `/play`, `/dex`, …) | Stable SPA library line (re-exports `react-router@7.18.1`). Use `basename: '/pokemon-safari'` matching Vite `base`. **Do not** jump to standalone `react-router@8.x` yet (peer/docs skew; no matching `react-router-dom@8`) | HIGH |
| **PokéAPI** (`https://pokeapi.co/api/v2`) | v2 | Gen 1 species metadata + sprite URLs | Locked data source; no auth; cache-first is required by PokéAPI guidance | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **howler** + **@types/howler** | **2.2.4** / **2.2.13** | Lightweight SFX (catch, grass rustle, UI click) | Always for audio — unlock on first gesture; pack short SFX as sprites; no BGM | MEDIUM |
| **Native Canvas 2D API** | — | Tile map + camera follow + nearest-neighbor sprites | Exploration viewport only; keep React out of the per-frame loop | MEDIUM |
| **Custom `services/pokeapi.ts`** | — | Gen 1 prefetch + versioned localStorage cache | Prefer over wrappers — full control of schema version, Gen 1 filter, and sprite URL shaping | HIGH |
| **Vitest** | **4.1.10** | Unit tests for `game/` (rolls, capture, unlocks) | Default test runner — same toolchain as Vite 8 | HIGH |
| **@testing-library/react** + **@testing-library/jest-dom** + **@testing-library/user-event** | **16.3.2** / **7.0.0** / **14.6.1** | Screen/component tests | D-pad, dex filters, settings — not the canvas loop | HIGH |
| **jsdom** | **29.1.1** | Vitest DOM environment | `test.environment: 'jsdom'` for React tests; pure logic tests can use `node` | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Node.js** | Runtime for Vite 8 | Use **20.19+** or **22.12+** (Vite 8 engines). Local env verified on Node 24 works. |
| **create-vite** (`npm create vite@latest`) | Scaffold | Template: React + TypeScript; then add Tailwind v4 plugin + Zustand + Router |
| **typescript-eslint** **8.65.0** + **ESLint** **10.8.0** | Lint | Strict TS in `game/` and `data/`; keep UI thin |
| **GitHub Pages (static copy)** | Host at `/pokemon-safari/` | Build → copy `dist/*` into repo `pokemon-safari/`; copy `index.html` → `404.html` for SPA refresh. Match existing multi-project site pattern (`food-crawl/`). |
| **vite preview** | Local prod check | Verify `base` paths before pushing |

## Installation

```bash
# Scaffold (from repo root or dedicated app folder)
npm create vite@latest pokemon-safari -- --template react-ts
cd pokemon-safari

# Core (locked stack)
npm install react@^19.2.8 react-dom@^19.2.8
npm install react-router-dom@^7.18.1
npm install zustand@^5.0.14
npm install howler@^2.2.4
npm install -D @types/howler@^2.2.13

# Vite 8 + React plugin + Tailwind v4
npm install -D vite@^8.1.5 @vitejs/plugin-react@^6.0.4 typescript@^7.0.2
npm install tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3

# Testing
npm install -D vitest@^4.1.10 jsdom@^29.1.1 \
  @testing-library/react@^16.3.2 @testing-library/jest-dom@^7.0.0 \
  @testing-library/user-event@^14.6.1
```

### Vite + Router + Tailwind essentials

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pokemon-safari/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

```css
/* src/index.css */
@import "tailwindcss";

/* Nearest-neighbor for pixel sprites / tiles */
.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

```ts
// Router: basename must match Vite base (no trailing slash in RR basename is conventional)
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter(routes, {
  basename: '/pokemon-safari',
})
```

```ts
// Assets / public files under subdirectory
const url = `${import.meta.env.BASE_URL}sfx/catch.webm`
```

### Zustand persist (save) pattern

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useSaveStore = create<SaveState>()(
  persist(
    (set) => ({ /* position, biome, inventory, dex, daily, unlocks, stats, settings */ }),
    {
      name: 'pokemon-safari-save',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ /* persist data only; omit actions & ephemeral UI */ }),
      migrate: (persisted, version) => { /* upgrade save schema */ return persisted as SaveState },
    },
  ),
)
```

**Separate** PokéAPI cache from player save: e.g. `pokemon-safari-poke-cache-v1` with its own version key so save migrations never wipe species data.

### PokéAPI caching (prescriptive)

1. On first load (or cache miss / version bump): `GET /api/v2/pokemon?limit=151` then batch detail fetches with concurrency limit (~5–10) and backoff on 429.
2. Store slim DTOs (id, name, types, sprite URLs, shiny URL) in **versioned** localStorage JSON (or chunked keys if quota pressure).
3. Encounters **only** read the cache — never hit the network mid-grass-roll.
4. Sprites: load from PokéAPI/GitHub sprite URLs at runtime (browser HTTP cache + optional `Image()` warm); do **not** bundle 151 sprites into the JS chunk for v1.
5. Skip `pokeapi-js-wrapper` / `pokenode-ts` unless caching becomes painful — a small typed service matches the locked folder layout (`services/`) and Gen‑1-only scope.

### Rendering split (tile map)

| Layer | Tech | Why |
|-------|------|-----|
| Exploration map + player + grass | **Canvas 2D** + `requestAnimationFrame` | Camera follow, culling, `drawImage` with pixelated scaling; no React re-render storm |
| HUD, D-pad, dex, menus, RPS / timing-bar | **React + Tailwind** | Accessibility, touch targets, form-like UI |
| Capture / encounter overlays | **React** portals over canvas | Keep mini-games testable without canvas hit-testing |

Do **not** put the game loop inside `useEffect` + setState every frame. Expose canvas via a ref; push discrete events (encounter started, moved tile) into Zustand.

### Deploy (this monorepo)

This site is **multi-project** static hosting (`/food-crawl/`, `/pokemon-safari/`), not a single Vite app at repo root.

1. `base: '/pokemon-safari/'` in Vite.
2. `npm run build` → output `dist/`.
3. Copy into `pokemon-safari/` on the Pages branch/root (same pattern as food-crawl assets).
4. `cp dist/index.html dist/404.html` (or post-build) so deep links / refresh under `/pokemon-safari/*` resolve on GH Pages (no server rewrites).
5. Prefer **not** using the `gh-pages` npm package as a separate orphan branch unless the whole site migrates to Actions-artifacts-of-dist; today the deliverable is a folder inside `sitjohnny.github.io`.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite 8 + React SPA | Next.js / Remix | Never for this project — GH Pages + no backend; SSR adds nothing |
| Canvas 2D map | CSS/DOM tile grid | Only if map stays tiny and camera is a CSS transform prototype; graduate to canvas before biome 2 |
| Canvas 2D (hand-rolled) | Phaser 4 / PixiJS 8 | Full engine if you add physics, particle battles, multi-layer tilemaps — overkill for Safari v1 |
| Zustand persist | TanStack Query | Query is for server cache/sync; one-shot Gen 1 prefetch + localStorage is simpler and offline-friendly |
| howler | Raw Web Audio API | Only if you need procedural synth; SFX file playback → Howler |
| howler | Tone.js | Music/synthesis games — out of scope (SFX only) |
| react-router-dom 7.18 | `createHashRouter` / Hash history | If 404.html SPA fallback proves unreliable on GH Pages; URLs become `/pokemon-safari/#/play` |
| react-router-dom 7.18 | react-router 8.x alone | Wait until SPA docs + `react-router-dom` align; v8 peers React ≥19.2.7 but packaging differs |
| Custom PokéAPI service | pokeapi-js-wrapper 2.x | If you want built-in SW image cache; still need versioned domain cache for encounter DTOs |
| TypeScript 7.0.2 | TypeScript 5.9.x | Only if a tooling plugin lags on TS 7; 5.9.3 remains available under the `5` tag |
| Vitest | Jest | Avoid — duplicate config; Vitest shares Vite resolve/aliases |
| localStorage | IndexedDB (idb-keyval) | If Gen 1 cache + sprites metadata blow past ~5MB quota; start with localStorage |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js / SSR / API routes** | Violates GH Pages frontend-only constraint | Vite SPA |
| **Redux / MobX / Jotai** | Extra boilerplate; locked stack is Zustand | Zustand slices + `persist` |
| **Phaser / Pixi / Three.js** | Heavy runtime, steep API, fights React ownership of UI | Canvas 2D + React HUD |
| **Tailwind v3 + PostCSS + `tailwind.config.js`** | Obsolete install path; v4 Vite plugin is official | `tailwindcss` + `@tailwindcss/vite` |
| **Per-encounter PokéAPI fetches** | Latency + abusive load; breaks offline/replay feel | Prefetch Gen 1 + versioned cache |
| **Background music libraries / streaming audio** | Product scope is SFX-only; music bloats assets | Short Howler sprites |
| **Bundling all Gen 1 PNGs into the Vite graph** | Huge first load for a kid on mobile | Hotlink/cache sprites; warm on title screen |
| **`gh-pages` orphan deploy as sole host** | Conflicts with multi-folder `sitjohnny.github.io` layout | Copy `dist` → `/pokemon-safari/` |
| **Putting odds/biomes in React components** | Untestable, hard to tune for kids | `src/data/*.ts` config consumed by `game/` |
| **Canvas for RPS / timing bar** | Harder a11y + Testing Library | React + CSS/pointer events |
| **Service Worker as v1 requirement** | Extra GH Pages + base-path complexity | HTTP cache + localStorage DTOs first |

## Stack Patterns by Variant

**If SPA deep-link refresh 404s on GH Pages:**  
- Add post-build `404.html` ← `index.html` under `pokemon-safari/`.  
- If still flaky, switch router to `createHashRouter` (keep Vite `base`).

**If localStorage quota errors on cache write:**  
- Slim DTOs further (drop unused sprite variants).  
- Split cache across keys or move cache to IndexedDB (`idb-keyval`); keep **player save** in localStorage for simplicity.

**If canvas perf jank on low-end phones:**  
- Cull to viewport tiles; pre-render static biome layer to offscreen canvas; cap DPR (e.g. `Math.min(devicePixelRatio, 2)`).

**If TypeScript 7 breaks a plugin:**  
- Pin `typescript@5.9.3` temporarily; keep `strict` on.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vite@8.1.5` | Node `^20.19 \|\| >=22.12`; `@vitejs/plugin-react@6` | Do not pair plugin-react 6 with Vite 5/6 |
| `@tailwindcss/vite@4.3.3` | `vite: ^5.2 \|\| ^6 \|\| ^7 \|\| ^8` | Verified peer includes Vite 8 |
| `react@19.2.8` | `react-router-dom@7.18.1` | Peer `react: >=18` |
| `react-router@8.3.0` | `react: >=19.2.7` | **Not recommended** for this SPA yet — use 7.18.1 via `react-router-dom` |
| `zustand@5.0.14` | `react: >=18` | Use `create<T>()(persist(...))` TS form |
| `vitest@4.1.10` | Vite 8 toolchain | Configure via `vitest/config` + same React plugin |
| `howler@2.2.4` | Modern browsers | Prefer `webm` + `mp3` fallbacks for SFX sprites |

## Sources

| Source | What verified | Confidence |
|--------|---------------|------------|
| npm registry (`npm view … version`) 2026-07-25 | React 19.2.8, Vite 8.1.5, TS 7.0.2, Zustand 5.0.14, RR-dom 7.18.1, Tailwind 4.3.3, Vitest 4.1.10, Howler 2.2.4 | HIGH |
| Context7 `/vitejs/vite` + https://vite.dev/guide/static-deploy.html | `base` for GH Pages subdirectory; static deploy workflow | MEDIUM |
| Context7 `/pmndrs/zustand` + zustand.docs.pmnd.rs persist | `persist`, `partialize`, `version`, `migrate`, hydration | MEDIUM |
| Context7 `/remix-run/react-router` | `createBrowserRouter` `basename` option | MEDIUM |
| https://tailwindcss.com/docs/installation/using-vite | Tailwind v4 `@tailwindcss/vite` + `@import "tailwindcss"` | HIGH |
| Context7 `/vitest-dev/vitest` | jsdom + Testing Library example deps | MEDIUM |
| https://pokeapi.co/docs/v2 | No official rate limit; **must cache locally** | HIGH |
| Community (gamedev.SE, Howler docs, 2026 audio roundups) | Canvas for map; Howler for SFX | LOW–MEDIUM |

---
*Stack research for: Pokémon Safari (React + Vite tile catch game on GitHub Pages)*  
*Researched: 2026-07-25*
