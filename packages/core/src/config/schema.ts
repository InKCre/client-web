import { z } from 'zod'

/**
 * LLM Provider types
 */
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'openai-compatible'

/**
 * LLM Provider configuration schema
 */
export const LLMProviderConfigSchema = z.object({
  id: z.string(), // Unique identifier for the provider
  name: z.string(), // Display name (e.g., "My OpenAI")
  type: z.enum(['openai', 'anthropic', 'google', 'openai-compatible']),
  apiKey: z.string(),
  baseURL: z.string().optional(), // Optional base URL for OpenAI-compatible providers
  models: z.array(z.string()), // List of available models
})

export type LLMProviderConfig = z.infer<typeof LLMProviderConfigSchema>

/**
 * AI configuration schema (from client-webext)
 */
export const AIConfigSchema = z.object({
  llmProviders: z.array(LLMProviderConfigSchema).default([]),
  defaultModel: z.string().default('openai-default:gpt-4o-mini'),
  explainInstruction: z
    .string()
    .default('Explain user given text based on page content in a concise, clear, simple way.'),
})

/**
 * Meta configuration schema (bootstrap/runtime)
 * Contains URLs and secrets needed to fetch and initialize app config
 */
const UnconfiguredUrlSchema = z.union([z.literal(''), z.url()])
const UnconfiguredClientIdSchema = z.union([z.literal(''), z.uuid()])

export const MetaConfigSchema = z.object({
  INKCRE_PGREST_URL: UnconfiguredUrlSchema.default(''),
  INKCRE_JWT_SECRET: z.string().default(''),
  INKCRE_CLIENT_ID: UnconfiguredClientIdSchema.default(''),
})

export type MetaConfig = z.infer<typeof MetaConfigSchema>

/**
 * App configuration schema (runtime)
 * Contains extension registry URL, AI settings, and runtime app configuration
 */
export const ClientConfigSchema = z.object({
  // Deployment-owned client configuration supplies this URL. Static artifacts
  // deliberately keep the unconfigured state instead of embedding an origin.
  extension_registry_url: UnconfiguredUrlSchema.default(''),
  // A browser peer has no Core REST API of its own. Deployment configuration
  // names the reachable Core peer that owns installation/configuration routes.
  extension_management_peer_id: UnconfiguredClientIdSchema.default(''),
  ai: AIConfigSchema.default(() => AIConfigSchema.parse({})),
})

/**
 * Config type
 */
export type ClientConfig = z.infer<typeof ClientConfigSchema>
