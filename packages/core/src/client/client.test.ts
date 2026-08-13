import { afterEach, describe, expect, it, vi } from 'vitest'

import { authStore } from '../auth'
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
