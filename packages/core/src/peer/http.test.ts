import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authStore } from '../auth'
import { configStore } from '../config'
import { PEER_EXECUTION_HEADER, PeerOutcomeUnknown, PeerRequestNotExecuted } from './contracts'
import { PeerHTTPOutbound } from './http'
import { Peer } from './peer'

const peer = Peer.parse({
  id: '11111111-1111-4111-8111-111111111111',
  name: 'provider',
  labels: [],
  config: {},
  config_schema: {},
  capabilities: [],
  lease_expires_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

describe('PeerHTTPOutbound', () => {
  beforeEach(() => {
    configStore.peerConfig.peer_http_timeout_ms = 1000
    authStore.token.value = 'peer-token'
  })

  it('normalizes query, headers, auth, body, and JSON response', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ ok: true }, { status: 201, headers: { 'X-Provider': 'core-py' } })
    )
    const outbound = new PeerHTTPOutbound(
      peer,
      { method: 'post', url: 'https://peer.example.test/capability' },
      fetcher
    )

    const result = await outbound.execute({
      query: { tag: ['first', 'second'] },
      headers: { 'x-domain': ['semantic-retrieval'] },
      body: { query: 'knowledge graph' },
    })

    const [input, init] = fetcher.mock.calls[0]
    const url = new URL(String(input))
    const headers = new Headers(init?.headers)
    expect(url.searchParams.getAll('tag')).toEqual(['first', 'second'])
    expect(init?.method).toBe('POST')
    expect(headers.get('Authorization')).toBe('Bearer peer-token')
    expect(headers.get('X-Domain')).toBe('semantic-retrieval')
    expect(init?.body).toBe(JSON.stringify({ query: 'knowledge graph' }))
    expect(result).toEqual({
      status: 201,
      headers: { 'content-type': ['application/json'], 'x-provider': ['core-py'] },
      body: { ok: true },
    })
  })

  it('admits failover only after an explicit non-execution response', async () => {
    const outbound = new PeerHTTPOutbound(
      peer,
      { method: 'POST', url: 'https://peer.example.test/capability' },
      vi.fn(
        async () =>
          new Response(null, {
            status: 503,
            headers: { [PEER_EXECUTION_HEADER]: 'not-executed' },
          })
      )
    )

    await expect(outbound.execute({})).rejects.toBeInstanceOf(PeerRequestNotExecuted)
  })

  it('reports browser fetch rejection and response-read failure as outcome unknown', async () => {
    const rejected = new PeerHTTPOutbound(
      peer,
      { method: 'POST', url: 'https://peer.example.test/capability' },
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )
    await expect(rejected.execute({})).rejects.toBeInstanceOf(PeerOutcomeUnknown)

    const unreadable = new PeerHTTPOutbound(
      peer,
      { method: 'POST', url: 'https://peer.example.test/capability' },
      vi.fn(
        async () =>
          ({
            status: 200,
            headers: new Headers(),
            text: async () => {
              throw new TypeError('stream interrupted')
            },
          }) as unknown as Response
      )
    )
    await expect(unreadable.execute({})).rejects.toBeInstanceOf(PeerOutcomeUnknown)
  })
})
