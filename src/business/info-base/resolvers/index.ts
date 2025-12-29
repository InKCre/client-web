/**
 * Built-in Resolvers Registration
 *
 * This module exports all built-in resolvers and provides
 * a function to register them with the global ResolverManager.
 */

import { resolverManager } from "../resolver";
import { TextResolver } from "./text";
import { ImageResolver } from "./image";
import { VideoResolver } from "./video";
import { HtmlResolver } from "./html";

// Export resolver classes for external use
export { TextResolver, ImageResolver, VideoResolver, HtmlResolver };

// Export content types
export type { ImageRawContent } from "./image";
export type { VideoRawContent } from "./video";
export type { HtmlRawContent } from "./html";

/**
 * Register all built-in resolvers with the global ResolverManager.
 * Call this during application initialization.
 */
export function registerBuiltinResolvers(): void {
  const textResolver = new TextResolver();

  resolverManager.register(textResolver);
  resolverManager.register(new ImageResolver());
  resolverManager.register(new VideoResolver());
  resolverManager.register(new HtmlResolver());

  // Set text as default resolver
  resolverManager.setDefault("text");
}
