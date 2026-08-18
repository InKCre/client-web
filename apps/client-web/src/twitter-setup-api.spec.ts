import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Cron,
  Peer,
  PeerManager,
  Source,
  SourceForm,
  type ExtensionStatePort,
  type InstalledExtension,
} from '@inkcre/core'
import {
  discoverCoreCandidates,
  OAuthTransactionSchema,
  TwitterBookmarkSetup,
  TwitterSetupAPI,
  TwitterSetupStatusSchema,
} from '../../../extensions/twitter/src/setup-api'

const corePeerId = '00000000-0000-4000-8000-000000000002'
const installed: InstalledExtension = {
  name: 'inkcre/twitter',
  version: '0.2.1',
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
      id: 'inkcre.twitter.setup.status.v1',
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
      },
    })

    await new TwitterSetupAPI(corePeer).status()

    expect(delegate).toHaveBeenCalledWith(
      'inkcre.twitter.setup.status.v1',
      { body: {} },
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

  it('composes bookmark Source, Cron, and initial Job through ordinary database models', async () => {
    const source = Source.parse({
      id: 25,
      type: 'extensions.twitter.bookmark.Source',
      nickname: 'Bookmarks',
      config: {},
      state: {},
      storage: null,
      block: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })
    const cron = Cron.parse({
      id: 9,
      schedule: '30 6 * * *',
      enabled: false,
      job_type: 'core.source.collect.v1',
      job_parameters: { source: 25, config: { full: false, result_limit: 40 } },
      job_timeout_seconds: null,
      last_job: null,
      last_scheduled_for: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })
    vi.spyOn(Source, 'getAll').mockResolvedValue([source])
    vi.spyOn(Cron, 'getBySource').mockResolvedValue([cron])
    vi.spyOn(SourceForm.prototype, 'create').mockResolvedValue(source)
    const update = vi
      .spyOn(Cron.prototype, 'update')
      .mockImplementation(async (form) =>
        Cron.parse({ ...cron, ...form, id: cron.id, enabled: form.enabled })
      )
    const runNow = vi.spyOn(Cron.prototype, 'runNow').mockResolvedValue({} as never)

    await expect(TwitterBookmarkSetup.read()).resolves.toMatchObject({ source, cron })
    await expect(TwitterBookmarkSetup.createSource('Bookmarks')).resolves.toBe(source)
    const scheduled = await TwitterBookmarkSetup.saveSchedule(source, 7, 15)
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({ schedule: '15 7 * * *', enabled: false })
    )
    await TwitterBookmarkSetup.finish(source, scheduled)
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    expect(runNow).toHaveBeenCalledOnce()
  })
})
