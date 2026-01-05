/**
 * Info-Base Storage System
 *
 * Storages provide a unified interface to retrieve "real" content from block.content.
 * For example, HttpImageStorage fetches image bytes from a URL stored in block.content.
 *
 * This module defines the Storage class and registry pattern.
 */

import { z } from "zod";

// ============================================================================
// Storage Type References
// ============================================================================

export type StorageTypeRef = string;
export const StorageTypeRefZ = z.string();

export type StorageRef = number;
export const StorageRefZ = z.number();

// ============================================================================
// Block Interface (minimal, for type compatibility)
// ============================================================================

/**
 * Minimal block interface for storage compatibility.
 */
export interface IStorageBlock {
  id: number;
  storage: number | null;
  content: string;
}

// ============================================================================
// Storage Class
// ============================================================================

export type StorageClass = new (...args: any[]) => Storage;

/**
 * Abstract storage class - provides registry pattern and interface.
 *
 * Subclasses implement _getRawContent to provide type-specific content retrieval.
 *
 * @template RawContentT - The type of content this storage returns
 */
export abstract class Storage<RawContentT = unknown> {
  // Storage record data
  readonly id?: StorageRef;
  readonly type: StorageTypeRef;
  readonly nickname: string | null;
  readonly config: Record<string, unknown>;

  // ============================================================================
  // Static Registry (Storage Manager)
  // ============================================================================

  private static storageClasses: Map<StorageTypeRef, StorageClass> = new Map();

  /**
   * Decorator for auto-registering storage classes.
   * Usage: @Storage.registry('http_image')
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
   * @param handler - The handler class
   */
  static registerHandler(type: StorageTypeRef, handler: StorageClass): void {
    this.storageClasses.set(type, handler);
  }

  /**
   * Get a registered handler by type.
   * @param type - The storage type identifier
   * @returns The handler class or undefined if not found
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
  // Constructor
  // ============================================================================

  constructor(data: {
    id?: StorageRef;
    type: StorageTypeRef;
    nickname?: string | null;
    config?: Record<string, unknown>;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.nickname = data.nickname ?? null;
    this.config = data.config ?? {};
  }

  // ============================================================================
  // Instance Methods
  // ============================================================================

  /**
   * Retrieve raw content for a block.
   * This method delegates to _getRawContent.
   *
   * @param block - The block to retrieve content for
   * @returns The raw content
   */
  async getRawContent(block: IStorageBlock): Promise<RawContentT> {
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
  protected async _getRawContent(block: IStorageBlock): Promise<RawContentT> {
    return block.content as RawContentT;
  }
}
