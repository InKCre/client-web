import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient, CoreAPIClient } from './base'
import { useAuthStore, createAuthStoreAdapter } from '../stores/auth'
import type { BlockRef } from './block'

// Zod schema for Relation
export const RelationZ = z.object({
  id: z.number().optional(),
  updated_at: z.string().optional(),
  from_: z.number(),
  to_: z.number(),
  content: z.string(),
})

export type RelationRef = number
export const RelationProp = RelationZ

// Relation business class extending zod-class
export class Relation extends Z.class(RelationZ) {
  // Declare properties to make them accessible
  declare id?: number
  declare updated_at?: string
  declare from_: number
  declare to_: number
  declare content: string
  // Static API clients
  static dbApi: DBAPIClient
  static coreApi: CoreAPIClient

  // Initialize API clients
  static initializeClients() {
    const authStore = useAuthStore()
    const authAdapter = createAuthStoreAdapter(authStore)
    
    this.dbApi = new DBAPIClient(authAdapter)
    this.coreApi = new CoreAPIClient(authAdapter)
  }

  /**
   * Get all relations from database
   */
  static async getAll(options: {
    select?: string[]
    filter?: Record<string, any>
    order?: string
    limit?: number
    offset?: number
  } = {}): Promise<Relation[]> {
    if (!this.dbApi) this.initializeClients()
    
    const data = await this.dbApi.getRecords(
      'relations',
      options,
      z.array(RelationZ)
    )
    
    return data.map(item => new Relation(item))
  }

  /**
   * Get a single relation by ID
   */
  static async getById(id: RelationRef): Promise<Relation | null> {
    if (!this.dbApi) this.initializeClients()
    
    const data = await this.dbApi.getRecord(
      'relations',
      id,
      {},
      RelationZ
    )
    
    return data ? new Relation(data) : null
  }

  /**
   * Get relations for a specific block
   */
  static async getByBlock(
    blockId: BlockRef,
    direction: 'from' | 'to' | 'both' = 'both'
  ): Promise<Relation[]> {
    if (!this.dbApi) this.initializeClients()
    
    let filter: Record<string, any> = {}
    
    if (direction === 'from') {
      filter = { from_: blockId }
    } else if (direction === 'to') {
      filter = { to_: blockId }
    } else {
      // For 'both', we need to make two requests or use a more complex query
      // Using PostgREST's OR operator
      const fromRelations = await this.dbApi.getRecords(
        'relations',
        { filter: { from_: blockId } },
        z.array(RelationZ)
      )
      
      const toRelations = await this.dbApi.getRecords(
        'relations',
        { filter: { to_: blockId } },
        z.array(RelationZ)
      )
      
      const allRelations = [...fromRelations, ...toRelations]
      // Remove duplicates based on ID
      const uniqueRelations = allRelations.reduce((acc, rel) => {
        if (!acc.find(r => r.id === rel.id)) {
          acc.push(rel)
        }
        return acc
      }, [] as any[])
      
      return uniqueRelations.map(item => new Relation(item))
    }
    
    const data = await this.dbApi.getRecords(
      'relations',
      { filter },
      z.array(RelationZ)
    )
    
    return data.map(item => new Relation(item))
  }

  /**
   * Get outgoing relations (from a block)
   */
  static async getOutgoing(blockId: BlockRef): Promise<Relation[]> {
    return this.getByBlock(blockId, 'from')
  }

  /**
   * Get incoming relations (to a block)
   */
  static async getIncoming(blockId: BlockRef): Promise<Relation[]> {
    return this.getByBlock(blockId, 'to')
  }

  /**
   * Create a new relation
   */
  static async create(data: {
    from_: BlockRef
    to_: BlockRef
    content: string
  }): Promise<Relation> {
    if (!this.dbApi) this.initializeClients()
    
    const result = await this.dbApi.createRecord(
      'relations',
      data,
      RelationZ
    )
    
    return new Relation(result)
  }

  /**
   * Find relations between two blocks
   */
  static async getBetween(
    fromBlockId: BlockRef,
    toBlockId: BlockRef
  ): Promise<Relation[]> {
    if (!this.dbApi) this.initializeClients()
    
    const data = await this.dbApi.getRecords(
      'relations',
      {
        filter: {
          from_: fromBlockId,
          to_: toBlockId
        }
      },
      z.array(RelationZ)
    )
    
    return data.map(item => new Relation(item))
  }

  // Instance methods

  /**
   * Get the relation ID
   */
  getId(): number {
    if (!this.id) {
      throw new Error('Relation has no ID (not persisted)')
    }
    return this.id
  }

  /**
   * Check if this relation is persisted (has an ID)
   */
  isPersisted(): boolean {
    return !!this.id
  }

  /**
   * Save this relation (create or update)
   */
  async save(): Promise<Relation> {
    const constructor = this.constructor as typeof Relation
    if (!constructor.dbApi) constructor.initializeClients()
    
    if (this.isPersisted()) {
      // Update existing relation
      const result = await constructor.dbApi.updateRecord(
        'relations',
        this.getId(),
        {
          from_: this.from_,
          to_: this.to_,
          content: this.content,
        },
        RelationZ
      )
      
      // Update this instance with the returned data
      Object.assign(this, result)
      return this
    } else {
      // Create new relation
      const result = await constructor.dbApi.createRecord(
        'relations',
        {
          from_: this.from_,
          to_: this.to_,
          content: this.content,
        },
        RelationZ
      )
      
      // Update this instance with the returned data (including ID)
      Object.assign(this, result)
      return this
    }
  }

  /**
   * Delete this relation
   */
  async delete(): Promise<void> {
    if (!this.isPersisted()) {
      throw new Error('Cannot delete relation that is not persisted')
    }
    
    const constructor = this.constructor as typeof Relation
    if (!constructor.dbApi) constructor.initializeClients()
    
    await constructor.dbApi.deleteRecord('relations', this.getId())
    
    // Clear the ID to indicate this instance is no longer persisted
    this.id = undefined
  }

  /**
   * Get the source block ID
   */
  getFromBlockId(): BlockRef {
    return this.from_
  }

  /**
   * Get the target block ID
   */
  getToBlockId(): BlockRef {
    return this.to_
  }

  /**
   * Check if this relation connects the given blocks
   */
  connectsBlocks(blockId1: BlockRef, blockId2: BlockRef): boolean {
    return (
      (this.from_ === blockId1 && this.to_ === blockId2) ||
      (this.from_ === blockId2 && this.to_ === blockId1)
    )
  }

  /**
   * Check if this relation is directional from block1 to block2
   */
  isDirectionalTo(fromBlockId: BlockRef, toBlockId: BlockRef): boolean {
    return this.from_ === fromBlockId && this.to_ === toBlockId
  }

  /**
   * Get the other block ID in this relation
   */
  getOtherBlockId(blockId: BlockRef): BlockRef {
    if (this.from_ === blockId) {
      return this.to_
    } else if (this.to_ === blockId) {
      return this.from_
    } else {
      throw new Error(`Block ${blockId} is not part of this relation`)
    }
  }

  /**
   * Convert to plain object
   */
  toPlainObject() {
    return {
      id: this.id,
      updated_at: this.updated_at,
      from_: this.from_,
      to_: this.to_,
      content: this.content,
    }
  }

  /**
   * Clone this relation (without ID)
   */
  clone(): Relation {
    return new Relation({
      from_: this.from_,
      to_: this.to_,
      content: this.content,
      // Don't include id, updated_at
    })
  }

  /**
   * Reverse the direction of this relation
   */
  reverse(): Relation {
    return new Relation({
      from_: this.to_,
      to_: this.from_,
      content: this.content,
    })
  }
}