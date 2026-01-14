/**
 * Info-Base Resolver System
 *
 * Resolvers provide a unified interface for block content display.
 * Each block specifies its resolver via the `resolver` field.
 * Resolvers can be extended through extensions (Module Federation).
 *
 * Architecture:
 * - Resolver instances are created per-block with optional relations
 * - Each resolver has a contentComp Vue component for rendering
 * - Resolver stores resolver classes statically and provides factory methods
 * - This implementation integrates with Block, Relation, and Storage models
 */

import { ref, type Component, type Ref } from 'vue'
import type { Block } from '../block'
import type { Relation } from '../relation'

// DEBUG
const instanceId = Math.random().toString(36).substring(7)
console.log(`[Core Init] Loading Core module. Instance ID: ${instanceId}`)

// ============================================================================
// Resolver Content State
// ============================================================================

/**
 * State of resolver content fetching.
 * Used by UI wrappers to show loading/error states.
 */
export interface ResolverContentState {
  status: 'idle' | 'loading' | 'success' | 'error'
  error: Error | null
}

// ============================================================================
// Content Component Props
// ============================================================================

/**
 * Props passed to contentComp Vue components.
 * Components receive the resolver instance and pre-resolved content.
 */
export interface ContentCompProps<SolvedContentT = any> {
  /** The resolver instance (provides access to block and relations) */
  resolver: Resolver<any, SolvedContentT>
  solvedContent: SolvedContentT
}

// ============================================================================
// Resolver Base Class (with DB Integration)
// ============================================================================

type ResolverClass = new (block: Block, relations?: Relation[]) => Resolver

/**
 * Base class for resolver implementations with Block, Relation, and Storage integration.
 * Provides common functionality: lazy-loading, caching, state management, and DB access.
 *
 * This class merges the protocol-level BaseResolver with info-base-specific DB integration.
 *
 * Subclasses must:
 * - Set static `type` and `contentComp`
 * - Override `_getSolvedContent()` for content transformation
 *
 * @template RawContentT - The type of raw content from storage
 * @template SolvedContentT - The type of content after processing
 */
export class Resolver<RawContentT = any, SolvedContentT = RawContentT> {
  /** Resolver type identifier */
  static readonly type: string

  /** Vue component for rendering - settable by applications */
  static contentComp: Component

  private static resolverClasses: Map<string, ResolverClass> = new Map()
  private static defaultResolverType: string | null = null

  static register(type: string, resolverClass: ResolverClass): void {
    this.resolverClasses.set(type, resolverClass)
    console.log('[Resolver] Registered resolver:', type)

    if (!this.defaultResolverType) {
      console.log('[Resolver] Set default resolver to:', type)
      this.defaultResolverType = type
    }
  }

  static getClass(type: string): ResolverClass {
    return this.resolverClasses.get(type) || this.resolverClasses.get(this.defaultResolverType!)!
  }

  readonly block: Block
  protected _relations: Relation[] | null

  protected _rawContent: RawContentT | null = null
  readonly solvedContentState: Ref<ResolverContentState> = ref({
    status: 'idle',
    error: null,
  })
  protected _solvedContent: SolvedContentT | null = null

  /**
   * Create a resolver instance for a block.
   * @param block - The block to resolve
   * @param relations - Optional pre-loaded relations (lazy-loads if not provided)
   */
  constructor(block: Block, relations?: Relation[]) {
    this.block = block as Block
    this._relations = relations ?? null // null means not loaded yet

    if (block.storage === null) {
      this._rawContent = block.content as RawContentT
    }
  }

  /**
   * Get relations for this block (lazy-loaded from database).
   * @param options.force - Force reload relations from database
   * @param options.includeIn - Include relations where block is to_ (incoming relations)
   * @param options.includeOut - Include relations where block is from_ (outgoing relations)
   */
  async getRelations(
    options?: { force?: boolean; includeIn?: boolean; includeOut?: boolean } | boolean
  ): Promise<Relation[]> {
    // Handle backward compatibility: boolean parameter is force
    const {
      force = false,
      includeIn = true,
      includeOut = true,
    } = typeof options === 'boolean' ? { force: options } : (options ?? {})

    if (this._relations === null || force) {
      // Dynamic import to avoid circular dependency
      const { Relation } = await import('../relation')
      this._relations = (await Relation.getByBlock(this.block.id)) as Relation[]
    }

    // Filter by direction if needed
    if (!includeIn || !includeOut) {
      return this._relations!.filter((rel) => {
        const isIncoming = rel.to_ === this.block.id
        const isOutgoing = rel.from_ === this.block.id
        if (includeIn && isIncoming) return true
        if (includeOut && isOutgoing) return true
        return false
      })
    }

    return this._relations as Relation[]
  }

  /**
   * Get raw content (lazy-loaded).
   * Fetches from Storage if block.storage is set, otherwise returns block.content.
   */
  async getRawContent(force = false): Promise<RawContentT> {
    if (!this._rawContent || force) {
      if (this.block.storage === null) {
        this._rawContent = this.block.content as RawContentT
      } else {
        // Dynamic import to avoid circular dependency
        const { Storage } = await import('../storages/base')
        const storage = await Storage.get<RawContentT>(this.block.storage)
        this._rawContent = await storage.getRawContent(this.block)
      }
    }
    return this._rawContent
  }

  /**
   * Get solved content (lazy-loading).
   * Manages content state transitions.
   */
  async getSolvedContent(force = false): Promise<SolvedContentT> {
    if (this._solvedContent && !force) {
      return this._solvedContent
    }
    if (this.solvedContentState.value.status === 'loading') {
      // Prevent concurrent loads
      throw new Error('Content is already loading')
    }
    try {
      this.solvedContentState.value.status = 'loading'
      this.solvedContentState.value.error = null
      this._solvedContent = await this._getSolvedContent()
      this.solvedContentState.value.status = 'success'
      return this._solvedContent
    } catch (error) {
      this.solvedContentState.value.status = 'error'
      this.solvedContentState.value.error =
        error instanceof Error ? error : new Error(String(error))
      throw error
    }
  }

  /**
   * Transform raw content into solved content.
   * Override in subclasses to implement specific logic.
   */
  protected _getSolvedContent(): Promise<SolvedContentT> {
    return this.getRawContent() as unknown as Promise<SolvedContentT>
  }

  /**
   * Cleanup when resolver is no longer needed.
   * Override in subclasses if cleanup is required.
   */
  async dispose(): Promise<void> {
    // Override in subclasses if needed
  }
}
