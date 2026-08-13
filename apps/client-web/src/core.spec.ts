import { describe, expect, it, vi } from 'vitest'
import { configStore, type ExtensionStatePort } from '@inkcre/core'
import {
  initializeExtensionHost,
  shouldLoadClientConfigAtBootstrap,
  startExtensionHost,
} from './core'

describe('client configuration bootstrap', () => {
  it('keeps Settings reachable without contacting a configured Peer', () => {
    expect(shouldLoadClientConfigAtBootstrap('/settings')).toBe(false)
    expect(shouldLoadClientConfigAtBootstrap('/settings/')).toBe(false)
  })

  it('loads deployment configuration before ordinary application routes', () => {
    expect(shouldLoadClientConfigAtBootstrap('/')).toBe(true)
    expect(shouldLoadClientConfigAtBootstrap('/extensions')).toBe(true)
  })
})

describe('Extension Host bootstrap', () => {
  it('shares the initial runtime restore with the Extension management view', async () => {
    const previousPeerId = configStore.metaConfig.INKCRE_CLIENT_ID
    configStore.metaConfig.INKCRE_CLIENT_ID = '00000000-0000-4000-8000-000000000002'
    const list = vi.fn().mockResolvedValue([])
    const unused = vi.fn(() => {
      throw new Error('not used')
    })
    initializeExtensionHost({
      list,
      get: unused,
      install: unused,
      updateConfig: unused,
      changeVersion: unused,
      setPeerEnabled: unused,
      uninstall: unused,
    } satisfies ExtensionStatePort)

    try {
      const appStartup = startExtensionHost()
      const viewStartup = startExtensionHost()

      expect(viewStartup).toBe(appStartup)
      await viewStartup
      expect(list).toHaveBeenCalledOnce()
    } finally {
      configStore.metaConfig.INKCRE_CLIENT_ID = previousPeerId
    }
  })
})
