import { makeBooleanProp } from '@/utils/vue-props'

// --- Types ---

// --- Props ---
export const appSidePanelProps = {
  expanded: makeBooleanProp(false),
} as const

// --- Emits ---
export const appSidePanelEmits = {
  'update:expanded': (_value: boolean) => true,
} as const
