import type { PropType } from 'vue'
import type { InstalledExtension, InstallExtensionInput } from '@inkcre/core'

export const installExtensionProps = {
  install: {
    type: Function as PropType<(coordinate: InstallExtensionInput) => Promise<InstalledExtension>>,
    required: true,
  },
  disabled: { type: Boolean, default: false },
} as const

// --- Emits ---
export const installExtensionEmits = {
  install: () => true,
  busy: (_value: boolean) => true,
} as const
