import { describe, expect, it, vi } from 'vitest'
import { RegistryExtensionReleaseReader } from './registry'

describe('RegistryExtensionReleaseReader', () => {
  it('reads the frozen exact-Release route with the browser fetch receiver', async () => {
    const fetchImplementation = vi.fn(function (this: unknown, input: URL | RequestInfo) {
      if (this !== globalThis) throw new TypeError('Illegal invocation')
      expect(String(input)).toBe(
        'https://registry.example/v1/extensions/inkcre/twitter/releases/0.1.0'
      )
      return Promise.resolve(
        Response.json({
          name: 'inkcre/twitter',
          nickname: 'Twitter',
          version: '0.1.0',
          state: 'published',
          module_federation: {
            manifest_url: '/extensions/inkcre/twitter/0.1.0/module-federation/mf-manifest.json',
            host_sdk: '@inkcre/core',
            host_sdk_version: '>=0.1.0,<0.2.0',
          },
        })
      )
    }) as typeof globalThis.fetch
    const reader = new RegistryExtensionReleaseReader(
      'https://registry.example/',
      fetchImplementation
    )

    await expect(reader.get('inkcre/twitter', '0.1.0')).resolves.toMatchObject({
      name: 'inkcre/twitter',
      version: '0.1.0',
    })

    expect(fetchImplementation).toHaveBeenCalledOnce()
  })

  it('rejects a manifest URL outside the configured Registry origin', () => {
    const reader = new RegistryExtensionReleaseReader('https://registry.example/')

    expect(() => reader.resolveManifestUrl('https://attacker.example/mf-manifest.json')).toThrow(
      'hosted by the configured Registry'
    )
  })

  it('reads a Registry URL configured after Host construction', async () => {
    let registryOrigin = ''
    const fetchImplementation = vi.fn(async (input: URL | RequestInfo) => {
      expect(String(input)).toBe(
        'https://registry.example/v1/extensions/inkcre/twitter/releases/0.1.0'
      )
      return Response.json({
        name: 'inkcre/twitter',
        nickname: 'Twitter',
        version: '0.1.0',
        state: 'published',
      })
    }) as typeof globalThis.fetch
    const reader = new RegistryExtensionReleaseReader(() => registryOrigin, fetchImplementation)

    expect(() => reader.resolveManifestUrl('/mf-manifest.json')).toThrow('not configured')

    registryOrigin = 'https://registry.example/'
    await expect(reader.get('inkcre/twitter', '0.1.0')).resolves.toMatchObject({
      name: 'inkcre/twitter',
    })
  })

  it('represents a non-executable Release without turning a missing association into a parse error', async () => {
    const reader = new RegistryExtensionReleaseReader(
      'https://registry.example/',
      vi.fn(async () =>
        Response.json({
          name: 'inkcre/twitter',
          nickname: 'Twitter',
          version: '0.1.0',
          state: 'preparing',
          python: null,
          module_federation: null,
        })
      ) as typeof globalThis.fetch
    )

    await expect(reader.get('inkcre/twitter', '0.1.0')).resolves.toMatchObject({
      state: 'preparing',
      module_federation: null,
    })
  })
})
