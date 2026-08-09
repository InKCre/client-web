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
 * - extension_management_peer_id: reachable Core peer for Registry management APIs
 * - ai:
 *   - llmProviders: LLM provider configurations
 *   - defaultModel: Default LLM model
 *   - explainInstruction: Explain feature instruction
 *
 * Use `configStore` to access and modify config.
 */

// Export store
export { useConfigStore, configStore } from './store'

// Re-export everything from other config modules
export * from './schema'
export * from './types'
export * from './adapters'
