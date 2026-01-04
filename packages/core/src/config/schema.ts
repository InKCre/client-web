import { z } from "zod";

/**
 * LLM Provider types
 */
export type ProviderType =
  | "openai"
  | "anthropic"
  | "google"
  | "openai-compatible";

/**
 * LLM Provider configuration schema
 */
export const LLMProviderConfigSchema = z.object({
  id: z.string(), // Unique identifier for the provider
  name: z.string(), // Display name (e.g., "My OpenAI")
  type: z.enum(["openai", "anthropic", "google", "openai-compatible"]),
  apiKey: z.string(),
  baseURL: z.string().optional(), // Optional base URL for OpenAI-compatible providers
  models: z.array(z.string()), // List of available models
});

export type LLMProviderConfig = z.infer<typeof LLMProviderConfigSchema>;

/**
 * App configuration schema
 */
export const AppConfigSchema = z.object({
  INKCRE_CORE_URL: z.string().url().default(""),
  INKCRE_PGREST_URL: z.string().url().default(""),
  INKCRE_EXTENSION_REGISTRY_URL: z.string().url().default(""),
  INKCRE_JWT_SECRET: z.string().default(""),
  INKCRE_CLIENT_ID: z.string().uuid().default(""),
});

/**
 * AI configuration schema (from client-webext)
 */
export const AIConfigSchema = z.object({
  llmProviders: z.array(LLMProviderConfigSchema).default([]),
  defaultModel: z.string().default("openai-default:gpt-4o-mini"),
  explainInstruction: z
    .string()
    .default("Explain user given text based on page content in a concise, clear, simple way."),
});

/**
 * Combined configuration schema
 */
export const ConfigSchema = AppConfigSchema.merge(AIConfigSchema);

/**
 * Config type
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Default LLM providers (from client-webext)
 */
export const DEFAULT_LLM_PROVIDERS: LLMProviderConfig[] = [
  {
    id: "openai-default",
    name: "OpenAI",
    type: "openai",
    apiKey: "",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "anthropic-default",
    name: "Anthropic",
    type: "anthropic",
    apiKey: "",
    models: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
  },
  {
    id: "google-default",
    name: "Google Gemini",
    type: "google",
    apiKey: "",
    models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
];

/**
 * Default explain instruction (from client-webext)
 */
export const DEFAULT_EXPLAIN_INSTRUCTION =
  "Explain user given text based on page content in a concise, clear, simple way.";
