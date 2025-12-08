import { makeBooleanProp } from "@/utils/vue-props";

// --- Types ---

// --- Props ---
export const appSidePanelProps = {
  expanded: makeBooleanProp(false),
} as const;

// --- Emits ---
export const appSidePanelEmits = {
  "update:expanded": (value: boolean) => true,
} as const;
