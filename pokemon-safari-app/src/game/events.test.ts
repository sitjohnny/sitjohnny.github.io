import { describe, expect, it } from 'vitest'
import {
  createEncounterCandidate,
  drainEncounters,
  enqueueEncounters,
  ENCOUNTER_CANDIDATE,
  MAX_PENDING_ENCOUNTERS,
} from './events'

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

  it('MAX_PENDING_ENCOUNTERS is 32', () => {
    expect(MAX_PENDING_ENCOUNTERS).toBe(32)
  })

  it('enqueueEncounters appends without mutating the input arrays', () => {
    const e1 = createEncounterCandidate('forest', 1, 1, 10)
    const queue: ReturnType<typeof createEncounterCandidate>[] = []
    const events = [e1]
    const next = enqueueEncounters(queue, events)
    expect(next).toEqual([e1])
    expect(queue).toEqual([])
    expect(events).toEqual([e1])
    expect(next).not.toBe(queue)
  })

  it('enqueueEncounters drops the oldest when past the cap', () => {
    const built = Array.from({ length: 40 }, (_, i) =>
      createEncounterCandidate('forest', i, 0, i),
    )
    const capped = enqueueEncounters([], built)
    expect(capped).toHaveLength(MAX_PENDING_ENCOUNTERS)
    expect(capped[0]?.at).toBe(8)
    expect(capped[capped.length - 1]?.at).toBe(39)
  })

  it('enqueueEncounters honours an explicit smaller max', () => {
    const built = Array.from({ length: 5 }, (_, i) =>
      createEncounterCandidate('forest', i, 0, i),
    )
    const capped = enqueueEncounters([], built, 3)
    expect(capped).toHaveLength(3)
    expect(capped.map((e) => e.at)).toEqual([2, 3, 4])
  })

  it('drainEncounters returns FIFO taken events and an empty remaining queue', () => {
    const e1 = createEncounterCandidate('forest', 1, 1, 1)
    const e2 = createEncounterCandidate('forest', 2, 2, 2)
    const queue = [e1, e2]
    const result = drainEncounters(queue)
    expect(result.taken).toEqual([e1, e2])
    expect(result.remaining).toEqual([])
    expect(queue).toEqual([e1, e2])
  })

  it('drainEncounters on an empty queue returns empty arrays', () => {
    expect(drainEncounters([])).toEqual({ taken: [], remaining: [] })
  })

  it('exports only the Phase 4 seam symbols (no roll/rate/table)', async () => {
    const mod = await import('./events')
    expect(Object.keys(mod).sort()).toEqual([
      'ENCOUNTER_CANDIDATE',
      'MAX_PENDING_ENCOUNTERS',
      'createEncounterCandidate',
      'drainEncounters',
      'enqueueEncounters',
    ])
    const names = Object.keys(mod).join(' ')
    expect(names).not.toMatch(/roll|rate|table/i)
  })
})
