/**
 * Info-Base Resolver Base
 *
 * Extends the protocol BaseResolver with actual Block, Relation, and Storage integration.
 * Apps extend these classes and provide Vue components for rendering.
 */

import {
  BaseResolver as ProtocolBaseResolver,
  type IBlock,
  type IRelation,
} from "../../protocols";
import type { Block } from "../../models/block";
import type { Relation } from "../../models/relation";

/**
 * Base resolver that integrates with actual Block and Relation models.
 * Provides lazy-loading of relations and storage-based content retrieval.
 *
 * Apps should extend this class and provide:
 * - contentComp: Vue component for rendering
 * - _getSolvedContent: Logic for transforming raw content
 */
export abstract class InfoBaseResolver<
  RawContentT = string,
  SolvedContentT = RawContentT
> extends ProtocolBaseResolver<RawContentT, SolvedContentT> {
  declare readonly block: Block; // Narrow type from IBlock to Block

  /**
   * Get relations for this block (lazy-loaded from database).
   */
  async getRelations(force = false): Promise<Relation[]> {
    if (this._relations === null || force) {
      // Dynamic import to avoid circular dependency
      const { Relation } = await import("../../models/relation");
      this._relations = (await Relation.getByBlock(
        this.block.id
      )) as IRelation[];
    }
    return this._relations as Relation[];
  }

  /**
   * Get raw content (lazy-loaded).
   * Fetches from Storage if block.storage is set, otherwise returns block.content.
   */
  async getRawContent(force = false): Promise<RawContentT> {
    if (!this._rawContent || force) {
      if (this.block.storage === null) {
        this._rawContent = this.block.content as RawContentT;
      } else {
        // Dynamic import to avoid circular dependency
        const { Storage } = await import("../../models/storage");
        const storage = await Storage.get<RawContentT>(this.block.storage);
        this._rawContent = await storage.getRawContent(this.block as IBlock);
      }
    }
    return this._rawContent;
  }
}
