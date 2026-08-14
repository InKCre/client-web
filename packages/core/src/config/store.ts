import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { store } from '../store'
import type { ConfigAdapterWithWrite } from './types'
import { ClientConfigSchema, MetaConfigSchema, type ClientConfig, type MetaConfig } from './schema'
import { loadConfig as zodLoadConfig } from 'zod-config'

// Lazy import Client to avoid circular imports
const lazyClient = async () => (await import('../client/client')).Client

const unconfiguredAdapter: ConfigAdapterWithWrite = {
  name: 'unconfigured',
  read: async () => ({}),
  write: async () => {
    throw new Error('[Config] Initialize a runtime-owned meta adapter before saving.')
  },
}

/**
 * Config store, includes metaConfig and clientConfig, managing their loading and saving.
 */
export const useConfigStore = defineStore('inkcre-config', () => {
  const metaAdapter = shallowRef<ConfigAdapterWithWrite>(unconfiguredAdapter)
  const metaConfig = ref<MetaConfig>(MetaConfigSchema.parse({}))
  const clientConfig = ref<ClientConfig>(ClientConfigSchema.parse({}))
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function initializeMeta(adapter: ConfigAdapterWithWrite): Promise<void> {
    metaAdapter.value = adapter
    isLoading.value = true
    error.value = null

    try {
      metaConfig.value = await zodLoadConfig({
        schema: MetaConfigSchema,
        adapters: [adapter],
      })
    } catch (err) {
      error.value = err as Error
      metaConfig.value = MetaConfigSchema.parse({})
      console.error('[Config] Failed to initialize meta config.')
    } finally {
      isLoading.value = false
    }
  }

  async function loadClientConfig(): Promise<void> {
    if (!metaConfig.value.INKCRE_PGREST_URL || !metaConfig.value.INKCRE_JWT_SECRET) {
      clientConfig.value = ClientConfigSchema.parse({})
      return
    }

    const Client = await lazyClient()
    try {
      const loaded = await Client.getSelf()
      clientConfig.value = ClientConfigSchema.parse(loaded.config)
    } catch {
      clientConfig.value = ClientConfigSchema.parse({})
      console.error('[Config] Failed to load client config.')
    }
  }

  async function saveMeta(): Promise<void> {
    error.value = null
    try {
      await metaAdapter.value.write(metaConfig.value)
    } catch (err) {
      error.value = err as Error
      console.error('[Config] Failed to save meta config:', err)
      throw err
    }
  }

  async function connectAndSave(
    metaCandidate: MetaConfig,
    clientCandidate: ClientConfig
  ): Promise<void> {
    error.value = null
    const nextMeta = MetaConfigSchema.parse(metaCandidate)
    const nextClient = ClientConfigSchema.parse(clientCandidate)

    try {
      const Client = await lazyClient()
      await Client.connect(nextMeta, nextClient)
      await metaAdapter.value.write(nextMeta)
      metaConfig.value = nextMeta
      clientConfig.value = nextClient
    } catch (err) {
      error.value = err as Error
      throw err
    }
  }

  async function resetMeta(): Promise<void> {
    metaConfig.value = MetaConfigSchema.parse({})
    clientConfig.value = ClientConfigSchema.parse({})
    await saveMeta()
  }

  return {
    metaConfig,
    clientConfig,
    metaAdapter,
    isLoading,
    error,
    initializeMeta,
    loadClientConfig,
    connectAndSave,
    saveMeta,
    resetMeta,
  }
})

export const configStore = useConfigStore(store)
