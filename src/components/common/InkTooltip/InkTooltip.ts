import { makeStringProp } from "@/utils/vue-props";

// --- Types ---
type TooltipPosition = "top" | "bottom" | "left" | "right";

// --- Props ---
export const inkTooltipProps = {
  content: makeStringProp(""),
  position: makeStringProp<TooltipPosition>("top"),
} as const;

// --- Emits ---
export const inkTooltipEmits = {} as const;
