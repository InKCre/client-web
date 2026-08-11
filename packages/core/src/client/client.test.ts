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
})
