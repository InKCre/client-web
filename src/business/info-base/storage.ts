/**
 * Storage System for Info-Base Blocks
 *
 * Storages provide a unified interface to retrieve "real" content from block.content.
 * For example, HttpImageStorage fetches image bytes from a URL stored in block.content.
 *
 * Architecture aligned with core-py:
 * - StorageType: defines storage type (id, description, config_schema)
 * - Storage: storage instance (id, type, nickname, config)
 * - StorageHandler: interface for storage implementations
 * - StorageManager: registry and orchestrator for storage handlers
 */

import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient } from "../api";
import type { Block } from "./block";

// ============================================================================
// Storage Type Model (matches core-py storage_types table)
// ============================================================================

export type StorageTypeRef = string;
export const StorageTypeRefZ = z.string();

export class StorageType extends Z.class({
  id: StorageTypeRefZ, // e.g., "http-image", "extensions.xxx.custom"
  description: z.string().optional(),
  config_schema: z.record(z.string(), z.unknown()).optional().default({}),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("storage_types", StorageType, "public");

  static async get(id: StorageTypeRef): Promise<StorageType> {
    return new StorageType(
      (await this.dbApi.from().select().eq("id", id).single()).data!
    );
  }

  static async getAll(): Promise<StorageType[]> {
    return (await this.dbApi.from().select()).data!.map(
      (d) => new StorageType(d)
    );
  }
}

// ============================================================================
// Storage Model (matches core-py storages table)
// ============================================================================

export type StorageRef = number;
export const StorageRefZ = z.number();

export class Storage extends Z.class({
  id: StorageRefZ,
  type: z.string(), // References storage_types.id
  nickname: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("storages", Storage, "public");

  private static cache: Map<StorageRef, Storage> = new Map();

  static async get(id: StorageRef): Promise<Storage> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const storage = new Storage(
      (await this.dbApi.from().select().eq("id", id).single()).data!
    );
    this.cache.set(id, storage);
    return storage;
  }

  static async getAll(): Promise<Storage[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Storage(d));
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Storage Handler Interface
// ============================================================================

/**
 * Interface for storage handler implementations.
 * Each handler knows how to retrieve content for a specific storage type.
 */
export interface StorageHandler<ContentT = unknown> {
  /**
   * The storage type identifier (e.g., "http-image")
   */
  readonly type: string;

  /**
   * Retrieve raw content from block.content using storage configuration.
   * @param block - The block containing the content reference
   * @param config - Storage configuration from the storage instance
   * @returns The retrieved content
   */
  getRawContent(
    block: Block,
    config?: Record<string, unknown>
  ): Promise<ContentT>;
}

// ============================================================================
// Storage Manager
// ============================================================================

/**
 * Central manager for storage handlers.
 * Handles registration, lookup, and content retrieval orchestration.
 */
export class StorageManager {
  private handlers: Map<string, StorageHandler> = new Map();

  /**
   * Register a storage handler for a specific type.
   * @param type - The storage type identifier
   * @param handler - The handler instance
   */
  register(type: string, handler: StorageHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Get a registered handler by type.
   * @param type - The storage type identifier
   * @returns The handler or undefined if not found
   */
  get(type: string): StorageHandler | undefined {
    return this.handlers.get(type);
  }

  /**
   * Check if a handler is registered for a type.
   * @param type - The storage type identifier
   */
  has(type: string): boolean {
    return this.handlers.has(type);
  }

  /**
   * Get all registered storage type identifiers.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Retrieve raw content for a block using its storage configuration.
   * If block has no storage, returns block.content as passthrough.
   *
   * @param block - The block to retrieve content for
   * @returns The raw content (type depends on storage handler)
   */
  async getRawContent(block: Block): Promise<unknown> {
    // No storage configured - passthrough block.content
    if (block.storage === null || block.storage === undefined) {
      return block.content;
    }

    // Get storage configuration
    const storage = await Storage.get(block.storage);
    const handler = this.get(storage.type);

    if (!handler) {
      console.warn(
        `Storage handler for type "${storage.type}" not registered, using passthrough`
      );
      return block.content;
    }

    return handler.getRawContent(block, storage.config);
  }
}

// Global storage manager instance
export const storageManager = new StorageManager();
