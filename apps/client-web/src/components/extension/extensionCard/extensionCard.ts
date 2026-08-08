import { Extension, makeExtensionProp } from '@inkcre/core'
import { makeClientRefProp } from '@inkcre/core'

// --- Props ---
export const extensionCardProps = {
  extension: makeExtensionProp(),
  clientId: makeClientRefProp(),
}

// --- Emits ---
export const extensionCardEmits = {
  toggle: (_extension: Extension) => true,
  'edit-config': (_extension: Extension) => true,
} as const
