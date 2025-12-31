import { ref, computed } from "vue";
import { z } from "zod";
import { loadConfig, type Adapter } from "zod-config";

/**
 * Config Schema
 */
export const ConfigSchema = z.object({
  INKCRE_CORE_URL: z.url().or(z.literal("")),
  INKCRE_PGREST_URL: z.url().or(z.literal("")),
  INKCRE_EXTENSION_REGISTRY_URL: z.url().or(z.literal("")),
  INKCRE_JWT_SECRET: z.string(),
  LOCAL_CLIENT_ID: z.uuid().nullable(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

// Storage keys
const CONFIG_STORAGE_KEY = "inkcre_app_config";
const ADAPTER_STORAGE_KEY = "inkcre_config_adapter";

/**
 * Custom localStorage adapter for zod-config
 */
const createLocalStorageAdapter = (): Adapter => ({
  name: "localStorage",
  read: async (): Promise<Record<string, unknown>> => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("[Config] Loaded config from localStorage");
        return parsed;
      }
    } catch (error) {
      console.error("[Config] Failed to load config from localStorage:", error);
    }
    return {};
  },
});

/**
 * Save config to localStorage
 */
async function saveToLocalStorage(config: ConfigType): Promise<void> {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    console.log("[Config] Saved config to localStorage");
  } catch (error) {
    console.error("[Config] Failed to save config to localStorage:", error);
  }
}

/**
 * Custom HTTP adapter for zod-config
 */
const createHttpAdapter = (): Adapter => ({
  name: "http",
  read: async (): Promise<Record<string, unknown>> => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        console.log("[Config] Loaded config from HTTP endpoint");
        return data;
      }
      console.warn(
        "[Config] HTTP endpoint returned non-ok status:",
        res.status
      );
    } catch (error) {
      console.error("[Config] Failed to load config from HTTP:", error);
    }
    return {};
  },
});

/**
 * Save config to HTTP endpoint
 */
async function saveToHttp(config: ConfigType): Promise<void> {
  try {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      console.log("[Config] Saved config to HTTP endpoint");
    } else {
      console.error("[Config] Failed to save config to HTTP:", res.status);
    }
  } catch (error) {
    console.error("[Config] Failed to save config to HTTP:", error);
  }
}

// Auto-detect: use HTTP for Cloudflare deployment
export let CONFIG = undefined;
if (import.meta.env.VITE_DEPLOY_TO === "CLOUDFLARE") {
  CONFIG = await loadConfig({
    schema: ConfigSchema,
    adapters: [createHttpAdapter()],
  });
} else {
  CONFIG = await loadConfig({
    schema: ConfigSchema,
    adapters: [createLocalStorageAdapter()],
  });
}

/**
 * Config Manager - manages adapter selection, loading, and saving
 */
export const configManager = {
  /**
   * Current adapter type (readonly computed)
   */
  currentAdapterType: computed(() => _currentAdapterType.value),

  /**
   * Get current adapter instance
   */
  getCurrentAdapter(): ConfigAdapter {
    return this.adapters[_currentAdapterType.value];
  },

  /**
   * Set adapter type and persist choice
   */
  async setAdapterType(type: AdapterType): Promise<void> {
    if (!(type in adapters)) {
      console.error("[Config] Invalid adapter type:", type);
      return;
    }

    _currentAdapterType.value = type;
    localStorage.setItem(ADAPTER_STORAGE_KEY, type);
    console.log("[Config] Switched adapter to:", type);

    // Reload config from new adapter
    await this.load();
  },

  /**
   * Load config using zod-config with current adapter
   */
  async load(): Promise<void> {
    const adapter = this.getCurrentAdapter();

    try {
      CONFIG = await loadConfig({
        schema: ConfigSchema,
        adapters: [adapter],
        onError: (error) => {
          console.error("[Config] Validation error:", error);
        },
      });

      console.log("[Config] Config loaded successfully");
    } catch (error) {
      console.error("[Config] Failed to load config:", error);
      // Fallback to defaults
      CONFIG = ConfigSchema.parse({});
    }
  },

  /**
   * Save config using current adapter
   */
  async save(): Promise<void> {
    const adapter = this.getCurrentAdapter();
    await adapter.save({ ...CONFIG });
  },

  /**
   * Update config values
   */
  update(partial: Partial<ConfigType>): void {
    Object.assign(CONFIG, partial);
  },

  /**
   * Check if config is valid
   */
  isValid(): boolean {
    try {
      ConfigSchema.parse(CONFIG);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reset config to defaults
   */
  reset(): void {
    CONFIG = ConfigSchema.parse({});
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    console.log("[Config] Config reset to defaults");
  },

  /**
   * Import config from JSON string
   */
  import(configJson: string): void {
    try {
      const parsed = JSON.parse(configJson);
      const validated = ConfigSchema.parse(parsed);
      CONFIG = validated;
      console.log("[Config] Config imported successfully");
    } catch (error) {
      console.error("[Config] Failed to import config:", error);
      throw new Error("Invalid config format");
    }
  },

  /**
   * Get current config as plain object
   */
  getConfig(): ConfigType {
    return { ...CONFIG };
  },
};
