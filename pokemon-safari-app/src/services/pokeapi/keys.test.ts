import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CACHE_KEY, CACHE_VERSION, SAVE_KEY } from '@/services/pokeapi/keys'

const servicesDir = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('pokeapi keys (DATA-04, D-11)', () => {
  it('uses namespaced versioned CACHE_KEY pokemon-safari:poke-cache:v1', () => {
    expect(CACHE_VERSION).toBe(1)
    expect(CACHE_KEY).toBe('pokemon-safari:poke-cache:v1')
  })

  it('reserves SAVE_KEY as pokemon-safari:save:v1 distinct from CACHE_KEY', () => {
    expect(SAVE_KEY).toBe('pokemon-safari:save:v1')
    expect(SAVE_KEY).not.toBe(CACHE_KEY)
  })

  it('production modules under src/services never call localStorage.clear', () => {
    const files = ['pokeapi/keys.ts', 'pokeapi/client.ts', 'pokeapi/cache.ts']
    for (const rel of files) {
      const path = join(servicesDir, rel)
      let source = ''
      try {
        source = readFileSync(path, 'utf8')
      } catch {
        // Wave 0: module may not exist yet — skip until 02-02 lands the file
        continue
      }
      expect(source, `${rel} must not call localStorage.clear`).not.toMatch(
        /localStorage\.clear\s*\(/,
      )
    }
  })
})
