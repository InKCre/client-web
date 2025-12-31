import { Extension, makeExtensionProp } from "@/business/extension";
import { makeClientRefProp } from "@/business/client";

// --- Props ---
export const extensionCardProps = {
  extension: makeExtensionProp(),
  clientId: makeClientRefProp(),
};

// --- Emits ---
export const extensionCardEmits = {
  toggle: (extension: Extension) => true,
  "edit-config": (extension: Extension) => true,
} as const;
