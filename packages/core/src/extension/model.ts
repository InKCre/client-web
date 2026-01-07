import { z } from 'zod'
import { Z } from 'zod-class'
import { ref, type Ref } from 'vue'
import { DBAPIClient } from '../base/db-api'
import { makeStringProp, makeObjectProp } from '../utils/vue-props'
import { Client, type ClientRef } from '../client/client'
import { configStore as sharedConfigStore } from '../config'
import { ExtensionState, type IExtension, type ExtensionRuntimeState } from './extension'
import { getMFImplementation } from './module-federation'

export type ExtensionRef = string
export const makeExtensionProp = (v?: any) => makeObjectProp<Extension>(v)
export const makeExtensionRefProp = (v?: any) => makeStringProp<ExtensionRef>(v)
export const ExtensionRefZ = z.string()

/**
 * Module Federation integration interface.
 * Apps must provide implementation via setMFImplementation.
 */

export class Extension extends Z.class({
  id: ExtensionRefZ,
  version: z.string(),
  enabled: z.array(z.string()).optional().default([]), // uuid array for client IDs
  nickname: z.string().nullable(),
  config: z.looseObject({}).default({}),
  config_schema: z.looseObject({}).nullable(),
}) {
  // ============================================================================
  // Static API Clients
  // ============================================================================

  static dbApi: DBAPIClient = new DBAPIClient<Extension>('extensions', Extension)

  static coreApi = new DBAPIClient('extensions', undefined, '/extensions')

  // ============================================================================
  // Static Registry
  // ============================================================================

  /**
   * Extension instances registry for the local client.
   *
   * IMPORTANT: This map assumes all instances belong to the current local client
   * (identified by `CONFIG.value.INKCRE_CLIENT_ID`). Do not use this registry
   * to manage extensions for remote clients.
   */
  private static _instances: Map<ExtensionRef, Extension> = new Map()

  private static getEnabledInstances(): Extension[] {
    const clientId = sharedConfigStore.config.INKCRE_CLIENT_ID
    if (!clientId) return []
    return Array.from(Extension._instances.values()).filter((ext) =>
      ext.isEnabledForClient(clientId)
    )
  }

  /**
   * Get all registered extension instances
   */
  static getInstances(): Map<ExtensionRef, Extension> {
    return Extension._instances
  }

  // ============================================================================
  // Runtime State (not persisted, reactive)
  // ============================================================================

  readonly runtimeState: Ref<ExtensionRuntimeState> = ref({
    status: ExtensionState.DISCOVERED,
    error: null,
  })

  module: IExtension | null = null

  // ============================================================================
  // Static Database Methods
  // ============================================================================

  static async get(id: ExtensionRef): Promise<Extension> {
    return new Extension((await Extension.dbApi.from().select().eq('id', id).single()).data!)
  }

  static async list(): Promise<Extension[]> {
    const query = Extension.dbApi.from().select().order('id', { ascending: true })
    return (await query).data!.map((item) => new Extension(item))
  }

  // ============================================================================
  // State Management Methods
  // ============================================================================

  setState(status: ExtensionState): void {
    console.log(`[Extension] ${this.id}: ${this.runtimeState.value.status} -> ${status}`)
    this.runtimeState.value.status = status
  }

  setError(error: Error): void {
    console.error(`[Extension] ${this.id} error:`, error)
    this.runtimeState.value.error = error
    this.runtimeState.value.status = ExtensionState.ERROR
  }

  clearError(): void {
    this.runtimeState.value.error = null
  }

  // ============================================================================
  // Instance Methods (existing)
  // ============================================================================

  isEnabledForClient(clientId: ClientRef): boolean {
    return this.enabled.includes(clientId)
  }

  async updateConfig(clientId: ClientRef, config?: Record<string, any>): Promise<Extension> {
    const client = await Client.get(clientId)
    return await client.request({
      method: 'PUT',
      path: `/${this.id}/config`,
      body: config || this.config,
    })
  }

  // ============================================================================
  // Lifecycle Instance Methods
  // ============================================================================

  async load(): Promise<void> {
    if (this.runtimeState.value.status !== ExtensionState.DISCOVERED) {
      console.warn(
        `[Extension] ${this.id} is not in DISCOVERED state, current: ${this.runtimeState.value.status}`
      )
      return
    }

    try {
      this.setState(ExtensionState.LOADING)
      const loadedModule = await this.loadModule()
      this.module = loadedModule
      this.setState(ExtensionState.LOADED)
      this.clearError()
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  async initialize(): Promise<void> {
    if (this.runtimeState.value.status !== ExtensionState.LOADED) {
      console.warn(
        `[Extension] ${this.id} is not in LOADED state, current: ${this.runtimeState.value.status}`
      )
      return
    }

    try {
      this.setState(ExtensionState.INITIALIZING)
      if (this.module?.initialize) {
        await this.module.initialize()
      }
      this.setState(ExtensionState.READY)
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  async activate(): Promise<void> {
    if (this.runtimeState.value.status !== ExtensionState.READY) {
      console.warn(
        `[Extension] ${this.id} is not in READY state, current: ${this.runtimeState.value.status}`
      )
      return
    }

    try {
      this.setState(ExtensionState.ACTIVATING)
      if (this.module?.activate) {
        await this.module.activate()
      }
      this.setState(ExtensionState.ACTIVE)
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  async deactivate(): Promise<void> {
    if (this.runtimeState.value.status !== ExtensionState.ACTIVE) {
      console.warn(
        `[Extension] ${this.id} is not in ACTIVE state, current: ${this.runtimeState.value.status}`
      )
      return
    }

    try {
      this.setState(ExtensionState.DEACTIVATING)
      if (this.module?.deactivate) {
        await this.module.deactivate()
      }
      this.setState(ExtensionState.READY)
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  async unload(): Promise<void> {
    if (this.runtimeState.value.status !== ExtensionState.READY) {
      console.warn(
        `[Extension] ${this.id} is not in READY state, current: ${this.runtimeState.value.status}`
      )
      return
    }

    try {
      this.setState(ExtensionState.UNLOADING)
      if (this.module?.dispose) {
        await this.module.dispose()
      }
      this.module = null
      this.setState(ExtensionState.UNLOADED)
    } catch (error) {
      this.setError(error as Error)
      throw error
    }
  }

  /**
   * Retry loading the extension after an error.
   * Automatic retries are handled by MF RetryPlugin;
   * this method allows manual retry from the UI.
   */
  async retry(): Promise<void> {
    if (this.runtimeState.value.status !== ExtensionState.ERROR) {
      console.warn(
        `[Extension] ${this.id} is not in ERROR state, current: ${this.runtimeState.value.status}`
      )
      return
    }

    this.clearError()
    this.setState(ExtensionState.DISCOVERED)
    await this.load()
  }

  // ============================================================================
  // Module Federation Helpers
  // ============================================================================

  /**
   * Construct the remote entry URL for this extension.
   * Convention: ${registryUrl}/${extensionId}/client-web/remoteEntry.js?version=${version}
   */
  getRemoteEntryUrl(): string {
    const registryUrl = sharedConfigStore.config.INKCRE_EXTENSION_REGISTRY_URL
    if (!registryUrl) {
      throw new Error('Extension registry URL is not configured (INKCRE_EXTENSION_REGISTRY_URL)')
    }

    const baseUrl = registryUrl.replace(/\/$/, '')
    const params = new URLSearchParams()
    if (this.version) {
      params.set('version', this.version)
    }

    const queryString = params.toString()
    return `${baseUrl}/${this.id}/client-web/remoteEntry.js${queryString ? `?${queryString}` : ''}`
  }

  /**
   * Get the unique remote name for this extension in Module Federation.
   */
  getRemoteName(): string {
    return `extension.${this.id}`
  }

  private async loadModule(): Promise<IExtension> {
    const remoteName = this.getRemoteName()
    const remoteEntry = this.getRemoteEntryUrl()
    const mf = getMFImplementation()

    // Register the remote with centralized MF instance
    mf.registerRemotes([{ name: remoteName, entry: remoteEntry, type: 'module' }])

    // Load the Extension export from the remote
    // Error handling is delegated to MF errorLoadRemote plugin
    const loadedModule = await mf.loadRemote<IExtension | { default: IExtension }>(remoteName)

    if (!loadedModule) {
      throw new Error(`Extension "${this.id}" failed to load (module returned null)`)
    }

    // Handle both default export and named export
    return 'default' in loadedModule ? loadedModule.default : loadedModule
  }

  // ============================================================================
  // Enable/Disable Methods (with lifecycle)
  // ============================================================================

  async enableForClient(clientId: ClientRef): Promise<void> {
    console.log(`[Extension] Enabling ${this.id} for client ${clientId}`)

    if (sharedConfigStore.config.INKCRE_CLIENT_ID === clientId) {
      // Local client

      // Activate if ready, or load->init->activate if discovered
      if (this.runtimeState.value.status === ExtensionState.READY) {
        await this.activate()
      } else if (this.runtimeState.value.status === ExtensionState.DISCOVERED) {
        await this.load()
        await this.initialize()
        await this.activate()
      }

      // Update local database after successful enable
      if (this.runtimeState.value.status === ExtensionState.ACTIVE) {
        this.enabled.push(clientId)
        await Extension.dbApi.from().update({ enabled: this.enabled }).eq('id', this.id)
      } else {
        throw new Error(`Failed to enable extension ${this.id} for local client`)
      }
    } else {
      // Remote client: call remote API
      const client = await Client.get(clientId)
      await client.request({
        method: 'POST',
        path: `/extensions/${this.id}/enable`,
      })

      // Update local enabled array
      if (!this.enabled.includes(clientId)) {
        this.enabled.push(clientId)
      }
    }

    console.log(`[Extension] ${this.id} enabled for client ${clientId}`)
  }

  async disableForClient(clientId: ClientRef): Promise<void> {
    console.log(`[Extension] Disabling ${this.id} for client ${clientId}`)

    if (sharedConfigStore.config.INKCRE_CLIENT_ID === clientId) {
      // Deactivate if active
      if (this.runtimeState.value.status === ExtensionState.ACTIVE) {
        await this.deactivate()
      }

      // Update local database after successful disable
      if (this.runtimeState.value.status === ExtensionState.READY) {
        const index = this.enabled.indexOf(clientId)
        if (index !== -1) {
          this.enabled.splice(index, 1)
        }
        await Extension.dbApi.from().update({ enabled: this.enabled }).eq('id', this.id)
      } else {
        throw new Error(`Failed to disable extension ${this.id} for local client`)
      }
    } else {
      // Remote client: call remote API
      const client = await Client.get(clientId)
      await client.request({
        method: 'POST',
        path: `/extensions/${this.id}/disable`,
      })

      // Update local enabled array
      const index = this.enabled.indexOf(clientId)
      if (index !== -1) {
        this.enabled.splice(index, 1)
      }
    }

    console.log(`[Extension] ${this.id} disabled for client ${clientId}`)
  }

  // ============================================================================
  // Static Lifecycle Methods
  // ============================================================================

  static async discover(): Promise<void> {
    try {
      const extensions = await Extension.list()
      for (const extension of extensions) {
        if (!Extension._instances.has(extension.id)) {
          Extension._instances.set(extension.id, extension)
        }
      }
    } catch (error) {
      console.error('[Extension] Failed to discover extensions:', error)
      throw error
    }
  }

  static async loadAllEnabled(): Promise<void> {
    const enabledInstances = Extension.getEnabledInstances().filter(
      (ext) => ext.runtimeState.value.status === ExtensionState.DISCOVERED
    )

    console.log(`[Extension] Loading ${enabledInstances.length} enabled extensions in parallel`)

    const results = await Promise.allSettled(enabledInstances.map((ext) => ext.load()))

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    console.log(`[Extension] Load completed: ${succeeded} succeeded, ${failed} failed`)
  }

  private static async initializeAllLoaded(): Promise<void> {
    const loadedInstances = Array.from(Extension._instances.values()).filter(
      (ext) => ext.runtimeState.value.status === ExtensionState.LOADED
    )

    console.log(`[Extension] Initializing ${loadedInstances.length} loaded extensions in parallel`)

    const results = await Promise.allSettled(loadedInstances.map((ext) => ext.initialize()))

    const succeeded = results.filter(
      (r): r is PromiseFulfilledResult<void> => r.status === 'fulfilled'
    ).length
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').length

    console.log(`[Extension] Initialize completed: ${succeeded} succeeded, ${failed} failed`)
  }

  private static async activateAllReady(): Promise<void> {
    const readyInstances = Extension.getEnabledInstances().filter(
      (ext) => ext.runtimeState.value.status === ExtensionState.READY
    )

    console.log(`[Extension] Activating ${readyInstances.length} ready extensions in parallel`)

    const results = await Promise.allSettled(readyInstances.map((ext) => ext.activate()))

    const succeeded = results.filter(
      (r): r is PromiseFulfilledResult<void> => r.status === 'fulfilled'
    ).length
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').length

    console.log(`[Extension] Activate completed: ${succeeded} succeeded, ${failed} failed`)
  }

  static async startup(): Promise<void> {
    console.log('[Extension] Starting up...')

    await Extension.discover()
    await Extension.loadAllEnabled()
    await Extension.initializeAllLoaded()
    await Extension.activateAllReady()

    console.log('[Extension] Startup completed')
  }

  static async shutdown(): Promise<void> {
    console.log('[Extension] Shutting down...')

    const activeInstances = Array.from(Extension._instances.values()).filter(
      (ext) => ext.runtimeState.value.status === ExtensionState.ACTIVE
    )

    await Promise.allSettled(activeInstances.map((ext) => ext.deactivate()))

    const readyInstances = Array.from(Extension._instances.values()).filter(
      (ext) => ext.runtimeState.value.status === ExtensionState.READY
    )

    await Promise.allSettled(readyInstances.map((ext) => ext.unload()))

    Extension._instances.clear()
    console.log('[Extension] Shutdown completed')
  }

  /**
   * Lookup extension by MF remote name.
   * Used internally by Module Federation plugins.
   */
  static lookupByRemoteName(remoteName: string): Extension | undefined {
    if (remoteName.startsWith('extension.')) {
      const extensionId = remoteName.slice('extension.'.length)
      return Extension._instances.get(extensionId)
    }
    return undefined
  }
}

export class InstallExtensionForm extends Z.class({
  id: ExtensionRefZ,
  version: z.string().optional(),
  enabled: z.array(z.string()).optional(), // optional initial enabled client IDs
}) {
  async install(): Promise<Extension> {
    const params = new URLSearchParams()
    if (this.version) {
      params.append('version', this.version)
    }

    const path = `/${this.id}?${params.toString()}`
    const result = await Extension.coreApi.request<Extension>({
      method: 'POST',
      path: path,
      body: this.enabled ? { enabled: this.enabled } : undefined,
    })
    return new Extension(result)
  }
}
