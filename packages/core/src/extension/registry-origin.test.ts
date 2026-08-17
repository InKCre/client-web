import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_EXTENSION_REGISTRY_ORIGIN,
  EXTENSION_REGISTRY_CONFIG_KEY,
  EXTENSION_REGISTRY_CONFIG_SCHEMA,
  ExtensionRegistryOriginResolver,
} from './registry-origin'

function database(result: { data: unknown; error: null | { message: string }; status?: number }) {
  const maybeSingle = vi.fn(async () => result)
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle,
  }
  return { from: vi.fn(() => query), query }
}

describe('ExtensionRegistryOriginResolver', () => {
  it('uses the current Peer override without reading deployment state', async () => {
    const db = database({ data: null, error: null })
    const resolver = new ExtensionRegistryOriginResolver(
      () => 'https://peer-registry.example/',
      db as never
    )

    await expect(resolver.resolve()).resolves.toBe('https://peer-registry.example')
    expect(db.from).not.toHaveBeenCalled()
  })

  it('uses the typed deployment config when the Peer has no override', async () => {
    const db = database({
      data: {
        schema: EXTENSION_REGISTRY_CONFIG_SCHEMA,
        value: { extension_registry_url: 'https://deployment-registry.example/' },
      },
      error: null,
    })
    const resolver = new ExtensionRegistryOriginResolver(() => '', db as never)

    await expect(resolver.resolve()).resolves.toBe('https://deployment-registry.example')
    expect(db.query.eq).toHaveBeenCalledWith('key', EXTENSION_REGISTRY_CONFIG_KEY)
  })

  it('falls back to the public product Registry only when no override exists', async () => {
    const resolver = new ExtensionRegistryOriginResolver(
      () => '',
      database({ data: null, error: null }) as never
    )

    await expect(resolver.resolve()).resolves.toBe(DEFAULT_EXTENSION_REGISTRY_ORIGIN)
  })

  it('does not hide a failed deployment-config read behind the product fallback', async () => {
    const resolver = new ExtensionRegistryOriginResolver(
      () => '',
      database({ data: null, error: { message: 'offline' }, status: 503 }) as never
    )

    await expect(resolver.resolve()).rejects.toThrow('deployment config failed: offline')
  })

  it('rejects an origin whose authority contains even empty user information', async () => {
    const resolver = new ExtensionRegistryOriginResolver(
      () => 'https://@registry.example',
      database({ data: null, error: null }) as never
    )

    await expect(resolver.resolve()).rejects.toThrow('one HTTP(S) origin')
  })
})
