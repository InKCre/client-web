import { afterEach, describe, expect, it, vi } from 'vitest'

import { StorageContentTooLargeError, HttpStorage } from './http'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function storage(maximumBytes: number): HttpStorage {
  return new HttpStorage({
    id: -1,
    type: 'http',
    config: { max_response_bytes: maximumBytes },
  })
}

describe('HttpStorage', () => {
  it('returns opaque response bytes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))))

    await expect(
      storage(3).getRawContent({ id: 1, storage: -1, content: 'https://example.test/file' })
    ).resolves.toEqual(new Uint8Array([1, 2, 3]))
  })

  it('enforces the configured response limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Length': '3' } })
        )
    )

    await expect(
      storage(2).getRawContent({ id: 1, storage: -1, content: 'https://example.test/file' })
    ).rejects.toBeInstanceOf(StorageContentTooLargeError)
  })
})
