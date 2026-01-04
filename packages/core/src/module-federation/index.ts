/**
 * Module Federation Abstraction Layer
 *
 * Provides environment-agnostic MF utilities. Apps inject their
 * MF implementation during initialization.
 */

export interface RemoteConfig {
  name: string;
  entry: string;
  type: "module" | "script";
}

export interface MFImplementation {
  registerRemotes: (remotes: RemoteConfig[]) => void;
  loadRemote: <T>(remoteName: string) => Promise<T | null>;
}

let _mfImplementation: MFImplementation | null = null;

/**
 * Set the Module Federation implementation.
 * Apps must call this during initialization.
 *
 * @example
 * ```typescript
 * import { init } from "@module-federation/enhanced/runtime";
 * import { setMFImplementation } from "@inkcre/core";
 *
 * const mf = init({...});
 * setMFImplementation({
 *   registerRemotes: (remotes) => mf.registerRemotes(remotes),
 *   loadRemote: (name) => mf.loadRemote(name)
 * });
 * ```
 */
export function setMFImplementation(impl: MFImplementation): void {
  _mfImplementation = impl;
}

function getMFImplementation(): MFImplementation {
  if (!_mfImplementation) {
    throw new Error(
      "Module Federation not initialized. Call setMFImplementation() first."
    );
  }
  return _mfImplementation;
}

/**
 * Register remote modules with the MF runtime.
 *
 * @param remotes - Array of remote configuration objects
 * @throws Error if MF not initialized
 */
export function registerRemotes(remotes: RemoteConfig[]): void {
  getMFImplementation().registerRemotes(remotes);
}

/**
 * Load a remote module.
 *
 * @param remoteName - The name of the remote module to load
 * @returns Promise resolving to the loaded module or null
 * @throws Error if MF not initialized
 */
export async function loadRemote<T = any>(remoteName: string): Promise<T | null> {
  return getMFImplementation().loadRemote<T>(remoteName);
}

/**
 * Check if Module Federation has been initialized.
 */
export function isMFInitialized(): boolean {
  return _mfImplementation !== null;
}
