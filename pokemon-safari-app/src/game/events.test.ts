import { describe, expect, it } from 'vitest'
import { createEncounterCandidate, ENCOUNTER_CANDIDATE } from './events'

describe('events', () => {
  it('ENCOUNTER_CANDIDATE is encounter_candidate', () => {
    expect(ENCOUNTER_CANDIDATE).toBe('encounter_candidate')
  })

  it('createEncounterCandidate returns exactly the five event keys', () => {
    const event = createEncounterCandidate('forest', 3, 4, 1234)
    expect(event).toEqual({
      type: 'encounter_candidate',
      biome: 'forest',
      x: 3,
      y: 4,
      at: 1234,
    })
    expect(Object.keys(event).sort()).toEqual(['at', 'biome', 'type', 'x', 'y'])
  })

  it('exports only the Phase 4 seam symbols (no roll/rate/table)', async () => {
    const mod = await import('./events')
    expect(Object.keys(mod).sort()).toEqual(['ENCOUNTER_CANDIDATE', 'createEncounterCandidate'])
  })
})
