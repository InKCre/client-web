import { makeStringProp } from "@/utils/vue-props";

// --- Props ---
export const inkHeaderProps = {
  title: makeStringProp("InKCre"),
  pageTitle: makeStringProp<string | undefined>(undefined),
};

// --- Emits ---
export const inkHeaderEmits = {
  "menu-click": () => true,
  "title-click": () => true,
} as const;
