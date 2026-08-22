import { DEFAULT_MATH_EDUCATION_SETTINGS } from '@/data/educationConfig'

export const MATH_SETTINGS_KEY = 'pokemon-safari:math-education-settings'

export type MathEducationSettings = {
  operators: {
    addition: boolean
    subtraction: boolean
    multiplication: boolean
    division: boolean
  }
  levels: {
    1: boolean
    2: boolean
    3: boolean
    4: boolean
    5: boolean
    6: boolean
  }
}

const OPERATOR_KEYS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
] as const

const LEVEL_KEYS = [1, 2, 3, 4, 5, 6] as const

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)
  )
}

export function defaultMathEducationSettings(): MathEducationSettings {
  return structuredClone(
    DEFAULT_MATH_EDUCATION_SETTINGS,
  ) as MathEducationSettings
}

export function isUsableMathEducationSettings(
  settings: MathEducationSettings,
): boolean {
  const ops = Object.values(settings.operators).some(Boolean)
  const levels = Object.values(settings.levels).some(Boolean)
  return ops && levels
}

function normalizeOperators(
  operators: unknown,
): MathEducationSettings['operators'] | null {
  if (
    typeof operators !== 'object' ||
    operators === null ||
    Array.isArray(operators)
  ) {
    return null
  }
  const obj = operators as Record<string, unknown>
  const out = {} as MathEducationSettings['operators']
  for (const key of OPERATOR_KEYS) {
    if (typeof obj[key] !== 'boolean') return null
    out[key] = obj[key]
  }
  return out
}

function normalizeLevels(
  levels: unknown,
): MathEducationSettings['levels'] | null {
  if (typeof levels !== 'object' || levels === null || Array.isArray(levels)) {
    return null
  }
  const obj = levels as Record<string | number, unknown>
  const out = {} as MathEducationSettings['levels']
  for (const level of LEVEL_KEYS) {
    const value = obj[level] ?? obj[String(level)]
    if (typeof value !== 'boolean') return null
    out[level] = value
  }
  return out
}

export function isValidMathEducationSettings(
  value: unknown,
): value is MathEducationSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const obj = value as Record<string, unknown>
  const operators = normalizeOperators(obj.operators)
  const levels = normalizeLevels(obj.levels)
  if (operators === null || levels === null) return false
  ;(obj as MathEducationSettings).operators = operators
  ;(obj as MathEducationSettings).levels = levels
  return true
}

export function loadMathEducationSettings(): MathEducationSettings {
  const raw = localStorage.getItem(MATH_SETTINGS_KEY)
  if (raw == null) return defaultMathEducationSettings()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      !isValidMathEducationSettings(parsed) ||
      !isUsableMathEducationSettings(parsed)
    ) {
      return defaultMathEducationSettings()
    }
    return parsed
  } catch {
    return defaultMathEducationSettings()
  }
}

export function persistMathEducationSettings(
  settings: MathEducationSettings,
): boolean {
  if (!isUsableMathEducationSettings(settings)) return false
  try {
    localStorage.setItem(MATH_SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch (e) {
    if (isQuotaError(e)) return false
    throw e
  }
}

export function clearMathEducationSettings(): void {
  localStorage.removeItem(MATH_SETTINGS_KEY)
}
