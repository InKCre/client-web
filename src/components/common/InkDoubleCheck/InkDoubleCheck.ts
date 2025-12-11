import { makeStringProp } from "@/utils/vue-props";

// --- Types ---

// --- Props ---
export const inkDoubleCheckProps = {
  title: makeStringProp("Confirm Action"),
  message: makeStringProp("Are you sure you want to proceed?"),
  confirmText: makeStringProp("Confirm"),
  cancelText: makeStringProp("Cancel"),
} as const;

// --- Emits ---
export const inkDoubleCheckEmits = {
  confirm: () => true,
} as const;
