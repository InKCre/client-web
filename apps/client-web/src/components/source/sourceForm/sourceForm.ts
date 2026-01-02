import type { PropType } from "vue";
import { Source, SourceForm } from "@/business/source";

// --- Props ---
export const sourceFormProps = {
  modelValue: {
    type: Object as PropType<Source | SourceForm>,
    required: true,
  },
} as const;

// --- Emits ---
export const sourceFormEmits = {
  "update:modelValue": (source: Source | SourceForm) => true,
} as const;
