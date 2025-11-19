import { z } from 'zod'
import { DBAPIClient, CoreAPIClient } from './base'
import { useAuthStore, createAuthStoreAdapter } from '../stores/auth'

// Zod schema for Block
export const BlockZ = z.object({
  id: z.number().optional(),
  updated_at: z.string().optional(),
  storage: z.enum(['url']).nullable().optional(),
  resolver: z.string(),
  content: z.string(),
  embedding: z.array(z.number()).nullable().optional(),
})

export type BlockRef = number
export type BlockType = z.infer<typeof BlockZ>
export const BlockProp = BlockZ

// Block business class
export class Block {
  id?: number
  updated_at?: string
  storage?: 'url' | null
  resolver: string
  content: string
  embedding?: number[] | null

  // Static API clients
  static dbApi: DBAPIClient
  static coreApi: CoreAPIClient

  constructor(data: Partial<BlockType>) {
    // Validate input data with Zod
    const validated = BlockZ.partial().parse(data)
    
    // Assign validated data to instance
    Object.assign(this, validated)
    
    // Ensure required fields
    if (!this.resolver) this.resolver = ''
    if (!this.content) this.content = ''
  }
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
   * Get all blocks from database
   */
  static async getAll(options: {
    select?: string[]
    filter?: Record<string, any>
    order?: string
    limit?: number
    offset?: number
  } = {}): Promise<Block[]> {
    if (!this.dbApi) this.initializeClients()
    
    const data = await this.dbApi.getRecords(
      'blocks',
      options,
      z.array(BlockZ)
    )
    
    return data.map(item => new Block(item))
  }

  /**
   * Get a single block by ID
   */
  static async getById(id: BlockRef): Promise<Block | null> {
    if (!this.dbApi) this.initializeClients()
    
    const data = await this.dbApi.getRecord(
      'blocks',
      id,
      {},
      BlockZ
    )
    
    return data ? new Block(data) : null
  }

  /**
   * Create a new block
   */
  static async create(data: {
    resolver: string
    content: string
    storage?: 'url' | null
  }): Promise<Block> {
    if (!this.dbApi) this.initializeClients()
    
    const result = await this.dbApi.createRecord(
      'blocks',
      data,
      BlockZ
    )
    
    return new Block(result)
  }

  /**
   * Search blocks using embedding (Core API)
   */
  static async search(query: string, options: { limit?: number } = {}): Promise<Block[]> {
    if (!this.coreApi) this.initializeClients()
    
    // Assuming the core API returns blocks in a compatible format
    const results = await this.coreApi.searchBlocks(
      query,
      options,
      z.object({
        blocks: z.array(BlockZ)
      })
    )
    
    return results.blocks.map((item: any) => new Block(item))
  }

  /**
   * Get related blocks through graph traversal (Core API)
   */
  static async getRelated(
    blockId: BlockRef,
    options: { depth?: number; limit?: number } = {}
  ): Promise<Block[]> {
    if (!this.coreApi) this.initializeClients()
    
    const results = await this.coreApi.getRelatedBlocks(
      blockId,
      options,
      z.object({
        blocks: z.array(BlockZ)
      })
    )
    
    return results.blocks.map((item: any) => new Block(item))
  }

  /**
   * Generate embedding for content (Core API)
   */
  static async generateEmbedding(content: string): Promise<number[]> {
    if (!this.coreApi) this.initializeClients()
    
    return await this.coreApi.generateEmbedding(content)
  }

  // Instance methods

  /**
   * Get the block ID
   */
  getId(): number {
    if (!this.id) {
      throw new Error('Block has no ID (not persisted)')
    }
    return this.id
  }

  /**
   * Check if this block is persisted (has an ID)
   */
  isPersisted(): boolean {
    return !!this.id
  }

  /**
   * Save this block (create or update)
   */
  async save(): Promise<Block> {
    const constructor = this.constructor as typeof Block
    if (!constructor.dbApi) constructor.initializeClients()
    
    if (this.isPersisted()) {
      // Update existing block
      const result = await constructor.dbApi.updateRecord(
        'blocks',
        this.getId(),
        {
          resolver: this.resolver,
          content: this.content,
          storage: this.storage,
        },
        BlockZ
      )
      
      // Update this instance with the returned data
      Object.assign(this, result)
      return this
    } else {
      // Create new block
      const result = await constructor.dbApi.createRecord(
        'blocks',
        {
          resolver: this.resolver,
          content: this.content,
          storage: this.storage,
        },
        BlockZ
      )
      
      // Update this instance with the returned data (including ID)
      Object.assign(this, result)
      return this
    }
  }

  /**
   * Delete this block
   */
  async delete(): Promise<void> {
    if (!this.isPersisted()) {
      throw new Error('Cannot delete block that is not persisted')
    }
    
    const constructor = this.constructor as typeof Block
    if (!constructor.dbApi) constructor.initializeClients()
    
    await constructor.dbApi.deleteRecord('blocks', this.getId())
    
    // Clear the ID to indicate this instance is no longer persisted
    this.id = undefined
  }

  /**
   * Generate embedding for this block's content
   */
  async generateEmbedding(): Promise<void> {
    const constructor = this.constructor as typeof Block
    if (!constructor.coreApi) constructor.initializeClients()
    
    const embedding = await constructor.coreApi.generateEmbedding(this.content)
    this.embedding = embedding
  }

  /**
   * Get related blocks for this block
   */
  async getRelated(options: { depth?: number; limit?: number } = {}): Promise<Block[]> {
    if (!this.isPersisted()) {
      throw new Error('Cannot get related blocks for unpersisted block')
    }
    
    const constructor = this.constructor as typeof Block
    return constructor.getRelated(this.getId(), options)
  }

  /**
   * Convert to plain object
   */
  toPlainObject() {
    return {
      id: this.id,
      updated_at: this.updated_at,
      storage: this.storage,
      resolver: this.resolver,
      content: this.content,
      embedding: this.embedding,
    }
  }

  /**
   * Clone this block (without ID)
   */
  clone(): Block {
    return new Block({
      resolver: this.resolver,
      content: this.content,
      storage: this.storage,
      // Don't include id, updated_at, embedding
    })
  }
}