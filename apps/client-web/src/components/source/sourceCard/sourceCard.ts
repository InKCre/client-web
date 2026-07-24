import { Source } from '@inkcre/core'

// --- Types ---

// --- Props ---
export type SourceCardProps =
  | { source: Source; sourceId?: never }
  | { source?: never; sourceId: number }

// --- Emits ---
export const sourceCardEmits = {
  delete: (_source: Source) => true,
  editConfig: (_source: Source) => true,
} as const
