/**
 * Extension Protocol Definitions
 *
 * Defines the interface between host application and extensions.
 * Extensions implement IExtension to provide lifecycle hooks.
 */

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

/**
 * Extension module interface - implemented by remote extensions.
 *
 * Extensions export a default object implementing this interface.
 * The host calls these methods during the extension lifecycle.
 */
export interface IExtension {
  /**
   * Called after the extension module is loaded.
   * Use for one-time setup that doesn't depend on activation state.
   */
  initialize?(): Promise<void>

  /**
   * Called when the extension is activated (enabled for a client).
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
