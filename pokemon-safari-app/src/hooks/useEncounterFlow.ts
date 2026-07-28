import { useEffect } from 'react'
import { feedbackCopy } from '@/data/educationConfig'
import {
  educationCaptureBonus,
  captureThrowLimits,
  encounterTimingMs,
  shinyRate,
} from '@/data/rates'
import { WORLD_SEED } from '@/data/worldConfig'
import { computeCatchChance, rollCapture } from '@/game/capture'
import {
  loadAdaptiveStats,
  persistAdaptiveStats,
  recordAttempt,
} from '@/game/education/adaptiveStore'
import { captureBonusFor, validateAnswer } from '@/game/education/answerValidator'
import {
  mathEducationProvider,
  nextEducationQuestion,
} from '@/game/education/questionGenerator'
import { loadSpellingEnabled } from '@/game/education/spellingSettings'
import { resolveCandidate } from '@/game/encounter'
import { gradeAt } from '@/game/timing'
import { prefersReducedMotion } from '@/hooks/useMapCamera'
import { getPokemon } from '@/services/pokeapi/cache'
import { useDexStore } from '@/store/dexStore'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import type { EncounterEducationOutcome } from '@/types/encounter'
import { getDefaultRng, type Rng } from '@/utils/rng'

type EncounterFlowOptions = {
  rng?: Rng
}

type EncounterFlowApi = {
  advanceFromAppear: () => void
  submitAnswer: (raw: string) => void
  capture: (position: number) => void
  continueFromResult: () => void
  continueFromFlee: () => void
  dismissRecap: () => void
}

/** Active rng for overlay callbacks exported beside the hook. */
const flowRngRef: { current: Rng } = { current: getDefaultRng() }
const feedbackTimerRef: {
  current: ReturnType<typeof setTimeout> | null
} = { current: null }
const failBeatTimerRef: {
  current: ReturnType<typeof setTimeout> | null
} = { current: null }

function clearFeedbackTimer() {
  if (feedbackTimerRef.current !== null) {
    clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = null
  }
}

function clearFailBeatTimer() {
  if (failBeatTimerRef.current !== null) {
    clearTimeout(failBeatTimerRef.current)
    failBeatTimerRef.current = null
  }
}

function clearEncounterTimers() {
  clearFeedbackTimer()
  clearFailBeatTimer()
}

function buildFeedbackMessage(ok: boolean, rng: Rng): string {
  const pool = ok ? feedbackCopy.correct : feedbackCopy.incorrect
  const index = Math.min(pool.length - 1, Math.floor(rng.next() * pool.length))
  const line = pool[index] ?? pool[0]
  if (ok) {
    const boost = Math.round(educationCaptureBonus.correct * 100)
    return `${line} ${feedbackCopy.correctSuffix.replace('{boost}', String(boost))}`
  }
  return line
}

function doAdvanceFromAppear(rng: Rng): void {
  const state = useEncounterStore.getState()
  if (state.stage !== 'appear') return
  const session = state.session
  if (!session) return
  const question = nextEducationQuestion(
    rng,
    loadAdaptiveStats(),
    session.rarity,
    state.lastFactKey,
    { spellingEnabled: loadSpellingEnabled() },
  )
  useEncounterStore.getState().askQuestion(question)
}

function doReplaceSpellingWithMath(rng: Rng): void {
  const state = useEncounterStore.getState()
  if (state.stage !== 'question') return
  if (state.question?.category !== 'spelling') return
  if (state.feedback !== null) return
  const session = state.session
  if (!session) return
  const question = mathEducationProvider.nextQuestion(
    rng,
    loadAdaptiveStats(),
    session.rarity,
    state.lastFactKey,
  )
  useEncounterStore.getState().askQuestion(question)
}

function doSubmitAnswer(rng: Rng, raw: string): void {
  const state = useEncounterStore.getState()
  if (state.feedback !== null) return
  if (state.stage !== 'question' && state.stage !== 'feedback') return
  const question = state.question
  if (!question) return

  const result = validateAnswer(question, raw)
  if (result.parsed === null) return

  const captureBonus = captureBonusFor(result)
  const message = buildFeedbackMessage(result.ok, rng)
  const outcome: EncounterEducationOutcome = {
    factKey: question.factKey,
    prompt: question.prompt,
    expected: question.expected,
    correct: result.ok,
    recapLine: question.recapLine,
    ...(question.category === 'spelling'
      ? {
          imageUrl: question.imageUrl,
          photographer: question.photographer,
          pexelsUrl: question.pexelsUrl,
        }
      : {}),
  }

  useEncounterStore.getState().applyAnswer({ outcome, captureBonus, message })
  persistAdaptiveStats(recordAttempt(loadAdaptiveStats(), question.factKey, result.ok))

  clearFeedbackTimer()
  const hold = result.ok
    ? prefersReducedMotion()
      ? encounterTimingMs.reducedFeedbackHold
      : encounterTimingMs.feedbackHold
    : prefersReducedMotion()
      ? encounterTimingMs.reducedIncorrectFeedbackHold
      : encounterTimingMs.incorrectFeedbackHold
  feedbackTimerRef.current = setTimeout(() => {
    feedbackTimerRef.current = null
    if (useEncounterStore.getState().stage === 'feedback') {
      useEncounterStore.getState().startTiming()
    }
  }, hold)
}

function clampPosition(position: number): number {
  if (!Number.isFinite(position)) return 0
  return Math.min(1, Math.max(0, position))
}

function doCapture(rng: Rng, position: number): void {
  const state = useEncounterStore.getState()
  if (state.stage !== 'timing') return
  const session = state.session
  if (!session) return

  const grade = gradeAt(clampPosition(position), session.sweetSpot, session.rarity)
  const chance = computeCatchChance({
    rarity: session.rarity,
    educationBonus: session.captureBonus,
    educationCorrect: session.education?.correct === true,
    grade,
    ball: 'poke',
    berry: false,
  })
  const caught = rollCapture(rng, chance)
  useEncounterStore.getState().registerThrow({ grade, caught, chance })
}

/** Overlay / tests: advance appear → adaptive question (D-06 sole trigger). */
export function advanceFromAppear(): void {
  doAdvanceFromAppear(flowRngRef.current)
}

/** Overlay / tests: validate, persist, and schedule timing (D-03). */
export function submitAnswer(raw: string): void {
  doSubmitAnswer(flowRngRef.current, raw)
}

/** Overlay: swap spelling → math when the word image fails (no attempt recorded). */
export function replaceSpellingWithMath(): void {
  doReplaceSpellingWithMath(flowRngRef.current)
}

/** Overlay / tests: freeze timing, grade, roll before shake (D-21 / D-31). */
export function capture(position: number): void {
  doCapture(flowRngRef.current, position)
}

/** Overlay: after Gotcha Continue — recap only when the answer was wrong (D-29). */
export function continueFromResult(): void {
  const { stage, session } = useEncounterStore.getState()
  if (stage !== 'result' && stage !== 'flee') return
  if (session?.education && session.education.correct === false) {
    useEncounterStore.getState().toRecap()
    return
  }
  useEncounterStore.getState().close()
}

/** Overlay: flee Continue uses the same recap/close branch as result (D-29). */
export function continueFromFlee(): void {
  continueFromResult()
}

/** Overlay: Continue on the Quick recap always returns to explore. */
export function dismissRecap(): void {
  if (useEncounterStore.getState().stage !== 'recap') return
  useEncounterStore.getState().close()
}

/**
 * After BallShake ending: Gotcha → result; else fail beat → remount timing, or flee at max throws.
 * Wrong education answers get one throw; correct answers get three (D-04/D-26).
 * attemptsUsed is owned solely by registerThrow (T-05-04) — this path never increments.
 */
export function onShakeComplete(): void {
  const state = useEncounterStore.getState()
  if (state.stage !== 'shake') return
  const session = state.session
  if (!session) return
  if (session.lastCaught) {
    useDexStore.getState().recordCatch({
      speciesId: session.speciesId,
      shiny: session.shiny === true,
    })
    useEncounterStore.getState().toResult()
    return
  }
  const maxThrows =
    session.education?.correct === true
      ? captureThrowLimits.educationCorrect
      : captureThrowLimits.educationIncorrect
  // Clamp so NaN/out-of-range never skips flee (threat T-05-04).
  const attemptsUsed = Math.min(maxThrows, Math.max(0, session.attemptsUsed | 0))
  if (attemptsUsed >= maxThrows) {
    useEncounterStore.getState().toFlee()
    return
  }
  useEncounterStore.getState().setStage('failBeat')
  clearFailBeatTimer()
  const hold = prefersReducedMotion()
    ? encounterTimingMs.reducedFailBeat
    : encounterTimingMs.failBeat
  failBeatTimerRef.current = setTimeout(() => {
    failBeatTimerRef.current = null
    if (useEncounterStore.getState().stage === 'failBeat') {
      useEncounterStore.getState().startTiming()
    }
  }, hold)
}

/** @deprecated Prefer onShakeComplete — kept as alias for any residual callers. */
export const resolveAfterShake = onShakeComplete

/**
 * Single Phase 4/5 queue consumer: drain one candidate, restore the FIFO
 * remainder, then route the config-driven result into session UI state.
 */
export function useEncounterFlow(options: EncounterFlowOptions = {}): EncounterFlowApi {
  const rng = options.rng ?? getDefaultRng()
  flowRngRef.current = rng
  const pendingEncounters = useExploreStore((state) => state.pendingEncounters)

  useEffect(() => {
    // Zustand subscribe runs synchronously on set — clear the feedback hold
    // inside close() before a stale timer can advance to timing (T-04-15).
    const unsub = useEncounterStore.subscribe((state, prev) => {
      if (prev.stage !== 'idle' && state.stage === 'idle') {
        clearEncounterTimers()
        if (prev.session != null) {
          useExploreStore.getState().armPokemonImmunity()
        }
      }
    })
    return () => {
      unsub()
      clearEncounterTimers()
      useEncounterStore.getState().close()
    }
  }, [])

  useEffect(() => {
    if (pendingEncounters.length === 0 || useEncounterStore.getState().stage !== 'idle') {
      return
    }

    const drained = useExploreStore.getState().drainEncounters()
    const [candidate, ...rest] = drained
    if (!candidate) {
      return
    }
    if (rest.length > 0) {
      useExploreStore.getState().pushEncounters(rest)
    }

    const suppressPokemon = useExploreStore.getState().pokemonImmunitySteps > 0
    const resolution = resolveCandidate(rng, candidate, {
      suppressPokemon,
      worldSeed: WORLD_SEED,
      habitatOf: (id) => {
        try {
          return getPokemon(id).habitat
        } catch {
          return null
        }
      },
    })
    if (resolution.kind === 'nothing') {
      return
    }

    try {
      getPokemon(resolution.speciesId)
      const shiny = rng.next() < shinyRate
      useEncounterStore.getState().open({
        speciesId: resolution.speciesId,
        rarity: resolution.rarity,
        biome: candidate.biome,
        education: null,
        captureBonus: 0,
        shiny,
      })
      useDexStore.getState().markSeen(resolution.speciesId)
    } catch {
      useEncounterStore.getState().fail()
    }
  }, [pendingEncounters, rng])

  return {
    advanceFromAppear: () => doAdvanceFromAppear(rng),
    submitAnswer: (raw: string) => doSubmitAnswer(rng, raw),
    capture: (position: number) => doCapture(rng, position),
    continueFromResult,
    continueFromFlee,
    dismissRecap,
  }
}
