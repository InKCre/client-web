/**
 * Core Package Integration for client-web
 *
 * This file initializes @inkcre/core with client-web specific configuration.
 * Import this file in main.ts before mounting the Vue app.
 */

import {
  configStore,
  devAdapter,
  localStorageAdapter,
  setMFImplementation,
} from "@inkcre/core";
import { createInstance } from "@module-federation/enhanced/runtime";
import mfSharedDependencies from "../../../shared/mf-shared-dependencies";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Initialize configuration system.
 * Uses devAdapter in development, localStorageAdapter in production.
 */
export async function initializeConfig(): Promise<void> {
  const adapter = import.meta.env.DEV ? devAdapter : localStorageAdapter;
  await configStore.load([adapter]);
  console.log("[Core] Configuration loaded:", configStore.config);
}

// ============================================================================
// Module Federation
// ============================================================================

/**
 * Initialize Module Federation runtime.
 * Creates the MF instance and injects it into core.
 */
// TODO Integrate into core, client-webext also uses this
export function initializeModuleFederation(): void {
  const mfInstance = createInstance({
    name: "host",
    remotes: [],
    // @ts-ignore
    shared: mfSharedDependencies,
  });

  // Inject MF implementation into core
  const mfImpl = {
    registerRemotes: (
      remotes: Array<{ name: string; entry: string; type: string }>
    ) => {
      mfInstance.registerRemotes(remotes);
    },
    loadRemote: async <T>(remoteName: string): Promise<T | null> => {
      return mfInstance.loadRemote<T>(remoteName);
    },
  };

  setMFImplementation(mfImpl);

  console.log("[Core] Module Federation initialized");
}

// ============================================================================
// Full Initialization
// ============================================================================

/**
 * Initialize all core systems.
 * Call this in main.ts before creating the Vue app.
 */
export async function initializeCore(): Promise<void> {
  await initializeConfig();
  initializeModuleFederation();
  console.log("[Core] Initialization complete");
}
