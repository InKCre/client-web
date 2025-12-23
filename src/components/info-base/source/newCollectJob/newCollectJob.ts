import type { PropType } from "vue";
import { SourceCollectJob } from "@/business/info-base/source";

// --- Props ---
export const newCollectJobProps = {
  sourceId: {
    type: Number as PropType<number>,
    required: true,
  },
} as const;

// --- Emits ---
export const newCollectJobEmits = {
  create: (job: SourceCollectJob) => true,
} as const;
