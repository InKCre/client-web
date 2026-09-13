import type { PropType } from 'vue'
import { Source, SourceForm } from '@inkcre/core'

// --- Props ---
export const sourceFormProps = {
  disabled: { type: Boolean, default: false },
  modelValue: {
    type: Object as PropType<Source | SourceForm>,
    required: true,
  },
} as const

// --- Emits ---
export const sourceFormEmits = {
  'update:modelValue': (_source: Source | SourceForm) => true,
} as const
