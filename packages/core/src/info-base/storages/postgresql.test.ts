import { afterEach, describe, expect, it, vi } from 'vitest'

import { authStore } from '../../auth'
import { configStore } from '../../config'
import { PostgreSQLBinaryStorage } from './postgresql'

const BLOB_ID = '00000000-0000-4000-8000-000000000017'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  configStore.metaConfig.INKCRE_PGREST_URL = ''
})

function storage(): PostgreSQLBinaryStorage {
  return new PostgreSQLBinaryStorage({
    id: -4,
    type: 'postgresql_binary',
    config: {},
  })
}

describe('PostgreSQLBinaryStorage', () => {
  it('uses raw RPC create/read and row-exact update/delete', async () => {
    configStore.metaConfig.INKCRE_PGREST_URL = 'https://database.example.test/'
    vi.spyOn(authStore, 'getToken').mockResolvedValue('peer-token')
    const requests: Array<{ url: URL; init: RequestInit }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: URL | RequestInfo, init: RequestInit = {}) => {
        const url = new URL(input.toString())
        requests.push({ url, init })
        if (url.pathname.endsWith('/rpc/create_storage_blob')) {
          return new Response(JSON.stringify(BLOB_ID), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (url.pathname.endsWith('/rpc/read_storage_blob')) {
          return new Response(new Uint8Array([7, 8, 9]), {
            headers: { 'Content-Type': 'application/octet-stream' },
          })
        }
        if (init.method === 'PATCH' || init.method === 'DELETE') {
          return new Response(JSON.stringify([{ id: BLOB_ID }]), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw new Error(`unexpected request: ${init.method} ${url}`)
      })
    )
    const handler = storage()

    const pointer = await handler.createRawContent(new Uint8Array([1, 2]))
    expect(pointer).toBe(`{"blob_id":"${BLOB_ID}"}`)
    await expect(handler.getRawContent({ id: 17, storage: -4, content: pointer })).resolves.toEqual(
      new Uint8Array([7, 8, 9])
    )
    await expect(handler.updateRawContent(pointer, new Uint8Array([10, 255]))).resolves.toBe(true)
    await expect(handler.deleteRawContent(pointer)).resolves.toBe(true)

    expect(requests).toHaveLength(4)
    expect(new Headers(requests[0].init.headers).get('Content-Type')).toBe(
      'application/octet-stream'
    )
    expect(new Headers(requests[0].init.headers).get('Authorization')).toBe('Bearer peer-token')
    expect(new Headers(requests[1].init.headers).get('Accept')).toBe('application/octet-stream')
    expect(requests[2].url.searchParams.get('id')).toBe(`eq.${BLOB_ID}`)
    expect(requests[2].init.body).toBe(JSON.stringify({ data: '\\x0aff' }))
    expect(requests[3].url.searchParams.get('id')).toBe(`eq.${BLOB_ID}`)
  })
})
