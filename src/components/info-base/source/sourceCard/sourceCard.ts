import { Source } from "@/business/info-base/source";

// --- Types ---

// --- Props ---
export type SourceCardProps =
  | { source: Source; sourceId?: never }
  | { source?: never; sourceId: number };

// --- Emits ---
export const sourceCardEmits = {
  delete: (source: Source) => true,
  run: (source: Source) => true,
  editConfig: (source: Source) => true,
} as const;
