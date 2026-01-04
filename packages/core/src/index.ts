/**
 * @inkcre/core
 *
 * Core protocols and utilities for InKCre applications.
 * This package provides environment-agnostic interfaces for:
 * - Extension lifecycle (IExtension)
 * - Content resolution (Resolver, BaseResolver, ResolverManager)
 * - Storage abstraction (Storage)
 */

// Base utilities
export { zinstance } from "./base";

// Protocols
export {
  // Extension
  ExtensionState,
  type IExtension,
  type ExtensionRuntimeState,
  // Resolver
  type IBlock,
  type IRelation,
  type ResolverContentState,
  type ContentCompProps,
  type Resolver,
  BaseResolver,
  type ResolverClass,
  type AnyResolver,
  type AnyResolverClass,
  ResolverManager,
  resolverManager,
  // Storage
  type StorageTypeRef,
  StorageTypeRefZ,
  type StorageRef,
  StorageRefZ,
  type IStorageBlock,
  type StorageClass,
  Storage,
} from "./protocols";

// Configuration
export {
  CONFIG,
  loadConfig,
  saveConfig,
  resetConfig,
  isConfigValid,
  ConfigSchema,
  AppConfigSchema,
  AIConfigSchema,
  LLMProviderConfigSchema,
  DEFAULT_LLM_PROVIDERS,
  DEFAULT_EXPLAIN_INSTRUCTION,
  localStorageAdapter,
  httpAdapter,
  devAdapter,
  createDevAdapter,
  createWebextAdapter,
  CONFIG_STORAGE_KEY,
  ADAPTER_STORAGE_KEY,
  type Config,
  type ProviderType,
  type LLMProviderConfig,
  type AdapterType,
  type ConfigAdapterWithWrite,
} from "./config";

// Authentication
export { authStore, createAuthStore } from "./auth";

// API Clients
export { APIError, CoreAPIClient, DBAPIClient } from "./api";

// Models
export * from "./models";

// Utils
export {
  unknownProp,
  numericProp,
  truthProp,
  makeRequiredProp,
  makeArrayProp,
  makeBooleanProp,
  makeNumberProp,
  makeNumericProp,
  makeStringProp,
  makeObjectProp,
  useOptionalVModel,
  type XOR,
} from "./utils/vue-props";

// Info-Base Resolvers
export {
  InfoBaseResolver,
  CoreTextResolver,
  CoreImageResolver,
  CoreVideoResolver,
  CoreHtmlResolver,
} from "./info-base";

// Info-Base Storages
export {
  HttpImageStorage,
  HttpVideoStorage,
  HttpTextStorage,
  HttpHtmlStorage,
  HttpJsonStorage,
  type VideoContent,
  type HtmlContent,
} from "./info-base";

// Sinks (as namespace)
export * as sinks from "./sinks";

// Graph utilities and types (re-export for direct import)
export * from "./sinks/graph";

// Module Federation
export { setMFImplementation } from "./module-federation";
