import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebPeerRuntime } from '../peer'
import { configStore } from './store'
import type { ConfigAdapterWithWrite } from './types'

const previousPeerId = '00000000-0000-4000-8000-000000000001'
const nextPeerId = '00000000-0000-4000-8000-000000000002'

function adapter() {
  const write = vi.fn(async () => undefined)
  const value: ConfigAdapterWithWrite = {
    name: 'test',
    read: async () => ({
      INKCRE_PGREST_URL: 'https://old-database.example',
      INKCRE_JWT_SECRET: 'old-secret',
      INKCRE_PEER_ID: previousPeerId,
    }),
    write,
  }
  return { value, write }
}

describe('Config connection transaction', () => {
  afterEach(() => vi.restoreAllMocks())

  it('does not replace working browser bootstrap when database validation fails', async () => {
    const storage = adapter()
    await configStore.initializeMeta(storage.value)
    vi.spyOn(WebPeerRuntime, 'connect').mockRejectedValue(new Error('wrong database'))

    await expect(
      configStore.connectAndSave(
        {
          INKCRE_PGREST_URL: 'https://new-database.example',
          INKCRE_JWT_SECRET: 'new-secret',
          INKCRE_PEER_ID: nextPeerId,
        },
        { ...configStore.peerConfig, extension_registry_url: 'https://registry.inkcre.dev' }
      )
    ).rejects.toThrow('wrong database')

    expect(storage.write).not.toHaveBeenCalled()
    expect(configStore.metaConfig.INKCRE_PEER_ID).toBe(previousPeerId)
  })

  it('persists bootstrap only after registration, config write, and lease validation succeed', async () => {
    const storage = adapter()
    await configStore.initializeMeta(storage.value)
    const runtime = { stop: vi.fn() }
    const connect = vi.spyOn(WebPeerRuntime, 'connect').mockResolvedValue({
      peer: {} as never,
      runtime: runtime as never,
    })
    const peerConfig = {
      ...configStore.peerConfig,
      extension_registry_url: 'https://registry.inkcre.dev',
    }
    const metaConfig = {
      INKCRE_PGREST_URL: 'https://new-database.example',
      INKCRE_JWT_SECRET: 'new-secret',
      INKCRE_PEER_ID: nextPeerId,
    }

    await expect(configStore.connectAndSave(metaConfig, peerConfig)).resolves.toBe(runtime)

    expect(connect).toHaveBeenCalledWith(metaConfig, peerConfig)
    expect(storage.write).toHaveBeenCalledWith(metaConfig)
    expect(configStore.metaConfig).toEqual(metaConfig)
    expect(configStore.peerConfig.extension_registry_url).toBe('https://registry.inkcre.dev')
  })

  it('keeps the current bootstrap when reset persistence fails', async () => {
    const storage = adapter()
    await configStore.initializeMeta(storage.value)
    storage.write.mockRejectedValueOnce(new Error('storage unavailable'))

    await expect(configStore.resetMeta()).rejects.toThrow('storage unavailable')

    expect(configStore.metaConfig.INKCRE_PEER_ID).toBe(previousPeerId)
    expect(configStore.metaConfig.INKCRE_PGREST_URL).toBe('https://old-database.example')
  })
})
