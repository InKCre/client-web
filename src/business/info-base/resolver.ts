/**
 * Resolver System for Info-Base Blocks
 *
 * Resolvers provide a unified interface to parse and display different types of block content.
 * Each block specifies its resolver via the `resolver` field.
 * Resolvers can be extended through plugins.
 */

export interface RenderedContent {
  type: "text" | "html" | "markdown";
  html: string;
}

export interface BlockResolver {
  /**
   * Resolve block content into renderable HTML
   * @param content - The raw content string from the block
   * @returns Promise resolving to rendered content
   */
  resolve(content: string): Promise<RenderedContent>;

  /**
   * Generate a preview of the block content (for node display)
   * @param content - The raw content string from the block
   * @param maxLength - Maximum length of preview text (default: 50)
   * @returns Truncated preview string
   */
  preview(content: string, maxLength?: number): string;
}

/**
 * Text Resolver - Default resolver for plain text content
 */
export class TextResolver implements BlockResolver {
  async resolve(content: string): Promise<RenderedContent> {
    return {
      type: "text",
      html: this.escapeHtml(content),
    };
  }

  preview(content: string, maxLength: number = 50): string {
    const trimmed = content.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return trimmed.slice(0, maxLength) + "...";
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Markdown Resolver - Parse and render markdown content
 * Note: For now this is a simplified version. A full implementation would use a markdown parser.
 */
export class MarkdownResolver implements BlockResolver {
  async resolve(content: string): Promise<RenderedContent> {
    // TODO: Integrate a markdown parser library (e.g., marked, markdown-it)
    // For now, just escape HTML and preserve line breaks
    const escapedHtml = this.escapeHtml(content);
    const htmlWithBreaks = escapedHtml.replace(/\n/g, "<br>");

    return {
      type: "markdown",
      html: htmlWithBreaks,
    };
  }

  preview(content: string, maxLength: number = 50): string {
    // Strip common markdown syntax for preview
    const plainText = content
      .replace(/^#+\s+/gm, "") // Remove headers
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Keep link text only
      .replace(/`(.+?)`/g, "$1") // Remove inline code
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }
    return plainText.slice(0, maxLength) + "...";
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Resolver Registry - Central registry for all block resolvers
 */
export class ResolverRegistry {
  private resolvers: Map<string, BlockResolver> = new Map();

  /**
   * Register a new resolver
   * @param name - Resolver name (used in block.resolver field)
   * @param resolver - The resolver instance
   */
  register(name: string, resolver: BlockResolver): void {
    this.resolvers.set(name, resolver);
  }

  /**
   * Get a resolver by name
   * @param name - Resolver name
   * @returns The resolver instance, or TextResolver as fallback
   */
  get(name: string): BlockResolver {
    return this.resolvers.get(name) || this.resolvers.get("text")!;
  }

  /**
   * Check if a resolver is registered
   * @param name - Resolver name
   * @returns true if registered
   */
  has(name: string): boolean {
    return this.resolvers.has(name);
  }

  /**
   * Get all registered resolver names
   * @returns Array of resolver names
   */
  getRegisteredResolvers(): string[] {
    return Array.from(this.resolvers.keys());
  }
}

// Global resolver registry instance
export const resolverRegistry = new ResolverRegistry();

// Register default resolvers
resolverRegistry.register("text", new TextResolver());
resolverRegistry.register("markdown", new MarkdownResolver());
