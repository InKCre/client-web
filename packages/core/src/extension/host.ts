import { satisfies, valid as validSemVer, validRange } from 'semver'
import type { MFImplementation } from './module-federation'
import {
  InstalledExtensionSchema,
  InstallExtensionInputSchema,
  ExtensionVersionSchema,
  type ExtensionModule,
  type InstalledExtension,
  type InstallExtensionInput,
} from './model'
import type {
  ExtensionRelease,
  ExtensionReleaseReader,
  ModuleFederationDistribution,
} from './registry'
import type { ExtensionStatePort } from './state'

const WEB_HOST_SDK = '@inkcre/core'

export class WebExtensionHostError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebExtensionHostError'
  }
}

export class WebExtensionIncompatibleError extends WebExtensionHostError {
  constructor(name: string, version: string, reason: string) {
    super(`Cannot run ${name}@${version} in this Web Host: ${reason}`)
    this.name = 'WebExtensionIncompatibleError'
  }
}

export class WebExtensionEnabledError extends WebExtensionHostError {
  constructor(name: string) {
    super(`Cannot change or uninstall ${name} while one or more Peers remain enabled.`)
    this.name = 'WebExtensionEnabledError'
  }
}

export interface WebExtensionHostOptions {
  state: ExtensionStatePort
  releases: ExtensionReleaseReader
  moduleFederation: () => MFImplementation
  currentPeerId: () => string | undefined
  hostSdkVersion: string
  warn?: (message: string) => void
}

interface RunningExtension {
  installed: InstalledExtension
  lifecycle: WebExtensionLifecycle
}

/** Platform-specific Host for native Module Federation Extension Releases. */
export class WebExtensionHost {
  private readonly state: ExtensionStatePort
  private readonly releases: ExtensionReleaseReader
  private readonly moduleFederation: () => MFImplementation
  private readonly currentPeerId: () => string | undefined
  private readonly hostSdkVersion: string
  private readonly warn: (message: string) => void
  private readonly running = new Map<string, RunningExtension>()
  private readonly runtimeErrors = new Map<string, Error>()
  private operationTail: Promise<void> = Promise.resolve()

  constructor(options: WebExtensionHostOptions) {
    if (validSemVer(options.hostSdkVersion) !== options.hostSdkVersion) {
      throw new TypeError('Web Host SDK version must be strict SemVer.')
    }
    this.state = options.state
    this.releases = options.releases
    this.moduleFederation = options.moduleFederation
    this.currentPeerId = options.currentPeerId
    this.hostSdkVersion = options.hostSdkVersion
    this.warn = options.warn ?? console.warn
  }

  list(): Promise<InstalledExtension[]> {
    return this.state.list()
  }

  getRuntimeError(name: string): Error | null {
    return this.runtimeErrors.get(name) ?? null
  }

  async install(input: InstallExtensionInput): Promise<InstalledExtension> {
    const exact = InstallExtensionInputSchema.parse(input)
    return this.exclusively(async () => {
      const release = await this.preflight(exact.name, exact.version, true)
      const installed = InstalledExtensionSchema.parse({
        name: release.name,
        version: release.version,
        enabled: [],
        nickname: release.nickname,
        config: {},
        config_schema: null,
      })
      return this.state.install(installed)
    })
  }

  updateConfig(name: string, config: Record<string, unknown>): Promise<InstalledExtension> {
    return this.exclusively(() => this.state.updateConfig(name, config))
  }

  changeVersion(name: string, version: string): Promise<InstalledExtension> {
    const exactVersion = ExtensionVersionSchema.parse(version)
    return this.exclusively(async () => {
      const installed = await this.requireInstalled(name)
      if (installed.enabled.length > 0 || this.running.has(name)) {
        throw new WebExtensionEnabledError(name)
      }
      if (installed.version === exactVersion) return installed
      const release = await this.preflight(name, exactVersion, true)
      return this.state.changeVersion(name, exactVersion, release.nickname)
    })
  }

  enable(name: string): Promise<InstalledExtension> {
    return this.exclusively(() => this.enableCurrentPeer(name))
  }

  disable(name: string): Promise<InstalledExtension> {
    return this.exclusively(() => this.disableCurrentPeer(name))
  }

  uninstall(name: string): Promise<void> {
    return this.exclusively(async () => {
      const installed = await this.requireInstalled(name)
      if (installed.enabled.length > 0 || this.running.has(name)) {
        throw new WebExtensionEnabledError(name)
      }
      await this.state.uninstall(name)
      this.runtimeErrors.delete(name)
    })
  }

  /** Start only exact installed rows enabled for this Web Peer. */
  async startup(): Promise<void> {
    const peerId = this.currentPeerId()
    if (!peerId) return

    await this.exclusively(async () => {
      const installedExtensions = await this.state.list()
      const enabledExtensions = installedExtensions.filter((extension) =>
        extension.enabled.includes(peerId)
      )
      const failures: Error[] = []

      for (const installed of enabledExtensions) {
        try {
          await this.start(installed)
        } catch (error) {
          const failure = asError(error)
          this.runtimeErrors.set(installed.name, failure)
          failures.push(failure)
        }
      }

      if (failures.length > 0) {
        throw combineErrors('Web Extension startup failed.', failures)
      }
    })
  }

  /** Stop volatile runtimes without changing durable enabled intent. */
  async shutdown(): Promise<void> {
    await this.exclusively(async () => {
      const failures: Error[] = []
      for (const [name, runtime] of this.running) {
        try {
          await runtime.lifecycle.stop()
          this.running.delete(name)
        } catch (error) {
          failures.push(asError(error))
        }
      }
      if (failures.length > 0) throw combineErrors('Web Extension shutdown failed.', failures)
    })
  }

  private async enableCurrentPeer(name: string): Promise<InstalledExtension> {
    const peerId = this.requireCurrentPeerId()
    const installed = await this.requireInstalled(name)
    if (!this.running.has(name)) {
      await this.start(installed)
    }
    if (installed.enabled.includes(peerId)) return installed

    const runtime = this.running.get(name)
    if (!runtime) throw new WebExtensionHostError(`Runtime ${name} did not start.`)

    try {
      const enabled = InstalledExtensionSchema.parse(
        await this.state.setPeerEnabled(name, peerId, true)
      )
      if (!enabled.enabled.includes(peerId)) {
        throw new WebExtensionHostError(`State port did not enable ${name} for the current Peer.`)
      }
      if (enabled.version !== installed.version) {
        const versionConflict = new WebExtensionHostError(
          `${name} changed from ${installed.version} to ${enabled.version} during enable; retry against the new exact Release.`
        )
        try {
          await this.state.setPeerEnabled(name, peerId, false)
        } catch (rollbackError) {
          throw combineErrors('Enable version conflict and durable intent rollback failed.', [
            versionConflict,
            asError(rollbackError),
          ])
        }
        throw versionConflict
      }
      runtime.installed = enabled
      return enabled
    } catch (persistenceError) {
      try {
        await runtime.lifecycle.stop()
        this.running.delete(name)
      } catch (cleanupError) {
        throw combineErrors('Enable persistence and runtime compensation failed.', [
          asError(persistenceError),
          asError(cleanupError),
        ])
      }
      throw persistenceError
    }
  }

  private async disableCurrentPeer(name: string): Promise<InstalledExtension> {
    const peerId = this.requireCurrentPeerId()
    const installed = await this.requireInstalled(name)
    if (!installed.enabled.includes(peerId)) return installed

    const runtime = this.running.get(name)
    if (runtime) {
      await runtime.lifecycle.stop()
      this.running.delete(name)
    }

    try {
      const disabled = InstalledExtensionSchema.parse(
        await this.state.setPeerEnabled(name, peerId, false)
      )
      if (disabled.enabled.includes(peerId)) {
        throw new WebExtensionHostError(`State port did not disable ${name} for the current Peer.`)
      }
      this.runtimeErrors.delete(name)
      return disabled
    } catch (persistenceError) {
      if (!runtime) throw persistenceError
      try {
        await this.start(installed)
      } catch (restartError) {
        throw combineErrors('Disable persistence and runtime restoration failed.', [
          asError(persistenceError),
          asError(restartError),
        ])
      }
      throw persistenceError
    }
  }

  private async start(installed: InstalledExtension): Promise<void> {
    if (this.running.has(installed.name)) return

    const release = await this.preflight(installed.name, installed.version, false)
    const distribution = release.module_federation
    if (!distribution) {
      throw new WebExtensionIncompatibleError(
        installed.name,
        installed.version,
        'the Release has no Module Federation Distribution.'
      )
    }

    const manifestUrl = this.releases.resolveManifestUrl(distribution.manifest_url)
    const remoteName = webExtensionRemoteName(installed.name)
    const lifecycle = new WebExtensionLifecycle(async () => {
      const moduleFederation = this.moduleFederation()
      moduleFederation.registerRemotes([{ name: remoteName, entry: manifestUrl }], { force: true })
      const loaded = await moduleFederation.loadRemote<
        ExtensionModule | { default: ExtensionModule }
      >(remoteName)
      if (!loaded) {
        throw new WebExtensionHostError(`${installed.name} returned no Module Federation module.`)
      }
      return 'default' in loaded ? loaded.default : loaded
    })

    await lifecycle.start()
    this.running.set(installed.name, { installed, lifecycle })
    this.runtimeErrors.delete(installed.name)
  }

  private async preflight(
    name: string,
    version: string,
    requirePublished: boolean
  ): Promise<ExtensionRelease> {
    const release = await this.releases.get(name, version)
    if (requirePublished && release.state !== 'published') {
      throw new WebExtensionHostError(
        `Only a published Release can be installed: ${name}@${version}.`
      )
    }
    if (!requirePublished && release.state !== 'published' && release.state !== 'yanked') {
      throw new WebExtensionHostError(
        `Exact installed Release ${name}@${version} is not executable in state ${release.state}.`
      )
    }
    if (release.state === 'yanked') {
      this.warn(`Starting exact installed yanked Release ${name}@${version}.`)
    }

    const distribution = release.module_federation
    if (!distribution) {
      throw new WebExtensionIncompatibleError(
        name,
        version,
        'the Release has no Module Federation Distribution.'
      )
    }
    this.assertHostSdkCompatible(name, version, distribution)
    return release
  }

  private assertHostSdkCompatible(
    name: string,
    version: string,
    distribution: ModuleFederationDistribution
  ): void {
    if (distribution.host_sdk !== WEB_HOST_SDK) {
      throw new WebExtensionIncompatibleError(
        name,
        version,
        `expected Host SDK ${WEB_HOST_SDK}, received ${distribution.host_sdk}.`
      )
    }

    const hostRange = distribution.host_sdk_version.replace(/,/g, ' ')
    if (!validRange(hostRange) || !satisfies(this.hostSdkVersion, hostRange)) {
      throw new WebExtensionIncompatibleError(
        name,
        version,
        `Host SDK ${this.hostSdkVersion} does not satisfy ${distribution.host_sdk_version}.`
      )
    }
  }

  private async requireInstalled(name: string): Promise<InstalledExtension> {
    const installed = await this.state.get(name)
    if (!installed) throw new WebExtensionHostError(`Extension ${name} is not installed.`)
    return InstalledExtensionSchema.parse(installed)
  }

  private requireCurrentPeerId(): string {
    const peerId = this.currentPeerId()
    if (!peerId) throw new WebExtensionHostError('INKCRE_PEER_ID is required for Extension state.')
    return peerId
  }

  private async exclusively<T>(operation: () => Promise<T>): Promise<T> {
    let release: (() => void) | undefined
    const previous = this.operationTail
    this.operationTail = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await operation()
    } finally {
      release?.()
    }
  }
}

class WebExtensionLifecycle {
  private extensionModule: ExtensionModule | null = null
  private active = false

  constructor(private readonly load: () => Promise<ExtensionModule>) {}

  async start(): Promise<void> {
    if (this.extensionModule) return

    const extensionModule = await this.load()
    this.extensionModule = extensionModule
    try {
      await extensionModule.initialize?.()
      await extensionModule.activate?.()
      this.active = true
    } catch (startError) {
      try {
        await this.stop()
      } catch (cleanupError) {
        throw combineErrors('Extension start and compensation failed.', [
          asError(startError),
          asError(cleanupError),
        ])
      }
      throw startError
    }
  }

  async stop(): Promise<void> {
    const extensionModule = this.extensionModule
    if (!extensionModule) return

    if (this.active) {
      await extensionModule.deactivate?.()
      this.active = false
    }
    await extensionModule.dispose?.()
    this.extensionModule = null
  }
}

export function webExtensionRemoteName(name: string): string {
  return `extension.${name.replace('/', '.')}`
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function combineErrors(message: string, errors: Error[]): Error {
  if (errors.length === 1) return errors[0]
  return new WebExtensionHostError(`${message} ${errors.map((error) => error.message).join(' | ')}`)
}
