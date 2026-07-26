import { create } from 'zustand'
import type { EducationQuestion } from '@/game/education/questionTypes'
import { sweetSpotFor } from '@/game/timing'
import type { TimingGrade } from '@/game/timing'
import type {
  EncounterEducationOutcome,
  EncounterSession,
  EncounterStage,
} from '@/types/encounter'

/**
 * Ephemeral encounter-session state. Phase 5 extends the session payload;
 * long-lived save data remains owned by Phase 7.
 */
type EncounterState = {
  stage: EncounterStage
  session: EncounterSession | null
  itemToastVisible: boolean
  lastFactKey: string | null
  question: EducationQuestion | null
  feedback: { ok: boolean; message: string } | null
  open: (session: Omit<
    EncounterSession,
    'attemptsUsed' | 'sweetSpot' | 'lastGrade' | 'lastCaught' | 'lastChance'
  > &
    Partial<
      Pick<
        EncounterSession,
        'attemptsUsed' | 'sweetSpot' | 'lastGrade' | 'lastCaught' | 'lastChance'
      >
    >) => void
  setStage: (stage: EncounterStage) => void
  askQuestion: (question: EducationQuestion) => void
  applyAnswer: (args: {
    outcome: EncounterEducationOutcome
    captureBonus: number
    message: string
  }) => void
  startTiming: () => void
  registerThrow: (args: {
    grade: TimingGrade
    caught: boolean
    chance: number
  }) => void
  toResult: () => void
  toFlee: () => void
  fail: () => void
  showItemToast: () => void
  hideItemToast: () => void
  toRecap: () => void
  close: () => void
  reset: () => void
}

function initialState() {
  return {
    stage: 'idle' as EncounterStage,
    session: null as EncounterSession | null,
    itemToastVisible: false,
    lastFactKey: null as string | null,
    question: null as EducationQuestion | null,
    feedback: null as { ok: boolean; message: string } | null,
  }
}

function withCaptureDefaults(
  session: Omit<
    EncounterSession,
    'attemptsUsed' | 'sweetSpot' | 'lastGrade' | 'lastCaught' | 'lastChance'
  > &
    Partial<
      Pick<
        EncounterSession,
        'attemptsUsed' | 'sweetSpot' | 'lastGrade' | 'lastCaught' | 'lastChance'
      >
    >,
): EncounterSession {
  return {
    attemptsUsed: 0,
    sweetSpot: 0.5,
    lastGrade: null,
    lastCaught: null,
    lastChance: null,
    ...session,
  }
}

export const useEncounterStore = create<EncounterState>((set) => ({
  ...initialState(),
  open: (session) =>
    set({
      stage: 'appear',
      session: withCaptureDefaults(session),
      question: null,
      feedback: null,
    }),
  setStage: (stage) => set({ stage }),
  askQuestion: (question) =>
    set({ question, feedback: null, stage: 'question' }),
  applyAnswer: ({ outcome, captureBonus, message }) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          education: outcome,
          captureBonus,
        },
        lastFactKey: outcome.factKey,
        feedback: { ok: outcome.correct, message },
        stage: 'feedback',
      }
    }),
  startTiming: () =>
    set((state) => {
      if (!state.session) return state
      const sweetSpot = sweetSpotFor(state.session.attemptsUsed)
      return {
        stage: 'timing' as const,
        session: {
          ...state.session,
          sweetSpot,
          lastGrade: null,
          lastCaught: null,
          lastChance: null,
        },
        feedback: null,
      }
    }),
  registerThrow: ({ grade, caught, chance }) =>
    set((state) => {
      if (!state.session) return state
      const nextAttempts = Math.min(3, Math.max(0, state.session.attemptsUsed + 1))
      return {
        stage: 'shake' as const,
        session: {
          ...state.session,
          attemptsUsed: nextAttempts,
          lastGrade: grade,
          lastCaught: caught,
          lastChance: chance,
        },
      }
    }),
  toResult: () => set({ stage: 'result' }),
  toFlee: () => set({ stage: 'flee' }),
  fail: () => set({ stage: 'error' }),
  showItemToast: () => set({ itemToastVisible: true }),
  hideItemToast: () => set({ itemToastVisible: false }),
  toRecap: () => set({ stage: 'recap' }),
  close: () =>
    set((state) => ({
      stage: 'idle',
      session: null,
      question: null,
      feedback: null,
      lastFactKey: state.lastFactKey,
      itemToastVisible: state.itemToastVisible,
    })),
  reset: () => set(initialState()),
}))

/** Pause signal for frame loops and global input listeners outside React. */
export function isEncounterActive(): boolean {
  return useEncounterStore.getState().stage !== 'idle'
}
