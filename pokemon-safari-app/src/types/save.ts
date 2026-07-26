/** Versioned save envelope types — dex slice lands in Phase 6; Phase 7 extends additively. */

export type DexEntry = {
  seen: boolean
  firstEncounteredAt: string | null
  firstCapturedAt: string | null
  catchCount: number
  shinyOwned: boolean
}

export type DexData = Record<string, DexEntry>

export type SaveEnvelopeV1 = {
  version: 1
  savedAt: string
  data: {
    dex: DexData
  }
}

export type SaveEnvelope = SaveEnvelopeV1
