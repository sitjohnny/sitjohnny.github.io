# Pokémon Safari (app source)

Vite + React source for the game published at `/pokemon-safari/` on sitjohnny.github.io.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local HashRouter app at Vite base `/pokemon-safari/` |
| `npm run build` | Typecheck + production bundle into `dist/` |
| `npm run deploy:copy` | Replace repo-root `../pokemon-safari/` with `dist/` (Pages publish folder) |
| `npm run preview` | Preview the production build with Vite (`base` preserved) |
| `npm run test` | Vitest |
| `npm run test:root` | Assert site-root dual-project listing (BOOT-02) |

## Local full-site check

After a publishable build:

```bash
npm run build && npm run deploy:copy && npx --yes serve .. -p 4173
```

Or from this directory: `npm run build && npm run preview`.

Do **not** add an origin-root `404.html` SPA fallback — that would break `/food-crawl/`. HashRouter keeps deep links inside `/pokemon-safari/`.
