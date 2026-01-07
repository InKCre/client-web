/**
 * Configuration module - Pinia-based config store
 *
 * This module provides a Pinia store for managing application configuration,
 * separated into MetaConfig (bootstrap) and ClientConfig (runtime) as distinct state items.
 *
 * **MetaConfig** (State: `metaConfig`): Contains bootstrap configuration needed to initialize the app
 * - INKCRE_PGREST_URL: PostgreSQL/PostgREST base URL
 * - INKCRE_JWT_SECRET: JWT signing secret
 * - INKCRE_CLIENT_ID: Current client UUID
 *
 * **ClientConfig** (State: `config`): Contains runtime application configuration
 * - extension_registry_url: Extension registry URL
 * - ai:
 *   - llmProviders: LLM provider configurations
 *   - defaultModel: Default LLM model
 *   - explainInstruction: Explain feature instruction
 *
 * Use `useConfigStore()` to access and modify config.
 *
 * @example
 * ```typescript
 * import { useConfigStore, localStorageAdapter } from "@inkcre/core";
 *
 * const configStore = useConfigStore();
 *
 * // Load config (both metaConfig and config)
 * await configStore.load([localStorageAdapter]);
 *
 * // Read MetaConfig
 * const pgUrl = configStore.metaConfig.INKCRE_PGREST_URL;
 * const clientId = configStore.metaConfig.INKCRE_CLIENT_ID;
 *
 * // Read ClientConfig
 * const registryUrl = configStore.clientConfig.extension_registry_url;
 * const models = configStore.clientConfig.ai.llmProviders;
 * const defaultModel = configStore.clientConfig.ai.defaultModel;
 *
 * // Write ClientConfig
 * configStore.clientConfig.ai.defaultModel = "claude-3-opus";
 *
 * // Save config (saves both metaConfig and config)
 * await configStore.save(localStorageAdapter);
 * ```
 */

// Export store
export { useConfigStore, configStore } from './store'

// Re-export everything from other config modules
export * from './schema'
export * from './types'
export * from './adapters'
