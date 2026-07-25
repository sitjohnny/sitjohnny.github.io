---
phase: 1
slug: app-shell-subpath-site-integration
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + jsdom + Testing Library |
| **Config file** | `pokemon-safari-app/vite.config.ts` (`test` block) — Wave 0 in plan 01-01 |
| **Quick run command** | `cd pokemon-safari-app && npm test -- --run` |
| **Full suite command** | `cd pokemon-safari-app && npm test -- --run && npm run build` |
| **Estimated runtime** | ~30–60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd pokemon-safari-app && npm test -- --run` (once package exists)
- **After every plan wave:** Run full suite + relevant assert scripts
- **Before `/gsd-verify-work`:** Full suite green + deploy:copy asserts
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | BOOT-03 | T-01-01 | Install only audited packages | unit scaffold | `npm test -- --run` (may fail UX asserts) | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | BOOT-01 / BOOT-03 | T-01-02 | No localStorage.clear; no persist | build smoke | `npm run build && node scripts/assert-build-base.mjs` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | UX-01 | — | N/A theme tokens | build | `npm run build` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | UX-01 / BOOT-01 | T-01-04 / T-01-05 | HashRouter; no raw HTML injection | component | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 3 | BOOT-02 | T-01-07 | Hardcoded listing hrefs only | file assert | `node pokemon-safari-app/scripts/assert-root-listing.mjs` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 3 | BOOT-01 | T-01-08 / T-01-09 | No root 404.html; copy only pokemon-safari | build+copy | `npm run build && npm run deploy:copy && node scripts/assert-build-base.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pokemon-safari-app/vite.config.ts` — Vitest jsdom + setupFiles
- [ ] `pokemon-safari-app/src/test/setup.ts` — Testing Library jest-dom
- [ ] `pokemon-safari-app/src/App.test.tsx` — Home brand + Start Safari / route smoke
- [ ] `pokemon-safari-app/src/components/BottomNav.test.tsx` — five labeled links + touch-target
- [ ] `pokemon-safari-app/scripts/assert-build-base.mjs` — `/pokemon-safari/assets/` in dist
- [ ] `pokemon-safari-app/scripts/assert-root-listing.mjs` — dual links, no sole meta-refresh (plan 03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile-width chrome feel + touch targets | UX-01 | Visual/touch sizing | Dev server, ~390px viewport, tap all five nav items |
| Hash deep-link refresh | BOOT-01 | Browser history + static host | Open `#/game`, refresh, confirm shell still loads |
| food-crawl regression | BOOT-02 / D-14 | Sibling app | Open `/food-crawl/` after Safari publish; confirm unchanged |
| Root listing discovery | BOOT-02 | Visual | Open site root; both project links visible |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (approve after Wave 0 files land in 01-01)
