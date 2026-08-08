/**
 * Extension System - Core Definitions and Model
 *
 * Defines the interface between host application and extensions,
 * along with the Extension model for database persistence and lifecycle management.
 */

import { z } from 'zod'
import { Z } from 'zod-class'
import { ref, type Ref } from 'vue'
import { DBAPIClient } from '../base/db-api'
import { makeStringProp, makeObjectProp } from '../utils/vue-props'
import { configStore as sharedConfigStore } from '../config'
import {
  type JsonValue,
  JsonValueSchema,
  PeerManager,
  PeerProtocolResponseSchema,
  type PeerRef,
} from '../peer'
import { getMFImplementation } from './module-federation'

export const EXTENSION_MANAGEMENT_CAPABILITY = 'core.extension.management.v1'

// ============================================================================
// Extension Lifecycle State
// ============================================================================

/**
 * Extension lifecycle state
 */
export const ExtensionState = {
  DISCOVERED: 'DISCOVERED', // Read from database
  LOADING: 'LOADING', // Module Federation loading
  LOADED: 'LOADED', // Module loaded, not initialized
  INITIALIZING: 'INITIALIZING', // Calling initialize
  READY: 'READY', // Initialized, waiting for activation
  ACTIVATING: 'ACTIVATING', // Activating
  ACTIVE: 'ACTIVE', // Working
  DEACTIVATING: 'DEACTIVATING', // Stopping, cleaning runtime resources
  UNLOADING: 'UNLOADING', // Cleaning all resources
  UNLOADED: 'UNLOADED', // Unloaded
  ERROR: 'ERROR', // Error state
} as const

export type ExtensionState = (typeof ExtensionState)[keyof typeof ExtensionState]

// ============================================================================
// Extension Module Interface
// ============================================================================

/**
 * Extension module interface - implemented by remote extensions.
 *
 * Extensions export a default object implementing this interface.
 * The host calls these methods during the extension lifecycle.
 */
export interface ExtensionModule {
  /**
   * Called after the extension module is loaded.
   * Use for one-time setup that doesn't depend on activation state.
   */
  initialize?(): Promise<void>

  /**
   * Called when the extension is activated (enabled for a Peer).
   * Use for registering resolvers, handlers, and other runtime hooks.
   */
  activate?(): Promise<void>

  /**
   * Called when the extension is deactivated.
   * Use for unregistering runtime hooks while keeping module loaded.
   */
  deactivate?(): Promise<void>

  /**
   * Called when the extension is being unloaded.
   * Use for final cleanup before the module is removed.
   */
  dispose?(): Promise<void>
}

/**
 * Extension runtime state (reactive in host application)
 */
export interface ExtensionRuntimeState {
  status: ExtensionState
  error: Error | null
}

// ============================================================================
// Extension Model
// ============================================================================

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
  enabled: z.array(z.string()).optional().default([]), // UUID array for Peer IDs
  nickname: z.string().nullable(),
  config: z.looseObject({}).default({}),
  config_schema: z.looseObject({}).nullable(),
}) {
  // ============================================================================
  // Static API Clients
  // ============================================================================

  static dbApi: DBAPIClient<'extensions', Extension> = new DBAPIClient<'extensions', Extension>(
    'extensions',
    Extension
  )

  // ============================================================================
  // Static Registry
  // ============================================================================

  /**
   * Extension instances registry for the local Peer.
   *
   * IMPORTANT: This map assumes all instances belong to the current local Peer
   * (identified by `metaConfig.INKCRE_PEER_ID`). Do not use this registry
   * to manage extensions for remote Peers.
   */
  private static _instances: Map<ExtensionRef, Extension> = new Map()

  /**
   * Runtime-only state cannot use a class-field initializer because zod-class
   * creates parsed models without running those initializers.
   */
  private static _runtimeStates = new WeakMap<Extension, Ref<ExtensionRuntimeState>>()

  private static getEnabledInstances(): Extension[] {
    const peer = sharedConfigStore.metaConfig.INKCRE_PEER_ID
    if (!peer) return []
    return Array.from(Extension._instances.values()).filter((ext) => ext.isEnabledForPeer(peer))
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

  get runtimeState(): Ref<ExtensionRuntimeState> {
    let state = Extension._runtimeStates.get(this)
    if (!state) {
      state = ref({
        status: ExtensionState.DISCOVERED,
        error: null,
      })
      Extension._runtimeStates.set(this, state)
    }
    return state
  }

  module: ExtensionModule | null = null

  // ============================================================================
  // Static Database Methods
  // ============================================================================

  static async get(id: ExtensionRef): Promise<Extension> {
    return Extension.parse((await Extension.dbApi.from().select().eq('id', id).single()).data)
  }

  static async list(): Promise<Extension[]> {
    const query = Extension.dbApi.from().select().order('id', { ascending: true })
    return ((await query).data ?? []).map((item) => Extension.parse(item))
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

  isEnabledForPeer(peer: PeerRef): boolean {
    return this.enabled.includes(peer)
  }

  async updateConfig(peer: PeerRef, config?: Record<string, unknown>): Promise<Extension> {
    const patch = config ?? this.config
    if (sharedConfigStore.metaConfig.INKCRE_PEER_ID === peer) {
      const result = await Extension.dbApi
        .update({ config: patch })
        .eq('id', this.id)
        .select()
        .single()
      return Extension.parse(result.data)
    }
    return this.manageRemote(peer, {
      action: 'patch_config',
      extension: this.id,
      patch: JsonValueSchema.parse(patch),
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
    const registryUrl = sharedConfigStore.peerConfig.extension_registry_url
    if (!registryUrl) {
      throw new Error('Extension registry URL is not configured (extension_registry_url)')
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

  private async loadModule(): Promise<ExtensionModule> {
    const remoteName = this.getRemoteName()
    const remoteEntry = this.getRemoteEntryUrl()
    const mf = getMFImplementation()

    // Register the remote with centralized MF instance
    mf.registerRemotes([{ name: remoteName, entry: remoteEntry, type: 'module' }])

    // Load the Extension export from the remote
    // Error handling is delegated to MF errorLoadRemote plugin
    const loadedModule = await mf.loadRemote<ExtensionModule | { default: ExtensionModule }>(
      remoteName
    )

    if (!loadedModule) {
      throw new Error(`Extension "${this.id}" failed to load (module returned null)`)
    }

    // Handle both default export and named export
    return 'default' in loadedModule ? loadedModule.default : loadedModule
  }

  // ============================================================================
  // Enable/Disable Methods (with lifecycle)
  // ============================================================================

  async enableForPeer(peer: PeerRef): Promise<void> {
    console.log(`[Extension] Enabling ${this.id} for Peer ${peer}`)

    if (sharedConfigStore.metaConfig.INKCRE_PEER_ID === peer) {
      // Local Peer

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
        this.enabled.push(peer)
        await Extension.dbApi.update({ enabled: this.enabled }).eq('id', this.id)
      } else {
        throw new Error(`Failed to enable extension ${this.id} for local Peer`)
      }
    } else {
      const updated = await this.manageRemote(peer, {
        action: 'enable',
        extension: this.id,
      })
      this.enabled = updated.enabled
    }

    console.log(`[Extension] ${this.id} enabled for Peer ${peer}`)
  }

  async disableForPeer(peer: PeerRef): Promise<void> {
    console.log(`[Extension] Disabling ${this.id} for Peer ${peer}`)

    if (sharedConfigStore.metaConfig.INKCRE_PEER_ID === peer) {
      // Deactivate if active
      if (this.runtimeState.value.status === ExtensionState.ACTIVE) {
        await this.deactivate()
      }

      // Update local database after successful disable
      if (this.runtimeState.value.status === ExtensionState.READY) {
        const index = this.enabled.indexOf(peer)
        if (index !== -1) {
          this.enabled.splice(index, 1)
        }
        await Extension.dbApi.update({ enabled: this.enabled }).eq('id', this.id)
      } else {
        throw new Error(`Failed to disable extension ${this.id} for local Peer`)
      }
    } else {
      const updated = await this.manageRemote(peer, {
        action: 'disable',
        extension: this.id,
      })
      this.enabled = updated.enabled
    }

    console.log(`[Extension] ${this.id} disabled for Peer ${peer}`)
  }

  private async manageRemote(peer: PeerRef, command: JsonValue): Promise<Extension> {
    const delegated = await PeerManager.delegate(
      EXTENSION_MANAGEMENT_CAPABILITY,
      { body: command },
      peer
    )
    const response = PeerProtocolResponseSchema.parse(delegated)
    if (response.status !== 200 || !Object.prototype.hasOwnProperty.call(response, 'body')) {
      throw new Error(`Extension management Peer returned HTTP ${response.status}`)
    }
    return Extension.parse(response.body)
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
  enabled: z.array(z.string()).optional(), // optional initial enabled Peer IDs
}) {
  /**
   * Install if not exist
   */
  async install(): Promise<Extension> {
    const existing = await Extension.dbApi.from().select().eq('id', this.id).single()
    if (!existing.data) {
      return Extension.parse((await Extension.dbApi.insert(this).select().single()).data)
    }
    return Extension.parse(existing.data)
  }
}
