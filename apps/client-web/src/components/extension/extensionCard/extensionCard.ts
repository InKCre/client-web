import { type PropType } from 'vue'
import type { RegistryInstallation } from '@inkcre/core'

// --- Props ---
export const extensionCardProps = {
  extension: { type: Object as PropType<RegistryInstallation>, required: true },
  enabled: { type: Boolean, required: true },
  peerId: { type: String, required: true },
} as const

// --- Emits ---
export const extensionCardEmits = {
  changed: () => true,
  updated: (_extension: RegistryInstallation) => true,
  uninstalled: () => true,
} as const
