import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Peer,
  PeerManager,
  type ExtensionStatePort,
  type InstalledExtension,
  type WebExtensionHost,
} from '@inkcre/core'
import {
  EXTENSION_MANAGEMENT_CAPABILITY,
  extensionPeerControlMode,
  setExtensionPeerEnabled,
} from './extension-peer-control'

const currentPeerId = '00000000-0000-4000-8000-000000000001'
const remotePeerId = '00000000-0000-4000-8000-000000000002'
const installed: InstalledExtension = {
  name: 'inkcre/twitter',
  version: '0.2.0',
  enabled: [],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}

function peer(id: string, options: { live?: boolean; management?: boolean } = {}): Peer {
  return Peer.parse({
    id,
    name: 'Client',
    labels: [],
    config: {},
    config_schema: {},
    capabilities: options.management
      ? [
          {
            id: EXTENSION_MANAGEMENT_CAPABILITY,
            inbound: { protocol: 'core.peer.protocol.http.v1', parameters: {} },
          },
        ]
      : [],
    lease_expires_at: options.live === false ? new Date(0) : new Date('2099-01-01'),
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  })
}

describe('Extension Peer control', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses the local Web Host for this browser Client', async () => {
    const enable = vi.fn(async () => ({ ...installed, enabled: [currentPeerId] }))
    const state = { setPeerEnabled: vi.fn() }

    await expect(
      setExtensionPeerEnabled({
        name: installed.name,
        peer: peer(currentPeerId),
        currentPeerId,
        enabled: true,
        webHost: { enable } as never,
        state: state as never,
      })
    ).resolves.toMatchObject({ enabled: [currentPeerId] })
    expect(enable).toHaveBeenCalledWith(installed.name)
    expect(state.setPeerEnabled).not.toHaveBeenCalled()
  })

  it('delegates to an exact live Client that advertises runtime management', async () => {
    const delegate = vi.spyOn(PeerManager, 'delegate').mockResolvedValue({
      status: 200,
      body: { ...installed, enabled: [remotePeerId] },
    } as never)

    await setExtensionPeerEnabled({
      name: installed.name,
      peer: peer(remotePeerId, { management: true }),
      currentPeerId,
      enabled: true,
      webHost: {} as WebExtensionHost,
      state: {} as ExtensionStatePort,
    })

    expect(delegate).toHaveBeenCalledWith(
      EXTENSION_MANAGEMENT_CAPABILITY,
      { body: { action: 'enable', extension: installed.name } },
      remotePeerId
    )
  })

  it('updates durable desired state for any Client without a live management endpoint', async () => {
    const target = peer(remotePeerId, { live: false })
    const setPeerEnabled = vi.fn(async () => ({ ...installed, enabled: [remotePeerId] }))

    expect(extensionPeerControlMode(target, currentPeerId)).toBe('desired-state')
    await setExtensionPeerEnabled({
      name: installed.name,
      peer: target,
      currentPeerId,
      enabled: true,
      webHost: {} as WebExtensionHost,
      state: { setPeerEnabled } as unknown as ExtensionStatePort,
    })

    expect(setPeerEnabled).toHaveBeenCalledWith(installed.name, remotePeerId, true)
  })
})
