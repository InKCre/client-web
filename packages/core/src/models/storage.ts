import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient } from "../api";
import {
  Storage as ProtocolStorage,
  type StorageClass,
  type StorageTypeRef,
  StorageTypeRefZ,
  StorageRefZ,
  type StorageRef,
  type IStorageBlock,
} from "../protocols/storage";

// ============================================================================
// Storage Type Model
// ============================================================================

export class StorageType extends Z.class({
  id: StorageTypeRefZ,
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
// Storage Model with DB Integration
// ============================================================================

/**
 * Storage class with database integration.
 * Extends protocol Storage with DB persistence.
 */
export class Storage<RawContentT = unknown> extends Z.class({
  id: z.number().optional(),
  type: StorageTypeRefZ,
  nickname: z.string().nullable(),
  config: z.looseObject({}).default({}),
}) {
  private static dbApi: DBAPIClient = new DBAPIClient("storages", Storage);

  /**
   * Get a storage record by ID from the database.
   * Returns an instance of the registered handler class.
   */
  static async get<RawContentT = unknown>(
    id: StorageRef
  ): Promise<ProtocolStorage<RawContentT>> {
    const storageRecord = new Storage(
      (await this.dbApi.from().select().eq("id", id).single()).data!
    );
    const Handler = ProtocolStorage.getHandler(storageRecord.type);
    if (!Handler) {
      throw new Error(
        `No handler registered for storage type: ${storageRecord.type}`
      );
    }
    return new Handler(storageRecord) as ProtocolStorage<RawContentT>;
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
   *
   * @param block - The block to retrieve content for
   * @returns The raw content (type depends on storage handler)
   */
  static async fetchRawContent(block: IStorageBlock): Promise<unknown> {
    if (block.storage === null || block.storage === undefined) {
      return block.content;
    }
    const storage = await Storage.get(block.storage);
    return storage.getRawContent(block);
  }
}

// Re-export protocol types and classes for convenience
export { StorageTypeRefZ, StorageRefZ } from "../protocols/storage";
export type { StorageTypeRef, StorageRef, StorageClass } from "../protocols/storage";
