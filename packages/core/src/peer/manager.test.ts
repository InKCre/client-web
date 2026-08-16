import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configStore } from '../config'
import {
  CapabilityDelegationUnavailable,
  PeerRequestNotExecuted,
  type JsonValue,
} from './contracts'
import { PeerManager } from './manager'
import { Peer } from './peer'

const currentPeer = '00000000-0000-4000-8000-000000000001'
const providerPeer = '11111111-1111-4111-8111-111111111111'
const capability = 'test.semantic.v1'
const protocol = 'test.peer.protocol.v1'

function peerRow(capabilities: unknown[]) {
  return {
    id: providerPeer,
    name: 'provider',
    labels: [],
    config: {},
    config_schema: {},
    capabilities,
    lease_expires_at: '2099-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

function queryReturning(rows: unknown[]) {
  const result = { data: rows, error: null, status: 200 }
  const query = Promise.resolve(result) as Promise<typeof result> & {
    select: ReturnType<typeof vi.fn>
    gt: ReturnType<typeof vi.fn>
    neq: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
  }
  query.select = vi.fn(() => query)
  query.gt = vi.fn(() => query)
  query.neq = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  return query
}

describe('PeerManager', () => {
  beforeEach(() => {
    configStore.metaConfig.INKCRE_PEER_ID = currentPeer
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps builtin outbound setup idempotent', () => {
    expect(() => {
      PeerManager.setupBuiltinOutbounds()
      PeerManager.setupBuiltinOutbounds()
    }).not.toThrow()
  })

  it('delegates an unchanged payload to the exact selected Peer', async () => {
    const query = queryReturning([
      peerRow([
        {
          id: capability,
          inbound: { protocol, parameters: { channel: 'test' } },
        },
      ]),
    ])
    vi.spyOn(Peer.dbApi, 'from').mockReturnValue(query as never)
    let executed: JsonValue | undefined
    PeerManager.registerOutbound(protocol, (peer, parameters) => {
      expect(peer.id).toBe(providerPeer)
      expect(parameters).toEqual({ channel: 'test' })
      return {
        execute: async (payload) => {
          executed = payload
          return { status: 204 }
        },
      }
    })

    const payload = { body: { block: 42 } }
    await expect(PeerManager.delegate(capability, payload, providerPeer)).resolves.toEqual({
      status: 204,
    })
    expect(executed).toEqual(payload)
    expect(query.eq).toHaveBeenCalledWith('id', providerPeer)
  })

  it('does not substitute another Peer after exact-target non-execution', async () => {
    const noExecutionProtocol = 'test.peer.protocol.non-execution.v1'
    const query = queryReturning([
      peerRow([
        {
          id: capability,
          inbound: { protocol: noExecutionProtocol, parameters: {} },
        },
      ]),
    ])
    vi.spyOn(Peer.dbApi, 'from').mockReturnValue(query as never)
    PeerManager.registerOutbound(noExecutionProtocol, () => ({
      execute: async () => {
        throw new PeerRequestNotExecuted('not executed')
      },
    }))

    await expect(PeerManager.delegate(capability, {}, providerPeer)).rejects.toBeInstanceOf(
      CapabilityDelegationUnavailable
    )
  })

  it('skips malformed persisted capability snapshots at use time', async () => {
    const query = queryReturning([peerRow([{ id: capability, inbound: null }])])
    vi.spyOn(Peer.dbApi, 'from').mockReturnValue(query as never)

    await expect(PeerManager.delegate(capability, {})).rejects.toBeInstanceOf(
      CapabilityDelegationUnavailable
    )
  })
})
