import { afterEach, describe, expect, it, vi } from 'vitest'

import { authStore } from '../auth'
import { Client } from './client'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Client.request', () => {
  it('accepts a successful empty Core API response', async () => {
    vi.spyOn(authStore, 'getToken').mockResolvedValue('test-token')
    const fetch = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    const client = Client.parse({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Core',
      rest_api_url: 'https://core.example',
    })

    await expect(
      client.request({ method: 'DELETE', path: '/extension-installations/inkcre/twitter' })
    ).resolves.toBeUndefined()

    expect(fetch).toHaveBeenCalledOnce()
  })
})
