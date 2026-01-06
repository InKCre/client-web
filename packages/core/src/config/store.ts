import { defineStore } from "pinia";
import { ref } from "vue";
import { store } from "../store";
import type { Config, ConfigAdapterWithWrite } from "./types";
import { ConfigSchema } from "./schema";
import {
  loadConfig as zodLoadConfig,
  type Adapter as ConfigAdapter,
} from "zod-config";

/**
 * Config store using Pinia.
 *
 * USAGE - Direct access pattern for loose coupling:
 * - Read: configStore.config.INKCRE_CORE_URL
 * - Write: configStore.config.INKCRE_CORE_URL = "new-url"
 * - Watch: watch(() => configStore.config.INKCRE_JWT_SECRET, ...)
 *
 * @example
 * ```typescript
 * import { useConfigStore } from "@inkcre/core";
 *
 * const configStore = useConfigStore();
 *
 * // Read
 * const url = configStore.config.INKCRE_CORE_URL;
 *
 * // Write
 * configStore.config.INKCRE_CORE_URL = "https://new-url.com";
 *
 * // Watch
 * watch(() => configStore.config.INKCRE_JWT_SECRET, (newSecret) => {
 *   console.log("JWT secret changed:", newSecret);
 * });
 *
 * // Load from adapters
 * await configStore.load([localStorageAdapter]);
 *
 * // Save to adapter
 * await configStore.save(localStorageAdapter);
 * ```
 */
export const useConfigStore = defineStore("inkcre-config", () => {
  // State - Direct access to config object
  const config = ref<Config>(ConfigSchema.parse({}));
  const adapters = ref<ConfigAdapterWithWrite[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Load configuration from adapters.
   *
   * @param configAdapters - Optional array of adapters to use for loading
   * @example
   * ```typescript
   * await configStore.load([localStorageAdapter]);
   * ```
   */
  async function load(
    configAdapters?: ConfigAdapterWithWrite[]
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const loaded = await zodLoadConfig({
        schema: ConfigSchema,
        adapters: configAdapters ?? adapters.value,
      });
      config.value = loaded;
      console.log("[Config] Config loaded successfully", loaded);
    } catch (err) {
      error.value = err as Error;
      console.error("[Config] Failed to load config:", err);
      // Fallback to defaults
      config.value = ConfigSchema.parse({});
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Save current configuration to adapter.
   *
   * @param configAdapter - Config adapter with write capability
   * @example
   * ```typescript
   * configStore.config.INKCRE_CORE_URL = "https://new-url.com";
   * await configStore.save(localStorageAdapter);
   * ```
   */
  async function save(configAdapter?: ConfigAdapterWithWrite): Promise<void> {
    error.value = null;
    try {
      await (configAdapter ?? adapters.value[0]).write({ ...config.value });
      console.log("[Config] Config saved successfully");
    } catch (err) {
      error.value = err as Error;
      console.error("[Config] Failed to save config:", err);
      throw err;
    }
  }

  /**
   * Reset configuration to defaults.
   * Note: This only resets in-memory config, not persisted storage.
   */
  function reset(): void {
    config.value = ConfigSchema.parse({});
    console.log("[Config] Config reset to defaults");
  }

  /**
   * Set the default adapters to use for loading.
   *
   * @param newAdapters - Array of config adapters
   */
  function setAdapters(newAdapters: ConfigAdapter[]): void {
    adapters.value = newAdapters;
  }

  return {
    // State - Exposed directly for consumer access
    config,
    adapters,
    isLoading,
    error,

    // Actions
    load,
    save,
    reset,
    setAdapters,
  };
});

export const configStore = useConfigStore(store);
