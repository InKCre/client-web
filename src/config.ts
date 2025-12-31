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
 * Adapter types
 */
export type AdapterType = "localStorage" | "http";

/**
 * Extended adapter interface with save method
 */
export interface ConfigAdapter extends Adapter {
  save(config: ConfigType): Promise<void>;
}

/**
 * Custom localStorage adapter
 */
const createLocalStorageAdapter = (): ConfigAdapter => ({
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
  save: async (config: ConfigType): Promise<void> => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      console.log("[Config] Saved config to localStorage");
    } catch (error) {
      console.error("[Config] Failed to save config to localStorage:", error);
      throw error;
    }
  },
});

/**
 * Custom HTTP adapter
 */
const createHttpAdapter = (): ConfigAdapter => ({
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
  save: async (config: ConfigType): Promise<void> => {
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
        throw new Error(`HTTP save failed with status ${res.status}`);
      }
    } catch (error) {
      console.error("[Config] Failed to save config to HTTP:", error);
      throw error;
    }
  },
});

/**
 * Adapter instances
 */
const adapters: Record<AdapterType, ConfigAdapter> = {
  localStorage: createLocalStorageAdapter(),
  http: createHttpAdapter(),
};

/**
 * Determine initial adapter type
 */
function getInitialAdapterType(): AdapterType {
  // Check if adapter type is stored
  const stored = localStorage.getItem(ADAPTER_STORAGE_KEY);
  if (stored && stored in adapters) {
    return stored as AdapterType;
  }
  
  // Auto-detect: use HTTP for Cloudflare deployment
  if (import.meta.env.VITE_DEPLOY_TO === "CLOUDFLARE") {
    return "http";
  }
  
  return "localStorage";
}

/**
 * Current adapter type (reactive)
 */
const _currentAdapterType = ref<AdapterType>(getInitialAdapterType());

/**
 * Global config singleton - initialized with default values
 */
let _config: ConfigType = ConfigSchema.parse({
  INKCRE_CORE_URL: "",
  INKCRE_PGREST_URL: "",
  INKCRE_EXTENSION_REGISTRY_URL: "",
  INKCRE_JWT_SECRET: "",
  LOCAL_CLIENT_ID: null,
});

/**
 * Get config (singleton access)
 */
export const CONFIG = new Proxy({} as ConfigType, {
  get(_target, prop) {
    return _config[prop as keyof ConfigType];
  },
  set(_target, prop, value) {
    (_config as any)[prop] = value;
    return true;
  },
});

/**
 * Config Manager - manages adapter selection, loading, and saving
 */
export const configManager = {
  /**
   * Available adapters
   */
  adapters,

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
      const loaded = await loadConfig({
        schema: ConfigSchema,
        adapters: [adapter],
        onError: (error) => {
          console.error("[Config] Validation error:", error);
        },
      });

      _config = loaded;
      console.log("[Config] Config loaded successfully");
    } catch (error) {
      console.error("[Config] Failed to load config:", error);
      // Fallback to defaults
      _config = ConfigSchema.parse({
        INKCRE_CORE_URL: "",
        INKCRE_PGREST_URL: "",
        INKCRE_EXTENSION_REGISTRY_URL: "",
        INKCRE_JWT_SECRET: "",
        LOCAL_CLIENT_ID: null,
      });
    }
  },

  /**
   * Save config using current adapter
   */
  async save(): Promise<void> {
    const adapter = this.getCurrentAdapter();
    await adapter.save({ ..._config });
  },

  /**
   * Update config values
   */
  update(partial: Partial<ConfigType>): void {
    Object.assign(_config, partial);
  },

  /**
   * Check if config is valid
   */
  isValid(): boolean {
    try {
      ConfigSchema.parse(_config);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reset config to defaults
   */
  reset(): void {
    _config = ConfigSchema.parse({
      INKCRE_CORE_URL: "",
      INKCRE_PGREST_URL: "",
      INKCRE_EXTENSION_REGISTRY_URL: "",
      INKCRE_JWT_SECRET: "",
      LOCAL_CLIENT_ID: null,
    });
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
      _config = validated;
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
    return { ..._config };
  },
};
