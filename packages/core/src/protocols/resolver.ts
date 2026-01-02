/**
 * Resolver System Protocol
 *
 * Resolvers provide a unified interface for block content display.
 * Each block specifies its resolver via the `resolver` field.
 * Resolvers can be extended through extensions (Module Federation).
 *
 * Architecture:
 * - Resolver instances are created per-block with optional relations
 * - Each resolver has a contentComp Vue component for rendering
 * - ResolverManager stores resolver classes and provides factory methods
 */

import { ref, type Component, type Ref } from "vue";

// ============================================================================
// Block Interface (minimal, for type compatibility)
// ============================================================================

/**
 * Minimal block interface for resolver compatibility.
 * The full Block class is defined in the application.
 */
export interface IBlock {
  id: number;
  storage: number | null;
  resolver: string;
  content: string;
}

/**
 * Minimal relation interface for resolver compatibility.
 */
export interface IRelation {
  id: number;
  from_: number;
  to_: number;
  content: string;
}

// ============================================================================
// Resolver Content State
// ============================================================================

/**
 * State of resolver content fetching.
 * Used by UI wrappers to show loading/error states.
 */
export interface ResolverContentState {
  status: "idle" | "loading" | "success" | "error";
  error: Error | null;
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
  resolver: Resolver<any, SolvedContentT>;
  solvedContent: SolvedContentT;
}

// ============================================================================
// Resolver Interface
// ============================================================================

/**
 * Interface for block resolvers.
 * Each resolver handles a specific content type (text, image, video, html, tweet, etc.)
 *
 * @template RawContentT - The type of raw content from storage
 * @template SolvedContentT - The type of content after processing (defaults to RawContentT)
 */
export interface Resolver<RawContentT = string, SolvedContentT = RawContentT> {
  /**
   * The resolver type identifier (e.g., "text", "image", "video", "html", "tweet")
   * Used for registration and lookup.
   */
  readonly type: string;

  /**
   * Vue component for rendering block content.
   * Receives ContentCompProps as props (includes pre-resolved content).
   */
  readonly contentComp: Component<ContentCompProps>;

  /**
   * The block this resolver instance is resolving.
   */
  readonly block: IBlock;

  /**
   * Current content loading state.
   * Reactive - can be observed by Vue components.
   */
  readonly solvedContentState: Ref<ResolverContentState>;

  /**
   * Get relations for this block (lazy-loaded).
   * Subclasses use this for accessing related blocks.
   */
  getRelations(): Promise<IRelation[]>;

  /**
   * Fetch and cache resolved content.
   * Triggers state.status transitions: IDLE -> LOADING -> SUCCESS/ERROR
   * Subsequent calls return cached content unless forceRefresh is true.
   *
   * @param forceRefresh - Force re-fetch even if cached
   * @returns The resolved content
   */
  getSolvedContent(forceRefresh?: boolean): Promise<SolvedContentT>;

  /**
   * Consumer of resolver should call dispose when done with it.
   */
  dispose(): Promise<void>;
}

// ============================================================================
// Base Resolver Class
// ============================================================================

/**
 * Abstract base class for resolver implementations.
 * Provides common functionality: lazy-loading, caching, and state management.
 *
 * Subclasses must:
 * - Set `type` and `contentComp`
 * - Override `_getSolvedContent()` for content transformation
 * - Optionally override `getRawContent()` for custom storage handling
 *
 * @template RawContentT - The type of raw content from storage
 * @template SolvedContentT - The type of content after processing
 */
export abstract class BaseResolver<
  RawContentT = string,
  SolvedContentT = RawContentT
> implements Resolver<RawContentT, SolvedContentT>
{
  /** Resolver type identifier */
  abstract readonly type: string;

  /** Vue component for rendering */
  abstract readonly contentComp: Component;

  readonly block: IBlock;
  protected _relations: IRelation[] | null;

  protected _rawContent: RawContentT | null = null;
  readonly solvedContentState: Ref<ResolverContentState> = ref({
    status: "idle",
    error: null,
  });
  protected _solvedContent: SolvedContentT | null = null;

  /**
   * Create a resolver instance for a block.
   * @param block - The block to resolve
   * @param relations - Optional pre-loaded relations (lazy-loads if not provided)
   */
  constructor(block: IBlock, relations?: IRelation[]) {
    this.block = block;
    this._relations = relations ?? null; // null means not loaded yet

    if (block.storage === null) {
      this._rawContent = block.content as RawContentT;
    }
  }

  /**
   * Get relations for this block.
   * Override in application-level subclass to implement lazy-loading.
   */
  async getRelations(_force = false): Promise<IRelation[]> {
    return this._relations ?? [];
  }

  /**
   * Get raw content (lazy-loading).
   * Override in application-level subclass to implement storage loading.
   */
  async getRawContent(force = false): Promise<RawContentT> {
    if (!this._rawContent || force) {
      if (this.block.storage === null) {
        this._rawContent = this.block.content as RawContentT;
      } else {
        // Subclass must override for storage-based content
        throw new Error(
          "getRawContent must be overridden for blocks with storage"
        );
      }
    }
    return this._rawContent;
  }

  /**
   * Get solved content (lazy-loading).
   * Manages content state transitions.
   */
  async getSolvedContent(force = false): Promise<SolvedContentT> {
    if (this._solvedContent && !force) {
      return this._solvedContent;
    }
    if (this.solvedContentState.value.status === "loading") {
      // Prevent concurrent loads
      throw new Error("Content is already loading");
    }
    try {
      this.solvedContentState.value.status = "loading";
      this.solvedContentState.value.error = null;
      this._solvedContent = await this._getSolvedContent();
      this.solvedContentState.value.status = "success";
      return this._solvedContent;
    } catch (error) {
      this.solvedContentState.value.status = "error";
      this.solvedContentState.value.error =
        error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Transform raw content into solved content.
   * Subclasses must implement this method.
   */
  protected abstract _getSolvedContent(): Promise<SolvedContentT>;

  /**
   * Cleanup when resolver is no longer needed.
   * Override in subclasses if cleanup is required.
   */
  async dispose(): Promise<void> {
    // Override in subclasses if needed
  }
}

// ============================================================================
// Resolver Manager
// ============================================================================

/**
 * Type for resolver classes (constructors).
 */
export type ResolverClass<RawContentT = any, SolvedContentT = any> = new (
  block: IBlock,
  relations?: IRelation[]
) => Resolver<RawContentT, SolvedContentT>;

export type AnyResolver = Resolver<any, any>;
export type AnyResolverClass = ResolverClass<any, any>;

/**
 * Central manager for resolver registration and lookup.
 * Stores resolver classes and provides factory methods.
 */
export class ResolverManager {
  private resolverClasses: Map<string, ResolverClass> = new Map();
  private defaultResolverType: string | null = null;

  /**
   * Decorator for auto-registering resolver classes.
   * Usage: @ResolverManager.registry('tweet')
   *
   * @param type - The resolver type identifier
   */
  static registry(type: string) {
    return function <T extends AnyResolverClass>(target: T): T {
      resolverManager.register(type, target);
      return target;
    };
  }

  /**
   * Register a resolver class.
   * @param type - The type identifier
   * @param resolverClass - The resolver class (constructor)
   */
  register(type: string, resolverClass: AnyResolverClass): void {
    this.resolverClasses.set(type, resolverClass);

    // First registered resolver becomes default
    if (!this.defaultResolverType) {
      this.defaultResolverType = type;
    }
  }

  /**
   * Set the default resolver type used when lookup fails.
   * @param type - The type of the resolver to use as default
   */
  setDefault(type: string): void {
    if (this.resolverClasses.has(type)) {
      this.defaultResolverType = type;
    }
  }

  /**
   * Get a resolver class by type.
   * Returns default resolver class if not found.
   * @param type - The resolver type identifier
   */
  getClass(type: string): ResolverClass {
    return (
      this.resolverClasses.get(type) ||
      this.resolverClasses.get(this.defaultResolverType!)!
    );
  }

  /**
   * Create a resolver instance for a block.
   * @param block - The block to resolve
   * @param relations - Optional pre-loaded relations
   */
  createResolver(block: IBlock, relations?: IRelation[]): AnyResolver {
    const ResolverCls = this.getClass(block.resolver);
    return new ResolverCls(block, relations);
  }

  /**
   * Check if a resolver type is registered.
   * @param type - The resolver type identifier
   */
  has(type: string): boolean {
    return this.resolverClasses.has(type);
  }

  /**
   * Get all registered resolver types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.resolverClasses.keys());
  }
}

// Global resolver manager instance
export const resolverManager = new ResolverManager();
