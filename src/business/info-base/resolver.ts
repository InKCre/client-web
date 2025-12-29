/**
 * Resolver System for Info-Base Blocks
 *
 * Resolvers provide a unified interface to parse, display, and render block content.
 * Each block specifies its resolver via the `resolver` field.
 * Resolvers can be extended through extensions (Module Federation).
 *
 * Architecture aligned with core-py:
 * - Resolver interface with type, getText(), preview(), resolve()
 * - ResolverManager for registration and lookup
 * - Frontend-specific: inGraph component for graph node rendering
 */

import type { Component } from "vue";
import type { Block } from "./block";
import { storageManager } from "./storage";

// ============================================================================
// Rendered Content Types
// ============================================================================

export interface RenderedContent {
  type: "text" | "html" | "markdown";
  html: string;
}

// ============================================================================
// InGraph Component Props
// ============================================================================

/**
 * Props passed to inGraph Vue components.
 * These components render block content within graph nodes.
 */
export interface InGraphProps<RawContentT = unknown> {
  /** The block being rendered */
  block: Block;
  /** Raw content after storage retrieval */
  rawContent: RawContentT;
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
 * Each resolver handles a specific content type (text, image, video, html, etc.)
 *
 * Generic parameter RawContentT represents the type of content after storage retrieval.
 * For text resolver, this is typically string.
 * For image resolver, this could be ImageContent from storage.
 */
export interface Resolver<RawContentT = string> {
  /**
   * The resolver type identifier (e.g., "text", "image", "video", "html")
   * Used for registration and lookup.
   */
  readonly type: string;

  /**
   * Vue component for rendering in graph nodes.
   * Receives InGraphProps as props.
   */
  readonly inGraph: Component;

  /**
   * Get raw content for a block.
   * Uses storage if configured, otherwise returns block.content.
   * @param block - The block to get content for
   */
  getRawContent(block: Block): Promise<RawContentT>;

  /**
   * Get text representation of the content.
   * Used for search, indexing, and accessibility.
   * @param rawContent - The raw content after storage retrieval
   */
  getText(rawContent: RawContentT): string;

  /**
   * Generate a preview string for node display.
   * @param rawContent - The raw content after storage retrieval
   * @param maxLength - Maximum length of preview text (default: 50)
   */
  preview(rawContent: RawContentT, maxLength?: number): string;

  /**
   * Resolve content into renderable HTML.
   * Used for detail panels and full content display.
   * @param rawContent - The raw content after storage retrieval
   */
  resolve(rawContent: RawContentT): Promise<RenderedContent>;
}

// ============================================================================
// Base Resolver Class
// ============================================================================

/**
 * Abstract base class for resolver implementations.
 * Provides common functionality and default implementations.
 */
export abstract class BaseResolver<RawContentT = string>
  implements Resolver<RawContentT>
{
  abstract readonly type: string;
  abstract readonly inGraph: Component;

  /**
   * Default implementation uses storageManager to get raw content.
   * Override if resolver needs custom content retrieval logic.
   */
  async getRawContent(block: Block): Promise<RawContentT> {
    return (await storageManager.getRawContent(block)) as RawContentT;
  }

  abstract getText(rawContent: RawContentT): string;
  abstract preview(rawContent: RawContentT, maxLength?: number): string;
  abstract resolve(rawContent: RawContentT): Promise<RenderedContent>;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResolver = Resolver<any>;

/**
 * Central manager for resolver registration and lookup.
 * Aligned with core-py's ResolverManager.
 */
export class ResolverManager {
  private resolvers: Map<string, AnyResolver> = new Map();
  private defaultResolver: AnyResolver | null = null;

  /**
   * Register a resolver.
   * @param resolver - The resolver instance (uses resolver.type as key)
   */
  register(resolver: AnyResolver): void {
    this.resolvers.set(resolver.type, resolver);

    // First registered resolver becomes default
    if (!this.defaultResolver) {
      this.defaultResolver = resolver;
    }
  }

  /**
   * Register a resolver with explicit type key.
   * @param type - The type identifier
   * @param resolver - The resolver instance
   */
  registerWithType(type: string, resolver: AnyResolver): void {
    this.resolvers.set(type, resolver);

    if (!this.defaultResolver) {
      this.defaultResolver = resolver;
    }
  }

  /**
   * Set the default resolver used when lookup fails.
   * @param type - The type of the resolver to use as default
   */
  setDefault(type: string): void {
    const resolver = this.resolvers.get(type);
    if (resolver) {
      this.defaultResolver = resolver;
    }
  }

  /**
   * Get a resolver by type.
   * Returns default resolver (typically "text") if not found.
   * @param type - The resolver type identifier
   */
  get(type: string): AnyResolver {
    return this.resolvers.get(type) || this.defaultResolver!;
  }

  /**
   * Check if a resolver is registered.
   * @param type - The resolver type identifier
   */
  has(type: string): boolean {
    return this.resolvers.has(type);
  }

  /**
   * Get all registered resolver types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.resolvers.keys());
  }

  /**
   * Find resolvers that can handle specific content.
   * Useful for auto-detection of resolver type.
   */
  findByContent(content: string): AnyResolver[] {
    // For now, return all resolvers. Extensions can implement
    // more sophisticated content-based matching.
    return Array.from(this.resolvers.values());
  }
}

// Global resolver manager instance
export const resolverManager = new ResolverManager();

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use Resolver interface instead
 */
export type BlockResolver = Resolver;

/**
 * @deprecated Use ResolverManager instead
 */
export class ResolverRegistry extends ResolverManager {
  /**
   * @deprecated Use register(resolver) or registerWithType(type, resolver)
   */
  registerLegacy(name: string, resolver: Resolver): void {
    this.registerWithType(name, resolver);
  }
}
