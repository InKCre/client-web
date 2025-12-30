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

import type { Component } from "vue";
import type { Block } from "./block";
import type { Relation } from "./relation";

// ============================================================================
// Content Component Props
// ============================================================================

/**
 * Props passed to contentComp Vue components.
 * Components receive the resolver instance and handle their own loading/error states.
 */
export interface ContentCompProps {
  /** The resolver instance (provides access to block and relations) */
  resolver: Resolver;
  /** Whether the node is currently selected */
  isSelected?: boolean;
  /** Maximum width for the component (in px) */
  maxWidth?: number;
  /** Maximum height for the component (in px) */
  maxHeight?: number;
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
   * Receives ContentCompProps as props.
   * Handles its own loading/error states internally.
   */
  readonly contentComp: Component;

  /**
   * The block this resolver instance is resolving.
   */
  readonly block: Block;

  /**
   * Get relations for this block (lazy-loaded).
   * Subclasses use this for accessing related blocks in StarGraph.
   */
  getRelations(): Promise<Relation[]>;
}

// ============================================================================
// Base Resolver Class
// ============================================================================

/**
 * Abstract base class for resolver implementations.
 * Provides common functionality and lazy-loading of relations.
 *
 * @template RawContentT - The type of raw content from storage
 * @template SolvedContentT - The type of content after processing
 */
export abstract class BaseResolver<
  RawContentT = string,
  SolvedContentT = RawContentT,
> implements Resolver<RawContentT, SolvedContentT>
{
  abstract readonly type: string;
  abstract readonly contentComp: Component;

  readonly block: Block;
  private _relations: Relation[] | null;

  /**
   * Create a resolver instance for a block.
   * @param block - The block to resolve
   * @param relations - Optional pre-loaded relations (lazy-loads if not provided)
   */
  constructor(block: Block, relations?: Relation[]) {
    this.block = block;
    this._relations = relations ?? null; // null means not loaded yet
  }

  /**
   * Get relations for this block.
   * Lazy-loads from Relation.getByBlock() if not provided in constructor.
   */
  async getRelations(): Promise<Relation[]> {
    if (this._relations === null) {
      // Dynamic import to avoid circular dependency
      const { Relation } = await import("./relation");
      this._relations = await Relation.getByBlock(this.block.id);
    }
    return this._relations!;
  }

  /**
   * Utility method to escape HTML in text content.
   */
  protected escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Utility method to truncate text with ellipsis.
   */
  protected truncate(text: string, maxLength: number = 50): string {
    const trimmed = text.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return trimmed.slice(0, maxLength) + "...";
  }
}

// ============================================================================
// Resolver Manager
// ============================================================================

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
