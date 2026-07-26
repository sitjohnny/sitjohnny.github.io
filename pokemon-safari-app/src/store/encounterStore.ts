import { create } from 'zustand'
import type { EducationQuestion } from '@/game/education/questionTypes'
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
  open: (session: EncounterSession) => void
  setStage: (stage: EncounterStage) => void
  askQuestion: (question: EducationQuestion) => void
  applyAnswer: (args: {
    outcome: EncounterEducationOutcome
    captureBonus: number
    message: string
  }) => void
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

export const useEncounterStore = create<EncounterState>((set) => ({
  ...initialState(),
  open: (session) =>
    set({ stage: 'appear', session, question: null, feedback: null }),
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
