import type { Log } from "@/business/obsrv";

// --- Types ---

// --- Props ---
export type LogEntryProps =
  | { log: Log; logId?: never }
  | { log?: never; logId: number };

// --- Emits ---
export const logEntryEmits = {} as const;
