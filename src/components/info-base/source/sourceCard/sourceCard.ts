import { Source } from "@/business/info-base/source";

// --- Types ---

// --- Props ---
export type SourceCardProps =
  | { source: Source; sourceId?: never }
  | { source?: never; sourceId: number };

// --- Emits ---
export const sourceCardEmits = {
  edit: (id: number) => true,
  delete: (id: number) => true,
  run: (id: number) => true,
  editConfig: (id: number) => true,
} as const;
