import type { ConfigAdapterWithWrite } from './types'
import { CONFIG_STORAGE_KEY } from './types'

/**
 * localStorage config adapter, compatible with zod-config.
 * Stores configuration in browser's localStorage.
 */
export const localStorageAdapter: ConfigAdapterWithWrite = {
  name: 'localStorage',
  read: async () => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('[Config] Loaded config from localStorage')
        return parsed
      }
    } catch (error) {
      console.error('[Config] Failed to load config from localStorage:', error)
    }
    return {}
  },
  write: async (config) => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
      console.log('[Config] Saved config to localStorage')
    } catch (error) {
      console.error('[Config] Failed to save config to localStorage:', error)
      throw error
    }
  },
}

/**
 * HTTP config adapter, fetches config from a predefined endpoint.
 * Useful for server-side configuration management.
 */
export const httpAdapter: ConfigAdapterWithWrite = {
  name: 'http',
  read: async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        console.log('[Config] Loaded config from HTTP endpoint')
        return data
      }
      console.warn('[Config] HTTP endpoint returned non-ok status:', res.status)
    } catch (error) {
      console.error('[Config] Failed to load config from HTTP:', error)
    }
    return {}
  },
  write: async (config) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        console.log('[Config] Saved config to HTTP endpoint')
      } else {
        console.error('[Config] Failed to save config to HTTP:', res.status)
        throw new Error(`HTTP save failed with status ${res.status}`)
      }
    } catch (error) {
      console.error('[Config] Failed to save config to HTTP:', error)
      throw error
    }
  },
}

/**
 * Dev adapter: reads from env vars, overlays with localStorage, writes to localStorage.
 * Used in development mode to combine environment variables with local overrides.
 *
 * Note: This adapter uses import.meta.env which is specific to Vite-based applications.
 * Applications using this adapter need to provide their own env adapter.
 */
export function createDevAdapter(
  options: {
    envPrefix?: string
    customEnv?: Record<string, any>
  } = {}
): ConfigAdapterWithWrite {
  const { envPrefix = 'VITE_', customEnv } = options

  return {
    name: 'dev',
    read: async () => {
      // Read from environment variables
      const env =
        customEnv ||
        (typeof import.meta !== 'undefined' && (import.meta as any).env
          ? (import.meta as any).env
          : {})
      const envData: Record<string, any> = {}

      // Extract env vars that match the prefix
      Object.entries(env).forEach(([key, value]) => {
        if (key.startsWith(envPrefix)) {
          // Strip prefix from keys to match ConfigSchema
          const cleanKey = key.slice(envPrefix.length)
          envData[cleanKey] = value
        }
      })

      // Then, overlay with localStorage data
      try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
        if (stored) {
          const localData = JSON.parse(stored)
          console.log('[Config] Loaded config from env and localStorage')
          // Local storage takes precedence over env vars
          return { ...envData, ...localData }
        }
      } catch (error) {
        console.error('[Config] Failed to load config from localStorage:', error)
      }

      console.log('[Config] Loaded config from env')
      return envData
    },
    write: localStorageAdapter.write,
  }
}

/**
 * Default dev adapter for Vite applications
 */
export const devAdapter = createDevAdapter()

/**
 * WebExtension adapter factory.
 * Creates an adapter that uses browser extension storage API.
 *
 * @param storage - WebExtension storage implementation (e.g., from @wxt-dev/storage)
 * @example
 * ```typescript
 * import { storage } from "@wxt-dev/storage";
 * const webextAdapter = createWebextAdapter(storage);
 * ```
 */
export function createWebextAdapter(storage: any): ConfigAdapterWithWrite {
  return {
    name: 'webext',
    read: async () => {
      try {
        // Read from webext storage
        // The storage API is expected to have a getItem method
        const config = await storage.getItem(CONFIG_STORAGE_KEY)
        if (config) {
          console.log('[Config] Loaded config from webext storage')
          return typeof config === 'string' ? JSON.parse(config) : config
        }
      } catch (error) {
        console.error('[Config] Failed to load config from webext storage:', error)
      }
      return {}
    },
    write: async (config) => {
      try {
        // Write to webext storage
        await storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
        console.log('[Config] Saved config to webext storage')
      } catch (error) {
        console.error('[Config] Failed to save config to webext storage:', error)
        throw error
      }
    },
  }
}
