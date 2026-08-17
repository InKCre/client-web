import { afterEach, describe, expect, test, vi } from 'vitest'
import { configStore } from '../config'
import { DBAPIClient } from './db-api'

describe('DBAPIClient reactive transport', () => {
  afterEach(() => {
    configStore.metaConfig.INKCRE_PGREST_URL = ''
    vi.unstubAllGlobals()
  })

  test('uses a newly configured PostgREST URL immediately', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetch)
    configStore.metaConfig.INKCRE_PGREST_URL = ''
    const database = new DBAPIClient('peers', undefined, 'inkcre', '', async () => 'test-token')

    configStore.metaConfig.INKCRE_PGREST_URL = 'https://database.example.test///'
    const response = await database.from().select('id')

    expect(response.error).toBeNull()
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'https://database.example.test/peers?select=id'
    )
  })
})
