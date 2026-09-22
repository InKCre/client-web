import { type PropType } from 'vue'
import type { InstalledExtension } from '@inkcre/core'

// --- Props ---
export const extensionCardProps = {
  extension: { type: Object as PropType<InstalledExtension>, required: true },
  enabled: { type: Boolean, required: true },
  controlsCurrentWebRuntime: { type: Boolean, required: true },
  setEnabled: {
    type: Function as PropType<(enabled: boolean) => Promise<InstalledExtension>>,
    required: true,
  },
} as const

// --- Emits ---
export const extensionCardEmits = {
  updated: (_extension: InstalledExtension) => true,
  uninstalled: () => true,
} as const
