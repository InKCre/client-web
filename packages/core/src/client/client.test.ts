import { afterEach, describe, expect, it, vi } from 'vitest'

import { authStore } from '../auth'
import { ClientConfigSchema, MetaConfigSchema } from '../config'
import { Client } from './client'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Client.request', () => {
  it('normalizes a trailing REST API slash and accepts a successful empty response', async () => {
    vi.spyOn(authStore, 'getToken').mockResolvedValue('test-token')
    const fetch = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Core',
      rest_api_url: 'https://core.example/',
    })

    await expect(
      client.request({ method: 'DELETE', path: '/documents/example' })
    ).resolves.toBeUndefined()

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(
      new URL('https://core.example/documents/example'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('preserves a REST API path prefix and joins a relative path with query parameters', async () => {
    vi.spyOn(authStore, 'getToken').mockResolvedValue('test-token')
    const fetch = vi.fn(async () => Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetch)
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Core',
      rest_api_url: 'https://core.example/api/',
    })

    await expect(
      client.request({
        method: 'GET',
        path: 'documents',
        query: { peer: 'web' },
      })
    ).resolves.toEqual({ ok: true })

    expect(fetch).toHaveBeenCalledWith(
      new URL('https://core.example/api/documents?peer=web'),
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('preserves JSON headers, body, and AbortSignal across one 401 refresh retry', async () => {
    vi.spyOn(authStore, 'getToken')
      .mockResolvedValueOnce('expired-token')
      .mockResolvedValueOnce('fresh-token')
    vi.spyOn(authStore, 'refreshToken').mockResolvedValue('fresh-token')
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetch)
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Core',
      rest_api_url: 'https://core.example/',
    })
    const controller = new AbortController()

    await expect(
      client.request({
        method: 'PUT',
        path: '/twitter/setup/oauth-app',
        body: { client_id: 'client', client_secret: 'secret' },
        signal: controller.signal,
      })
    ).resolves.toEqual({ ok: true })

    const retry = fetch.mock.calls[1]?.[1] as RequestInit
    expect(retry.method).toBe('PUT')
    expect(retry.body).toBe(JSON.stringify({ client_id: 'client', client_secret: 'secret' }))
    expect(retry.signal).toBe(controller.signal)
    expect(retry.headers).toMatchObject({
      Authorization: 'Bearer fresh-token',
      'Content-Type': 'application/json',
    })
  })

  it('uses a bounded string FastAPI detail as the API error message', async () => {
    vi.spyOn(authStore, 'getToken').mockResolvedValue('test-token')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ detail: 'Connect a Twitter account first' }, { status: 409 })
      )
    )
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Core',
      rest_api_url: 'https://core.example/',
    })

    await expect(client.get('/twitter/setup')).rejects.toThrow('Connect a Twitter account first')
  })
})

describe('Client.connect', () => {
  it('validates the candidate database before registering a missing browser Client', async () => {
    const clientId = '00000000-0000-4000-8000-000000000002'
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'GET') {
        return Response.json([], {
          headers: { 'Content-Range': '*/0' },
        })
      }
      if (init?.method === 'POST') {
        return Response.json(
          {
            id: clientId,
            name: 'client-web',
            labels: ['web'],
            rest_api_url: null,
            config: { extension_registry_url: 'https://registry.inkcre.dev/' },
            config_schema: {},
            created_at: '2026-08-14T00:00:00Z',
          },
          { status: 201 }
        )
      }
      return Response.json({ message: 'unexpected request' }, { status: 500 })
    })
    vi.stubGlobal('fetch', fetch)

    const connected = await Client.connect(
      MetaConfigSchema.parse({
        INKCRE_PGREST_URL: 'https://database.example.test/',
        INKCRE_JWT_SECRET: 'test-secret',
        client_id: clientId,
      }),
      ClientConfigSchema.parse({
        extension_registry_url: 'https://registry.inkcre.dev/',
      })
    )

    expect(connected.id).toBe(clientId)
    expect(fetch).toHaveBeenCalledTimes(2)
    const registration = fetch.mock.calls[1]?.[1]
    expect(registration?.method).toBe('POST')
    expect(JSON.parse(String(registration?.body))).toMatchObject({
      id: clientId,
      name: 'client-web',
      labels: ['web'],
      config: { extension_registry_url: 'https://registry.inkcre.dev/' },
    })
  })

  it('surfaces a candidate database authentication failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ code: 'PGRST301', message: 'JWT verification failed' }, { status: 401 })
      )
    )

    await expect(
      Client.connect(
        MetaConfigSchema.parse({
          INKCRE_PGREST_URL: 'https://database.example.test/',
          INKCRE_JWT_SECRET: 'wrong-secret',
        }),
        ClientConfigSchema.parse({})
      )
    ).rejects.toThrow('Client database connection failed: JWT verification failed')
  })
})
