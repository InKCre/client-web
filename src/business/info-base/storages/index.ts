/**
 * Built-in Storage Handlers Registration
 *
 * This module exports all built-in storage handlers and provides
 * a function to register them with the global StorageManager.
 */

import { storageManager } from "../storage";
import {
  HttpImageStorage,
  HttpVideoStorage,
  HttpTextStorage,
  HttpHtmlStorage,
  HttpJsonStorage,
} from "./http";

// Export storage classes for external use
export {
  HttpImageStorage,
  HttpVideoStorage,
  HttpTextStorage,
  HttpHtmlStorage,
  HttpJsonStorage,
};

// Export content types
export type {
  ImageContent,
  VideoContent,
  TextContent,
  HtmlContent,
  JsonContent,
  HttpStorageConfig,
} from "./http";

/**
 * Register all built-in storage handlers with the global StorageManager.
 * Call this during application initialization.
 */
export function registerBuiltinStorages(): void {
  storageManager.register("http-image", new HttpImageStorage());
  storageManager.register("http-video", new HttpVideoStorage());
  storageManager.register("http-text", new HttpTextStorage());
  storageManager.register("http-html", new HttpHtmlStorage());
  storageManager.register("http-json", new HttpJsonStorage());
}
