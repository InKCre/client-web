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
