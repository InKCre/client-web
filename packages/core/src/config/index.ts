/**
 * Configuration module - Pinia-based config store
 *
 * This module provides a Pinia store for managing application configuration.
 * Use `useConfigStore()` to access and modify config.
 *
 * @example
 * ```typescript
 * import { useConfigStore, localStorageAdapter } from "@inkcre/core";
 *
 * const configStore = useConfigStore();
 *
 * // Load config
 * await configStore.load([localStorageAdapter]);
 *
 * // Read config
 * const url = configStore.config.INKCRE_CORE_URL;
 *
 * // Write config
 * configStore.config.INKCRE_CORE_URL = "https://new-url.com";
 *
 * // Save config
 * await configStore.save(localStorageAdapter);
 * ```
 */

// Export store
export { useConfigStore, configStore } from "./store";

// Re-export everything from other config modules
export * from "./schema";
export * from "./types";
export * from "./adapters";
