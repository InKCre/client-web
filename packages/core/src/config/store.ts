import { defineStore } from 'pinia'
import { ref } from 'vue'
import { store } from '../store'
import type { ConfigAdapterWithWrite } from './types'
import { ClientConfigSchema, MetaConfigSchema } from './schema'
import { loadConfig as zodLoadConfig } from 'zod-config'
import { computedAsync } from '@vueuse/core'
import { envAdapter } from './adapters'

// Lazy import Client to avoid circular imports
const lazyClient = async () => (await import('../client/client')).Client

/**
 * Config store, includes metaConfig and clientConfig, managing their loading and saving.
 */
export const useConfigStore = defineStore('inkcre-config', () => {
  // State
  const metaAdapter = ref<ConfigAdapterWithWrite>(envAdapter)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const metaConfig = computedAsync(async () => {
    try {
      const loadedMeta = await zodLoadConfig({
        schema: MetaConfigSchema,
        adapters: [metaAdapter.value],
      })
      console.log('[Config] MetaConfig loaded', loadedMeta)
      return loadedMeta
    } catch (err) {
      console.error('[Config] Failed to load meta config:', err)
      return MetaConfigSchema.parse({})
    }
  }, MetaConfigSchema.parse({}))

  const clientConfig = computedAsync(async () => {
    const Client = await lazyClient()
    try {
      const client = await Client.getSelf()
      return await client.config
    } catch (error) {
      console.error('[Config] Failed to load client config:', error)
      return ClientConfigSchema.parse({})
    }
  }, ClientConfigSchema.parse({}))

  async function saveMeta(): Promise<void> {
    error.value = null
    try {
      await metaAdapter.value.write(metaConfig.value)
      console.log('[Config] MetaConfig saved')
    } catch (err) {
      error.value = err as Error
      console.error('[Config] Failed to save meta config:', err)
      throw err
    }
  }

  /**
   * Reset configuration to defaults.
   * Note: This only resets in-memory config, not persisted storage.
   */
  function reset(): void {
    metaConfig.value = MetaConfigSchema.parse({})
    clientConfig.value = ClientConfigSchema.parse({})
    console.log('[Config] Config reset to defaults')
  }

  return {
    // State - Exposed directly for consumer access
    metaConfig,
    clientConfig,
    metaAdapter,
    isLoading,
    error,

    // Actions
    saveMeta,
    reset,
  }
})

export const configStore = useConfigStore(store)
