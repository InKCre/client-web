import type { PropType } from "vue";
import { Extension } from "@/business/extension";

// --- Props ---
export const extensionCardProps = {
  extension: {
    type: Object as PropType<Extension>,
    required: true,
    default: () => Extension.parse({}),
  },
};

// --- Emits ---
export const extensionCardEmits = {
  toggle: (extension: Extension) => true,
  "edit-config": (extension: Extension) => true,
} as const;
