import { useState } from 'react'
import { mathSettingsCopy } from '@/data/educationConfig'
import { clearAdaptiveStats } from '@/game/education/adaptiveStore'
import {
  clearMathEducationSettings,
  defaultMathEducationSettings,
  loadMathEducationSettings,
  persistMathEducationSettings,
  type MathEducationSettings,
} from '@/game/education/mathSettings'
import { PixelButton } from '@/components/PixelButton'
import { ScreenTitle } from '@/components/ScreenTitle'
import { clearSave } from '@/services/save'
import { cancelPendingSaveFlush } from '@/services/saveFlush'
import { useEncounterStore } from '@/store/encounterStore'
import { useDexStore } from '@/store/dexStore'
import { useExploreStore } from '@/store/exploreStore'

const OPERATOR_KEYS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
] as const

const LEVEL_KEYS = [1, 2, 3, 4, 5, 6] as const

function countEnabledOperators(settings: MathEducationSettings): number {
  return OPERATOR_KEYS.filter((key) => settings.operators[key]).length
}

function countEnabledLevels(settings: MathEducationSettings): number {
  return LEVEL_KEYS.filter((level) => settings.levels[level]).length
}

function allLevelsEnabled(settings: MathEducationSettings): boolean {
  return LEVEL_KEYS.every((level) => settings.levels[level])
}

/** Wipe player progress keys and session stores, then reload. Keeps poke-cache. */
export function eraseProgress(): void {
  cancelPendingSaveFlush()
  useDexStore.setState({ dex: {}, saveSoftFail: false })
  useExploreStore.getState().reset()
  useEncounterStore.getState().reset()
  clearSave()
  clearAdaptiveStats()
  clearMathEducationSettings()
  window.location.reload()
}

export function SettingsScreen() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [math, setMath] = useState(loadMathEducationSettings)

  function updateMath(next: MathEducationSettings) {
    if (!persistMathEducationSettings(next)) return
    setMath(next)
  }

  function toggleOperator(key: (typeof OPERATOR_KEYS)[number]) {
    if (math.operators[key] && countEnabledOperators(math) === 1) return
    const next = structuredClone(math)
    next.operators[key] = !math.operators[key]
    updateMath(next)
  }

  function toggleLevel(level: (typeof LEVEL_KEYS)[number]) {
    if (math.levels[level] && countEnabledLevels(math) === 1) return
    const next = structuredClone(math)
    next.levels[level] = !math.levels[level]
    updateMath(next)
  }

  function toggleAllLevels(checked: boolean) {
    const next = structuredClone(math)
    if (checked) {
      for (const level of LEVEL_KEYS) next.levels[level] = true
    } else {
      const defaults = defaultMathEducationSettings().levels
      for (const level of LEVEL_KEYS) next.levels[level] = defaults[level]
    }
    updateMath(next)
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="sticky top-0 z-10 bg-dominant px-4 pb-3 pt-[max(8px,env(safe-area-inset-top))]">
        <ScreenTitle>Settings</ScreenTitle>
      </header>
      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="font-[family-name:var(--font-display)] text-[18px] font-bold leading-[1.2] tracking-[0.02em] text-text">
            {mathSettingsCopy.operatorsHeading}
          </legend>
          <ul className="flex flex-col gap-2">
            {OPERATOR_KEYS.map((key) => {
              const label = mathSettingsCopy.operators[key]
              const checked = math.operators[key]
              const disabled = checked && countEnabledOperators(math) === 1
              return (
                <li key={key}>
                  <label className="flex cursor-pointer items-center gap-3 font-[family-name:var(--font-body)] text-[16px] leading-[1.5] text-text">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleOperator(key)}
                    />
                    {label}
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="font-[family-name:var(--font-display)] text-[18px] font-bold leading-[1.2] tracking-[0.02em] text-text">
            {mathSettingsCopy.levelsHeading}
          </legend>
          <label className="flex cursor-pointer items-center gap-3 font-[family-name:var(--font-body)] text-[16px] leading-[1.5] text-text">
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-primary"
              checked={allLevelsEnabled(math)}
              onChange={(e) => toggleAllLevels(e.target.checked)}
            />
            {mathSettingsCopy.allLevels}
          </label>
          <ul className="flex flex-col gap-3">
            {LEVEL_KEYS.map((level) => {
              const { label, description } = mathSettingsCopy.levels[level]
              const checked = math.levels[level]
              const disabled = checked && countEnabledLevels(math) === 1
              return (
                <li key={level}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-5 shrink-0 accent-primary"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleLevel(level)}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-[family-name:var(--font-body)] text-[16px] leading-[1.5] text-text">
                        {label}
                      </span>
                      <span className="font-[family-name:var(--font-body)] text-[14px] leading-[1.4] text-muted">
                        {description}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <div className="mt-auto flex justify-center pt-2">
          <PixelButton variant="destructive" onClick={() => setConfirmOpen(true)}>
            Reset Save
          </PixelButton>
        </div>
      </div>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-save-title"
          className="pixel-border fixed inset-x-4 top-1/3 z-20 mx-auto max-w-sm bg-dominant p-4 shadow-none"
        >
          <h2
            id="reset-save-title"
            className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text"
          >
            Reset Save
          </h2>
          <p className="mt-3 font-[family-name:var(--font-body)] text-[16px] leading-[1.5] text-text">
            Erase your Safari progress on this device? This cannot be undone.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <PixelButton variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep Progress
            </PixelButton>
            <PixelButton variant="destructive" onClick={eraseProgress}>
              Erase Progress
            </PixelButton>
          </div>
        </div>
      ) : null}
    </section>
  )
}
