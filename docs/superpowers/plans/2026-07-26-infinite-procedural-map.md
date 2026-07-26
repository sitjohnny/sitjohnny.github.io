# Infinite Procedural Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Player can walk forever on a procedurally generated Forest of ground, grass, and trees, with stable revisits and the existing grass-encounter loop.

**Architecture:** `NoiseGenerator` → `ChunkCache` (16×16) → `WorldProvider` (`tileAt` / walk / grass). `TerrainCanvas` paints only visible tiles each frame. Camera follows without map-edge clamp. Movement still discrete-tile + 200ms tween.

**Tech Stack:** React + Zustand + Canvas 2D + Vitest (`pokemon-safari-app`)

**Spec:** [docs/superpowers/specs/2026-07-26-infinite-procedural-map-design.md](../specs/2026-07-26-infinite-procedural-map-design.md)

## Global Constraints

- Shared `WORLD_SEED` (hardcoded, e.g. `1337`) — same world for everyone
- Chunk size `16`; spawn `{ x: 0, y: 0 }`; carve walkable 5×5 (`max(|x|,|y|) ≤ 2`)
- Tile ids stay `'ground' | 'grass' | 'obstacle'`; biome stays `'forest'` for encounters
- Player / D-pad / encounter overlay stay DOM; only terrain moves to canvas
- No multi-biome, no save of world position, no WebGL (YAGNI)

## File Map

| Path | Role |
|---|---|
| Create `pokemon-safari-app/src/game/world/noise.ts` | Pure value noise + hash |
| Create `pokemon-safari-app/src/game/world/generateChunk.ts` | Seed + thresholds + spawn carve → `TileId[]` |
| Create `pokemon-safari-app/src/game/world/chunkCache.ts` | Lazy cache + Chebyshev eviction (~3 chunks) |
| Create `pokemon-safari-app/src/game/world/worldProvider.ts` | `tileAt` / `isWalkable` / `isGrass` / `ensureAround` |
| Create `pokemon-safari-app/src/data/worldConfig.ts` | Seed, chunk size, noise scale, thresholds, spawn |
| Modify `pokemon-safari-app/src/types/map.ts` | Add `TileSource` / world types |
| Modify collision / movement / camera / hooks / GameScreen | Wire infinite world |
| Create `TerrainCanvas.tsx`; remove `TileWorld` / `forest.ts` | Canvas render |

---

### Task 1: World config + noise + chunk generation

**Files:**
- Create: `pokemon-safari-app/src/data/worldConfig.ts`
- Create: `pokemon-safari-app/src/game/world/noise.ts`
- Create: `pokemon-safari-app/src/game/world/generateChunk.ts`
- Test: `pokemon-safari-app/src/game/world/generateChunk.test.ts`

- [ ] **Step 1:** Write failing tests for stability, spawn carve, chunk length, negatives
- [ ] **Step 2:** Implement config, noise, `tileIdAt`, `generateChunk`
- [ ] **Step 3:** Run `npm test -- src/game/world/generateChunk.test.ts` — PASS
- [ ] **Step 4:** Commit `feat(world): add seeded noise chunk generation`

### Task 2: ChunkCache + WorldProvider

**Files:**
- Create: `pokemon-safari-app/src/game/world/chunkCache.ts`
- Create: `pokemon-safari-app/src/game/world/worldProvider.ts`
- Test: `pokemon-safari-app/src/game/world/worldProvider.test.ts`

- [ ] **Step 1:** Write failing tests for cache hit, eviction identity, negative coords
- [ ] **Step 2:** Implement cache + provider
- [ ] **Step 3:** Run tests — PASS
- [ ] **Step 4:** Commit `feat(world): add chunk cache and WorldProvider`

### Task 3: Rewire collision + movement

**Files:**
- Modify: `pokemon-safari-app/src/types/map.ts`
- Modify: `pokemon-safari-app/src/game/collision.ts`
- Modify: `pokemon-safari-app/src/game/movement.ts`
- Modify: `pokemon-safari-app/src/game/collision.test.ts`, `movement.test.ts`

- [ ] **Step 1:** Introduce `TileSource`; update collision/movement + tests
- [ ] **Step 2:** Run collision + movement tests — PASS
- [ ] **Step 3:** Commit `refactor(explore): move collision and steps onto WorldProvider`

### Task 4: Unclamped camera

**Files:**
- Modify: `pokemon-safari-app/src/game/camera.ts`, `camera.test.ts`
- Modify: `pokemon-safari-app/src/hooks/useMapCamera.ts`

- [ ] **Step 1:** Remove mapPx clamp; update tests + hook
- [ ] **Step 2:** Run camera tests — PASS
- [ ] **Step 3:** Commit `feat(camera): remove finite-map clamp for infinite world`

### Task 5: TerrainCanvas

**Files:**
- Create: `pokemon-safari-app/src/components/map/TerrainCanvas.tsx`
- Create: `pokemon-safari-app/src/components/map/TerrainCanvas.test.tsx`
- Modify: explore loop / GameScreen wiring for canvas redraw
- Delete or stop using: `TileWorld.tsx`

- [ ] **Step 1:** Implement canvas draw + smoke test
- [ ] **Step 2:** Commit `feat(map): render procedural terrain on canvas`

### Task 6: GameScreen + store integration

**Files:**
- Modify: `GameScreen.tsx`, `exploreStore.ts`, `useExploreLoop.ts`, tests
- Delete: `data/maps/forest.ts` when unreferenced

- [ ] **Step 1:** Wire world, spawn `(0,0)`, remove authored map gate
- [ ] **Step 2:** Fix GameScreen tests
- [ ] **Step 3:** Commit `feat(explore): ship infinite procedural Forest world`

### Task 7: Verification

- [ ] Run `npm test` in `pokemon-safari-app`
- [ ] Manual smoke if possible; fix regressions
