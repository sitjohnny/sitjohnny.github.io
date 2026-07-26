# Phase 7 Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist Pokédex + explore tile/facing across reloads via SaveEnvelope v2 with v1 migration and a shared debounced flush.

**Architecture:** Extend `services/save.ts` to load/migrate/persist a full v2 envelope (`dex` + `explore`). Extract flush debounce and visibility/pagehide listeners into `services/saveFlush.ts` so dex and explore never overwrite each other. Hydrate both Zustand stores from `loadSave()`; pass the hydrated tile into `useMapCamera` on first paint.

**Tech Stack:** TypeScript, Zustand, Vitest, localStorage (`pokemon-safari-app`)

**Spec:** [docs/superpowers/specs/2026-07-26-phase7-persistence-design.md](../specs/2026-07-26-phase7-persistence-design.md)

## Global Constraints

- No Lake/Mountain unlocks, daily rewards, settings/mute, audio, or polish features
- No new gameplay features
- Keep `SAVE_KEY` string `pokemon-safari:save:v1` — schema version lives in the envelope
- Never wipe poke-cache or edu-stats keys on save failure
- Mid-encounter / pending queue / `moving` / immunity are session-only — never written to the envelope
- Every `persistSave` writes the **full** v2 envelope (dex + explore)
- Explore coords may be **negative** (infinite world); reject only non-finite or non-integer values
- Work primarily under `pokemon-safari-app/`; Task 5 updates `.planning/ROADMAP.md` + `.planning/STATE.md`

## File Map

| Path                                                       | Role                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Modify `pokemon-safari-app/src/types/save.ts`              | `ExploreSave`, `SaveEnvelopeV1`, `SaveEnvelopeV2`, `LoadedSave` |
| Modify `pokemon-safari-app/src/services/save.ts`           | Migrate v1→v2, sanitize explore, new load/persist signatures    |
| Modify `pokemon-safari-app/src/services/save.test.ts`      | Migration, round-trip, corrupt explore, quota                   |
| Create `pokemon-safari-app/src/services/saveFlush.ts`      | Shared debounce + visibility/pagehide flush                     |
| Modify `pokemon-safari-app/src/store/dexStore.ts`          | Hydrate + schedule via `saveFlush`                              |
| Modify `pokemon-safari-app/src/store/dexStore.test.ts`     | Expect version 2; no-clobber with explore                       |
| Modify `pokemon-safari-app/src/store/exploreStore.ts`      | Hydrate tile/facing; schedule on tile/facing change             |
| Modify `pokemon-safari-app/src/store/exploreStore.test.ts` | Persist/hydrate + no encounter keys                             |
| Modify `pokemon-safari-app/src/hooks/useExploreLoop.ts`    | `useMapCamera(worldRef, hydratedTile)`                          |
| Modify `.planning/ROADMAP.md`                              | Slim Phase 7 goal/criteria                                      |
| Modify `.planning/STATE.md`                                | Point focus at Phase 7 persistence                              |

---

### Task 1: Save envelope v2 + migration

**Files:**

- Modify: `pokemon-safari-app/src/types/save.ts`
- Modify: `pokemon-safari-app/src/services/save.ts`
- Modify: `pokemon-safari-app/src/services/save.test.ts`

**Interfaces:**

- Produces:

  ```ts
  export type ExploreSave = {
    x: number;
    y: number;
    facing: Direction; // from @/types/map
  };

  export type SaveEnvelopeV1 = {
    version: 1;
    savedAt: string;
    data: { dex: DexData };
  };

  export type SaveEnvelopeV2 = {
    version: 2;
    savedAt: string;
    data: { dex: DexData; explore: ExploreSave };
  };

  export type SaveEnvelope = SaveEnvelopeV2;

  export type LoadedSave = {
    dex: DexData;
    explore: ExploreSave;
  };

  export const SAVE_SCHEMA_VERSION = 2;

  export function defaultExploreSave(): ExploreSave;
  // → { x: WORLD_SPAWN.x, y: WORLD_SPAWN.y, facing: 'down' }

  export function loadSave(): LoadedSave;
  export function persistSave(data: {
    dex: DexData;
    explore: ExploreSave;
  }): "ok" | "quota";
  ```

- [ ] **Step 1: Rewrite failing save tests for v2 API**

Replace `pokemon-safari-app/src/services/save.test.ts` contents with:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WORLD_SPAWN } from "@/data/worldConfig";
import { CACHE_KEY, EDU_STATS_KEY, SAVE_KEY } from "@/services/pokeapi/keys";
import {
  defaultExploreSave,
  loadSave,
  persistSave,
  resetSaveForTests,
} from "@/services/save";
import type { DexData, ExploreSave } from "@/types/save";

const SEEDED_CACHE = JSON.stringify({
  version: 1,
  fetchedAt: "2026-01-01T00:00:00.000Z",
  pokemon: [{ id: 1, name: "bulbasaur" }],
});
const SEEDED_EDU = JSON.stringify({
  version: 1,
  facts: { "7x8": { correct: 1, incorrect: 0 } },
});

const SAMPLE_DEX: DexData = {
  "25": {
    seen: true,
    firstEncounteredAt: "2026-07-26T12:00:00.000Z",
    firstCapturedAt: "2026-07-26T12:05:00.000Z",
    catchCount: 2,
    shinyOwned: false,
  },
};

const SAMPLE_EXPLORE: ExploreSave = { x: 3, y: -2, facing: "left" };

beforeEach(() => {
  localStorage.removeItem(SAVE_KEY);
  localStorage.setItem(CACHE_KEY, SEEDED_CACHE);
  localStorage.setItem(EDU_STATS_KEY, SEEDED_EDU);
  resetSaveForTests();
});

function assertNeighborKeysUntouched() {
  expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE);
  expect(localStorage.getItem(EDU_STATS_KEY)).toBe(SEEDED_EDU);
}

describe("save service v2 (Phase 7 persistence)", () => {
  it("persistSave then loadSave round-trips dex + explore under version 2", () => {
    expect(persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })).toBe(
      "ok",
    );
    expect(loadSave()).toEqual({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE });
    const raw = localStorage.getItem(SAVE_KEY);
    expect(raw).toBeTruthy();
    const envelope = JSON.parse(raw!) as {
      version: number;
      data: { dex: DexData; explore: ExploreSave };
    };
    expect(envelope.version).toBe(2);
    expect(envelope.data.dex).toEqual(SAMPLE_DEX);
    expect(envelope.data.explore).toEqual(SAMPLE_EXPLORE);
    expect(envelope.data).not.toHaveProperty("pendingEncounters");
    assertNeighborKeysUntouched();
  });

  it("missing SAVE_KEY returns empty dex + default explore", () => {
    expect(loadSave()).toEqual({ dex: {}, explore: defaultExploreSave() });
    assertNeighborKeysUntouched();
  });

  it("corrupt JSON returns empty dex + default explore without throwing", () => {
    localStorage.setItem(SAVE_KEY, "{ not json");
    expect(() => loadSave()).not.toThrow();
    expect(loadSave()).toEqual({ dex: {}, explore: defaultExploreSave() });
    assertNeighborKeysUntouched();
  });

  it("unknown envelope version returns empty dex + default explore", () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 99,
        savedAt: "2026-07-26T00:00:00.000Z",
        data: { dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE },
      }),
    );
    expect(loadSave()).toEqual({ dex: {}, explore: defaultExploreSave() });
    assertNeighborKeysUntouched();
  });

  it("migrates v1 envelope: keeps dex, explore defaults to spawn+down", () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: "2026-07-26T00:00:00.000Z",
        data: { dex: SAMPLE_DEX },
      }),
    );
    expect(loadSave()).toEqual({
      dex: SAMPLE_DEX,
      explore: {
        x: WORLD_SPAWN.x,
        y: WORLD_SPAWN.y,
        facing: "down",
      },
    });
    expect(persistSave(loadSave())).toBe("ok");
    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      version: number;
    };
    expect(envelope.version).toBe(2);
    assertNeighborKeysUntouched();
  });

  it("corrupt explore field keeps dex and defaults explore", () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
        savedAt: "2026-07-26T00:00:00.000Z",
        data: {
          dex: SAMPLE_DEX,
          explore: { x: 1.5, y: "nope", facing: "north" },
        },
      }),
    );
    expect(loadSave()).toEqual({
      dex: SAMPLE_DEX,
      explore: defaultExploreSave(),
    });
    assertNeighborKeysUntouched();
  });

  it("QuotaExceededError on setItem returns quota instead of throwing", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === SAVE_KEY) {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    });

    expect(persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })).toBe(
      "quota",
    );
    assertNeighborKeysUntouched();
    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/services/save.test.ts
```

Expected: FAIL (missing exports / still v1 API).

- [ ] **Step 3: Update types**

Replace `pokemon-safari-app/src/types/save.ts` with:

```ts
/** Versioned save envelope — dex (Phase 6) + explore position (Phase 7). */

import type { Direction } from "@/types/map";

export type DexEntry = {
  seen: boolean;
  firstEncounteredAt: string | null;
  firstCapturedAt: string | null;
  catchCount: number;
  shinyOwned: boolean;
};

export type DexData = Record<string, DexEntry>;

export type ExploreSave = {
  x: number;
  y: number;
  facing: Direction;
};

export type SaveEnvelopeV1 = {
  version: 1;
  savedAt: string;
  data: {
    dex: DexData;
  };
};

export type SaveEnvelopeV2 = {
  version: 2;
  savedAt: string;
  data: {
    dex: DexData;
    explore: ExploreSave;
  };
};

export type SaveEnvelope = SaveEnvelopeV2;

export type LoadedSave = {
  dex: DexData;
  explore: ExploreSave;
};
```

- [ ] **Step 4: Implement save.ts v2**

Rewrite `pokemon-safari-app/src/services/save.ts` to:

```ts
/**
 * Namespaced, versioned localStorage adapter for the player save envelope.
 *
 * This module may read and write `SAVE_KEY` and nothing else — never the poke-cache
 * or edu-stats keys, and never a blanket wipe of all origin storage.
 */

import { WORLD_SPAWN } from "@/data/worldConfig";
import { SAVE_KEY } from "@/services/pokeapi/keys";
import type { Direction } from "@/types/map";
import type {
  DexData,
  DexEntry,
  ExploreSave,
  LoadedSave,
  SaveEnvelopeV2,
} from "@/types/save";

export const SAVE_SCHEMA_VERSION = 2;

const FACINGS: ReadonlySet<Direction> = new Set([
  "up",
  "down",
  "left",
  "right",
]);

export function defaultExploreSave(): ExploreSave {
  return { x: WORLD_SPAWN.x, y: WORLD_SPAWN.y, facing: "down" };
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014)
  );
}

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function isIsoOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function isIntegerCoord(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Number.isInteger(n);
}

function sanitizeEntry(raw: unknown): DexEntry | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const entry = raw as Record<string, unknown>;
  if (typeof entry.seen !== "boolean") return null;
  if (!isIsoOrNull(entry.firstEncounteredAt)) return null;
  if (!isIsoOrNull(entry.firstCapturedAt)) return null;
  if (!isFiniteNonNegative(entry.catchCount)) return null;
  if (typeof entry.shinyOwned !== "boolean") return null;
  return {
    seen: entry.seen,
    firstEncounteredAt: entry.firstEncounteredAt,
    firstCapturedAt: entry.firstCapturedAt,
    catchCount: entry.catchCount,
    shinyOwned: entry.shinyOwned,
  };
}

/** Drops invalid entries; returns null when `raw` is not a plain object. */
function sanitizeDex(raw: unknown): DexData | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const out: DexData = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const entry = sanitizeEntry(value);
    if (entry) out[key] = entry;
  }
  return out;
}

function sanitizeExplore(raw: unknown): ExploreSave {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaultExploreSave();
  }
  const obj = raw as Record<string, unknown>;
  if (!isIntegerCoord(obj.x) || !isIntegerCoord(obj.y)) {
    return defaultExploreSave();
  }
  if (typeof obj.facing !== "string" || !FACINGS.has(obj.facing as Direction)) {
    return defaultExploreSave();
  }
  return { x: obj.x, y: obj.y, facing: obj.facing as Direction };
}

function emptyLoaded(): LoadedSave {
  return { dex: {}, explore: defaultExploreSave() };
}

function parseToLoaded(raw: string | null): LoadedSave {
  if (!raw) return emptyLoaded();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return emptyLoaded();
    }
    const obj = parsed as Record<string, unknown>;
    if (
      typeof obj.data !== "object" ||
      obj.data === null ||
      Array.isArray(obj.data)
    ) {
      return emptyLoaded();
    }
    const data = obj.data as Record<string, unknown>;
    const dex = sanitizeDex(data.dex);
    if (dex === null) {
      return emptyLoaded();
    }

    if (obj.version === 1) {
      return { dex, explore: defaultExploreSave() };
    }
    if (obj.version === 2) {
      return { dex, explore: sanitizeExplore(data.explore) };
    }
    return emptyLoaded();
  } catch {
    return emptyLoaded();
  }
}

/** Returns empty dex + default explore on missing/corrupt/unknown version. */
export function loadSave(): LoadedSave {
  return parseToLoaded(localStorage.getItem(SAVE_KEY));
}

export function persistSave(data: {
  dex: DexData;
  explore: ExploreSave;
}): "ok" | "quota" {
  const envelope: SaveEnvelopeV2 = {
    version: 2,
    savedAt: new Date().toISOString(),
    data: {
      dex: data.dex,
      explore: data.explore,
    },
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return "ok";
  } catch (e) {
    if (isQuotaError(e)) return "quota";
    throw e;
  }
}

/** Test-only: removes only SAVE_KEY. */
export function resetSaveForTests(): void {
  localStorage.removeItem(SAVE_KEY);
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/services/save.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pokemon-safari-app/src/types/save.ts \
  pokemon-safari-app/src/services/save.ts \
  pokemon-safari-app/src/services/save.test.ts
git commit -m "$(cat <<'EOF'
feat(07): SaveEnvelope v2 with explore slice and v1 migration

EOF
)"
```

---

### Task 2: Shared saveFlush + wire dexStore

**Files:**

- Create: `pokemon-safari-app/src/services/saveFlush.ts`
- Modify: `pokemon-safari-app/src/store/dexStore.ts`
- Modify: `pokemon-safari-app/src/store/dexStore.test.ts`

**Interfaces:**

- Consumes: `loadSave()`, `persistSave({ dex, explore })`, `dexSaveDebounceMs`
- Produces:

  ```ts
  export function scheduleSaveFlush(): void;
  export function flushSaveNow(): void;
  ```

  - `flushSaveNow` reads `useDexStore.getState().dex` + explore tile/facing from `useExploreStore`, persists full envelope, sets `saveSoftFail` on quota
  - Listeners for `visibilitychange` (hidden) and `pagehide` live **only** in `saveFlush.ts`

- [ ] **Step 1: Update dexStore tests for v2 + shared flush**

In `dexStore.test.ts`, change the envelope version assertion and ensure `persistSave` shape:

```ts
it("after advanceTimersByTime(dexSaveDebounceMs) SAVE_KEY receives envelope", () => {
  useDexStore.getState().markSeen(1);
  useDexStore.getState().recordCatch({ speciesId: 1, shiny: false });
  expect(localStorage.getItem(SAVE_KEY)).toBeNull();

  vi.advanceTimersByTime(dexSaveDebounceMs);

  const raw = localStorage.getItem(SAVE_KEY);
  expect(raw).toBeTruthy();
  const envelope = JSON.parse(raw!) as {
    version: number;
    data: {
      dex: Record<string, unknown>;
      explore: { x: number; y: number; facing: string };
    };
  };
  expect(envelope.version).toBe(2);
  expect(envelope.data.dex["1"]).toBeTruthy();
  expect(envelope.data.explore).toEqual(
    expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
      facing: expect.any(String),
    }),
  );
  expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE);
  expect(localStorage.getItem(EDU_STATS_KEY)).toBe(SEEDED_EDU);
});
```

Add a no-clobber test (same file):

```ts
import { useExploreStore } from "@/store/exploreStore";
import { defaultExploreSave } from "@/services/save";

// inside describe:
it("dex flush after explore move keeps both slices", () => {
  useExploreStore.setState({
    tile: { x: 4, y: 5 },
    facing: "up",
    moving: false,
    pendingEncounters: [],
    pokemonImmunitySteps: 0,
  });
  useDexStore.getState().markSeen(7);
  vi.advanceTimersByTime(dexSaveDebounceMs);

  const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
    version: number;
    data: {
      dex: Record<string, unknown>;
      explore: { x: number; y: number; facing: string };
    };
  };
  expect(envelope.version).toBe(2);
  expect(envelope.data.dex["7"]).toBeTruthy();
  expect(envelope.data.explore).toEqual({ x: 4, y: 5, facing: "up" });
});
```

Keep existing quota / dismiss tests; they should still call `markSeen` + advance timers.

In `beforeEach`, after clearing SAVE_KEY, also reset explore so tests start clean:

```ts
useExploreStore.getState().reset();
```

- [ ] **Step 2: Run dexStore tests — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/store/dexStore.test.ts
```

Expected: FAIL (dexStore still calls old `persistSave(dex)` / version 1).

- [ ] **Step 3: Create saveFlush.ts**

Create `pokemon-safari-app/src/services/saveFlush.ts`:

```ts
import { dexSaveDebounceMs } from "@/data/rates";
import { persistSave } from "@/services/save";
import { useDexStore } from "@/store/dexStore";
import { useExploreStore } from "@/store/exploreStore";

const flushTimerRef: {
  current: ReturnType<typeof setTimeout> | null;
} = { current: null };

function clearFlushTimer() {
  if (flushTimerRef.current !== null) {
    clearTimeout(flushTimerRef.current);
    flushTimerRef.current = null;
  }
}

export function flushSaveNow(): void {
  clearFlushTimer();
  const dex = useDexStore.getState().dex;
  const { tile, facing } = useExploreStore.getState();
  const result = persistSave({
    dex,
    explore: { x: tile.x, y: tile.y, facing },
  });
  if (result === "quota") {
    useDexStore.setState({ saveSoftFail: true });
  }
}

export function scheduleSaveFlush(): void {
  clearFlushTimer();
  flushTimerRef.current = setTimeout(() => {
    flushTimerRef.current = null;
    flushSaveNow();
  }, dexSaveDebounceMs);
}

function eagerFlushIfHidden() {
  if (
    typeof document !== "undefined" &&
    document.visibilityState === "hidden"
  ) {
    flushSaveNow();
  }
}

function onPageHide() {
  flushSaveNow();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", eagerFlushIfHidden);
}
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", onPageHide);
}
```

- [ ] **Step 4: Wire dexStore to saveFlush**

Replace `pokemon-safari-app/src/store/dexStore.ts` with:

```ts
/**
 * Pokédex session store — hydrates from SAVE_KEY, mutates via pure reducers,
 * and schedules persist through the shared saveFlush coordinator.
 */

import { create } from "zustand";
import {
  markSeen as markSeenPure,
  recordCatch as recordCatchPure,
} from "@/game/dex";
import { loadSave } from "@/services/save";
import { flushSaveNow, scheduleSaveFlush } from "@/services/saveFlush";
import type { DexData } from "@/types/save";

type DexState = {
  dex: DexData;
  saveSoftFail: boolean;
  markSeen: (speciesId: number) => void;
  recordCatch: (args: { speciesId: number; shiny: boolean }) => void;
  dismissSaveSoftFail: () => void;
  flushNow: () => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

const initial = loadSave();

export const useDexStore = create<DexState>((set, get) => ({
  dex: initial.dex,
  saveSoftFail: false,
  markSeen: (speciesId) => {
    set((state) => ({
      dex: markSeenPure(state.dex, speciesId, nowIso()),
    }));
    scheduleSaveFlush();
  },
  recordCatch: ({ speciesId, shiny }) => {
    set((state) => ({
      dex: recordCatchPure(state.dex, { speciesId, shiny }, nowIso()),
    }));
    scheduleSaveFlush();
  },
  dismissSaveSoftFail: () => set({ saveSoftFail: false }),
  flushNow: () => {
    flushSaveNow();
  },
}));
```

Note: remove the old per-store visibility/pagehide listeners from dexStore — they now live in `saveFlush.ts`.

- [ ] **Step 5: Run dexStore tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/store/dexStore.test.ts
```

Expected: PASS. If circular-init errors appear (`Cannot access useDexStore before initialization`), break the cycle by moving the store imports inside `flushSaveNow` / `scheduleSaveFlush` function bodies (lazy `await import` is unnecessary — use inline `require`-style dynamic import via:

```ts
export function flushSaveNow(): void {
  clearFlushTimer()
  // Lazy imports avoid ESM init cycles between stores ↔ saveFlush.
  const { useDexStore } = require('@/store/dexStore') as typeof import('@/store/dexStore')
  const { useExploreStore } = require('@/store/exploreStore') as typeof import('@/store/exploreStore')
  ...
}
```

Prefer first trying top-level imports; only switch to lazy access if the suite fails on init. Vitest + Zustand usually tolerate the cycle when `getState` runs after both modules evaluate.)

- [ ] **Step 6: Commit**

```bash
git add pokemon-safari-app/src/services/saveFlush.ts \
  pokemon-safari-app/src/store/dexStore.ts \
  pokemon-safari-app/src/store/dexStore.test.ts
git commit -m "$(cat <<'EOF'
feat(07): shared saveFlush coordinator wired through dexStore

EOF
)"
```

---

### Task 3: Hydrate exploreStore + schedule flush on move

**Files:**

- Modify: `pokemon-safari-app/src/store/exploreStore.ts`
- Modify: `pokemon-safari-app/src/store/exploreStore.test.ts`

**Interfaces:**

- Consumes: `loadSave().explore`, `scheduleSaveFlush()`
- Produces: `useExploreStore` initial `tile`/`facing` from save; `setPlayer` calls `scheduleSaveFlush()` only when `tile` or `facing` changes
- `reset()` restores in-memory spawn defaults only (does not clear disk) — same as today

- [ ] **Step 1: Add explore persistence tests**

Append to `pokemon-safari-app/src/store/exploreStore.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dexSaveDebounceMs } from "@/data/rates";
import { SAVE_KEY } from "@/services/pokeapi/keys";
import {
  defaultExploreSave,
  persistSave,
  resetSaveForTests,
} from "@/services/save";
import { useDexStore } from "@/store/dexStore";
import { useExploreStore } from "@/store/exploreStore";

// Keep existing immunity describe block.

describe("useExploreStore persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSaveForTests();
    useDexStore.setState({ dex: {}, saveSoftFail: false });
    useExploreStore.getState().reset();
    useDexStore.getState().flushNow();
    resetSaveForTests();
  });

  afterEach(() => {
    useDexStore.getState().flushNow();
    vi.useRealTimers();
    resetSaveForTests();
  });

  it("setPlayer tile/facing change writes explore into SAVE_KEY after debounce", () => {
    useExploreStore.getState().setPlayer({
      x: 2,
      y: -1,
      facing: "right",
      moving: false,
    });
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();

    vi.advanceTimersByTime(dexSaveDebounceMs);

    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      version: number;
      data: {
        dex: Record<string, unknown>;
        explore: { x: number; y: number; facing: string };
        pendingEncounters?: unknown;
      };
    };
    expect(envelope.version).toBe(2);
    expect(envelope.data.explore).toEqual({ x: 2, y: -1, facing: "right" });
    expect(envelope.data).not.toHaveProperty("pendingEncounters");
  });

  it("hydrates tile and facing from an existing v2 save on re-init path", () => {
    persistSave({
      dex: {},
      explore: { x: 9, y: 8, facing: "up" },
    });
    // Simulate module re-init by applying loaded explore into the store the same
    // way create() initial state does.
    const { loadSave } =
      require("@/services/save") as typeof import("@/services/save");
    const loaded = loadSave();
    useExploreStore.setState({
      tile: { x: loaded.explore.x, y: loaded.explore.y },
      facing: loaded.explore.facing,
      moving: false,
      pendingEncounters: [],
      pokemonImmunitySteps: 0,
    });
    expect(useExploreStore.getState().tile).toEqual({ x: 9, y: 8 });
    expect(useExploreStore.getState().facing).toBe("up");
  });

  it("moving-only updates do not schedule a save by themselves", () => {
    useExploreStore.setState({
      tile: { x: 1, y: 1 },
      facing: "down",
      moving: false,
      pendingEncounters: [],
      pokemonImmunitySteps: 0,
    });
    useExploreStore.getState().setPlayer({
      x: 1,
      y: 1,
      facing: "down",
      moving: true,
    });
    vi.advanceTimersByTime(dexSaveDebounceMs);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});
```

(If the file already imports `describe`/`it`/`expect`, merge imports instead of duplicating.)

- [ ] **Step 2: Run exploreStore tests — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/store/exploreStore.test.ts
```

Expected: FAIL (no schedule on setPlayer / no hydrate).

- [ ] **Step 3: Implement exploreStore hydration + schedule**

Update `pokemon-safari-app/src/store/exploreStore.ts`:

```ts
import { create } from "zustand";
import { postEncounterPokemonImmunitySteps } from "@/data/rates";
import { WORLD_SPAWN } from "@/data/worldConfig";
import {
  drainEncounters as drainEncounterQueue,
  enqueueEncounters,
  MAX_PENDING_ENCOUNTERS,
} from "@/game/events";
import { loadSave } from "@/services/save";
import { scheduleSaveFlush } from "@/services/saveFlush";
import type {
  Direction,
  EncounterCandidateEvent,
  PlayerState,
  Vec2,
} from "@/types/map";

type ExploreState = {
  tile: Vec2;
  facing: Direction;
  moving: boolean;
  pendingEncounters: EncounterCandidateEvent[];
  pokemonImmunitySteps: number;
  setPlayer: (next: PlayerState, options?: { tickImmunity?: boolean }) => void;
  pushEncounters: (events: EncounterCandidateEvent[]) => void;
  drainEncounters: () => EncounterCandidateEvent[];
  armPokemonImmunity: () => void;
  tickPokemonImmunity: () => void;
  reset: () => void;
};

function spawnState() {
  return {
    tile: { ...WORLD_SPAWN },
    facing: "down" as Direction,
    moving: false,
    pendingEncounters: [] as EncounterCandidateEvent[],
    pokemonImmunitySteps: 0,
  };
}

function initialState() {
  const { explore } = loadSave();
  return {
    tile: { x: explore.x, y: explore.y },
    facing: explore.facing,
    moving: false,
    pendingEncounters: [] as EncounterCandidateEvent[],
    pokemonImmunitySteps: 0,
  };
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  ...initialState(),
  setPlayer: (next, options) => {
    const prev = get();
    const tileChanged = prev.tile.x !== next.x || prev.tile.y !== next.y;
    const facingChanged = prev.facing !== next.facing;
    set((state) => ({
      tile: { x: next.x, y: next.y },
      facing: next.facing,
      moving: next.moving,
      pokemonImmunitySteps:
        options?.tickImmunity === true && state.pokemonImmunitySteps > 0
          ? state.pokemonImmunitySteps - 1
          : state.pokemonImmunitySteps,
    }));
    if (tileChanged || facingChanged) {
      scheduleSaveFlush();
    }
  },
  pushEncounters: (events) => {
    if (events.length === 0) {
      return;
    }
    set({
      pendingEncounters: enqueueEncounters(
        get().pendingEncounters,
        events,
        MAX_PENDING_ENCOUNTERS,
      ),
    });
  },
  drainEncounters: () => {
    const { taken, remaining } = drainEncounterQueue(get().pendingEncounters);
    if (taken.length > 0 || get().pendingEncounters.length > 0) {
      set({ pendingEncounters: remaining });
    }
    return taken;
  },
  armPokemonImmunity: () =>
    set({ pokemonImmunitySteps: postEncounterPokemonImmunitySteps }),
  tickPokemonImmunity: () => {
    const remaining = get().pokemonImmunitySteps;
    if (remaining <= 0) {
      return;
    }
    set({ pokemonImmunitySteps: remaining - 1 });
  },
  reset: () => set(spawnState()),
}));
```

- [ ] **Step 4: Run exploreStore tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/store/exploreStore.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/store/exploreStore.ts \
  pokemon-safari-app/src/store/exploreStore.test.ts
git commit -m "$(cat <<'EOF'
feat(07): hydrate exploreStore and debounce position saves

EOF
)"
```

---

### Task 4: Camera first paint from hydrated tile

**Files:**

- Modify: `pokemon-safari-app/src/hooks/useExploreLoop.ts`
- Modify: `pokemon-safari-app/src/store/exploreStore.test.ts` (optional assert only if needed)
- Optionally add a focused note/test in `GameScreen.test.tsx` only if an existing remount case already covers store tile — do **not** invent a heavy rAF camera test

**Interfaces:**

- Consumes: `useExploreStore.getState().tile` at hook init
- Produces: `useMapCamera(worldRef, hydratedTile)` so camera center matches saved tile on first paint

- [ ] **Step 1: Pass hydrated tile into useMapCamera**

In `pokemon-safari-app/src/hooks/useExploreLoop.ts`, change:

```ts
const camera = useMapCamera(worldRef);
```

to:

```ts
const camera = useMapCamera(worldRef, useExploreStore.getState().tile);
```

`useMapCamera` already accepts `spawn: Vec2` and uses it only for the initial camera ref — this aligns first paint with the hydrated explore tile. The existing `useEffect` already boots `playerPx` from `useExploreStore.getState().tile`.

- [ ] **Step 2: Run related suites**

```bash
cd pokemon-safari-app && npm test -- src/screens/GameScreen.test.tsx src/store/exploreStore.test.ts src/store/dexStore.test.ts src/services/save.test.ts
```

Expected: PASS (GameScreen tests call `reset()` so they still start at spawn).

- [ ] **Step 3: Commit**

```bash
git add pokemon-safari-app/src/hooks/useExploreLoop.ts
git commit -m "$(cat <<'EOF'
fix(07): seed map camera from hydrated explore tile

EOF
)"
```

---

### Task 5: Slim Phase 7 in roadmap + STATE

**Files:**

- Modify: `.planning/ROADMAP.md` (Phase 7 section + progress table note)
- Modify: `.planning/STATE.md` (current focus → Phase 7 persistence)

**Interfaces:**

- Produces: Phase 7 goal/success criteria match the persistence-only spec; unlocks/daily called out as deferred

- [ ] **Step 1: Rewrite Phase 7 in ROADMAP.md**

Replace the Phase 7 block (goal through Plans) with:

```markdown
### Phase 7: Persistence

**Goal**: Progress persists safely across sessions — Pokédex and map position/facing resume on reopen with no manual save
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: SAVE-01, SAVE-02, SAVE-03
**Success Criteria** (what must be TRUE):

1. Closing and reopening the game resumes the player at their saved tile and facing with dex intact — no manual save ever needed
2. The save schema is versioned with a migration chain (v1 → v2), so an app update never wipes a child's collection
3. Mid-encounter state is not restored; reload lands on the map at the saved position
4. Lake/Mountain unlocks and daily rewards are **not** part of this phase (deferred)

**Plans**: See `docs/superpowers/plans/2026-07-26-phase7-persistence.md`
**UI hint**: no
```

Also update the overview sentence that describes Phase 7 as “persistence, biome unlocks, and daily rewards” to persistence-only, and the progress table Phase 7 row label to `7. Persistence`.

- [ ] **Step 2: Update STATE.md current focus**

Set:

```markdown
**Current focus:** Phase 07 — persistence (dex + explore)
```

and Current Position to Phase 07 / plan not started (or in progress once execution begins). Do not invent fake plan completion counts.

- [ ] **Step 3: Commit**

```bash
git add .planning/ROADMAP.md .planning/STATE.md
git commit -m "$(cat <<'EOF'
docs: slim Phase 7 roadmap to persistence only

EOF
)"
```

---

### Task 6: Full regression gate

**Files:** none (verification only)

- [ ] **Step 1: Run full Vitest suite**

```bash
cd pokemon-safari-app && npm test
```

Expected: PASS. Fix any callers still using `loadSave()` as `DexData` or `persistSave(dex)` — grep:

```bash
cd pokemon-safari-app && rg "loadSave\\(|persistSave\\(" src
```

- [ ] **Step 2: Manual smoke (human)**

1. Warm cache → walk several tiles away from spawn → switch tabs or wait ~1s → hard reload → same tile + facing
2. With an existing v1 save (dex only), reload → dex preserved, spawn position
3. Start an encounter → hard reload → map only, no overlay

- [ ] **Step 3: Final commit only if Step 1 required fixes**

Otherwise done.

---

## Spec coverage (self-review)

| Spec requirement                          | Task              |
| ----------------------------------------- | ----------------- |
| SaveEnvelope v2 + explore slice           | Task 1            |
| v1 → v2 migration keeps dex               | Task 1            |
| Shared debounce + visibility/pagehide     | Task 2            |
| Dex hydrate via shared load               | Task 2            |
| Explore hydrate + schedule on tile/facing | Task 3            |
| No mid-encounter persistence              | Tasks 1 + 3 tests |
| No clobber / full envelope writes         | Tasks 1–3         |
| Quota soft-fail reused                    | Task 2            |
| Camera first paint from hydrated tile     | Task 4            |
| Roadmap/STATE slim Phase 7                | Task 5            |
| Success criteria verification             | Task 6            |

No Lake/Mountain/daily/settings/audio/polish tasks included (explicitly out of scope).
