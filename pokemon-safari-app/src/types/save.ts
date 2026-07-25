/** Versioned save envelope types — persist wiring lands in Phase 7. */

export type SaveEnvelopeV1 = {
  version: 1
  savedAt: string
  data: Record<string, never>
}

export type SaveEnvelope = SaveEnvelopeV1
