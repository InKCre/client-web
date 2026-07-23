/**
 * @inkcre/core
 *
 * Core protocols and utilities for InKCre applications.
 * This package provides environment-agnostic interfaces for:
 * - Extension lifecycle (ExtensionModule)
 * - Content resolution (Resolver)
 * - Storage abstraction (Storage)
 */

// Core singleton
export { store } from './store'

// Base layer
export { APIError, DBAPIClient } from './base'

// Extension System (protocols + Module Federation + Extension model)
export {
  // Extension lifecycle
  ExtensionState,
  type ExtensionModule,
  type ExtensionRuntimeState,
  // Extension model
  Extension,
  InstallExtensionForm,
  type ExtensionRef,
  // Module Federation
  setMFImplementation,
  getMFImplementation,
  registerRemotes,
  loadRemote,
  isMFInitialized,
  type RemoteConfig,
  type MFImplementation,
  makeExtensionProp,
} from './extension'

// Client
export {
  Client,
  CreateClientForm,
  type ClientRef,
  makeClientProp,
  makeClientRefProp,
} from './client'

// Source
export {
  Source,
  SourceForm,
  SourceType,
  CollectAt,
  SourceCollectJob,
  SourceCollectJobForm,
  SourceCollectJobStatus,
  type SourceRef,
  type SourceTypeRef,
  type SourceCollectJobRef,
  makeSourceProp,
  makeSourceRefProp,
} from './source'

// Observability
export { Log, type LogRef } from './obsrv'

// Info-Base (Blocks, Relations, Storage, Resolvers)
export {
  // Models
  Block,
  BlockForm,
  Relation,
  RelationForm,
  type BlockRef,
  type RelationRef,
  makeBlockProp,
  makeBlockRefProp,
  makeRelationProp,
  makeRelationRefProp,
  // Resolver protocols
  type ResolverContentState,
  type ContentCompProps,
  // Resolver implementations
  Resolver,
  ResolverCache,
  TextResolver,
  ImageResolver,
  VideoResolver,
  HtmlResolver,
  // Storage protocols
  Storage,
  StorageType,
  type StorageTypeRef,
  StorageTypeRefZ,
  type StorageRef,
  StorageRefZ,
  type IStorageBlock,
  // HTTP storage implementations
  HttpImageStorage,
  HttpVideoStorage,
  HttpTextStorage,
  HttpHtmlStorage,
  HttpJsonStorage,
  type VideoContent,
  type HtmlContent,
} from './info-base'

// Sink (Output formatters)
export * from './sink/graph'

// Configuration
export {
  configStore,
  ClientConfigSchema,
  AIConfigSchema,
  LLMProviderConfigSchema,
  localStorageAdapter,
  httpAdapter,
  envAdapter,
  createEnvAdapter,
  createWebextAdapter,
  CONFIG_STORAGE_KEY,
  ADAPTER_STORAGE_KEY,
  type ClientConfig,
  type ProviderType,
  type LLMProviderConfig,
  type AdapterType,
  type ConfigAdapterWithWrite,
  type WebextStorageLike,
} from './config'

// Authentication
export { authStore } from './auth'

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
  zinstance,
} from './utils'

// AI (placeholder)
export * from './libs/ai'
