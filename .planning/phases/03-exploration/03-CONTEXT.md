# Phase 3: Exploration - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning
**Source:** User requirements (inline express path — /gsd-plan-phase invocation)

<domain>
## Phase Boundary

Implement the tile-based movement system: a walkable Forest tile map with a scrolling camera, shared D-pad/keyboard/touch input, collision detection, walking animation, and pixel-perfect rendering. Walking through grass emits an encounter event but does NOT open encounters — encounter resolution (rolls, tables, UI) is Phase 4. Phase stops when movement works.

</domain>

<decisions>
## Implementation Decisions

### Map & Biome
- Forest biome is the only biome in this phase
- Tile map drives the world (tile-based movement, not free movement)
- Grass tiles exist as a distinct tile type on the map

### Camera & Rendering
- Scrolling camera with the player centered
- Camera smoothing (eased follow, not hard-locked snapping)
- Pixel-perfect rendering (nearest-neighbor scaling, no blurry tiles — Emerald-inspired style per MAP-02)

### Input
- On-screen D-pad controls (large, touch-friendly per MAP-01)
- Keyboard controls (arrows/WASD per MAP-01)
- Mobile touch controls
- All input funnels through one shared input path (MAP-01)

### Movement & Collision
- Collision detection — player cannot walk through obstacles
- Walking animation on the player sprite
- Movement and collision resolve in pure `game/` logic, not per-frame React setState (MAP-04)

### Encounter Boundary (Phase 3 / Phase 4 seam)
- Walking through grass emits an encounter event
- Encounter events do NOT open encounters in this phase — no encounter UI, no rolls, no tables
- The event is the integration point Phase 4 will subscribe to

### Architecture
- Create reusable hooks (e.g., input, game loop, camera) so later phases can consume them

### Claude's Discretion
- Tile size, map dimensions, and map data format
- Canvas vs. DOM rendering approach (subject to MAP-04 performance constraint and RESEARCH.md findings)
- Game loop implementation details (rAF cadence, fixed timestep, etc.)
- Exact camera smoothing function/constants
- Walking animation frame source and timing (placeholder sprites acceptable — Pokémon data layer is Phase 2, may not exist yet)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 3 goal and success criteria
- `.planning/REQUIREMENTS.md` — MAP-01, MAP-02, MAP-04 definitions

### Existing app structure (Phase 1 output)
- `.planning/phases/01-app-shell-subpath-site-integration/01-01-SUMMARY.md` — scaffold, folder layout, Zustand store, types
- `.planning/phases/01-app-shell-subpath-site-integration/01-02-SUMMARY.md` — AppShell, routing, Game screen placeholder
- `pokemon-safari-app/src/` — `{assets,components,screens,hooks,services,game,data,store,types,utils}/` layout to extend

</canonical_refs>

<specifics>
## Specific Ideas

- Player stays centered on screen while the map scrolls beneath (Pokémon Emerald-style camera)
- "Stop after movement works" — do not scaffold encounter UI, encounter tables, or Phase 4 config in this phase

</specifics>

<deferred>
## Deferred Ideas

- Encounter outcome rolls, rates, and per-biome tables (Phase 4, MAP-03/DATA-03)
- Encounter flash/UI when a Pokémon appears (Phase 4)
- Lake and Mountain biomes (Phase 7 unlocks)
- Movement sound effects (Phase 8, AUDIO-01)

</deferred>

---

*Phase: 03-exploration*
*Context gathered: 2026-07-25 via user-provided requirements express path*
