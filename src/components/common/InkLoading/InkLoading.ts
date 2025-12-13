import { makeStringProp } from "@/utils/vue-props";

// --- Types ---
type LoadingSize = "xs" | "sm" | "md";
type LoadingDensity = "sm" | "md";

// --- Props ---
export const inkLoadingProps = {
  size: makeStringProp<LoadingSize>("md"),
  density: makeStringProp<LoadingDensity>("md"),
} as const;
