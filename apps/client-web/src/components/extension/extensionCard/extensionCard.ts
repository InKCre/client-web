import { Extension, makeExtensionProp } from "@inkcre/core";
import { makeClientRefProp } from "@inkcre/core";

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
