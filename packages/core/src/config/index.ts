import { ref } from "vue";
import {
  loadConfig as ZodConfigLoadConfig,
  type Adapter as ConfigAdapter,
} from "zod-config";
import { ConfigSchema, type Config } from "./schema";
import type { ConfigAdapterWithWrite } from "./types";

/**
 * Global configuration reference.
 * All applications should assign their config to this ref during initialization.
 */
export const CONFIG = ref<Config>(ConfigSchema.parse({}));

/**
 * Load configuration using zod-config with provided adapters.
 *
 * @param adapters - Array of config adapters to use for loading
 * @example
 * ```typescript
 * import { loadConfig, localStorageAdapter } from "@inkcre/core/config";
 * await loadConfig([localStorageAdapter]);
 * ```
 */
export async function loadConfig(adapters: ConfigAdapter[]): Promise<void> {
  try {
    const loaded = await ZodConfigLoadConfig({
      schema: ConfigSchema,
      adapters,
    });

    CONFIG.value = loaded;
    console.log("[Config] Config loaded successfully", loaded);
  } catch (error) {
    console.error("[Config] Failed to load config:", error);
    // Fallback to defaults
    CONFIG.value = ConfigSchema.parse({});
  }
}

/**
 * Save configuration using the provided adapter's write function.
 *
 * @param adapter - Config adapter with write capability
 * @param config - Optional config to save (defaults to current CONFIG.value)
 * @example
 * ```typescript
 * import { saveConfig, localStorageAdapter, CONFIG } from "@inkcre/core/config";
 * CONFIG.value.INKCRE_CORE_URL = "https://new-url.com";
 * await saveConfig(localStorageAdapter);
 * ```
 */
export async function saveConfig(
  adapter: ConfigAdapterWithWrite,
  config?: Config
): Promise<void> {
  await adapter.write(config ?? structuredClone(CONFIG.value));
}

/**
 * Reset configuration to defaults.
 * Note: This only resets the in-memory config, not persisted storage.
 */
export function resetConfig(): void {
  CONFIG.value = ConfigSchema.parse({});
  console.log("[Config] Config reset to defaults");
}

/**
 * Check if a config object is valid according to the schema.
 *
 * @param config - Optional config to validate (defaults to current CONFIG.value)
 * @returns true if valid, false otherwise
 */
export function isConfigValid(config?: Config): boolean {
  try {
    ConfigSchema.parse(config ?? CONFIG.value);
    return true;
  } catch {
    return false;
  }
}

// Re-export everything from other config modules
export * from "./schema";
export * from "./types";
export * from "./adapters";
