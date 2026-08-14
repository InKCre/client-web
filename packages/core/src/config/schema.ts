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
const GeneratedClientIdSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.uuid().default(() => crypto.randomUUID())
)

const CurrentMetaConfigSchema = z.object({
  INKCRE_PGREST_URL: UnconfiguredUrlSchema.default(''),
  INKCRE_JWT_SECRET: z.string().default(''),
  client_id: GeneratedClientIdSchema,
})

/**
 * Browser bootstrap configuration.
 *
 * `INKCRE_CLIENT_ID` was once a manually supplied environment-style value. A
 * browser now owns its stable identity, while this preprocessor preserves an
 * already configured origin during migration.
 */
export const MetaConfigSchema = z.preprocess((value) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value

  const input = value as Record<string, unknown>
  if (input.client_id !== undefined || input.INKCRE_CLIENT_ID === undefined) return input
  return { ...input, client_id: input.INKCRE_CLIENT_ID }
}, CurrentMetaConfigSchema)

export type MetaConfig = z.infer<typeof MetaConfigSchema>

/**
 * App configuration schema (runtime)
 * Contains extension registry URL, AI settings, and runtime app configuration
 */
export const ClientConfigSchema = z.object({
  // Deployment-owned client configuration supplies this URL. Static artifacts
  // deliberately keep the unconfigured state instead of embedding an origin.
  extension_registry_url: UnconfiguredUrlSchema.default(''),
  ai: AIConfigSchema.default(() => AIConfigSchema.parse({})),
})

/**
 * Config type
 */
export type ClientConfig = z.infer<typeof ClientConfigSchema>
