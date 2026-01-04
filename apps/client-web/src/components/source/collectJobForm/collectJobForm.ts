import type { PropType } from "vue";
import { SourceCollectJobForm } from "@inkcre/core";

// --- Props ---
export const collectJobFormProps = {
  modelValue: {
    type: Object as PropType<SourceCollectJobForm>,
    required: true,
  },
} as const;

// --- Emits ---
export const collectJobFormEmits = {
  "update:modelValue": (form: SourceCollectJobForm) => true,
} as const;
