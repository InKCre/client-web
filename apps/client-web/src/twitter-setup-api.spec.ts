import { afterEach, describe, expect, it, vi } from 'vitest'
import { Peer, PeerManager, type ExtensionStatePort, type InstalledExtension } from '@inkcre/core'
import {
  discoverCoreCandidates,
  OAuthTransactionSchema,
  TwitterSetupAPI,
  TwitterSetupStatusSchema,
} from '../../../extensions/twitter/src/setup-api'

const corePeerId = '00000000-0000-4000-8000-000000000002'
const installed: InstalledExtension = {
  name: 'inkcre/twitter',
  version: '0.2.0',
  enabled: [corePeerId],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}
const corePeer = Peer.parse({
  id: corePeerId,
  name: 'Core Preview',
  labels: [],
  config: {},
  config_schema: {},
  capabilities: [
    {
      id: 'core.extension.management.v1',
      inbound: { protocol: 'core.peer.protocol.http.v1', parameters: {} },
    },
    {
      id: 'inkcre.twitter.setup.v1',
      inbound: { protocol: 'core.peer.protocol.http.v1', parameters: {} },
    },
  ],
  lease_expires_at: new Date('2099-01-01'),
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
})

describe('Twitter Peer setup API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('discovers setup against one shared installation and live capability snapshots', async () => {
    vi.spyOn(PeerManager, 'listLive').mockResolvedValue([corePeer])
    const get = vi.fn(async () => installed)

    await expect(
      discoverCoreCandidates(undefined, { get } as unknown as ExtensionStatePort)
    ).resolves.toEqual([
      expect.objectContaining({
        peer: corePeer,
        extension: installed,
        enabled: true,
        setupAvailable: true,
      }),
    ])
    expect(get).toHaveBeenCalledWith('inkcre/twitter')
  })

  it('executes setup only through the exact selected Core Peer capability', async () => {
    const delegate = vi.spyOn(PeerManager, 'delegate').mockResolvedValue({
      status: 200,
      body: {
        backend: 'oauth2',
        callback_url: 'https://core.example/twitter/oauth/callback',
        oauth_app_configured: false,
        client_id: null,
        connected: false,
        user_id: null,
        handle: null,
        scopes: [],
        reconnect_required: false,
        bookmark_source_id: null,
        bookmark_cron_id: null,
        bookmark_sources: [],
        collect_at: { day_of_week: null, hour: 0, minute: 0 },
        bookmark_source_ready: false,
        ready: false,
      },
    })

    await new TwitterSetupAPI(corePeer).status()

    expect(delegate).toHaveBeenCalledWith(
      'inkcre.twitter.setup.v1',
      { body: { action: 'get_status' } },
      corePeerId
    )
  })

  it('rejects non-HTTP callback and non-HTTPS authorization URLs from a Peer', () => {
    expect(() =>
      TwitterSetupStatusSchema.parse({
        backend: 'oauth2',
        callback_url: 'javascript:alert(1)',
        oauth_app_configured: false,
        client_id: null,
        connected: false,
        user_id: null,
        handle: null,
        scopes: [],
        reconnect_required: false,
        bookmark_source_id: null,
        bookmark_cron_id: null,
        bookmark_sources: [],
        collect_at: { day_of_week: null, hour: 0, minute: 0 },
        bookmark_source_ready: false,
        ready: false,
      })
    ).toThrow('HTTP or HTTPS')
    expect(() =>
      OAuthTransactionSchema.parse({
        id: '00000000-0000-4000-8000-000000000003',
        status: 'pending',
        authorize_url: 'javascript:alert(1)',
        expires_at: '2099-01-01T00:00:00Z',
        error: null,
      })
    ).toThrow('HTTPS')
    expect(() =>
      OAuthTransactionSchema.parse({
        id: '00000000-0000-4000-8000-000000000004',
        status: 'pending',
        authorize_url: 'https://user:secret@x.example/authorize',
        expires_at: '2099-01-01T00:00:00Z',
        error: null,
      })
    ).toThrow('embedded credentials')
  })
})
