import type { ConfigAdapterWithWrite } from './types'
import { CONFIG_STORAGE_KEY } from './types'

/**
 * localStorage config adapter, compatible with zod-config.
 * Stores configuration in browser's localStorage.
 */
export const localStorageAdapter: ConfigAdapterWithWrite = {
  name: 'localStorage',
  read: async () => {
    if (!globalThis.localStorage) return {}

    try {
      const stored = globalThis.localStorage.getItem(CONFIG_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('[Config] Failed to load config from localStorage:', error)
    }
    return {}
  },
  write: async (config) => {
    if (!globalThis.localStorage) {
      throw new Error('[Config] localStorage is unavailable in this runtime.')
    }

    try {
      globalThis.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('[Config] Failed to save config to localStorage:', error)
      throw error
    }
  },
}

export interface WebextStorageLike {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: string) => Promise<unknown>
}

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
export function createWebextAdapter(storageBackend: WebextStorageLike): ConfigAdapterWithWrite {
  return {
    name: 'webext',
    read: async () => {
      try {
        // Read from webext storage
        // The storage API is expected to have a getItem method
        const config = await storageBackend.getItem(CONFIG_STORAGE_KEY)
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
        await storageBackend.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
        console.log('[Config] Saved config to webext storage')
      } catch (error) {
        console.error('[Config] Failed to save config to webext storage:', error)
        throw error
      }
    },
  }
}
