/**
 * Storage configuration for client-webext
 *
 * Integrates @inkcre/core CONFIG system with WebExtension storage.
 */

import { CONFIG, createWebextAdapter, loadConfig } from "@inkcre/core";
import { useWebExtensionStorage } from "~/composables/useWebExtensionStorage";

// ============================================================================
// Core Configuration Integration
// ============================================================================

/**
 * Initialize core configuration with WebExtension storage adapter.
 * Call this early in the extension lifecycle (e.g., in background script).
 */
export async function initializeConfig() {
  const webextAdapter = createWebextAdapter({
    storageArea: "sync", // Use 'sync' for cross-device sync, 'local' for local-only
  });

  await loadConfig([webextAdapter]);
  console.log("[Client-WebExt] Core configuration loaded");
}

/**
 * Reactive reference to INKCRE_API (from core CONFIG)
 */
export const inkcreApi = {
  get value() {
    return CONFIG.value.INKCRE_API || import.meta.env.VITE_INKCRE_API || "https://api.inkcre.com";
  },
  set value(v: string) {
    CONFIG.value.INKCRE_API = v;
  },
};

// Re-export core config types and defaults for backwards compatibility
export {
  type ProviderType,
  type LLMProviderConfig,
  DEFAULT_LLM_PROVIDERS,
  DEFAULT_EXPLAIN_INSTRUCTION,
} from "@inkcre/core";

/**
 * Reactive reference to llmProviders (from core CONFIG)
 */
export const llmProviders = {
  get value() {
    return CONFIG.value.llmProviders;
  },
  set value(v) {
    CONFIG.value.llmProviders = v;
  },
};

/**
 * Reactive reference to explainInstruction (from core CONFIG)
 */
export const explainInstruction = {
  get value() {
    return CONFIG.value.explainInstruction || DEFAULT_EXPLAIN_INSTRUCTION;
  },
  set value(v: string) {
    CONFIG.value.explainInstruction = v;
  },
};

// ============================================================================
// Extension-Specific Storage (Stopwords)
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
