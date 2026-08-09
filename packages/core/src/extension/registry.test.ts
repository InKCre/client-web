import type { PlatformProfile, Release, Target } from '@inkcre/extension-runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Client } from '../client'
import { configStore } from '../config'
import type { MFImplementation } from './module-federation'
import {
  CoreRegistryInstallationApi,
  RegistryBindingConflictError,
  RegistryExtensionManager,
  RegistryTargetNotCompatibleError,
  type RegistryBindingStore,
  type RegistryCoordinate,
  type RegistryInstallation,
  type RegistryInstallationApi,
  type RegistryPeerBinding,
} from './registry'

const peerId = '00000000-0000-4000-8000-000000000001'
const otherPeerId = '00000000-0000-4000-8000-000000000002'
const targetDigest = `sha256:${'a'.repeat(64)}`

const installation: RegistryInstallation = {
  namespace: 'inkcre',
  name: 'twitter',
  version: '0.1.0',
  config: {},
  config_schema: {},
}

const profile: PlatformProfile = {
  'inkcre.integration': 'module-federation-esm-v1',
  'inkcre.extension-api': '1.0.0',
  'module-federation.runtime': '0.21.6',
  'module-federation.share-scope': 'default',
  'shared.vue': '3.5.40',
  'shared.@inkcre/core': '0.1.0',
  'web.ecmascript': 'es2022',
}

const originalClientConfig = { ...configStore.clientConfig }

afterEach(() => {
  Object.assign(configStore.clientConfig, originalClientConfig)
  vi.restoreAllMocks()
})

function webTarget(overrides: Partial<Target> = {}): Target {
  return {
    target_key: 'web-module-federation-v1',
    target_digest: targetDigest,
    artifact_format: 'module-federation-esm-v1',
    entrypoint: 'remoteEntry.js',
    conditions: [
      {
        key: 'inkcre.integration',
        operator: 'equals',
        value: 'module-federation-esm-v1',
      },
      { key: 'inkcre.extension-api', operator: 'semver', value: '^1.0.0' },
      { key: 'module-federation.runtime', operator: 'semver', value: '^0.21.4' },
      { key: 'module-federation.share-scope', operator: 'equals', value: 'default' },
      { key: 'shared.vue', operator: 'semver', value: '^3.5.18' },
      { key: 'shared.@inkcre/core', operator: 'semver', value: '^0.1.0' },
      { key: 'web.ecmascript', operator: 'equals', value: 'es2022' },
    ],
    ...overrides,
  }
}

function release(targets: Target[] = [webTarget()]): Release {
  return {
    namespace: installation.namespace,
    name: installation.name,
    version: installation.version,
    state: 'published',
    targets,
  }
}

function bindingFor(peer: string = peerId): RegistryPeerBinding {
  return {
    namespace: installation.namespace,
    name: installation.name,
    version: installation.version,
    peer_id: peer,
    target_key: 'web-module-federation-v1',
    target_digest: targetDigest,
  }
}

class MemoryBindingStore implements RegistryBindingStore {
  readonly bindings = new Map<string, RegistryPeerBinding>()
  readonly events: string[] = []
  readonly listedPeers: string[] = []
  deleteFailure: Error | undefined

  async get(coordinate: RegistryCoordinate, peer: string): Promise<RegistryPeerBinding | null> {
    return this.bindings.get(bindingKey(coordinate, peer)) ?? null
  }

  async listForPeer(peer: string): Promise<RegistryPeerBinding[]> {
    this.listedPeers.push(peer)
    return [...this.bindings.values()].filter((binding) => binding.peer_id === peer)
  }

  async listForInstallation(coordinate: RegistryCoordinate): Promise<RegistryPeerBinding[]> {
    return [...this.bindings.values()].filter(
      (binding) => binding.namespace === coordinate.namespace && binding.name === coordinate.name
    )
  }

  async create(binding: RegistryPeerBinding): Promise<RegistryPeerBinding> {
    this.events.push('create-binding')
    this.bindings.set(bindingKey(binding, binding.peer_id), binding)
    return binding
  }

  async delete(coordinate: RegistryCoordinate, peer: string): Promise<void> {
    this.events.push('delete-binding')
    if (this.deleteFailure) throw this.deleteFailure
    this.bindings.delete(bindingKey(coordinate, peer))
  }
}

function bindingKey(coordinate: RegistryCoordinate, peer: string): string {
  return `${coordinate.namespace}/${coordinate.name}:${peer}`
}

function createHarness(
  options: {
    target?: Target
    releaseFailure?: Error
    manifestFailure?: boolean
    loadFailure?: Error
    deactivateFailure?: Error
    bindingDeleteFailure?: Error
    initialBindings?: RegistryPeerBinding[]
  } = {}
) {
  const events: string[] = []
  const store = new MemoryBindingStore()
  for (const binding of options.initialBindings ?? []) {
    store.bindings.set(bindingKey(binding, binding.peer_id), binding)
  }
  store.deleteFailure = options.bindingDeleteFailure

  const getInstallation = vi.fn(async () => installation)
  const install = vi.fn(async () => installation)
  const uninstall = vi.fn(async () => undefined)
  const installationApi: RegistryInstallationApi = {
    list: vi.fn(async () => [installation]),
    get: getInstallation,
    install,
    uninstall,
    updateConfig: vi.fn(async () => installation),
  }
  const registry = {
    getPublishedRelease: vi.fn(async () => {
      if (options.releaseFailure) throw options.releaseFailure
      return release(options.target ? [options.target] : undefined)
    }),
    artifactManifestUrl: vi.fn(
      (digest: string) => `https://registry.example/v1/artifacts/${digest}/manifest`
    ),
    artifactFileUrl: vi.fn(
      (digest: string, entrypoint: string) =>
        `https://registry.example/v1/artifacts/${digest}/files/${entrypoint}`
    ),
  }
  const remoteModule = {
    initialize: vi.fn(async () => {
      events.push('initialize')
    }),
    activate: vi.fn(async () => {
      events.push('activate')
    }),
    deactivate: vi.fn(async () => {
      events.push('deactivate')
      if (options.deactivateFailure) throw options.deactivateFailure
    }),
    dispose: vi.fn(async () => {
      events.push('dispose')
    }),
  }
  const registerRemotes = vi.fn(() => {
    events.push('register-remote')
  })
  const loadRemote = vi.fn(async () => {
    events.push('load-remote')
    if (options.loadFailure) throw options.loadFailure
    return { default: remoteModule }
  })
  const mf = { registerRemotes, loadRemote } as unknown as MFImplementation
  const fetch = vi.fn(async () => {
    if (options.manifestFailure) return new Response('registry unavailable', { status: 503 })
    return new Response(
      JSON.stringify({
        artifact_format: 'module-federation-esm-v1',
        entrypoint: 'remoteEntry.js',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as unknown as typeof globalThis.fetch
  const manager = new RegistryExtensionManager({
    installationApi,
    bindingStore: store,
    currentPeerId: () => peerId,
    managementPeerId: () => otherPeerId,
    registryOrigin: () => 'https://registry.example',
    registryClientFactory: () => registry,
    getMFImplementation: () => mf,
    fetch,
    platformProfile: profile,
  })

  return {
    events,
    store,
    installationApi,
    getInstallation,
    install,
    uninstall,
    registry,
    registerRemotes,
    loadRemote,
    remoteModule,
    manager,
  }
}

describe('RegistryExtensionManager', () => {
  it('uses the deployment-configured management peer instead of the null-API browser self row', async () => {
    const managementPeerId = '00000000-0000-4000-8000-000000000003'
    Object.assign(configStore.clientConfig, {
      extension_management_peer_id: managementPeerId,
    })
    const request = vi.fn(async () => [])
    const get = vi.spyOn(Client, 'get').mockResolvedValue({ request } as unknown as Client)
    const getSelf = vi
      .spyOn(Client, 'getSelf')
      .mockRejectedValue(new Error('browser self row has rest_api_url=null'))

    await expect(new CoreRegistryInstallationApi().list()).resolves.toEqual([])

    expect(get).toHaveBeenCalledWith(managementPeerId)
    expect(getSelf).not.toHaveBeenCalled()
  })

  it('delegates a selected reachable Core peer to its namespaced lifecycle routes', async () => {
    const harness = createHarness()
    const request = vi
      .fn()
      .mockResolvedValueOnce(bindingFor(otherPeerId))
      .mockResolvedValueOnce(installation)
    vi.spyOn(Client, 'get').mockResolvedValue({
      rest_api_url: 'https://core.example',
      request,
    } as unknown as Client)

    await expect(harness.manager.enableForPeer(installation, otherPeerId)).resolves.toEqual(
      bindingFor(otherPeerId)
    )
    await expect(harness.manager.disableForPeer(installation, otherPeerId)).resolves.toBeUndefined()

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: '/extension-installations/inkcre/twitter/enable',
    })
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: '/extension-installations/inkcre/twitter/disable',
    })
    expect(harness.registry.getPublishedRelease).not.toHaveBeenCalled()
  })

  it('rejects a selected browser peer with no Core REST API instead of guessing a route', async () => {
    const harness = createHarness()
    vi.spyOn(Client, 'get').mockResolvedValue({ rest_api_url: null } as unknown as Client)

    await expect(harness.manager.enableForPeer(installation, otherPeerId)).rejects.toThrow(
      'has no Core REST API'
    )

    expect(harness.registry.getPublishedRelease).not.toHaveBeenCalled()
  })

  it('rejects an unconfigured third peer before attempting Core discovery', async () => {
    const harness = createHarness()
    const thirdPeerId = '00000000-0000-4000-8000-000000000004'
    const get = vi.spyOn(Client, 'get')

    await expect(harness.manager.enableForPeer(installation, thirdPeerId)).rejects.toThrow(
      'extension_management_peer_id'
    )

    expect(get).not.toHaveBeenCalled()
  })

  it('selects an exact compatible target, loads its digest URL, then persists its binding', async () => {
    const harness = createHarness()

    const binding = await harness.manager.enable(installation)

    expect(binding).toEqual(bindingFor())
    expect(harness.registerRemotes).toHaveBeenCalledWith(
      [
        {
          name: 'extension.inkcre.twitter',
          entry: `https://registry.example/v1/artifacts/${targetDigest}/files/remoteEntry.js`,
          type: 'module',
        },
      ],
      { force: true }
    )
    expect(harness.events).toEqual(['register-remote', 'load-remote', 'initialize', 'activate'])
    expect(harness.store.events).toEqual(['create-binding'])
  })

  it('does not persist a binding when Module Federation loading fails', async () => {
    const harness = createHarness({ loadFailure: new Error('remote unavailable') })

    await expect(harness.manager.enable(installation)).rejects.toThrow('remote unavailable')

    expect(harness.store.bindings).toHaveLength(0)
    expect(harness.store.events).toEqual([])
  })

  it.each([
    ['no target', undefined],
    [
      'unknown required condition',
      webTarget({
        conditions: [
          {
            key: 'inkcre.integration',
            operator: 'equals',
            value: 'module-federation-esm-v1',
          },
          { key: 'future.web.feature', operator: 'equals', value: 'required' },
        ],
      }),
    ],
  ])('fails closed and writes no binding when release has %s', async (_label, target) => {
    const harness = createHarness({ target })
    if (target === undefined) {
      harness.registry.getPublishedRelease.mockResolvedValue(release([]))
    }

    await expect(harness.manager.enable(installation)).rejects.toBeInstanceOf(
      RegistryTargetNotCompatibleError
    )

    expect(harness.store.bindings).toHaveLength(0)
    expect(harness.loadRemote).not.toHaveBeenCalled()
  })

  it('does not call the Core installation API when Registry resolution is unavailable', async () => {
    const harness = createHarness({ releaseFailure: new Error('registry outage') })

    await expect(harness.manager.install(installation)).rejects.toThrow('registry outage')

    expect(harness.install).not.toHaveBeenCalled()
  })

  it('cleans up runtime before deleting the current peer binding', async () => {
    const harness = createHarness()
    await harness.manager.enable(installation)

    await harness.manager.disable(installation)

    expect(harness.events.slice(-2)).toEqual(['deactivate', 'dispose'])
    expect(harness.store.events).toEqual(['create-binding', 'delete-binding'])
    expect(harness.store.bindings).toHaveLength(0)
  })

  it('retains the binding if lifecycle cleanup fails', async () => {
    const harness = createHarness({ deactivateFailure: new Error('cleanup failed') })
    await harness.manager.enable(installation)

    await expect(harness.manager.disable(installation)).rejects.toThrow('cleanup failed')

    expect(harness.store.bindings).toHaveLength(1)
    expect(harness.store.events).toEqual(['create-binding'])
  })

  it('restores the runtime when binding deletion fails after cleanup', async () => {
    const harness = createHarness({ bindingDeleteFailure: new Error('delete failed') })
    await harness.manager.enable(installation)

    await expect(harness.manager.disable(installation)).rejects.toThrow('delete failed')

    expect(harness.store.bindings).toHaveLength(1)
    expect(harness.store.events).toEqual(['create-binding', 'delete-binding'])
    expect(harness.events.slice(-6)).toEqual([
      'deactivate',
      'dispose',
      'register-remote',
      'load-remote',
      'initialize',
      'activate',
    ])

    harness.store.deleteFailure = undefined
    await harness.manager.disable(installation)
    expect(harness.store.bindings).toHaveLength(0)
  })

  it('guards uninstall before calling Core when any peer remains bound', async () => {
    const harness = createHarness({ initialBindings: [bindingFor(otherPeerId)] })

    await expect(harness.manager.uninstall(installation)).rejects.toBeInstanceOf(
      RegistryBindingConflictError
    )

    expect(harness.uninstall).not.toHaveBeenCalled()
  })

  it('starts only current-peer bindings without re-resolving the mutable release', async () => {
    const harness = createHarness({ initialBindings: [bindingFor()] })

    await harness.manager.startup()

    expect(harness.store.listedPeers).toEqual([peerId])
    expect(harness.registry.getPublishedRelease).not.toHaveBeenCalled()
    expect(harness.getInstallation).not.toHaveBeenCalled()
    expect(harness.loadRemote).toHaveBeenCalledOnce()
  })
})
