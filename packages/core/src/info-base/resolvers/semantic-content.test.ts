import { afterEach, describe, expect, it, vi } from 'vitest'

import { Block } from '../block'
import { Resolver } from './base'
import { HtmlResolver } from './html'
import { ImageResolver } from './image'
import { TextResolver } from './text'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function block(resolver: string): Block {
  return Block.parse({ id: 41, storage: -4, resolver, content: 'opaque-pointer' })
}

describe('semantic content resolvers', () => {
  it('decodes storage-backed text strictly and preserves authored empty text', async () => {
    const stored = block(TextResolver.type)
    vi.spyOn(stored, 'getHydratedContent').mockResolvedValue(
      new TextEncoder().encode('storage text')
    )

    await expect(new TextResolver(stored).getSolvedContent()).resolves.toBe('storage text')
    const empty = Block.parse({ id: 42, storage: null, resolver: TextResolver.type, content: '' })
    await expect(new TextResolver(empty).getText()).resolves.toBe('')
  })

  it('decodes HTML source and derives text without rendering markup', async () => {
    const source = block(HtmlResolver.type)
    vi.spyOn(source, 'getHydratedContent').mockResolvedValue(
      new TextEncoder().encode('<main>Semantic <strong>content</strong></main>')
    )
    const resolver = new HtmlResolver(source)

    await expect(resolver.getSolvedContent()).resolves.toContain('<strong>content</strong>')
    await expect(resolver.getText()).resolves.toContain('Semantic content')
  })

  it('owns and revokes object URLs on refresh and disposal', async () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const source = block(ImageResolver.type)
    vi.spyOn(source, 'getHydratedContent')
      .mockResolvedValueOnce(new Uint8Array([1]))
      .mockResolvedValueOnce(new Uint8Array([2]))
    const resolver = new ImageResolver(source)

    await expect(resolver.getSolvedContent()).resolves.toMatchObject({
      byte_size: 1,
      detected_media_type: null,
      objectUrl: 'blob:first',
    })
    await expect(resolver.getSolvedContent({ refresh: true })).resolves.toMatchObject({
      byte_size: 1,
      objectUrl: 'blob:second',
    })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')

    await resolver.dispose()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second')
  })

  it('disposes cached resolver handles when cache entries are evicted', async () => {
    const { ResolverCache } = await import('./cache')
    const dispose = vi.spyOn(ImageResolver.prototype, 'dispose')
    Resolver.register(ImageResolver.type, ImageResolver)
    const source = block(ImageResolver.type)

    await ResolverCache.getResolver(source)
    ResolverCache.invalidate(source.id)

    expect(dispose).toHaveBeenCalledOnce()
    ResolverCache.clear()
  })
})
