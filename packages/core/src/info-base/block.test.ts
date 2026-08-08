import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { authStore } from '../auth'
import { configStore } from '../config'
import { Block } from './block'
import { Storage } from './storages/base'

function storedBlock(): Block {
  return Block.parse({
    id: 17,
    storage: -4,
    resolver: 'core.file.v1',
    content: '{"blob_id":"00000000-0000-0000-0000-000000000017"}',
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  configStore.metaConfig.INKCRE_PGREST_URL = ''
  authStore.token.value = undefined
})

describe('Block database access', () => {
  it('normalizes a runtime PostgREST base URL before relation requests', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json([])
    )
    vi.stubGlobal('fetch', fetcher)
    authStore.token.value = 'peer-token'
    configStore.metaConfig.INKCRE_PGREST_URL = 'http://database.example.test///'
    await nextTick()

    await expect(Block.getAll()).resolves.toEqual([])

    expect(String(fetcher.mock.calls[0][0])).toBe('http://database.example.test/blocks?select=*')
  })
})

describe('Block hydration', () => {
  it('returns inline authored content without a storage lookup', async () => {
    const lookup = vi.spyOn(Storage, 'get')
    const block = Block.parse({
      id: 1,
      storage: null,
      resolver: 'core.text.v1',
      content: 'authored',
    })

    await expect(block.getHydratedContent()).resolves.toBe('authored')
    expect(lookup).not.toHaveBeenCalled()
  })

  it('caches one instance snapshot and replaces it on refresh', async () => {
    const getRawContent = vi
      .fn()
      .mockResolvedValueOnce(new Uint8Array([1, 2]))
      .mockResolvedValueOnce(new Uint8Array([3, 4]))
    vi.spyOn(Storage, 'get').mockResolvedValue({
      type: 'postgresql_binary',
      getRawContent,
    } as unknown as Storage<Uint8Array>)
    const block = storedBlock()

    await expect(block.getHydratedContent()).resolves.toEqual(new Uint8Array([1, 2]))
    await expect(block.getHydratedContent()).resolves.toEqual(new Uint8Array([1, 2]))
    expect(getRawContent).toHaveBeenCalledTimes(1)
    await expect(block.getHydratedContent({ refresh: true })).resolves.toEqual(
      new Uint8Array([3, 4])
    )
    expect(getRawContent).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(block)).not.toContain('hydratedContent')
  })
})
