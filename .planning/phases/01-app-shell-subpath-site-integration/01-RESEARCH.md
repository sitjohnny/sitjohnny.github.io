# Phase 1: App Shell, Subpath & Site Integration - Research

**Researched:** 2026-07-25
**Domain:** Vite React TypeScript SPA scaffold on GitHub Pages multi-app user site (`/pokemon-safari/` beside `/food-crawl/`)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Scaffold & Tooling
- Configure React + TypeScript + Vite for the app under a `/pokemon-safari/` deploy path
- Install and configure Tailwind CSS (prefer Tailwind v4 via `@tailwindcss/vite` per project research)
- Configure Zustand (store skeleton / empty slices OK — no gameplay state required yet)
- Configure React Router with `basename` matching Vite `base: '/pokemon-safari/'`
- Configure GitHub Pages deployment so built output lands at `/pokemon-safari/`
- Configure ESLint + Prettier
- Configure path aliases (e.g. `@/` → `src/`)
- Preferred folder layout: `src/{assets,components,screens,hooks,services,game,data,store,types,utils}/`

#### Theme & Visual Foundations
- Create a global theme (CSS variables / Tailwind theme tokens) — Emerald-inspired, kid-friendly, mobile-first
- Create pixel-art CSS utilities
- Configure nearest-neighbor image rendering (`image-rendering: pixelated` / crisp edges)

#### Placeholder Screens (routing only — no gameplay)
- Home
- Game
- Pokédex
- Inventory
- Settings

#### Site Integration
- Root `index.html` / README should list both Food Crawl and Pokémon Safari (no sole redirect that hides Safari)
- Deep-link / SPA fallback strategy must not break existing `/food-crawl/`

#### Hard Stops
- Application must compile successfully (`tsc` / Vite build)
- No gameplay implementation in this phase
- Stop after project setup

### Claude's Discretion
- Exact package versions within the locked stack
- Whether map/world chrome uses a thin CSS-transform shell vs empty Game placeholder
- ESLint flat-config vs legacy; Prettier integration details
- Exact icon-first chrome component naming
- Vitest wiring if it fits naturally in scaffold without expanding scope

### Deferred Ideas (OUT OF SCOPE)
- Gameplay (map, encounters, capture, items) — Phases 3–7
- PokéAPI prefetch / cache — Phase 2
- SFX / celebrations — Phase 8
- Real inventory / dex data binding — later phases
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOOT-01 | Player can open the game at `/pokemon-safari/` on GitHub Pages with assets and routes resolving correctly (Vite `base` + router `basename`) | Standard Stack Vite `base`, Pattern 1 basename lock, Pitfall 1, deploy copy to `pokemon-safari/`, HashRouter recommendation |
| BOOT-02 | Root site lists both Food Crawl and Pokémon Safari (no sole auto-redirect that hides Safari) | Site Integration pattern, root `index.html` listing contract from UI-SPEC, README table update |
| BOOT-03 | App scaffold uses React + TypeScript (strict) + Vite + Tailwind + Zustand + React Router with preferred `src/` folder layout | Standard Stack + Recommended Project Structure + path aliases |
| UX-01 | UI is icon-first, mobile-first, responsive on desktop; touch targets large enough for a child | UI-SPEC tokens (48–56px `.touch-target`), AppShell + BottomNav patterns, Design System section |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

- **Tech stack locked:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, localStorage, PokéAPI
- **Hosting:** GitHub Pages only — no server endpoints; `base` path must be `/pokemon-safari/`
- **Audience:** Kid-friendly UX (~7yo)
- **Code quality:** Strict TypeScript; testable game logic in `game/`; no Pokémon data hardcoded in UI
- **Art:** PokéAPI Gen 1 sprites + simple tiles; nearest-neighbor scaling
- **Audio:** SFX only; no music (Phase 8 — do not implement here)
- Stack versions from research/STACK.md apply (Vite 8 / React 19 / Tailwind 4 / Zustand 5 / RR-dom 7)

## Summary

Phase 1 is a **deploy-correct walking skeleton**: scaffold a Vite 8 + React 19 + TypeScript strict app, wire Tailwind v4 via `@tailwindcss/vite`, Zustand stub store, React Router with matching `basename`, ESLint flat-config + Prettier, `@/` path aliases, Emerald theme + pixel CSS utilities, five placeholder screens behind icon-first chrome, and copy the production build into repo-root `pokemon-safari/` so GitHub Pages serves it beside `food-crawl/`. Root `index.html` must stop auto-redirecting solely to food-crawl and become a project listing. No gameplay, PokéAPI, or save persistence logic.

The load-bearing risk is **GitHub Pages SPA deep-link handling on a multi-app user site**. Official GH Pages custom 404 is a **single origin-root** `404.html` ([docs.github.com](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)). A spa-github-pages redirect at repo root can hijack unknown paths under `/food-crawl/` if allowlisting is wrong. Food-crawl is a multi-page-less static shell (one `index.html` + assets) with no client router today — still, a root SPA 404 that redirects *everything* is unsafe. **Primary recommendation: `createHashRouter` with Vite `base: '/pokemon-safari/'`** so nested routes never ask the server for a physical file. That satisfies BOOT-01 refresh/deep-link without touching food-crawl. Keep BrowserRouter + allowlisted root `404.html` as an explicit deferred upgrade path.

Save envelope *types* (`types/save.ts`) and empty `data/` / `game/` / `services/` folders land now so Phase 7 does not retrofit versioning. Vitest + Testing Library wire into the same Vite config (discretion — fits naturally).

**Primary recommendation:** Scaffold under `pokemon-safari-app/` (source) → build with `base: '/pokemon-safari/'` → copy `dist/` to published `pokemon-safari/` → HashRouter `basename` aligned to Vite base → root listing + README update → no root SPA 404 that can break food-crawl.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vite build + static assets under `/pokemon-safari/` | CDN / Static | Browser / Client | GH Pages serves files; Vite `base` rewrites asset URLs |
| SPA routing (Home/Game/Dex/Pack/Settings) | Browser / Client | — | Client-side router; HashRouter avoids server rewrite |
| App shell chrome (BottomNav, top bar, CTA) | Browser / Client | — | React components + Tailwind; no SSR |
| Theme tokens + pixel CSS utilities | Browser / Client | CDN / Static | CSS in bundle / fonts from Google Fonts CDN |
| Zustand store stub | Browser / Client | — | In-memory session; persist middleware deferred to Phase 7 |
| Root project listing (`index.html`, README) | CDN / Static | — | Static HTML at user-site root |
| Deploy copy (`dist` → `pokemon-safari/`) | CDN / Static | — | Multi-folder publish pattern matching food-crawl |
| Save / PokéAPI / gameplay | — | — | Out of scope Phase 1 |

Single-tier application for runtime: **Browser / Client SPA + Static hosting**. No API/Backend, no Frontend Server SSR, no Database.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react + react-dom | 19.2.8 | UI shell + screens | Locked stack; current stable [VERIFIED: npm registry 2026-07-25] |
| typescript | 7.0.2 | Strict typing | `latest` on npm; pin `5.9.3` only if a plugin breaks [VERIFIED: npm registry] |
| vite | 8.1.5 | Dev + static build | Official GH Pages `base` path; needs Node `^20.19 \|\| >=22.12` [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.4 | JSX/TSX transform | Peer requires `vite: ^8` — do not mix with Vite 5/6 [VERIFIED: npm registry] |
| tailwindcss + @tailwindcss/vite | 4.3.3 | Layout + chrome | Official v4 install: Vite plugin + `@import "tailwindcss"` — no PostCSS/`tailwind.config.js` [VERIFIED: npm registry] [CITED: tailwindcss.com/docs/installation/using-vite] |
| zustand | 5.0.14 | Session store stub | Locked; later `persist`/`version`/`migrate`/`partialize` [VERIFIED: npm registry] |
| react-router-dom | 7.18.1 | Screen routing | SPA line; `basename` / HashRouter; **avoid** standalone `react-router@8` [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.10 | Unit/component tests | Wire in Phase 1 scaffold (discretion) [VERIFIED: npm registry] |
| jsdom | 29.1.1 | Vitest DOM env | `test.environment: 'jsdom'` [VERIFIED: npm registry] |
| @testing-library/react | 16.3.2 | Component tests | Shell/nav smoke tests [VERIFIED: npm registry] |
| @testing-library/jest-dom | 7.0.0 | DOM matchers | Vitest setup [VERIFIED: npm registry] |
| @testing-library/user-event | 14.6.1 | Interaction tests | Nav tap / CTA [VERIFIED: npm registry] |
| eslint | 10.8.0 | Lint | Flat config [VERIFIED: npm registry] |
| typescript-eslint | 8.65.0 | TS lint rules | Pair with ESLint 10 [VERIFIED: npm registry] |
| prettier | 3.9.6 | Format | Discretion — integrate via eslint-config-prettier or scripts [VERIFIED: npm registry] |
| eslint-config-prettier | (latest) | Disable ESLint format rules | When Prettier owns formatting [ASSUMED] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `createHashRouter` | `createBrowserRouter` + root `404.html` allowlist | Cleaner URLs but origin-wide 404 risk to food-crawl — defer |
| App source in `pokemon-safari/` | Source at repo root | Conflicts with multi-app publish folders; keep source in `pokemon-safari-app/` (or similar) and publish built files to `pokemon-safari/` |
| Tailwind v4 Vite plugin | Tailwind v3 PostCSS | Obsolete path; do not scaffold |
| react-router-dom 7 | react-router 8 alone | Packaging/docs skew; no matching react-router-dom@8 |
| Hash URLs | Flat single-route SPA | Would fail UI-SPEC multi-route chrome |

**Installation (from app source directory):**

```bash
npm create vite@latest pokemon-safari-app -- --template react-ts
cd pokemon-safari-app
npm install react@^19.2.8 react-dom@^19.2.8 react-router-dom@^7.18.1 zustand@^5.0.14
npm install -D vite@^8.1.5 @vitejs/plugin-react@^6.0.4 typescript@^7.0.2 \
  tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 \
  vitest@^4.1.10 jsdom@^29.1.1 \
  @testing-library/react@^16.3.2 @testing-library/jest-dom@^7.0.0 @testing-library/user-event@^14.6.1 \
  eslint@^10.8.0 typescript-eslint@^8.65.0 prettier@^3.9.6 eslint-config-prettier
```

**Version verification:** All core/supporting versions above verified via `npm view <pkg> version` on 2026-07-25. Local Node `v24.8.0` satisfies Vite 8 engines.

**Publish layout (repo root):**

```
sitjohnny.github.io/
├── index.html              # project listing (BOOT-02)
├── README.md               # table with both apps
├── food-crawl/             # existing static app — DO NOT break
├── pokemon-safari/         # PUBLISHED build output (copied from dist/)
└── pokemon-safari-app/     # SOURCE Vite project (not the Pages URL folder)
```

## Package Legitimacy Audit

> Gate run: `gsd-tools query package-legitimacy check --ecosystem npm` on 2026-07-25.

| Package | Registry | Age signal | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|------------|-----------|-------------|---------|-------------|
| vite | npm | published 2026-07-16 | ~157M/wk | github.com/vitejs/vite | SUS (too-new) | Approved — canonical; high downloads |
| @vitejs/plugin-react | npm | 2026-07-22 | ~76M/wk | vitejs/vite-plugin-react | SUS (too-new) | Approved |
| tailwindcss | npm | 2026-07-16 | ~115M/wk | tailwindlabs/tailwindcss | SUS (too-new) | Approved |
| @tailwindcss/vite | npm | 2026-07-16 | ~42M/wk | tailwindlabs/tailwindcss | SUS (too-new) | Approved |
| react / react-dom | npm | 2026-07-21 | ~163M / ~154M/wk | facebook/react | SUS (too-new) | Approved |
| react-router-dom | npm | 2026-06-29 | ~44M/wk | remix-run/react-router | SUS (too-new) | Approved |
| zustand | npm | 2026-05-28 | ~47M/wk | pmndrs/zustand | OK | Approved |
| typescript | npm | 2026-07-08 | ~245M/wk | microsoft/TypeScript | SUS (too-new) | Approved |
| vitest | npm | 2026-07-06 | ~82M/wk | vitest-dev/vitest | SUS (too-new) | Approved |
| jsdom | npm | 2026-04-30 | ~86M/wk | jsdom/jsdom | OK | Approved |
| @testing-library/react | npm | 2026-01-19 | ~49M/wk | testing-library/react-testing-library | OK | Approved |
| @testing-library/jest-dom | npm | 2026-07-20 | ~56M/wk | testing-library/jest-dom | SUS (too-new) | Approved |
| @testing-library/user-event | npm | 2025-01-21 | ~43M/wk | testing-library/user-event | OK | Approved |
| eslint | npm | 2026-07-24 | ~149M/wk | eslint/eslint | SUS (too-new) | Approved |
| typescript-eslint | npm | 2026-07-20 | ~83M/wk | typescript-eslint/typescript-eslint | SUS (too-new) | Approved |
| prettier | npm | 2026-07-21 | ~126M/wk | prettier/prettier | SUS (too-new) | Approved |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** All SUS rows above are **false positives from the `too-new` heuristic** on latest releases of long-established packages (tens–hundreds of millions of weekly downloads, official GitHub orgs, `postinstall: null`). Planner may proceed without `checkpoint:human-verify` for these; optional human glance at lockfile is fine.

**No postinstall scripts** flagged on audited packages.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Entry: Browser                                                           │
│   https://sitjohnny.github.io/          → root index.html (listing)      │
│   https://sitjohnny.github.io/food-crawl/ → food-crawl static (untouched)│
│   https://sitjohnny.github.io/pokemon-safari/ → pokemon-safari/index.html│
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ load SPA shell
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Vite-built assets (/pokemon-safari/assets/*)                             │
│   base='/pokemon-safari/' ensures correct script/CSS URLs                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ React Router (HashRouter / createHashRouter)                             │
│   basename: '/pokemon-safari'                                            │
│   #/  #/game  #/dex  #/pack  #/settings                                  │
│   (hash routes → no server 404 for nested paths)                         │
└───────────────────────────────┬──────────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ AppShell                                                                 │
│   Top bar (non-Home) → <Outlet /> → BottomNav (5 icon+label items)       │
└───────┬──────────┬──────────┬──────────┬──────────┬─────────────────────┘
        ▼          ▼          ▼          ▼          ▼
     HomeScreen GameScreen DexScreen PackScreen SettingsScreen
     (CTA)      (placeholder empties — no gameplay)
        │
        │ optional Start Safari → navigate #/game
        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Zustand stub store (ui/settings skeleton only)                           │
│   types/save.ts envelope types present; persist NOT wired                │
└──────────────────────────────────────────────────────────────────────────┘

Deploy path (build time):
  pokemon-safari-app/  --npm run build-->  dist/
       --copy-->  repo pokemon-safari/ (+ optional pokemon-safari/404.html unused if Hash)
```

### Recommended Project Structure

```
pokemon-safari-app/
├── package.json
├── vite.config.ts              # base, react, tailwind, resolve.alias, vitest
├── tsconfig.json / tsconfig.app.json
├── eslint.config.js            # flat config
├── .prettierrc
├── index.html
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx                 # RouterProvider
    ├── index.css               # @import "tailwindcss"; @theme; pixel utils
    ├── assets/
    ├── components/
    │   ├── AppShell.tsx
    │   ├── BottomNav.tsx
    │   ├── PixelButton.tsx
    │   ├── ScreenTitle.tsx
    │   └── EmptyState.tsx
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── GameScreen.tsx
    │   ├── DexScreen.tsx
    │   ├── PackScreen.tsx
    │   └── SettingsScreen.tsx
    ├── hooks/                  # empty or .gitkeep
    ├── services/               # empty placeholder
    ├── game/                   # empty placeholder — no React imports ever
    ├── data/                   # empty placeholder
    ├── store/
    │   └── index.ts            # stub create() store
    ├── types/
    │   └── save.ts             # versioned SaveEnvelope stub
    ├── utils/
    ├── test/
    │   └── setup.ts
    └── vite-env.d.ts
```

Repo root remains the Pages publish root (`food-crawl/`, `pokemon-safari/`, listing `index.html`).

### Pattern 1: Vite `base` + Router basename lock
**What:** Single shared path constant; Vite `base: '/pokemon-safari/'`; router `basename: '/pokemon-safari'`; all public assets via `import.meta.env.BASE_URL`.
**When to use:** Always on this user-site subdirectory app.
**Example:**
```ts
// vite.config.ts — Source: vite.dev/config/shared-options + STACK.md
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: '/pokemon-safari/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

### Pattern 2: HashRouter for multi-app GH Pages safety
**What:** Use `createHashRouter` so nested routes never hit the static server as missing files; food-crawl unaffected.
**When to use:** Phase 1 default on multi-folder user Pages sites without a safe allowlisted root 404.
**Example:**
```tsx
// Source: remix-run/react-router HashRouter / createHashRouter docs pattern
import { createHashRouter, RouterProvider } from 'react-router-dom'

const router = createHashRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <HomeScreen /> },
        { path: 'game', element: <GameScreen /> },
        { path: 'dex', element: <DexScreen /> },
        { path: 'pack', element: <PackScreen /> },
        { path: 'settings', element: <SettingsScreen /> },
      ],
    },
  ],
  { basename: '/pokemon-safari' },
)

export function App() {
  return <RouterProvider router={router} />
}
```

URLs look like `https://sitjohnny.github.io/pokemon-safari/#/game`. Refresh and deep-link work without root `404.html`.

### Pattern 3: Tailwind v4 `@theme` + pixel utilities
**What:** No `tailwind.config.js`. Tokens in `src/index.css` under `@theme`; utilities `.pixelated`, `.pixel-border`, `.touch-target` per UI-SPEC.
**When to use:** Phase 1 theme foundations.
**Example:**
```css
/* Source: tailwindcss.com/docs/installation/using-vite + 01-UI-SPEC.md */
@import "tailwindcss";

@theme {
  --color-dominant: #E3F2C9;
  --color-secondary: #2F7A4B;
  --color-accent: #E8B923;
  --color-destructive: #C45C4A;
  --color-text: #1A3324;
  --color-on-secondary: #F5FBEF;
  --color-muted: #6B8F6E;
  --font-display: "Pixelify Sans", "Courier New", monospace;
  --font-body: Fredoka, "Trebuchet MS", sans-serif;
}

.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.pixel-border {
  border: 4px solid var(--color-secondary);
  border-radius: 4px;
  box-shadow: 4px 4px 0 #1A3324;
}
.touch-target {
  min-width: 48px;
  min-height: 48px;
}
```

### Pattern 4: Deploy copy script (not gh-pages orphan branch)
**What:** `npm run build` then copy `dist/*` into repo `pokemon-safari/`. Match food-crawl multi-folder hosting.
**When to use:** Every release of Safari.
**Example:**
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "deploy:copy": "rm -rf ../pokemon-safari && mkdir -p ../pokemon-safari && cp -R dist/. ../pokemon-safari/"
  }
}
```
Do **not** use `gh-pages` package orphan-branch deploy for this repo.

### Pattern 5: Zustand stub + save envelope types only
**What:** Minimal store (e.g. settings.mute default false); `types/save.ts` defines `SaveEnvelope { version: number; data: ... }` without `persist` middleware.
**When to use:** Phase 1 — satisfy roadmap “types in Phase 1”; wiring is Phase 7.

### Anti-Patterns to Avoid
- **`base: '/'` on user-site subdirectory:** blank page / asset 404s on Pages
- **BrowserRouter without safe 404 strategy:** refresh on `#`-less nested route → GitHub 404; root SPA 404 can break food-crawl
- **Scaffolding Tailwind v3 PostCSS:** obsolete; use `@tailwindcss/vite`
- **Putting source publish folder = app package root without build step:** editing `pokemon-safari/` as Vite root confuses “source vs published artifacts”
- **Gameplay or PokéAPI in Phase 1:** hard stop
- **`localStorage.clear()` anywhere:** shared origin with food-crawl
- **Installing howler / canvas map / shadcn:** out of Phase 1 scope (UI-SPEC: no shadcn)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|----------------|-----|
| SPA deep-link on GH Pages multi-app | Custom root 404 redirect that rewrites all paths | `createHashRouter` (Phase 1) | Root 404 is origin-wide; wrong allowlist breaks food-crawl [CITED: docs.github.com Pages 404] |
| CSS utility framework | Custom spacing/color system from scratch | Tailwind v4 `@theme` tokens from UI-SPEC | Tokens already contracted; utility classes ship mobile chrome fast |
| Client router | `window.location` / manual hash parsing | `react-router-dom` 7 | Nested routes, NavLink active state, Outlet layout |
| Module path aliases | Relative `../../../` only | Vite `resolve.alias` + `tsconfig` paths `@/*` | Single alias shared by Vite + tsc + Vitest |
| Lint/format toolchain | Ad-hoc style comments | ESLint flat + Prettier | Locked quality gate; TS-aware rules |
| Test runner | Separate Jest pipeline | Vitest in `vite.config.ts` | Same resolve/aliases as app |
| Pixel image scaling | Canvas filters / JS upscalers | CSS `image-rendering: pixelated` | Standard nearest-neighbor; required for later sprites |

**Key insight:** Phase 1 failures are almost always **hosting + path** mistakes, not React component mistakes. Prefer boring official Vite/Tailwind/RR patterns and the HashRouter tradeoff over clever multi-app 404 hacks.

## Common Pitfalls

### Pitfall 1: Wrong Vite `base` / Router `basename`
**What goes wrong:** Blank page on Pages; `/assets/*` 404; “No routes matched.”
**Why it happens:** Default `base: '/'`; basename omitted or slash mismatch (`/pokemon-safari` vs `/pokemon-safari/`).
**How to avoid:** Lock `base: '/pokemon-safari/'`; router basename `'/pokemon-safari'`; verify asset hrefs in built `index.html` contain `/pokemon-safari/assets/`.
**Warning signs:** Works on `localhost:5173/` only; fails on real Pages URL.

### Pitfall 2: Root SPA `404.html` breaks food-crawl
**What goes wrong:** Refresh or unknown path under `/food-crawl/` redirects into Safari SPA or shows wrong shell.
**Why it happens:** GH Pages serves **one** custom 404 at site root for the whole origin [CITED: GitHub Docs custom 404 page].
**How to avoid:** Phase 1 default = HashRouter; **do not** add root spa-github-pages `404.html` unless allowlist is tested for both apps.
**Warning signs:** food-crawl URL behavior changes after Safari deploy; GitHub 404 page replaced by Safari redirect.

### Pitfall 3: Publishing source instead of `dist`
**What goes wrong:** Pages serves Vite `index.html` with `/src/main.tsx` → fails in production.
**Why it happens:** Confusing `pokemon-safari/` publish folder with app source.
**How to avoid:** Source in `pokemon-safari-app/`; published artifacts only in `pokemon-safari/`; `deploy:copy` after `vite build`.
**Warning signs:** Network tab requests `.tsx` on Pages.

### Pitfall 4: Leaving root meta-refresh to food-crawl
**What goes wrong:** BOOT-02 fails; Safari undiscoverable.
**Why it happens:** Current `index.html` has `http-equiv="refresh" … /food-crawl/`.
**How to avoid:** Replace with listing per UI-SPEC copy; update README table.
**Warning signs:** `/` never shows Safari link.

### Pitfall 5: Tailwind v3 habits
**What goes wrong:** Broken build or unused PostCSS config; theme tokens not applied.
**Why it happens:** Tutorials still show `tailwind.config.js` + `postcss.config.js`.
**How to avoid:** Only `@tailwindcss/vite` + `@import "tailwindcss"` + `@theme`.
**Warning signs:** Looking for `content: ['./src/**']` globs in a JS config.

### Pitfall 6: Path alias in Vite but not TypeScript
**What goes wrong:** IDE red squiggles or `tsc` fails while Vite builds.
**Why it happens:** `resolve.alias` without `compilerOptions.paths`.
**How to avoid:** Mirror `@/*` → `./src/*` in `tsconfig.app.json`; Vitest inherits Vite resolve.
**Warning signs:** `@/components/...` resolves in HMR only.

### Pitfall 7: Scope creep into gameplay
**What goes wrong:** Phase 1 balloons; compile gate delayed.
**Why it happens:** Empty Game screen invites “just a tiny map.”
**How to avoid:** Hard stop from CONTEXT; Game = EmptyState placeholder only.
**Warning signs:** `game/movement.ts` with real logic; PokéAPI imports.

## Code Examples

### Vite + Tailwind v4 + alias
```ts
// Source: https://tailwindcss.com/docs/installation/using-vite
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: '/pokemon-safari/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

### Hash router + shell routes
```tsx
// Source: react-router createHashRouter (react-router-dom 7.18.1)
import { createHashRouter, Outlet, NavLink } from 'react-router-dom'

function AppShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-dominant text-text">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] bg-secondary pb-[env(safe-area-inset-bottom)]">
        {/* 5× NavLink with icon + label; .touch-target min 48px */}
      </nav>
    </div>
  )
}
```

### Zustand stub (no persist yet)
```ts
// Source: zustand create pattern — persist deferred to Phase 7
import { create } from 'zustand'

type UiState = {
  // stub only — expand in later phases
  lastRoute: string
  setLastRoute: (r: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  lastRoute: '/',
  setLastRoute: (lastRoute) => set({ lastRoute }),
}))
```

### Save envelope types (Phase 1 stub)
```ts
// Designed now; persist wired in Phase 7 — ROADMAP / STATE flag
export type SaveEnvelopeV1 = {
  version: 1
  savedAt: string // ISO
  // fields filled when SAVE-01 lands
  data: Record<string, never>
}

export type SaveEnvelope = SaveEnvelopeV1
```

### Root listing (BOOT-02)
```html
<!-- Replace meta-refresh; copy from 01-UI-SPEC -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>sitjohnny projects</title>
  </head>
  <body>
    <h1>sitjohnny projects</h1>
    <ul>
      <li><a href="/food-crawl/">Roosevelt Ave Food Crawl</a></li>
      <li>
        <a href="/pokemon-safari/">Pokémon Safari</a>
        <p>Catch ’em on a tiny Safari Zone.</p>
      </li>
    </ul>
  </body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 + PostCSS + `tailwind.config.js` | Tailwind v4 `@tailwindcss/vite` + `@import` + `@theme` | Tailwind 4.x | No PostCSS scaffold in Phase 1 |
| Vite 5/6 + plugin-react 4 | Vite 8 + `@vitejs/plugin-react` 6 | 2025–2026 | Node 20.19+/22.12+ required |
| CRA / Next for GH Pages toys | Vite SPA + `base` | Community default | Matches locked stack |
| `gh-pages` orphan branch | Copy `dist` into repo subfolder | This site's pattern | Coexists with food-crawl |
| Root meta-refresh to one app | Project listing | Phase 1 BOOT-02 | Discovers Safari |

**Deprecated/outdated:**
- Tailwind v3 PostCSS install path for new apps
- Standalone `react-router@8` for this SPA until `react-router-dom` aligns
- Root-only auto-redirect to food-crawl

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `eslint-config-prettier` is the right Prettier↔ESLint bridge package name | Standard Stack | Wrong package → install fail; verify with npm + legitimacy before lock |
| A2 | Source directory name `pokemon-safari-app/` is acceptable (vs `apps/pokemon-safari`) | Architecture | Naming only; planner may choose equivalent |
| A3 | HashRouter `basename` option behaves like BrowserRouter basename under Vite `base` | Pattern 2 | If basename quirks appear, set basename and retest; fallback document URLs |
| A4 | Food-crawl has no client-side routes that need deep-link 404 today | Pitfall 2 | Still avoid root SPA 404; future food-crawl SPA would need allowlist |
| A5 | TypeScript 7.0.2 works with typescript-eslint 8.65 / Vite plugin-react 6 | Standard Stack | If broken, pin `typescript@5.9.3` per STACK.md |

**If empty:** N/A — five assumptions listed for planner confirmation.

## Open Questions

1. **Source folder name**
   - What we know: Publish folder must be `pokemon-safari/` for URL path.
   - What's unclear: Exact source dir name (`pokemon-safari-app` vs `apps/safari`).
   - Recommendation: Use `pokemon-safari-app/` at repo root; keep publish dir `pokemon-safari/`.

2. **BrowserRouter upgrade timing**
   - What we know: HashRouter is safe for multi-app; URLs include `#`.
   - What's unclear: Whether product owner wants pretty URLs in v1.
   - Recommendation: Ship HashRouter in Phase 1; optional later allowlisted root `404.html` with explicit food-crawl regression test.

3. **Commit built `pokemon-safari/` artifacts to git**
   - What we know: food-crawl static files are committed; no Actions workflow today.
   - What's unclear: Prefer committed dist vs GitHub Action.
   - Recommendation: Commit copied `pokemon-safari/` like food-crawl for v1; add Actions later if desired.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vite 8 | ✓ | v24.8.0 | — (meets `>=22.12`) |
| npm | installs | ✓ | 11.6.0 | — |
| Git | commit/deploy | ✓ | (repo present) | — |
| GitHub Pages | hosting | ✓ | user site `sitjohnny.github.io` | — |
| Docker | — | n/a | — | Not required |
| PostgreSQL / Redis | — | n/a | — | Frontend-only |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

Step 2.6: audited — Node/npm present; no other external services for Phase 1.

## Validation Architecture

> `workflow.nyquist_validation` is true in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + jsdom 29.1.1 + Testing Library |
| Config file | `pokemon-safari-app/vite.config.ts` (`test` block) — Wave 0 create |
| Quick run command | `cd pokemon-safari-app && npm test -- --run` |
| Full suite command | `cd pokemon-safari-app && npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOT-01 | `base` appears in built index asset URLs; router basename set | unit / build smoke | `npm run build` + assert `/pokemon-safari/assets/` in `dist/index.html` | ❌ Wave 0 |
| BOOT-02 | Root listing contains both links, no sole meta-refresh | smoke / file assert | script or manual + optional node assert on `../index.html` | ❌ Wave 0 |
| BOOT-03 | Preferred folders exist; tsc strict build passes | smoke | `npm run build` | ❌ Wave 0 |
| UX-01 | BottomNav exposes 5 labeled links; touch-target class on controls | component | `npm test -- --run src/components/BottomNav.test.tsx` | ❌ Wave 0 |
| — | Hash routes render placeholders | component | `npm test -- --run src/App.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run` + `npm run build`
- **Phase gate:** Full suite green + build + manual open `/pokemon-safari/` and root listing

### Wave 0 Gaps
- [ ] Create Vite app + Vitest `test` config + `src/test/setup.ts`
- [ ] `src/components/BottomNav.test.tsx` — covers UX-01 labels/routes
- [ ] `src/App.test.tsx` — covers route smoke / Start Safari navigation
- [ ] Optional `scripts/assert-root-listing.mjs` — covers BOOT-02
- [ ] Build assert for BOOT-01 asset prefix

## Security Domain

> `security_enforcement: true`, ASVS level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts (GH Pages frontend-only) |
| V3 Session Management | no | No server sessions |
| V4 Access Control | no | No privileged APIs |
| V5 Input Validation | yes (light) | React text escaping; no `dangerouslySetInnerHTML`; route paths are static |
| V6 Cryptography | no | No secrets; no auth tokens |

### Known Threat Patterns for Vite SPA on GH Pages

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via injected HTML in chrome | Tampering | React defaults; no raw HTML from URLs |
| Supply-chain malicious npm postinstall | Tampering | Legitimacy gate; lockfile; no unknown packages |
| `localStorage.clear()` wiping sibling app | Elevation / Tampering | Do not call clear; namespace keys later (`pokemon-safari:*`) |
| Open redirect on root 404 hack | Spoofing | Prefer HashRouter; if 404 used, allowlist path prefixes only |
| Dependency CDN script injection | Tampering | Bundled deps; Google Fonts CSS only from fonts.googleapis.com |

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view` 2026-07-25) — versions for Vite 8.1.5, React 19.2.8, Tailwind 4.3.3, Zustand 5.0.14, react-router-dom 7.18.1, Vitest 4.1.10, ESLint 10.8.0, Prettier 3.9.6, typescript 7.0.2
- https://tailwindcss.com/docs/installation/using-vite — Tailwind v4 Vite plugin install
- https://vite.dev/guide/static-deploy + https://vite.dev/config/shared-options — `base` for GitHub Pages subdirectories
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site — custom 404 is site-level
- `.planning/research/STACK.md`, `SUMMARY.md`, `PITFALLS.md`, `ARCHITECTURE.md` — prior project research
- `.planning/phases/01-.../01-CONTEXT.md`, `01-UI-SPEC.md` — locked decisions + visual contract
- Live repo: `index.html` meta-refresh; `food-crawl/` static sibling; no root `404.html` today

### Secondary (MEDIUM confidence)
- https://github.com/rafgraph/spa-github-pages — SPA 404 redirect pattern (use only with allowlist if ever adopted)
- Community multi-app GH Pages notes (thisdot.co) — allowlisting path segments
- React Router 7 docs — `createHashRouter` / `basename` (via prior Context7 research in STACK.md)

### Tertiary (LOW confidence)
- Exact HashRouter + `basename` interaction edge cases under Vite base — verify in Phase 1 execution with `vite preview` and real Pages URL

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm-verified versions + official Tailwind/Vite docs
- Architecture: HIGH — matches prior project research + existing multi-folder site
- Pitfalls: HIGH — base/basename and multi-app 404 grounded in Vite + GitHub docs
- Code examples: MEDIUM-HIGH — composed from official patterns; HashRouter basename to verify at build

**Research date:** 2026-07-25
**Valid until:** 2026-08-24 (30 days — stable toolchain)

---

*Phase: 01-app-shell-subpath-site-integration*
*Research completed: 2026-07-25*
*Ready for planning: yes*
