import type { PropType } from "vue";
import { SourceCollectJob } from "@/business/source";

// --- Props ---
export const sourceCollectJobCardProps = {
  job: {
    type: Object as PropType<SourceCollectJob>,
    required: true,
  },
} as const;

// --- Emits ---
export const sourceCollectJobCardEmits = {
  click: () => true,
} as const;
