/**
 * Module Federation Runtime Plugin Infrastructure
 *
 * This module centralizes MF instance creation and provides custom plugins
 * for Extension lifecycle management, error handling, and shared dependencies.
 */

import {
  createInstance,
  type ModuleFederationRuntimePlugin,
} from "@module-federation/runtime";
import type { Extension, ExtensionRef } from "../extension";
import mfSharedDependencies from "../../../../../shared/mf-shared-dependencies";

// ============================================================================
// Extension Registry Bridge
// ============================================================================

/**
 * Callback to get Extension instance by remote name.
 * This is set by Extension class to avoid circular dependency.
 */
let getExtensionByRemoteName:
  | ((remoteName: string) => Extension | undefined)
  | null = null;

/**
 * Register the Extension lookup callback.
 * Called by Extension class during initialization.
 */
export function registerExtensionLookup(
  lookup: (remoteName: string) => Extension | undefined
): void {
  getExtensionByRemoteName = lookup;
}

/**
 * Parse extension ID from MF remote name.
 * Convention: remote name is `extension_${extensionId}`
 */
function parseExtensionId(remoteName: string): ExtensionRef | null {
  if (remoteName.startsWith("extension_")) {
    return remoteName.slice("extension_".length);
  }
  return null;
}

// ============================================================================
// Extension Lifecycle Plugin
// ============================================================================

/**
 * Plugin that bridges MF hooks to Extension lifecycle states.
 *
 * Hook mapping:
 * - beforeRequest → Set Extension state to LOADING
 * - onLoad → Log successful load
 * - errorLoadRemote → Set Extension state to ERROR, log error
 */
const extensionLifecyclePlugin = (): ModuleFederationRuntimePlugin => ({
  name: "extension-lifecycle-plugin",

  beforeRequest(args) {
    const extensionId = parseExtensionId(args.id);
    if (extensionId && getExtensionByRemoteName) {
      const ext = getExtensionByRemoteName(args.id);
      if (ext) {
        console.log(`[MF Plugin] beforeRequest: ${extensionId}`);
        // Note: Extension.load() already sets LOADING state before calling loadModule
        // This hook can be used for additional pre-load logic
      }
    }
    return args;
  },

  onLoad(args) {
    const extensionId = parseExtensionId(args.pkgNameOrAlias);
    if (extensionId) {
      console.log(
        `[MF Plugin] onLoad: ${extensionId} - module loaded successfully`
      );
    }
    return args;
  },

  async errorLoadRemote(args) {
    const { id, error, lifecycle } = args;
    const extensionId = parseExtensionId(id);

    if (extensionId) {
      console.error(
        `[MF Plugin] errorLoadRemote: ${extensionId} failed at ${lifecycle}`,
        error instanceof Error ? error.message : error
      );

      // Set Extension error state via callback
      if (getExtensionByRemoteName) {
        const ext = getExtensionByRemoteName(id);
        if (ext && error instanceof Error) {
          ext.setError(error);
        }
      }
    }

    // Return undefined for silent failure (no fallback component)
    return undefined;
  },
});

// ============================================================================
// Logging Plugin (Debug)
// ============================================================================

/**
 * Debug logging plugin for development.
 * Logs all MF lifecycle events.
 */
const loggingPlugin = (enabled = false): ModuleFederationRuntimePlugin => ({
  name: "logging-plugin",

  beforeInit(args) {
    if (enabled) {
      console.debug("[MF] beforeInit", args.userOptions);
    }
    return args;
  },

  init(args) {
    if (enabled) {
      console.debug("[MF] init completed");
    }
  },

  beforeRequest(args) {
    if (enabled) {
      console.debug(`[MF] beforeRequest: ${args.id}`);
    }
    return args;
  },

  onLoad(args) {
    if (enabled) {
      console.debug(`[MF] onLoad: ${args.pkgNameOrAlias}/${args.expose}`);
    }
    return args;
  },

  async beforeLoadShare(args) {
    if (enabled) {
      console.debug(`[MF] beforeLoadShare: ${args.pkgName}`);
    }
    return args;
  },
});

// ============================================================================
// MF Instance Creation
// ============================================================================

const DEBUG_MF = import.meta.env.DEV;

/**
 * Centralized Module Federation instance with plugins.
 */
export const mfInstance = createInstance({
  name: "host",
  remotes: [],
  shared: mfSharedDependencies,
  plugins: [extensionLifecyclePlugin(), loggingPlugin(DEBUG_MF)],
});

// ============================================================================
// Exports
// ============================================================================

/**
 * Load a remote module via the centralized MF instance.
 * Wraps the MF loadRemote for consistent usage.
 */
export async function loadRemote<T>(id: string): Promise<T | null> {
  return mfInstance.loadRemote<T>(id);
}

/**
 * Register remotes with the MF instance.
 */
export function registerRemotes(
  remotes: Array<{ name: string; entry: string; type: "module" | "script" }>
): void {
  mfInstance.registerRemotes(remotes);
}

export type { ModuleFederationRuntimePlugin };
