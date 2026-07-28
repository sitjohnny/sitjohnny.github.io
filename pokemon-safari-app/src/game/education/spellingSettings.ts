/**
 * Persisted spelling-questions preference (separate from adaptive stats key).
 */

export const SPELLING_ENABLED_KEY = 'pokemon-safari:spelling-enabled'

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)
  )
}

/** Missing, invalid, or corrupt values default to enabled. */
export function loadSpellingEnabled(): boolean {
  const raw = localStorage.getItem(SPELLING_ENABLED_KEY)
  if (raw === 'false') return false
  if (raw === 'true') return true
  return true
}

export function persistSpellingEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SPELLING_ENABLED_KEY, enabled ? 'true' : 'false')
  } catch (e) {
    if (isQuotaError(e)) return
    throw e
  }
}
