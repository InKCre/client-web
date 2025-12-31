/**
 * Resolver System for Info-Base Blocks
 *
 * Resolvers provide a unified interface for block content display.
 * Each block specifies its resolver via the `resolver` field.
 * Resolvers can be extended through extensions (Module Federation).
 *
 * Architecture:
 * - Resolver instances are created per-block with StarGraph support (block + relations)
 * - Each resolver has a contentComp Vue component that handles loading/error states
 * - ResolverManager stores resolver classes and provides factory methods
 */

import { ref, type Component, type Ref } from "vue";
import type { Block } from "./block";
import type { Relation } from "./relation";
import { Storage } from "./storage";

// ============================================================================
// Resolver Content State
// ============================================================================

/**
 * State of resolver content fetching.
 * Used by ResolvedContent wrapper to show appropriate UI.
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
   * Receives ResolvedContentCompProps as props (includes pre-resolved content).
   */
  readonly contentComp: Component<ContentCompProps>;

  /**
   * The block this resolver instance is resolving.
   */
  readonly block: Block;

  /**
   * Current content loading state.
   * Reactive - can be observed by Vue components.
   */
  readonly solvedContentState: Ref<ResolverContentState>;

  /**
   * Get relations for this block (lazy-loaded).
   * Subclasses use this for accessing related blocks in StarGraph.
   */
  getRelations(): Promise<Relation[]>;

  /**
   * Fetch and cache resolved content.
   * Triggers state.status transitions: IDLE -> LOADING -> SUCCESS/ERROR
   * Subsequent calls return cached content unless forceRefresh is true.
   *
   * @param forceRefresh - Force re-fetch even if cached
   * @returns The resolved content
   */
  getSolvedContent(forceRefresh?: boolean): Promise<SolvedContentT>;
}

// ============================================================================
// Base Resolver Class
// ============================================================================

/**
 * Abstract base class for resolver implementations.
 * Provides common functionality, lazy-loading of relations, and content fetching.
 *
 * @template RawContentT - The type of raw content from storage
 * @template SolvedContentT - The type of content after processing
 */
export abstract class BaseResolver<
  RawContentT = string,
  SolvedContentT = RawContentT
> implements Resolver<RawContentT, SolvedContentT>
{
  /** Resolve Type */
  abstract readonly type: string;

  abstract readonly contentComp: Component;

  readonly block: Block;
  private _relations: Relation[] | null;

  private _rawContent: RawContentT | null = null;
  readonly solvedContentState: Ref<ResolverContentState> = ref({
    status: "idle",
    error: null,
  });
  private _solvedContent: SolvedContentT | null = null;

  /**
   * Create a resolver instance for a block.
   * @param block - The block to resolve
   * @param relations - Optional pre-loaded relations (lazy-loads if not provided)
   */
  constructor(block: Block, relations?: Relation[]) {
    this.block = block;
    this._relations = relations ?? null; // null means not loaded yet

    if (block.storage === null) {
      this._rawContent = block.content as RawContentT;
    }
  }

  /**
   * Get relations for this block.
   * Lazy-loads from Relation.getByBlock() if not provided in constructor.
   */
  async getRelations(force = false): Promise<Relation[]> {
    if (this._relations === null || force) {
      // Dynamic import to avoid circular dependency
      const { Relation } = await import("./relation");
      this._relations = await Relation.getByBlock(this.block.id);
    }
    return this._relations;
  }

  /**
   * Get raw content (lazy-loading).
   * Lazy-loads from Storage if not already loaded.
   */
  async getRawContent(force = false): Promise<RawContentT> {
    if (!this._rawContent || force) {
      if (this.block.storage === null) {
        this._rawContent = this.block.content as RawContentT;
      } else {
        const storage = await Storage.get<RawContentT>(this.block.storage);
        this._rawContent = await storage.getRawContent(this.block);
      }
    }
    return this._rawContent;
  }

  /**
   * Get solved content (lazy-loading).
   * Lazy-loads from _getSolvedContent() if not already loaded.
   * Manages content state transitions.
   *
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

  protected abstract _getSolvedContent(): Promise<SolvedContentT>;
}

// ============================================================================
// Resolver Manager
// ============================================================================

// TODO get rid of AnyResolver, add generics throughout like storage

/**
 * Type for resolver classes (constructors).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResolverClass<RawContentT = any, SolvedContentT = any> = new (
  block: Block,
  relations?: Relation[]
) => Resolver<RawContentT, SolvedContentT>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResolver = Resolver<any, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResolverClass = ResolverClass<any, any>;

/**
 * Central manager for resolver registration and lookup.
 * Stores resolver classes and provides factory methods.
 */
export class ResolverManager {
  private resolverClasses: Map<string, AnyResolverClass> = new Map();
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
  getClass(type: string): AnyResolverClass {
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
  createResolver(block: Block, relations?: Relation[]): AnyResolver {
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
