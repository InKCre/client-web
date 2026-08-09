/**
 * Registry-backed Web Extension lifecycle.
 *
 * This is intentionally separate from `base.ts`: that module owns the legacy
 * `extensions` table and its UUID `enabled` array. Registry installations are
 * deployment-wide `(namespace, name, version)` records, while an enabled Web
 * runtime is one exact target binding for the current peer.
 */

import {
  ExtensionLifecycleController,
  RegistryClient,
  selectCompatibleTarget,
  type ExtensionModule as RuntimeExtensionModule,
  type LoadedExtensionModule,
  type PlatformProfile,
  type Release,
  type Target,
} from '@inkcre/extension-runtime'
import { z } from 'zod'
import { APIError, DBAPIClient } from '../base'
import { Client } from '../client'
import { configStore } from '../config'
import { getMFImplementation, type MFImplementation } from './module-federation'

const WEB_MODULE_FEDERATION_ARTIFACT_FORMAT = 'module-federation-esm-v1'

const RegistryCoordinateSchema = z.object({
  namespace: z.string().min(1),
  name: z.string().min(1),
})

export const RegistryInstallationSchema = RegistryCoordinateSchema.extend({
  version: z.string().min(1),
  config: z.looseObject({}).default({}),
  config_schema: z.looseObject({}).default({}),
})

export const RegistryPeerBindingSchema = RegistryInstallationSchema.pick({
  namespace: true,
  name: true,
  version: true,
}).extend({
  peer_id: z.uuid(),
  target_key: z.string().min(1),
  target_digest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
})

const ArtifactManifestSchema = z.object({
  artifact_format: z.string().min(1),
  entrypoint: z.string().min(1),
})

export type RegistryCoordinate = z.infer<typeof RegistryCoordinateSchema>
export type RegistryInstallation = z.infer<typeof RegistryInstallationSchema>
export type RegistryPeerBinding = z.infer<typeof RegistryPeerBindingSchema>
export type RegistryInstallationInput = Pick<RegistryInstallation, 'namespace' | 'name' | 'version'>

export class RegistryExtensionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RegistryExtensionError'
  }
}

export class RegistryTargetNotCompatibleError extends RegistryExtensionError {
  constructor(namespace: string, name: string, version: string) {
    super(`No compatible Web target exists for ${namespace}/${name}@${version}.`)
    this.name = 'RegistryTargetNotCompatibleError'
  }
}

export class RegistryBindingConflictError extends RegistryExtensionError {
  constructor(namespace: string, name: string) {
    super(`Cannot uninstall ${namespace}/${name} while peer bindings exist.`)
    this.name = 'RegistryBindingConflictError'
  }
}

export class RegistryBindingPersistenceError extends RegistryExtensionError {
  constructor(operation: string, cause?: unknown) {
    super(
      `Registry peer binding ${operation} failed${
        cause instanceof Error ? `: ${cause.message}` : ''
      }.`
    )
    this.name = 'RegistryBindingPersistenceError'
  }
}

interface RegistryClientLike {
  getPublishedRelease(namespace: string, name: string, version: string): Promise<Release>
  artifactManifestUrl(targetDigest: string): string
  artifactFileUrl(targetDigest: string, relativePath: string): string
}

interface RegistryCoreClient {
  request<T = unknown>(options: {
    method: string
    path: string
    body?: unknown
    query?: Record<string, unknown>
  }): Promise<T>
}

export interface RegistryInstallationApi {
  list(): Promise<RegistryInstallation[]>
  get(coordinate: RegistryCoordinate): Promise<RegistryInstallation>
  install(input: RegistryInstallationInput): Promise<RegistryInstallation>
  uninstall(coordinate: RegistryCoordinate): Promise<void>
  updateConfig(
    coordinate: RegistryCoordinate,
    config: Record<string, unknown>
  ): Promise<RegistryInstallation>
}

export interface RegistryBindingStore {
  get(coordinate: RegistryCoordinate, peerId: string): Promise<RegistryPeerBinding | null>
  listForPeer(peerId: string): Promise<RegistryPeerBinding[]>
  listForInstallation(coordinate: RegistryCoordinate): Promise<RegistryPeerBinding[]>
  create(binding: RegistryPeerBinding): Promise<RegistryPeerBinding>
  delete(coordinate: RegistryCoordinate, peerId: string): Promise<void>
}

export class CoreRegistryInstallationApi implements RegistryInstallationApi {
  constructor(
    private readonly getClient: () => Promise<RegistryCoreClient> = () => {
      const managementPeerId = configStore.clientConfig.extension_management_peer_id
      if (!managementPeerId) {
        throw new RegistryExtensionError(
          'extension_management_peer_id is required for Registry management APIs.'
        )
      }
      return Client.get(managementPeerId)
    }
  ) {}

  async list(): Promise<RegistryInstallation[]> {
    const response = await (
      await this.getClient()
    ).request<unknown>({
      method: 'GET',
      path: '/extension-installations',
    })
    return z.array(RegistryInstallationSchema).parse(response)
  }

  async get(coordinate: RegistryCoordinate): Promise<RegistryInstallation> {
    const response = await (
      await this.getClient()
    ).request<unknown>({
      method: 'GET',
      path: installationPath(coordinate),
    })
    return RegistryInstallationSchema.parse(response)
  }

  async install(input: RegistryInstallationInput): Promise<RegistryInstallation> {
    const response = await (
      await this.getClient()
    ).request<unknown>({
      method: 'POST',
      path: installationPath(input),
      query: { version: input.version },
    })
    return RegistryInstallationSchema.parse(response)
  }

  async uninstall(coordinate: RegistryCoordinate): Promise<void> {
    await (
      await this.getClient()
    ).request({
      method: 'DELETE',
      path: installationPath(coordinate),
    })
  }

  async updateConfig(
    coordinate: RegistryCoordinate,
    config: Record<string, unknown>
  ): Promise<RegistryInstallation> {
    const response = await (
      await this.getClient()
    ).request<unknown>({
      method: 'PUT',
      path: `${installationPath(coordinate)}/config`,
      body: config,
    })
    return RegistryInstallationSchema.parse(response)
  }
}

class PostgrestRegistryBindingStore implements RegistryBindingStore {
  private readonly dbApi = new DBAPIClient<'extension_peer_bindings'>('extension_peer_bindings')

  async get(coordinate: RegistryCoordinate, peerId: string): Promise<RegistryPeerBinding | null> {
    const response = await this.dbApi
      .from()
      .select()
      .eq('namespace', coordinate.namespace)
      .eq('name', coordinate.name)
      .eq('peer_id', peerId)
    assertPostgrestSuccess(response, 'read')
    const binding = response.data?.[0]
    return binding === undefined ? null : RegistryPeerBindingSchema.parse(binding)
  }

  async listForPeer(peerId: string): Promise<RegistryPeerBinding[]> {
    const response = await this.dbApi.from().select().eq('peer_id', peerId)
    assertPostgrestSuccess(response, 'list')
    return (response.data ?? []).map((binding) => RegistryPeerBindingSchema.parse(binding))
  }

  async listForInstallation(coordinate: RegistryCoordinate): Promise<RegistryPeerBinding[]> {
    const response = await this.dbApi
      .from()
      .select()
      .eq('namespace', coordinate.namespace)
      .eq('name', coordinate.name)
    assertPostgrestSuccess(response, 'list')
    return (response.data ?? []).map((binding) => RegistryPeerBindingSchema.parse(binding))
  }

  async create(binding: RegistryPeerBinding): Promise<RegistryPeerBinding> {
    const response = await this.dbApi.insert(binding).select().single()
    assertPostgrestSuccess(response, 'create')
    if (!response.data) {
      throw new RegistryBindingPersistenceError('create')
    }
    return RegistryPeerBindingSchema.parse(response.data)
  }

  async delete(coordinate: RegistryCoordinate, peerId: string): Promise<void> {
    const response = await this.dbApi
      .from()
      .delete()
      .eq('namespace', coordinate.namespace)
      .eq('name', coordinate.name)
      .eq('peer_id', peerId)
    assertPostgrestSuccess(response, 'delete')
  }
}

export interface RegistryExtensionManagerOptions {
  installationApi?: RegistryInstallationApi
  bindingStore?: RegistryBindingStore
  currentPeerId?: () => string | undefined
  managementPeerId?: () => string | undefined
  registryOrigin?: () => string
  registryClientFactory?: (origin: string) => RegistryClientLike
  getMFImplementation?: () => MFImplementation
  fetch?: typeof globalThis.fetch
  platformProfile?: PlatformProfile
}

interface RunningRegistryExtension {
  binding: RegistryPeerBinding
  lifecycle: ExtensionLifecycleController
}

/**
 * Browser adapter for the Registry deployment and peer-binding contract.
 *
 * Install/config/uninstall remain Core API operations. Web binding persistence
 * is intentionally local to this adapter because Core's registry lifecycle API
 * can only start its own Python target.
 */
export class RegistryExtensionManager {
  private readonly installationApi: RegistryInstallationApi
  private readonly bindingStore: RegistryBindingStore
  private readonly currentPeerId: () => string | undefined
  private readonly managementPeerId: () => string | undefined
  private readonly registryOrigin: () => string
  private readonly registryClientFactory: (origin: string) => RegistryClientLike
  private readonly getMfImplementation: () => MFImplementation
  private readonly fetchImplementation: typeof globalThis.fetch
  private readonly running = new Map<string, RunningRegistryExtension>()
  private operationTail: Promise<void> = Promise.resolve()
  private platformProfile: PlatformProfile | undefined

  constructor(options: RegistryExtensionManagerOptions = {}) {
    this.installationApi = options.installationApi ?? new CoreRegistryInstallationApi()
    this.bindingStore = options.bindingStore ?? new PostgrestRegistryBindingStore()
    this.currentPeerId = options.currentPeerId ?? (() => configStore.metaConfig.INKCRE_CLIENT_ID)
    this.managementPeerId =
      options.managementPeerId ?? (() => configStore.clientConfig.extension_management_peer_id)
    this.registryOrigin =
      options.registryOrigin ?? (() => configStore.clientConfig.extension_registry_url)
    this.registryClientFactory =
      options.registryClientFactory ?? ((origin) => new RegistryClient(origin))
    this.getMfImplementation = options.getMFImplementation ?? getMFImplementation
    this.fetchImplementation = options.fetch ?? globalThis.fetch
    this.platformProfile = options.platformProfile
  }

  configurePlatformProfile(profile: PlatformProfile): void {
    this.platformProfile = Object.freeze({ ...profile })
  }

  async listInstallations(): Promise<RegistryInstallation[]> {
    return this.installationApi.list()
  }

  async listCurrentPeerBindings(): Promise<RegistryPeerBinding[]> {
    const peerId = this.currentPeerId()
    return peerId ? this.bindingStore.listForPeer(peerId) : []
  }

  async listPeerBindings(peerId: string): Promise<RegistryPeerBinding[]> {
    return this.bindingStore.listForPeer(peerId)
  }

  async install(input: RegistryInstallationInput): Promise<RegistryInstallation> {
    const installation = RegistryInstallationSchema.pick({
      namespace: true,
      name: true,
      version: true,
    }).parse(input)
    return this.exclusively(async () => {
      const registry = this.registryClient()
      await registry.getPublishedRelease(
        installation.namespace,
        installation.name,
        installation.version
      )
      return this.installationApi.install(installation)
    })
  }

  async updateConfig(
    coordinate: RegistryCoordinate,
    config: Record<string, unknown>
  ): Promise<RegistryInstallation> {
    return this.exclusively(() => this.installationApi.updateConfig(coordinate, config))
  }

  async enable(installation: RegistryInstallation): Promise<RegistryPeerBinding> {
    return this.exclusively(() => this.enableCurrentPeer(installation))
  }

  /**
   * Enable the current Web peer locally, or delegate the one deployment-configured
   * Core management peer to its namespaced Registry lifecycle API. Arbitrary
   * peers are never guessed or treated as Core instances.
   */
  async enableForPeer(
    installation: RegistryInstallation,
    peerId: string
  ): Promise<RegistryPeerBinding> {
    return this.exclusively(async () => {
      if (peerId === this.requireCurrentPeerId()) {
        return this.enableCurrentPeer(installation)
      }
      const client = await this.requireReachableCorePeer(peerId)
      const response = await client.request<unknown>({
        method: 'POST',
        path: `${installationPath(installation)}/enable`,
      })
      return RegistryPeerBindingSchema.parse(response)
    })
  }

  async disable(coordinate: RegistryCoordinate): Promise<void> {
    return this.exclusively(() => this.disableCurrentPeer(coordinate))
  }

  async disableForPeer(coordinate: RegistryCoordinate, peerId: string): Promise<void> {
    return this.exclusively(async () => {
      if (peerId === this.requireCurrentPeerId()) {
        return this.disableCurrentPeer(coordinate)
      }
      const client = await this.requireReachableCorePeer(peerId)
      await client.request({
        method: 'POST',
        path: `${installationPath(coordinate)}/disable`,
      })
    })
  }

  async uninstall(coordinate: RegistryCoordinate): Promise<void> {
    return this.exclusively(async () => {
      const peerId = this.currentPeerId()
      if (peerId && this.running.has(bindingKey({ ...coordinate, peer_id: peerId }))) {
        throw new RegistryBindingConflictError(coordinate.namespace, coordinate.name)
      }
      const bindings = await this.bindingStore.listForInstallation(coordinate)
      if (bindings.length > 0) {
        throw new RegistryBindingConflictError(coordinate.namespace, coordinate.name)
      }
      // Core repeats this guard authoritatively, including bindings hidden by RLS.
      await this.installationApi.uninstall(coordinate)
    })
  }

  private async enableCurrentPeer(
    installation: RegistryInstallation
  ): Promise<RegistryPeerBinding> {
    const peerId = this.requireCurrentPeerId()
    const coordinate = toCoordinate(installation)
    const existing = await this.bindingStore.get(coordinate, peerId)
    if (existing) {
      await this.startPersistedBinding(existing)
      return existing
    }

    const registry = this.registryClient()
    const release = await registry.getPublishedRelease(
      installation.namespace,
      installation.name,
      installation.version
    )
    const target = selectCompatibleTarget(release.targets, this.requirePlatformProfile())
    if (!target || target.artifact_format !== WEB_MODULE_FEDERATION_ARTIFACT_FORMAT) {
      throw new RegistryTargetNotCompatibleError(
        installation.namespace,
        installation.name,
        installation.version
      )
    }

    const entrypoint = await this.resolveArtifactEntrypoint(registry, target, target.entrypoint)
    const binding = RegistryPeerBindingSchema.parse({
      namespace: installation.namespace,
      name: installation.name,
      version: installation.version,
      peer_id: peerId,
      target_key: target.target_key,
      target_digest: target.target_digest,
    })
    const lifecycle = this.createLifecycle(registry, binding, entrypoint)

    await lifecycle.enable()
    try {
      const persisted = await this.bindingStore.create(binding)
      this.running.set(bindingKey(persisted), { binding: persisted, lifecycle })
      return persisted
    } catch (error) {
      await this.compensateAfterPersistenceFailure(lifecycle, error)
      throw error
    }
  }

  private async disableCurrentPeer(coordinate: RegistryCoordinate): Promise<void> {
    const peerId = this.requireCurrentPeerId()
    const binding = await this.bindingStore.get(coordinate, peerId)
    if (!binding) return

    const key = bindingKey(binding)
    const running = this.running.get(key)
    if (running) {
      // Persisted enabled state remains intact until all runtime cleanup succeeds.
      await running.lifecycle.disable()
      this.running.delete(key)
      try {
        await this.bindingStore.delete(coordinate, peerId)
      } catch (persistenceError) {
        // The binding still says enabled. Restore the volatile runtime so the
        // persisted authority and this process agree before reporting failure.
        try {
          await running.lifecycle.enable()
          this.running.set(key, running)
        } catch (restartError) {
          throw combineErrors('Registry binding delete and runtime restoration failed.', [
            asError(persistenceError),
            asError(restartError),
          ])
        }
        throw persistenceError
      }
      return
    }
    await this.bindingStore.delete(coordinate, peerId)
  }

  /** Restore only bindings owned by this peer; it never enumerates all installations. */
  async startup(): Promise<void> {
    const peerId = this.currentPeerId()
    if (!peerId) return

    await this.exclusively(async () => {
      const bindings = await this.bindingStore.listForPeer(peerId)
      const failures: Error[] = []
      for (const binding of bindings) {
        if (binding.peer_id !== peerId) {
          failures.push(
            new RegistryExtensionError('Binding store returned a row for a different peer.')
          )
          continue
        }
        try {
          await this.startPersistedBinding(binding)
        } catch (error) {
          failures.push(asError(error))
        }
      }
      if (failures.length > 0) throw combineErrors('Registry Extension startup failed.', failures)
    })
  }

  /** Stop volatile Web runtimes without changing persisted peer bindings. */
  async shutdown(): Promise<void> {
    await this.exclusively(async () => {
      const failures: Error[] = []
      for (const [key, runtime] of this.running) {
        try {
          await runtime.lifecycle.disable()
          this.running.delete(key)
        } catch (error) {
          failures.push(asError(error))
        }
      }
      if (failures.length > 0) throw combineErrors('Registry Extension shutdown failed.', failures)
    })
  }

  private async startPersistedBinding(binding: RegistryPeerBinding): Promise<void> {
    const key = bindingKey(binding)
    if (this.running.has(key)) return

    const registry = this.registryClient()
    const entrypoint = await this.resolveArtifactEntrypoint(registry, binding)
    const lifecycle = this.createLifecycle(registry, binding, entrypoint)
    await lifecycle.enable()
    this.running.set(key, { binding, lifecycle })
  }

  private createLifecycle(
    registry: RegistryClientLike,
    binding: RegistryPeerBinding,
    entrypoint: string
  ): ExtensionLifecycleController {
    const remoteName = registryRemoteName(binding)
    const remoteEntry = registry.artifactFileUrl(binding.target_digest, entrypoint)
    return new ExtensionLifecycleController(async () => {
      const mf = this.getMfImplementation()
      // Re-enable/version transitions reuse this coordinate's host-side name.
      // Force clears the Module Federation remote/module caches before exact
      // digest bytes are loaded again.
      mf.registerRemotes([{ name: remoteName, entry: remoteEntry, type: 'module' }], {
        force: true,
      })
      const loaded = await mf.loadRemote<LoadedExtensionModule>(remoteName)
      if (!loaded) {
        throw new RegistryExtensionError(
          `Registry Extension ${binding.namespace}/${binding.name} returned no Module Federation module.`
        )
      }
      return loaded
    })
  }

  private async resolveArtifactEntrypoint(
    registry: RegistryClientLike,
    target: Pick<Target, 'target_digest'> & Partial<Pick<Target, 'artifact_format'>>,
    expectedEntrypoint?: string
  ): Promise<string> {
    const response = await this.fetchImplementation(
      registry.artifactManifestUrl(target.target_digest),
      {
        headers: { Accept: 'application/json' },
      }
    )
    if (!response.ok) {
      throw new RegistryExtensionError(
        `Registry artifact manifest request failed with HTTP ${response.status}.`
      )
    }
    const manifest = ArtifactManifestSchema.parse(await response.json())
    if (manifest.artifact_format !== WEB_MODULE_FEDERATION_ARTIFACT_FORMAT) {
      throw new RegistryExtensionError(
        'Registry binding does not name a Module Federation ESM artifact.'
      )
    }
    if (
      target.artifact_format !== undefined &&
      target.artifact_format !== WEB_MODULE_FEDERATION_ARTIFACT_FORMAT
    ) {
      throw new RegistryExtensionError('Registry target is not a Module Federation ESM artifact.')
    }
    if (expectedEntrypoint && manifest.entrypoint !== expectedEntrypoint) {
      throw new RegistryExtensionError(
        'Registry target entrypoint does not match its immutable manifest.'
      )
    }
    return manifest.entrypoint
  }

  private registryClient(): RegistryClientLike {
    const origin = this.registryOrigin()
    if (!origin) {
      throw new RegistryExtensionError('Extension Registry URL is not configured.')
    }
    return this.registryClientFactory(origin)
  }

  private async requireReachableCorePeer(peerId: string): Promise<Client> {
    if (peerId !== this.managementPeerId()) {
      throw new RegistryExtensionError(
        'Only the deployment-configured extension_management_peer_id can be controlled remotely.'
      )
    }
    const client = await Client.get(peerId)
    if (!client.rest_api_url) {
      throw new RegistryExtensionError(
        `Peer ${peerId} has no Core REST API. Only the current Web peer and reachable Core peers can be controlled.`
      )
    }
    return client
  }

  private requireCurrentPeerId(): string {
    const peerId = this.currentPeerId()
    if (!peerId) {
      throw new RegistryExtensionError('INKCRE_CLIENT_ID is required for peer bindings.')
    }
    return peerId
  }

  private requirePlatformProfile(): PlatformProfile {
    if (!this.platformProfile) {
      throw new RegistryExtensionError('Registry platform profile is not configured.')
    }
    return this.platformProfile
  }

  private async compensateAfterPersistenceFailure(
    lifecycle: ExtensionLifecycleController,
    persistenceError: unknown
  ): Promise<void> {
    try {
      await lifecycle.disable()
    } catch (cleanupError) {
      throw combineErrors('Registry binding persistence and runtime compensation failed.', [
        asError(persistenceError),
        asError(cleanupError),
      ])
    }
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

/** Shared browser-facing manager. Apps must configure its platform profile at startup. */
export const registryExtensions = new RegistryExtensionManager()

/**
 * The Module Federation ESM runtime keeps this name in the host's local remote
 * registry, so encoding the complete coordinate avoids cross-namespace clashes.
 */
export function registryRemoteName(coordinate: RegistryCoordinate): string {
  return `extension.${coordinate.namespace}.${coordinate.name}`
}

function installationPath(coordinate: RegistryCoordinate): string {
  return `/extension-installations/${encodeURIComponent(coordinate.namespace)}/${encodeURIComponent(
    coordinate.name
  )}`
}

function toCoordinate(installation: RegistryInstallation): RegistryCoordinate {
  return {
    namespace: installation.namespace,
    name: installation.name,
  }
}

function bindingKey(binding: Pick<RegistryPeerBinding, 'namespace' | 'name' | 'peer_id'>): string {
  return `${binding.namespace}/${binding.name}:${binding.peer_id}`
}

function assertPostgrestSuccess(
  response: { error?: { message: string } | null },
  operation: string
): void {
  if (response.error) {
    throw new RegistryBindingPersistenceError(operation, new APIError(response.error.message, 0))
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function combineErrors(message: string, errors: Error[]): Error {
  if (errors.length === 1) return errors[0]
  return new RegistryExtensionError(
    `${message} ${errors.map((error) => error.message).join(' | ')}`
  )
}

export type { RuntimeExtensionModule }
