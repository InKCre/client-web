import { afterEach, describe, expect, it, vi } from 'vitest'

import { Client } from '../client'
import type { ConfigAdapterWithWrite } from './types'
import { configStore } from './store'

const clientId = '00000000-0000-4000-8000-000000000002'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('connected configuration save', () => {
  it('does not query the database before its bootstrap settings exist', async () => {
    const adapter: ConfigAdapterWithWrite = {
      name: 'test',
      read: async () => ({}),
      write: vi.fn(),
    }
    await configStore.initializeMeta(adapter)
    const getSelf = vi.spyOn(Client, 'getSelf')

    await configStore.loadClientConfig()

    expect(getSelf).not.toHaveBeenCalled()
    expect(configStore.clientConfig.extension_registry_url).toBe('')
  })

  it('does not persist or activate MetaConfig when database validation fails', async () => {
    const write = vi.fn()
    const adapter: ConfigAdapterWithWrite = {
      name: 'test',
      read: async () => ({
        INKCRE_PGREST_URL: 'https://old.example.test/',
        INKCRE_JWT_SECRET: 'old-secret',
        client_id: clientId,
      }),
      write,
    }
    await configStore.initializeMeta(adapter)
    vi.spyOn(Client, 'connect').mockRejectedValue(new Error('database unavailable'))

    await expect(
      configStore.connectAndSave(
        {
          INKCRE_PGREST_URL: 'https://new.example.test/',
          INKCRE_JWT_SECRET: 'new-secret',
          client_id: clientId,
        },
        { ...configStore.clientConfig }
      )
    ).rejects.toThrow('database unavailable')

    expect(write).not.toHaveBeenCalled()
    expect(configStore.metaConfig.INKCRE_PGREST_URL).toBe('https://old.example.test/')
  })

  it('persists MetaConfig only after the browser Client is registered', async () => {
    const events: string[] = []
    const write = vi.fn(async () => {
      events.push('write')
    })
    const adapter: ConfigAdapterWithWrite = {
      name: 'test',
      read: async () => ({}),
      write,
    }
    await configStore.initializeMeta(adapter)
    vi.spyOn(Client, 'connect').mockImplementation(async () => {
      events.push('connect')
      return Client.parse({ id: clientId, name: 'client-web' })
    })

    await configStore.connectAndSave(
      {
        INKCRE_PGREST_URL: 'https://database.example.test/',
        INKCRE_JWT_SECRET: 'test-secret',
        client_id: clientId,
      },
      { ...configStore.clientConfig, extension_registry_url: 'https://registry.inkcre.dev/' }
    )

    expect(events).toEqual(['connect', 'write'])
    expect(configStore.metaConfig.client_id).toBe(clientId)
    expect(configStore.clientConfig.extension_registry_url).toBe('https://registry.inkcre.dev/')
  })
})
