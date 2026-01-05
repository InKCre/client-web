/**
 * @inkcre/core
 *
 * Core protocols and utilities for InKCre applications.
 * This package provides environment-agnostic interfaces for:
 * - Extension lifecycle (IExtension)
 * - Content resolution (Resolver, ResolverManager)
 * - Storage abstraction (Storage)
 */

// Store
export { store } from "./store";

// Base utilities
export { zinstance } from "./base";

// Extension System (protocols + Module Federation + Extension model)
export {
  // Extension protocols
  ExtensionState,
  type IExtension,
  type ExtensionRuntimeState,
  // Module Federation
  setMFImplementation,
  getMFImplementation,
  registerRemotes,
  loadRemote,
  isMFInitialized,
  type RemoteConfig,
  type MFImplementation,
  // Extension model (from models)
  Extension,
  InstallExtensionForm,
  type ExtensionRef,
} from "./extension";

// Resolver System (protocols + implementations)
export {
  // Resolver protocols
  type IBlock,
  type IRelation,
  type ResolverContentState,
  type ContentCompProps,
  type IResolver,
  type ResolverClass,
  type AnyResolver,
  type AnyResolverClass,
  ResolverManager,
  resolverManager,
  // Resolver implementations
  Resolver,
  TextResolver,
  ImageResolver,
  VideoResolver,
  HtmlResolver,
} from "./info-base";

// Storage System (protocols + implementations)
export {
  // Storage protocols
  type StorageTypeRef,
  StorageTypeRefZ,
  type StorageRef,
  StorageRefZ,
  type IStorageBlock,
  type StorageClass,
  Storage,
  // HTTP storage implementations
  HttpImageStorage,
  HttpVideoStorage,
  HttpTextStorage,
  HttpHtmlStorage,
  HttpJsonStorage,
  type VideoContent,
  type HtmlContent,
} from "./info-base";

// Configuration
export {
  useConfigStore,
  configStore,
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

// Sinks (as namespace)
export * as sinks from "./sinks";

// Graph utilities and types (re-export for direct import)
export * from "./sinks/graph";
