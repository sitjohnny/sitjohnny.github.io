# Infinite Procedural Map Design

**Date:** 2026-07-26  
**Status:** Approved  
**App:** `pokemon-safari-app`

## Goal

Replace the finite authored Forest map with an unbounded, seed-stable procedural world of ground, grass, and trees so the player can walk forever while keeping tile-step movement, camera follow, and grass encounters.

## Decisions

| Topic | Choice |
|---|---|
| Infinity model | Truly unbounded — chunk-streamed world |
| Terrain render | Canvas 2D (visible tiles only); player/UI stay DOM |
| Generation | Deterministic value noise + thresholds |
| Authored map | Replace entirely (no hybrid spawn chunk) |
| Seed | Hardcoded shared `WORLD_SEED` (same world for everyone) |
| Architecture | Chunk cache + on-demand noise (Approach 1) |

## Architecture

```
Input → useExploreLoop → movement/collision → WorldProvider → ChunkCache → NoiseGenerator
                      → unclamped camera
                      → TerrainCanvas (reads WorldProvider)
                      → PlayerSprite (DOM)
```

### Units

| Unit | Responsibility |
|---|---|
| `NoiseGenerator` | Pure `(seed, worldX, worldY) → TileId` via value noise + thresholds |
| `ChunkCache` | Lazy `Map<"cx,cy", TileId[]>` for 16×16 chunks; generate on miss; evict far chunks |
| `WorldProvider` | `tileAt` / `isWalkable` / `isGrass` / `ensureAround` over infinite integer coords |
| `TerrainCanvas` | Replaces `TileWorld`; draws tiles intersecting the viewport |
| Camera | Exponential follow; **no** map-edge clamp |
| Movement / encounters | Unchanged step rules; grass still emits `encounter_candidate` |

### What goes away

- Authored `forest.ts` layout
- Full-map `MapDef.tiles` for exploration
- DOM terrain image grid
- Camera clamp to finite map size

### What stays

- Tile step + 200ms tween, turn-in-place, reduced-motion snap
- Grass encounter flow and forest encounter tables
- D-pad / keyboard input
- Player sprite as DOM over the canvas

## Procedural generation

1. Hardcoded `WORLD_SEED` (e.g. `1337`).
2. Value noise at world `(x, y)` with fixed scale (~8–12 tile period).
3. Map `n ∈ [0,1]` to tiles:
   - `n < 0.18` → `obstacle` (trees)
   - `0.18 ≤ n < 0.45` → `grass`
   - else → `ground`
4. **Spawn carve:** tiles with `max(|x|, |y|) ≤ 2` forced walkable (`ground`). Spawn at `{ x: 0, y: 0 }`.

Thresholds live in config for tuning without touching math.

### Chunks

- Size: **16×16**
- Key: `"${chunkX},${chunkY}"` with `chunkX = Math.floor(x / 16)` (correct for negatives)
- On miss: generate full chunk once into `TileId[256]`
- Eviction: drop chunks farther than ~**3** Chebyshev distance from the player’s chunk; never drop the player’s current chunk

## Rendering & camera

- Full-size `<canvas>` inside `MapViewport`
- Each frame: clear; draw tiles whose pixel rect intersects the view using existing PNGs
- World → screen uses camera-relative math; `imageSmoothingEnabled = false`
- Missing tile image → solid-color fallback (no crash)
- Player DOM layer positioned with the same camera-relative pixel coords
- Camera eases toward player center with **no** clamp

## Movement

- Same turn-then-step rules
- Collision uses `WorldProvider` (obstacles block; no out-of-bounds)
- After a successful step, `ensureAround(player)` warms neighbors and evicts distant chunks

## Testing

- Noise stability, spawn carve, chunk length, negative coords
- Cache hit / eviction regenerates identical tiles
- Collision, movement, grass events with provider
- Camera follows far from origin without clamp
- GameScreen: spawn `(0,0)`, walk, encounters

## Out of scope

- Multi-biome regions / Lake / Mountain unlocks
- Per-player or session seeds
- Destructible trees, placed map items
- WebGL / mesh batching
- Persisting player world position
