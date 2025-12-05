import { makeStringProp } from "@/utils/vue-props";

// --- Types ---
type ButtonType = "subtle" | "primary";

// --- Props ---
export const inkButtonProps = {
	text: makeStringProp("Button Text"),
	type: makeStringProp<ButtonType>("subtle"),
} as const;

// --- Emits ---
export const inkButtonEmits = {
	click: () => true,
} as const;
