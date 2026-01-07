import { defineStore } from 'pinia'
import { ref } from 'vue'
import { store } from '../store'
import type { ConfigAdapterWithWrite, MetaConfig } from './types'
import { ClientConfigSchema, MetaConfigSchema } from './schema'
import { loadConfig as zodLoadConfig } from 'zod-config'
import { computedAsync } from '@vueuse/core'

// Lazy import Client to avoid circular imports
const lazyClient = async () => (await import('../client/client')).Client

/**
 * Config store, includes metaConfig and clientConfig, managing their loading and saving.
 */
export const useConfigStore = defineStore('inkcre-config', () => {
  // State
  const metaConfig = ref<MetaConfig>(MetaConfigSchema.parse({}))
  const adapters = ref<ConfigAdapterWithWrite[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

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

  async function loadMeta(_adapters?: ConfigAdapterWithWrite[]): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const loadedMeta = await zodLoadConfig({
        schema: MetaConfigSchema,
        adapters: _adapters ?? adapters.value,
      })
      metaConfig.value = loadedMeta

      console.log('[Config] MetaConfig loaded', { metaConfig: loadedMeta })
    } catch (err) {
      error.value = err as Error
      console.error('[Config] Failed to load meta config:', err)
      metaConfig.value = MetaConfigSchema.parse({})
    } finally {
      isLoading.value = false
    }
  }

  async function saveMeta(_adapter?: ConfigAdapterWithWrite): Promise<void> {
    error.value = null
    try {
      const adapter = _adapter ?? adapters.value[0]
      await adapter.write(metaConfig.value)
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

  /**
   * Set the default adapters to use for loading.
   *
   * @param newAdapters - Array of config adapters
   */
  function setAdapters(newAdapters: ConfigAdapterWithWrite[]): void {
    adapters.value = newAdapters
  }

  return {
    // State - Exposed directly for consumer access
    metaConfig,
    clientConfig,
    adapters,
    isLoading,
    error,

    // Actions
    loadMeta,
    saveMeta,
    reset,
    setAdapters,
  }
})

export const configStore = useConfigStore(store)
