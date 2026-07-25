---
phase: 3
slug: exploration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 |
| **Config file** | `pokemon-safari-app/vite.config.ts` (`test.environment: 'jsdom'`) |
| **Quick run command** | `cd pokemon-safari-app && npm test -- src/game` |
| **Full suite command** | `cd pokemon-safari-app && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd pokemon-safari-app && npm test -- src/game`
- **After every plan wave:** Run `cd pokemon-safari-app && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | MAP-04 | T-03-02 | Bounds-checked `tileAt`; reject OOB | unit | `npm test -- src/game/collision.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | MAP-04 | T-03-02 / T-03-SC | Pure movement; no UI-layer imports | unit | `npm test -- src/game/movement.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | MAP-01 | T-03-05a | Turn-in-place, move-lock, one event/step | unit | `npm test -- src/game/movement.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | MAP-02 | — | N/A (pure camera math) | unit | `npm test -- src/game/camera.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | MAP-01 (seam) | T-03-05a | Emit `encounter_candidate` only; no rolls | unit | `npm test -- src/game/events.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | MAP-01 (seam) | T-03-05 | Queue cap 32; FIFO drain; no encounter UI | unit + component | `npm test -- src/game/events.test.ts` / `GameScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | MAP-01 | T-03-01 | Key allowlist; last-press wins | component | `npm test -- src/hooks/usePlayerInput.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*`nyquist_compliant` stays `false` until Wave 0 test files exist on disk.*

---

## Wave 0 Requirements

- [ ] `src/game/movement.test.ts` — stubs for MAP-01 movement rules / MAP-04 purity
- [ ] `src/game/collision.test.ts` — stubs for blocked vs walkable tiles
- [ ] `src/game/camera.test.ts` — stubs for camera follow + clamp to map bounds
- [ ] `src/game/events.test.ts` — stubs for grass step → `encounter_candidate` emission only
- [ ] Optional: `src/components/controls/DPad.test.tsx` — hit targets / pointer handlers
- Framework install: none — Vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pixelated (nearest-neighbor) tiles look crisp on a retina phone | MAP-02 | Visual rendering quality cannot be asserted in jsdom | Open Game screen on a real phone; verify tiles are sharp, not blurry, while walking |
| Movement feels smooth on a mid-tier phone | MAP-04 | Frame pacing requires a real device | Walk in all four directions holding D-pad; no visible jank or input lag |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
