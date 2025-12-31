/**
 * Built-in Storage Handlers Registration
 *
 * This module imports all built-in storage handlers to trigger their
 * decorator registration, and provides a function for initialization.
 */

// Import storages to trigger @Storage.registry() decorator registration
import "./http";

// Re-export storage classes for external use
export {
  HttpImageStorage,
  HttpVideoStorage,
  HttpTextStorage,
  HttpHtmlStorage,
  HttpJsonStorage,
} from "./http";

// Export content types
export type {
  VideoContent,
  TextContent,
  HtmlContent,
  JsonContent,
  HttpStorageConfig,
} from "./http";

/**
 * Initialize built-in storages.
 * The decorators auto-register on import.
 * Call this during application initialization.
 */
export function initBuiltinStorages(): void {
  // Decorators have already registered all handlers on import.
  // This function exists for consistency with initBuiltinResolvers().
}
