import { describe, expect, it, vi } from 'vitest'
import type { MFImplementation } from './module-federation'
import type { InstalledExtension } from './model'
import type { ExtensionRelease, ExtensionReleaseReader } from './registry'
import type { ExtensionStatePort } from './state'
import { WebExtensionEnabledError, WebExtensionHost, WebExtensionIncompatibleError } from './host'

const peerId = '00000000-0000-4000-8000-000000000001'
const otherPeerId = '00000000-0000-4000-8000-000000000002'
const installed: InstalledExtension = {
  name: 'inkcre/twitter',
  version: '0.1.0',
  enabled: [],
  nickname: 'Twitter',
  config: {},
  config_schema: null,
}

class MemoryExtensionState implements ExtensionStatePort {
  readonly rows = new Map<string, InstalledExtension>()
  readonly events: string[] = []
  setPeerEnabledFailure: Error | undefined
  setPeerEnabledResultVersion: string | undefined
  changeVersionFailure: Error | undefined

  constructor(rows: InstalledExtension[] = []) {
    for (const row of rows) this.rows.set(row.name, structuredClone(row))
  }

  async list(): Promise<InstalledExtension[]> {
    return [...this.rows.values()].map((row) => structuredClone(row))
  }

  async get(name: string): Promise<InstalledExtension | null> {
    const row = this.rows.get(name)
    return row ? structuredClone(row) : null
  }

  async install(extension: InstalledExtension): Promise<InstalledExtension> {
    this.events.push('install')
    this.rows.set(extension.name, structuredClone(extension))
    return structuredClone(extension)
  }

  async updateConfig(name: string, config: Record<string, unknown>): Promise<InstalledExtension> {
    const row = this.require(name)
    const updated = { ...row, config: structuredClone(config) }
    this.rows.set(name, updated)
    return structuredClone(updated)
  }

  async changeVersion(
    name: string,
    version: string,
    nickname: string
  ): Promise<InstalledExtension> {
    this.events.push('change-version')
    if (this.changeVersionFailure) throw this.changeVersionFailure
    const row = this.require(name)
    if (row.enabled.length > 0) throw new Error('enabled')
    const updated = { ...row, version, nickname, config_schema: null }
    this.rows.set(name, updated)
    return structuredClone(updated)
  }

  async setPeerEnabled(
    name: string,
    targetPeerId: string,
    enabled: boolean
  ): Promise<InstalledExtension> {
    this.events.push(enabled ? 'persist-enable' : 'persist-disable')
    if (this.setPeerEnabledFailure) throw this.setPeerEnabledFailure
    const row = this.require(name)
    const peerIds = new Set(row.enabled)
    if (enabled) peerIds.add(targetPeerId)
    else peerIds.delete(targetPeerId)
    const updated = {
      ...row,
      version: enabled ? (this.setPeerEnabledResultVersion ?? row.version) : row.version,
      enabled: [...peerIds],
    }
    this.rows.set(name, updated)
    return structuredClone(updated)
  }

  async uninstall(name: string): Promise<void> {
    this.events.push('uninstall')
    this.rows.delete(name)
  }

  private require(name: string): InstalledExtension {
    const row = this.rows.get(name)
    if (!row) throw new Error(`missing ${name}`)
    return row
  }
}

function release(overrides: Partial<ExtensionRelease> = {}): ExtensionRelease {
  return {
    name: installed.name,
    nickname: 'Twitter',
    version: installed.version,
    state: 'published',
    module_federation: {
      manifest_url: '/extensions/inkcre/twitter/0.1.0/module-federation/mf-manifest.json',
      host_sdk: '@inkcre/core',
      host_sdk_version: '>=0.1.0,<0.2.0',
    },
    ...overrides,
  }
}

function createHarness(
  options: {
    rows?: InstalledExtension[]
    release?: ExtensionRelease
    releaseFailure?: Error
    loadFailure?: Error
    activateFailure?: Error
    deactivateFailure?: Error
  } = {}
) {
  const events: string[] = []
  const state = new MemoryExtensionState(options.rows ?? [installed])
  const getRelease = vi.fn(async () => {
    if (options.releaseFailure) throw options.releaseFailure
    return options.release ?? release()
  })
  const releases: ExtensionReleaseReader = {
    get: getRelease,
    resolveManifestUrl: vi.fn((url) => new URL(url, 'https://registry.example').href),
  }
  const extensionModule = {
    setup: { component: { name: 'TestSetup' } },
    initialize: vi.fn(async () => {
      events.push('initialize')
    }),
    activate: vi.fn(async () => {
      events.push('activate')
      if (options.activateFailure) throw options.activateFailure
    }),
    deactivate: vi.fn(async () => {
      events.push('deactivate')
      if (options.deactivateFailure) throw options.deactivateFailure
    }),
    dispose: vi.fn(async () => {
      events.push('dispose')
    }),
  }
  const registerRemotes = vi.fn(() => events.push('register-manifest'))
  const loadRemote = vi.fn(async () => {
    events.push('load-remote')
    if (options.loadFailure) throw options.loadFailure
    return { default: extensionModule }
  })
  const moduleFederation = { registerRemotes, loadRemote } as MFImplementation
  const warn = vi.fn()
  const host = new WebExtensionHost({
    state,
    releases,
    moduleFederation: () => moduleFederation,
    currentPeerId: () => peerId,
    hostSdkVersion: '0.1.0',
    warn,
  })

  return {
    events,
    state,
    getRelease,
    releases,
    registerRemotes,
    loadRemote,
    extensionModule,
    warn,
    host,
  }
}

describe('WebExtensionHost', () => {
  it('prechecks the exact Release and passes its native manifest URL directly to MF Host', async () => {
    const harness = createHarness()

    const enabled = await harness.host.enable(installed.name)

    expect(enabled.enabled).toEqual([peerId])
    expect(harness.getRelease).toHaveBeenCalledWith(installed.name, installed.version)
    expect(harness.registerRemotes).toHaveBeenCalledWith(
      [
        {
          name: 'extension.inkcre.twitter',
          entry:
            'https://registry.example/extensions/inkcre/twitter/0.1.0/module-federation/mf-manifest.json',
        },
      ],
      { force: true }
    )
    expect(harness.events).toEqual(['register-manifest', 'load-remote', 'initialize', 'activate'])
    expect(harness.state.events).toEqual(['persist-enable'])
    expect(harness.host.isRunning(installed.name)).toBe(true)
    expect(harness.host.getSetupContribution(installed.name)?.component).toEqual({
      name: 'TestSetup',
    })
  })

  it('withdraws the setup contribution with the running Extension', async () => {
    const harness = createHarness()
    await harness.host.enable(installed.name)

    await harness.host.disable(installed.name)

    expect(harness.host.isRunning(installed.name)).toBe(false)
    expect(harness.host.getSetupContribution(installed.name)).toBeNull()
  })

  it('rejects an incompatible @inkcre/core range before MF can fetch executable bytes', async () => {
    const harness = createHarness({
      release: release({
        module_federation: {
          manifest_url: '/native/mf-manifest.json',
          host_sdk: '@inkcre/core',
          host_sdk_version: '>=0.2.0,<0.3.0',
        },
      }),
    })

    await expect(harness.host.enable(installed.name)).rejects.toBeInstanceOf(
      WebExtensionIncompatibleError
    )

    expect(harness.registerRemotes).not.toHaveBeenCalled()
    expect(harness.loadRemote).not.toHaveBeenCalled()
    expect(harness.state.events).toEqual([])
  })

  it('runs dispose compensation and leaves enabled intent unchanged when activation fails', async () => {
    const harness = createHarness({ activateFailure: new Error('activation failed') })

    await expect(harness.host.enable(installed.name)).rejects.toThrow('activation failed')

    expect(harness.events).toEqual([
      'register-manifest',
      'load-remote',
      'initialize',
      'activate',
      'dispose',
    ])
    expect(harness.state.events).toEqual([])
    expect((await harness.state.get(installed.name))?.enabled).toEqual([])
  })

  it('stops a started runtime if atomic enable persistence fails', async () => {
    const harness = createHarness()
    harness.state.setPeerEnabledFailure = new Error('atomic RPC unavailable')

    await expect(harness.host.enable(installed.name)).rejects.toThrow('atomic RPC unavailable')

    expect(harness.events.slice(-2)).toEqual(['deactivate', 'dispose'])
    expect((await harness.state.get(installed.name))?.enabled).toEqual([])
  })

  it('rolls back enablement if a disabled version changes after native preflight', async () => {
    const harness = createHarness()
    harness.state.setPeerEnabledResultVersion = '0.1.1'

    await expect(harness.host.enable(installed.name)).rejects.toThrow(
      'changed from 0.1.0 to 0.1.1 during enable'
    )

    expect(harness.state.events).toEqual(['persist-enable', 'persist-disable'])
    expect(harness.events.slice(-2)).toEqual(['deactivate', 'dispose'])
    expect(await harness.state.get(installed.name)).toMatchObject({
      version: '0.1.1',
      enabled: [],
    })
  })

  it('restores runtime when atomic disable persistence fails after cleanup', async () => {
    const harness = createHarness()
    await harness.host.enable(installed.name)
    harness.state.setPeerEnabledFailure = new Error('disable write failed')

    await expect(harness.host.disable(installed.name)).rejects.toThrow('disable write failed')

    expect(harness.events.slice(-6)).toEqual([
      'deactivate',
      'dispose',
      'register-manifest',
      'load-remote',
      'initialize',
      'activate',
    ])
    expect((await harness.state.get(installed.name))?.enabled).toEqual([peerId])
  })

  it('cold-starts exact yanked intent with a warning and never rewrites it', async () => {
    const enabled = { ...installed, enabled: [peerId] }
    const harness = createHarness({ rows: [enabled], release: release({ state: 'yanked' }) })

    await harness.host.startup()

    expect(harness.warn).toHaveBeenCalledWith(
      'Starting exact installed yanked Release inkcre/twitter@0.1.0.'
    )
    expect(harness.loadRemote).toHaveBeenCalledOnce()
    expect(harness.state.events).toEqual([])
    expect((await harness.state.get(installed.name))?.enabled).toEqual([peerId])
  })

  it('reports cold-start failure without deleting durable enabled intent', async () => {
    const enabled = { ...installed, enabled: [peerId] }
    const harness = createHarness({
      rows: [enabled],
      releaseFailure: new Error('Registry unavailable'),
    })

    await expect(harness.host.startup()).rejects.toThrow('Registry unavailable')

    expect(harness.host.getRuntimeError(installed.name)?.message).toBe('Registry unavailable')
    expect((await harness.state.get(installed.name))?.enabled).toEqual([peerId])
    expect(harness.state.events).toEqual([])
  })

  it('requires a published Web Release before installing the canonical empty row', async () => {
    const harness = createHarness({ rows: [], release: release({ state: 'yanked' }) })

    await expect(harness.host.install(installed)).rejects.toThrow('Only a published Release')

    expect(harness.state.events).toEqual([])
  })

  it('does not uninstall while any Peer remains enabled', async () => {
    const harness = createHarness({ rows: [{ ...installed, enabled: [otherPeerId] }] })

    await expect(harness.host.uninstall(installed.name)).rejects.toBeInstanceOf(
      WebExtensionEnabledError
    )

    expect(harness.state.events).toEqual([])
  })

  it('preflights a published Release before changing a fully disabled shared version', async () => {
    const harness = createHarness({ release: release({ version: '0.1.1' }) })

    await expect(harness.host.changeVersion(installed.name, '0.1.1')).resolves.toMatchObject({
      version: '0.1.1',
      enabled: [],
    })

    expect(harness.getRelease).toHaveBeenCalledWith(installed.name, '0.1.1')
    expect(harness.state.events).toEqual(['change-version'])
    expect(harness.loadRemote).not.toHaveBeenCalled()
  })

  it('rejects version change before Registry preflight while any Peer is enabled', async () => {
    const harness = createHarness({ rows: [{ ...installed, enabled: [otherPeerId] }] })

    await expect(harness.host.changeVersion(installed.name, '0.1.1')).rejects.toBeInstanceOf(
      WebExtensionEnabledError
    )

    expect(harness.getRelease).not.toHaveBeenCalled()
    expect(harness.state.events).toEqual([])
  })

  it('surfaces an atomic version conflict if a Peer becomes enabled after preflight', async () => {
    const harness = createHarness({ release: release({ version: '0.1.1' }) })
    harness.state.changeVersionFailure = new Error('Extension became enabled')

    await expect(harness.host.changeVersion(installed.name, '0.1.1')).rejects.toThrow(
      'Extension became enabled'
    )

    expect(harness.getRelease).toHaveBeenCalledWith(installed.name, '0.1.1')
    expect((await harness.state.get(installed.name))?.version).toBe('0.1.0')
  })
})
