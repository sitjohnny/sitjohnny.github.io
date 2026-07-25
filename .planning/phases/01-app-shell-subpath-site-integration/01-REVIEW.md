---
phase: 01-app-shell-subpath-site-integration
reviewed: 2026-07-25T19:45:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - index.html
  - README.md
  - pokemon-safari/index.html
  - pokemon-safari-app/README.md
  - pokemon-safari-app/eslint.config.js
  - pokemon-safari-app/index.html
  - pokemon-safari-app/package.json
  - pokemon-safari-app/scripts/assert-build-base.mjs
  - pokemon-safari-app/scripts/assert-root-listing.mjs
  - pokemon-safari-app/src/App.test.tsx
  - pokemon-safari-app/src/App.tsx
  - pokemon-safari-app/src/components/AppShell.tsx
  - pokemon-safari-app/src/components/BottomNav.test.tsx
  - pokemon-safari-app/src/components/BottomNav.tsx
  - pokemon-safari-app/src/components/EmptyState.tsx
  - pokemon-safari-app/src/components/PixelButton.tsx
  - pokemon-safari-app/src/components/ScreenTitle.tsx
  - pokemon-safari-app/src/index.css
  - pokemon-safari-app/src/main.tsx
  - pokemon-safari-app/src/screens/DexScreen.tsx
  - pokemon-safari-app/src/screens/GameScreen.tsx
  - pokemon-safari-app/src/screens/HomeScreen.tsx
  - pokemon-safari-app/src/screens/PackScreen.tsx
  - pokemon-safari-app/src/screens/SettingsScreen.tsx
  - pokemon-safari-app/src/store/index.ts
  - pokemon-safari-app/src/types/save.ts
  - pokemon-safari-app/vite.config.ts
  - pokemon-safari-app/tsconfig.app.json
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-25T19:45:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues

## Summary

Reviewed the Phase 01 app shell, HashRouter bootstrap, Emerald UI primitives, deploy/assert scripts, root listing, and published `pokemon-safari/index.html` (generated hashed assets under `pokemon-safari/assets/` excluded). No security-critical issues (no secrets, XSS sinks, or unsafe eval). Four warnings: StrictMode-unsafe router creation, incomplete modal a11y, destructive `deploy:copy` without a `dist` guard, and an overly broad root-listing assert. Info items cover intentional stubs and dead store writes.

## Warnings

### WR-01: Impure `createAppRouter` in `useState` leaks a live hash router under StrictMode

**File:** `pokemon-safari-app/src/App.tsx:58-60`
**Issue:** `createHashRouter` immediately calls `.initialize()` and attaches `history.listen`. `main.tsx` wraps the tree in `<StrictMode>`, and React double-invokes `useState` initializers in development, discarding the first return value. The discarded router still listens to hash changes (impure initializer: mutates `location.hash` via `syncHashBasename` and creates a stateful router). This can cause duplicate listener work and subtle nav races in dev.
**Fix:**
```tsx
export default function App({ router: routerProp }: AppProps = {}) {
  const routerRef = useRef(routerProp)
  if (routerRef.current == null) {
    routerRef.current = createAppRouter()
  }
  return <RouterProvider router={routerRef.current} />
}
```
Or create the router once outside the component for production and inject a fresh router only from tests via the `router` prop (avoid calling `createAppRouter()` inside a `useState` initializer).

### WR-02: Reset Save dialog is not a real modal (focus / dismiss / background)

**File:** `pokemon-safari-app/src/screens/SettingsScreen.tsx:17-51`
**Issue:** The confirm UI sets `role="dialog"` and `aria-modal="true"` but does not trap focus, move focus into the dialog, restore focus on close, handle Escape, or block interaction with BottomNav / the page behind it. For a kid-facing destructive control this fails basic dialog expectations and can leave keyboard users on controls behind the overlay.
**Fix:** Add a backdrop, `useEffect` focus management (focus first button on open; restore on close), `onKeyDown` Escape → close, and either `inert` on the shell behind the dialog or disable pointer events on non-dialog content while open. Prefer a small shared `ConfirmDialog` when persist lands in Phase 7.

### WR-03: `deploy:copy` deletes publish folder before verifying `dist/`

**File:** `pokemon-safari-app/package.json:9`
**Issue:** `rm -rf ../pokemon-safari` runs unconditionally. If `dist/` is missing or empty (forgot `build`, failed build), `cp` fails after the published Pages folder is already gone, leaving an empty/broken `pokemon-safari/` until git restore or a successful rebuild.
**Fix:**
```json
"deploy:copy": "node -e \"require('fs').accessSync('dist/index.html')\" && rm -rf ../pokemon-safari && mkdir -p ../pokemon-safari && cp -R dist/. ../pokemon-safari/"
```
Or a small `scripts/deploy-copy.mjs` that asserts `dist/index.html` (and ideally `/pokemon-safari/assets/`) before deleting the destination.

### WR-04: Root listing assert false-fails any meta-refresh while food-crawl link exists

**File:** `pokemon-safari-app/scripts/assert-root-listing.mjs:18-23`
**Issue:** The check requires both `http-equiv=refresh` and `/food-crawl/` anywhere in the document. The dual listing always includes `href="/food-crawl/"`, so *any* future meta-refresh (even to `/pokemon-safari/`) fails the assert. The comment describes “sole discovery path to food-crawl,” but the predicate does not inspect the refresh URL.
**Fix:**
```js
const refreshToFoodCrawl =
  /http-equiv\s*=\s*["']refresh["'][^>]*url=["']?[^"'>\s]*\/food-crawl\//i.test(html) ||
  /http-equiv\s*=\s*["']refresh["'][\s\S]{0,120}\/food-crawl\//i.test(html)
if (refreshToFoodCrawl) {
  errors.push(
    'index.html must not use http-equiv refresh to /food-crawl/ as sole discovery path',
  )
}
```

## Info

### IN-01: “Erase Progress” confirms success but performs no erase

**File:** `pokemon-safari-app/src/screens/SettingsScreen.tsx:40-45`
**Issue:** Documented Phase 1 stub (T-01-06): dialog closes with no `localStorage` change. Misleading once real saves exist if wiring is forgotten.
**Fix:** When Phase 7 persist lands, implement erase here (or disable/hide the control until then with copy like “Coming soon”).

### IN-02: `lastRoute` / `setMute` written or defined but never read for UX

**File:** `pokemon-safari-app/src/store/index.ts:13-19` (also writers in `BottomNav.tsx:26`, `HomeScreen.tsx:25`)
**Issue:** Session stub updates `lastRoute` on nav; nothing restores route from it. `setMute` is unused. Harmless now; dead paths may rot.
**Fix:** Wire restore on boot when persist/session resume is in scope, or drop writers until needed.

### IN-03: Home CTA duplicates `PixelButton` styles instead of composing it

**File:** `pokemon-safari-app/src/screens/HomeScreen.tsx:23-28`
**Issue:** `Link` reimplements the same pixel/touch classes as `PixelButton`, so variant/motion changes can drift.
**Fix:** Support `asChild` / render-prop on `PixelButton`, or wrap `Link` styling via a shared `pixelControlClass` constant.

---

_Reviewed: 2026-07-25T19:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
