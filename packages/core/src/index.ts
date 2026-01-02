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
