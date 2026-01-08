import type { Adapter as ConfigAdapter } from 'zod-config'

/**
 * Adapter type identifiers
 */
export type AdapterType = 'localStorage' | 'http' | 'env' | 'webext'

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
export const ADAPTER_STORAGE_KEY = 'inkcre_config_adapter'

// Re-export Config, AppConfig and MetaConfig types from schema for convenience
export type { ClientConfig, MetaConfig } from './schema'
