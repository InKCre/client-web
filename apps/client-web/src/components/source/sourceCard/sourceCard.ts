import { Source } from "@inkcre/core";

// --- Types ---

// --- Props ---
export type SourceCardProps =
  | { source: Source; sourceId?: never }
  | { source?: never; sourceId: number };

// --- Emits ---
export const sourceCardEmits = {
  delete: (source: Source) => true,
  editConfig: (source: Source) => true,
} as const;
