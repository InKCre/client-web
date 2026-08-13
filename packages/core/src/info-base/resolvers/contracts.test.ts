import { describe, expect, it } from 'vitest'

import { Block } from '../block'
import { Resolver } from './base'
import {
  CORE_RESOLVER_IDS,
  DuplicateResolverRegistrationError,
  type ProjectionOptions,
  UnknownResolverError,
  UnsupportedResolverCapability,
} from './contracts'
import { ImageResolver } from './image'
import { registerCoreResolvers } from './index'

class ProjectionResolver extends Resolver<string, string> {
  static readonly type = 'tests.resolver.projection.v1'

  async getText(options: ProjectionOptions = {}): Promise<string | null> {
    const content = await this.getSolvedContent(options)
    return content === 'supported-null' ? null : content
  }
}

function block(content: string, resolver = ProjectionResolver.type): Block {
  return Block.parse({ id: 17, storage: null, resolver, content })
}

describe('resolver contracts', () => {
  it('uses exact lookup, idempotent registration, and collision rejection', () => {
    Resolver.register(ProjectionResolver.type, ProjectionResolver)
    expect(() => Resolver.register(ProjectionResolver.type, ProjectionResolver)).not.toThrow()
    expect(Resolver.getClass(ProjectionResolver.type)).toBe(ProjectionResolver)

    class CollisionResolver extends ProjectionResolver {}
    Object.defineProperty(CollisionResolver, 'type', { value: ProjectionResolver.type })
    expect(() => Resolver.register(ProjectionResolver.type, CollisionResolver)).toThrow(
      DuplicateResolverRegistrationError
    )
    expect(() => Resolver.getClass('tests.resolver.unknown.v1')).toThrow(UnknownResolverError)
  })

  it('distinguishes supported-null, authored-empty, and unsupported', async () => {
    await expect(new ProjectionResolver(block('supported-null')).getText()).resolves.toBeNull()
    await expect(new ProjectionResolver(block('')).getText()).resolves.toBe('')
    await expect(
      new ImageResolver(block('inline', ImageResolver.type)).getText()
    ).rejects.toBeInstanceOf(UnsupportedResolverCapability)
  })

  it('replaces the resolver snapshot only when refresh is explicit', async () => {
    const source = block('first')
    const resolver = new ProjectionResolver(source)

    await expect(resolver.getSolvedContent()).resolves.toBe('first')
    source.content = 'second'
    await expect(resolver.getSolvedContent()).resolves.toBe('first')
    await expect(resolver.getSolvedContent({ refresh: true })).resolves.toBe('second')
  })

  it('registers exactly the nine versioned core IDs', () => {
    registerCoreResolvers()

    for (const resolverId of CORE_RESOLVER_IDS) {
      expect(Resolver.getClass(resolverId).type).toBe(resolverId)
    }
    for (const retiredId of ['text', 'html', 'image', 'video']) {
      expect(() => Resolver.getClass(retiredId)).toThrow(UnknownResolverError)
    }
  })

  it('matches normalized specific media types without choosing file fallback', () => {
    registerCoreResolvers()

    expect(Resolver.matchMediaType('IMAGE/PNG; charset=ignored')).toBe('core.image.v1')
    expect(Resolver.matchMediaType('application/pdf')).toBe('core.pdf.v1')
    expect(Resolver.matchMediaType('application/octet-stream')).toBeNull()
    expect(Resolver.matchMediaType('application/vnd.example.unknown')).toBeNull()
  })
})
