import type { PropType } from "vue";
import type { Block } from "@/business/info-base/block";

// --- Types ---

// --- Constants ---

// --- Props ---
export const blockDetailsPanelProps = {
  block: {
    type: Object as PropType<Block>,
    required: true as const,
  },
};

// --- Emits ---
export const blockDetailsPanelEmits = {
  close: () => true,
};
