import { afterEach, describe, expect, it, vi } from 'vitest'
import { PeerConfigSchema } from '../config'
import { WEB_PEER_LEASE_RENEW_INTERVAL_MS, WebPeerRuntime } from './runtime'

const peerId = '00000000-0000-4000-8000-000000000001'

function peerRow(config: Record<string, unknown> = {}) {
  return {
    id: peerId,
    name: 'Client Web',
    labels: ['owner-label'],
    config,
    config_schema: {},
    capabilities: [],
    lease_expires_at: '2099-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

function database() {
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    void name
    void args
    return { data: '2099-01-01T00:00:00Z', error: null }
  })
  const single = vi.fn(async () => ({ data: peerRow(PeerConfigSchema.parse({})), error: null }))
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => ({ select }))
  const update = vi.fn((payload: Record<string, unknown>) => {
    void payload
    return { eq }
  })
  const upsert = vi.fn((payload: Record<string, unknown>) => {
    void payload
    return { select }
  })
  return { rpc, update, upsert, eq, select, single }
}

describe('WebPeerRuntime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('upserts only runtime-owned fields and preserves owner-managed labels and config', async () => {
    const db = database()
    const runtime = new WebPeerRuntime(peerId, db as never)

    await expect(runtime.register()).resolves.toMatchObject({
      id: peerId,
      labels: ['owner-label'],
      config: {},
    })
    expect(db.upsert).toHaveBeenCalledWith({
      id: peerId,
      name: 'Client Web',
      config_schema: expect.any(Object),
      capabilities: [],
    })
    expect(Object.keys(db.upsert.mock.calls[0]?.[0] ?? {})).toEqual([
      'id',
      'name',
      'config_schema',
      'capabilities',
    ])
  })

  it('renews one registered Peer lease and stops browser-owned renewal cleanly', async () => {
    vi.useFakeTimers()
    const db = database()
    const runtime = new WebPeerRuntime(peerId, db as never)

    await runtime.start()
    expect(db.rpc.mock.calls.map(([name]) => name)).toEqual(['renew_peer_lease'])

    await vi.advanceTimersByTimeAsync(WEB_PEER_LEASE_RENEW_INTERVAL_MS)
    expect(db.rpc.mock.calls.map(([name]) => name)).toEqual([
      'renew_peer_lease',
      'renew_peer_lease',
    ])

    runtime.stop()
    await vi.advanceTimersByTimeAsync(WEB_PEER_LEASE_RENEW_INTERVAL_MS)
    expect(db.rpc).toHaveBeenCalledTimes(2)
    expect(db.rpc).toHaveBeenNthCalledWith(1, 'renew_peer_lease', {
      peer: peerId,
      ttl_seconds: 90,
    })
  })

  it('writes only the owner-managed Peer config field', async () => {
    const db = database()
    const runtime = new WebPeerRuntime(peerId, db as never)
    const config = PeerConfigSchema.parse({
      extension_registry_url: 'https://registry.operator.example',
    })

    await runtime.saveConfig(config)

    expect(db.update).toHaveBeenCalledWith({ config })
    expect(db.eq).toHaveBeenCalledWith('id', peerId)
  })
})
