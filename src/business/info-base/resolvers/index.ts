/**
 * Built-in Resolvers Registration
 *
 * This module imports all built-in resolvers to trigger their decorator registration,
 * and provides a function to set the default resolver.
 */

import { resolverManager } from "../resolver";

// Import resolvers to trigger @ResolverManager.registry() decorator registration
import "./text";
import "./image";
import "./video";
import "./html";

// Export resolver classes for external use
export { TextResolver } from "./text";
export { ImageResolver } from "./image";
export { VideoResolver } from "./video";
export { HtmlResolver } from "./html";

// Export content types
export type { ImageRawContent } from "./image";
export type { VideoRawContent } from "./video";
export type { HtmlRawContent } from "./html";
