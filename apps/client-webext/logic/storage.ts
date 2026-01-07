/**
 * Storage configuration for client-webext
 *
 * Separates core config (using Pinia store) from extension-specific storage.
 */

import {
  useConfigStore,
  createWebextAdapter,
  DEFAULT_LLM_PROVIDERS,
  DEFAULT_EXPLAIN_INSTRUCTION,
} from "@inkcre/core";
import { useWebExtensionStorage } from "~/composables/useWebExtensionStorage";

// ============================================================================
// Core Configuration Integration
// ============================================================================

/**
 * Initialize core configuration with WebExtension storage adapter.
 * Call this early in the extension lifecycle (e.g., in background script).
 *
 * @example
 * ```typescript
 * // In background.ts
 * import { initializeConfig } from "~/logic/storage";
 * await initializeConfig();
 *
 * // Then use config store anywhere
 * import { useConfigStore } from "@inkcre/core";
 * const configStore = useConfigStore();
 * console.log(configStore.clientConfig.llmProviders);
 * ```
 */
export async function initializeConfig() {
  const webextAdapter = createWebextAdapter({
    storageArea: "sync", // Use 'sync' for cross-device sync, 'local' for local-only
  });

  const configStore = useConfigStore();
  await configStore.loadMeta([webextAdapter]);
  console.log("[Client-WebExt] Core configuration loaded");
}

/**
 * Save current config to WebExtension storage.
 * Call this when config changes need to be persisted.
 *
 * @example
 * ```typescript
 * import { saveConfig } from "~/logic/storage";
 * import { useConfigStore } from "@inkcre/core";
 *
 * const configStore = useConfigStore();
 * configStore.clientConfig.llmProviders.push(newProvider);
 * await saveConfig();
 * ```
 */
export async function saveConfig() {
  const webextAdapter = createWebextAdapter({
    storageArea: "sync",
  });

  const configStore = useConfigStore();
  await configStore.saveMeta(webextAdapter);
  console.log("[Client-WebExt] Core configuration saved");
}

// Re-export core config types and defaults for convenience
export {
  type ProviderType,
  type LLMProviderConfig,
  DEFAULT_LLM_PROVIDERS,
  DEFAULT_EXPLAIN_INSTRUCTION,
} from "@inkcre/core";

// ============================================================================
// Extension-Specific Storage (Not in core config)
// ============================================================================

// Default English stopwords list (loaded from JSON)
import stopwordsList from "./stopwords.json";

export const DEFAULT_STOPWORDS: string[] = stopwordsList;

/**
 * Stopwords storage (extension-specific, not in core).
 * Used for text processing and content extraction.
 */
export const { data: stopwords, dataReady: stopwordsReady } =
  useWebExtensionStorage("stopwords", DEFAULT_STOPWORDS);

/**
 * InKCre API base URL (extension-specific, not in core).
 * Used for info-base API calls.
 */
export const { data: inkcreApi, dataReady: inkcreApiReady } =
  useWebExtensionStorage("inkcreApi", "http://127.0.0.1:8000");

/**
 * Re-export for backward compatibility with .value pattern
 * @deprecated Use useConfigStore().config.llmProviders instead
 */
export const { data: llmProviders, dataReady: llmProvidersReady } =
  useWebExtensionStorage("llmProviders", DEFAULT_LLM_PROVIDERS);

/**
 * Default model selection
 * @deprecated Use useConfigStore().config.defaultModel instead
 */
export const { data: defaultModel, dataReady: defaultModelReady } =
  useWebExtensionStorage("defaultModel", "openai-default:gpt-4o-mini");

/**
 * Explain instruction
 * @deprecated Use useConfigStore().config.explainInstruction instead
 */
export const { data: explainInstruction, dataReady: explainInstructionReady } =
  useWebExtensionStorage("explainInstruction", DEFAULT_EXPLAIN_INSTRUCTION);
