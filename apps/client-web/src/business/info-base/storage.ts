/**
 * Storage System for Info-Base Blocks
 *
 * Storages provide a unified interface to retrieve "real" content from block.content.
 * For example, HttpImageStorage fetches image bytes from a URL stored in block.content.
 *
 * Architecture aligned with core-py:
 * - StorageType: defines storage type (id, description, config_schema)
 * - Storage: storage instance (id, type, nickname, config) + handler implementation
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
  static dbApi: DBAPIClient = new DBAPIClient(
    "storage_types",
    StorageType,
    "public"
  );

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StorageClass = new (...args: any[]) => Storage;

/**
 * Storage class - combines DB model and handler implementation.
 * Subclasses implement _getRawContent to provide type-specific content retrieval.
 *
 * @template RawContentT - The type of content this storage returns
 */
export class Storage<RawContentT = unknown> extends Z.class({
  id: StorageRefZ.optional(),
  type: StorageTypeRefZ, // References storage_types.id
  nickname: z.string().nullable(),
  config: z.looseObject({}).default({}),
}) {
  // ============================================================================
  // Static Registry (Storage Manager)
  // ============================================================================

  private static storageClasses: Map<StorageTypeRef, StorageClass> = new Map();
  private static dbApi: DBAPIClient = new DBAPIClient("storages", Storage);

  /**
   * Decorator for auto-registering storage classes.
   * Usage: @Storage.registry('http-image')
   *
   * @param type - The storage type identifier
   */
  static registry(type: StorageTypeRef) {
    return function <T extends StorageClass>(target: T): T {
      Storage.registerHandler(type, target);
      return target;
    };
  }

  /**
   * Register a storage handler for a specific type.
   * @param type - The storage type identifier
   * @param handler - The handler instance
   */
  static registerHandler(type: StorageTypeRef, handler: StorageClass): void {
    this.storageClasses.set(type, handler);
  }

  /**
   * Get a registered handler by type.
   * @param type - The storage type identifier
   * @returns The handler or undefined if not found
   */
  static getHandler(type: StorageTypeRef): StorageClass | undefined {
    return this.storageClasses.get(type);
  }

  /**
   * Get all registered storage type identifiers.
   */
  static getRegisteredTypes(): StorageTypeRef[] {
    return Array.from(this.storageClasses.keys());
  }

  // ============================================================================
  // Static DB Methods
  // ============================================================================

  /**
   * Get a storage record by ID from the database.
   * @param id - The storage record ID
   */
  static async get<RawContentT = unknown>(
    id: StorageRef
  ): Promise<Storage<RawContentT>> {
    const storageRecord = new Storage(
      (await this.dbApi.from().select().eq("id", id).single()).data!
    );
    const Handler = Storage.getHandler(storageRecord.type);
    if (!Handler) {
      throw new Error(
        `No handler registered for storage type: ${storageRecord.type}`
      );
    }
    return new Handler(storageRecord) as Storage<RawContentT>;
  }

  /**
   * Get all storage records from the database.
   */
  static async getAll(): Promise<Storage[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Storage(d));
  }

  /**
   * Retrieve raw content for a block using its storage configuration.
   * If block has no storage, returns block.content as passthrough.
   * This is a convenience method that handles the full flow.
   *
   * @param block - The block to retrieve content for
   * @returns The raw content (type depends on storage handler)
   */
  static async fetchRawContent(block: Block): Promise<unknown> {
    if (block.storage === null || block.storage === undefined) {
      // No storage configured - passthrough block.content
      return block.content;
    }
    const storage = await Storage.get(block.storage);
    return storage.getRawContent(block);
  }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Retrieve raw content for a block.
   * This method handles state management and delegates to _getRawContent.
   *
   * @param block - The block to retrieve content for
   * @returns The raw content
   */
  async getRawContent(block: Block): Promise<RawContentT> {
    return this._getRawContent(block);
  }

  /**
   * Internal method to retrieve raw content.
   * Subclasses override this to provide type-specific content retrieval.
   * Base implementation returns block.content as passthrough.
   *
   * @param block - The block to retrieve content for
   * @returns The raw content
   */
  protected async _getRawContent(block: Block): Promise<RawContentT> {
    return block.content as RawContentT;
  }
}
