import type { Adapter as ConfigAdapter } from 'zod-config'

/**
 * Config adapter with write capability
 */
export interface ConfigAdapterWithWrite extends ConfigAdapter {
  write: (data: Record<string, unknown>) => Promise<void>
}

/**
 * Storage keys for config persistence
 */
export const CONFIG_STORAGE_KEY = 'inkcre_app_config'

// Re-export Config, AppConfig and MetaConfig types from schema for convenience
export type { MetaConfig, PeerConfig } from './schema'
