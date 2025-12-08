import { makeStringProp } from "@/utils/vue-props";

// --- Types ---
type ButtonType = "subtle" | "primary" | "danger";
type ButtonSize = "md" | "sm";

// --- Props ---
export const inkButtonProps = {
	text: makeStringProp("Button Text"),
	type: makeStringProp<ButtonType>("subtle"),
	size: makeStringProp<ButtonSize>("md"),
} as const;

// --- Emits ---
export const inkButtonEmits = {
	click: () => true,
} as const;
