import { type PropType } from 'vue'
import type { InstalledExtension } from '@inkcre/core'

// --- Props ---
export const extensionCardProps = {
  extension: { type: Object as PropType<InstalledExtension>, required: true },
  enabled: { type: Boolean, required: true },
} as const

// --- Emits ---
export const extensionCardEmits = {
  changed: () => true,
  updated: (_extension: InstalledExtension) => true,
  uninstalled: () => true,
} as const
