import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { store } from '../store'
import type { ConfigAdapterWithWrite } from './types'
import { MetaConfigSchema, PeerConfigSchema, type MetaConfig, type PeerConfig } from './schema'
import { loadConfig as zodLoadConfig } from 'zod-config'

// Lazy import Peer to avoid circular imports
const lazyPeer = async () => (await import('../peer/peer')).Peer
const lazyWebPeerRuntime = async () => (await import('../peer/runtime')).WebPeerRuntime

const unconfiguredAdapter: ConfigAdapterWithWrite = {
  name: 'unconfigured',
  read: async () => ({}),
  write: async () => {
    throw new Error('[Config] Initialize a runtime-owned meta adapter before saving.')
  },
}

/**
 * Config store, includes metaConfig and peerConfig, managing their loading and saving.
 */
export const useConfigStore = defineStore('inkcre-config', () => {
  const metaAdapter = shallowRef<ConfigAdapterWithWrite>(unconfiguredAdapter)
  const metaConfig = ref<MetaConfig>(MetaConfigSchema.parse({}))
  const peerConfig = ref<PeerConfig>(PeerConfigSchema.parse({}))
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

  async function loadPeerConfig(): Promise<void> {
    if (!metaConfig.value.INKCRE_PGREST_URL || !metaConfig.value.INKCRE_JWT_SECRET) {
      peerConfig.value = PeerConfigSchema.parse({})
      return
    }

    const Peer = await lazyPeer()
    try {
      const loaded = await Peer.getSelf()
      peerConfig.value = PeerConfigSchema.parse(loaded.config)
    } catch {
      peerConfig.value = PeerConfigSchema.parse({})
      console.error('[Config] Failed to load Peer config.')
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

  async function connectAndSave(metaCandidate: MetaConfig, peerCandidate: PeerConfig) {
    error.value = null
    const nextMeta = MetaConfigSchema.parse(metaCandidate)
    const nextPeer = PeerConfigSchema.parse(peerCandidate)
    let candidateRuntime: InstanceType<Awaited<ReturnType<typeof lazyWebPeerRuntime>>> | null = null

    try {
      const WebPeerRuntime = await lazyWebPeerRuntime()
      const connection = await WebPeerRuntime.connect(nextMeta, nextPeer)
      candidateRuntime = connection.runtime
      await metaAdapter.value.write(nextMeta)
      metaConfig.value = nextMeta
      peerConfig.value = nextPeer
      return candidateRuntime
    } catch (err) {
      candidateRuntime?.stop()
      error.value = err as Error
      throw err
    }
  }

  async function resetMeta(): Promise<void> {
    const resetMetaConfig = MetaConfigSchema.parse({})
    const resetPeerConfig = PeerConfigSchema.parse({})
    error.value = null
    try {
      await metaAdapter.value.write(resetMetaConfig)
      metaConfig.value = resetMetaConfig
      peerConfig.value = resetPeerConfig
    } catch (err) {
      error.value = err as Error
      throw err
    }
  }

  return {
    metaConfig,
    peerConfig,
    metaAdapter,
    isLoading,
    error,
    initializeMeta,
    loadPeerConfig,
    connectAndSave,
    saveMeta,
    resetMeta,
  }
})

export const configStore = useConfigStore(store)
