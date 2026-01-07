/**
 * @inkcre/core
 *
 * Core protocols and utilities for InKCre applications.
 * This package provides environment-agnostic interfaces for:
 * - Extension lifecycle (IExtension)
 * - Content resolution (Resolver)
 * - Storage abstraction (Storage)
 */

// Core singleton
export { store } from './store'

// Base layer
export { APIError, DBAPIClient, CoreAPIClient } from './base'

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
  // Extension model
  Extension,
  InstallExtensionForm,
  type ExtensionRef,
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
  Relation,
  Storage as StorageModel,
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
  TextResolver,
  ImageResolver,
  VideoResolver,
  HtmlResolver,
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
} from './info-base'

// Sink (Output formatters)
export {
  LayoutType,
  TopologyType,
  topologyToLayout,
  DEFAULT_DAGRE_CONFIG,
  LayoutDirection,
  DEFAULT_CIRCULAR_CONFIG,
  DEFAULT_RADIAL_CONFIG,
  DEFAULT_FORCE_CONFIG,
  DEFAULT_GRID_CONFIG,
  classicalMDS,
  computeIntraCommunityDistances,
  computeInterCommunityDistances,
  blockToNode,
  relationToEdge,
} from './sink/graph'

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
} from './config'

// Authentication
export { authStore, createAuthStore } from './auth'

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
