import { describe, expect, it } from 'vitest'
import type { DexData, DexEntry } from '@/types/save'
import {
  countCaught,
  countSeen,
  dexTileState,
  markSeen,
  recordCatch,
} from '@/game/dex'

const NOW = '2026-07-26T15:00:00.000Z'

function entry(partial: Partial<DexEntry>): DexEntry {
  return {
    seen: false,
    firstEncounteredAt: null,
    firstCapturedAt: null,
    catchCount: 0,
    shinyOwned: false,
    ...partial,
  }
}

describe('markSeen (D-06)', () => {
  it('first call sets seen=true and firstEncounteredAt ISO', () => {
    const next = markSeen({}, 25, NOW)
    expect(next['25']).toEqual(
      entry({ seen: true, firstEncounteredAt: NOW }),
    )
  })

  it('second call for same species is idempotent (same object reference)', () => {
    const once = markSeen({}, 25, NOW)
    const twice = markSeen(once, 25, '2026-07-27T12:00:00.000Z')
    expect(twice).toBe(once)
    expect(twice['25']?.firstEncounteredAt).toBe(NOW)
  })
})

describe('recordCatch (D-06, D-09)', () => {
  it('increments catchCount, sets firstCapturedAt once, ORs shinyOwned, forces seen', () => {
    const first = recordCatch({}, { speciesId: 1, shiny: false }, NOW)
    expect(first['1']).toEqual(
      entry({
        seen: true,
        firstEncounteredAt: NOW,
        firstCapturedAt: NOW,
        catchCount: 1,
        shinyOwned: false,
      }),
    )

    const later = '2026-07-28T10:00:00.000Z'
    const second = recordCatch(first, { speciesId: 1, shiny: true }, later)
    expect(second['1']).toEqual(
      entry({
        seen: true,
        firstEncounteredAt: NOW,
        firstCapturedAt: NOW,
        catchCount: 2,
        shinyOwned: true,
      }),
    )
  })

  it('fills firstEncounteredAt when missing on catch', () => {
    const next = recordCatch({}, { speciesId: 4, shiny: false }, NOW)
    expect(next['4']?.firstEncounteredAt).toBe(NOW)
    expect(next['4']?.seen).toBe(true)
  })
})

describe('dexTileState (D-06, D-07, D-09)', () => {
  it("absent or seen-only entry → kind 'unknown' with #NNN Pokémon label (no species name)", () => {
    expect(dexTileState(undefined, 25, 'Pikachu')).toEqual({
      kind: 'unknown',
      label: '#025 Pokémon',
      shinyOwned: false,
    })
    expect(dexTileState(entry({ seen: true, firstEncounteredAt: NOW }), 7, 'Squirtle')).toEqual({
      kind: 'unknown',
      label: '#007 Pokémon',
      shinyOwned: false,
    })
  })

  it("caught → kind 'caught' with name + shinyOwned flag", () => {
    expect(
      dexTileState(
        entry({
          seen: true,
          firstEncounteredAt: NOW,
          firstCapturedAt: NOW,
          catchCount: 1,
          shinyOwned: true,
        }),
        1,
        'Bulbasaur',
      ),
    ).toEqual({
      kind: 'caught',
      label: '#001 Bulbasaur',
      shinyOwned: true,
    })
  })
})

describe('countSeen / countCaught (D-12)', () => {
  it('counts seen===true and firstCapturedAt!==null entries', () => {
    const dex: DexData = {
      '1': entry({ seen: true, firstEncounteredAt: NOW }),
      '2': entry({
        seen: true,
        firstEncounteredAt: NOW,
        firstCapturedAt: NOW,
        catchCount: 1,
      }),
      '3': entry({ seen: false }),
    }
    expect(countSeen(dex)).toBe(2)
    expect(countCaught(dex)).toBe(1)
  })
})
