/** Versioned save envelope — dex (Phase 6) + explore position (Phase 7). */

import type { Direction } from "@/types/map";

export type DexEntry = {
  seen: boolean;
  firstEncounteredAt: string | null;
  firstCapturedAt: string | null;
  catchCount: number;
  shinyOwned: boolean;
};

export type DexData = Record<string, DexEntry>;

export type ExploreSave = {
  x: number;
  y: number;
  facing: Direction;
};

export type SaveEnvelopeV1 = {
  version: 1;
  savedAt: string;
  data: {
    dex: DexData;
  };
};

export type SaveEnvelopeV2 = {
  version: 2;
  savedAt: string;
  data: {
    dex: DexData;
    explore: ExploreSave;
  };
};

export type SaveEnvelope = SaveEnvelopeV2;

export type LoadedSave = {
  dex: DexData;
  explore: ExploreSave;
};
