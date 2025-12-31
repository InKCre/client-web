import { reactive, watch, ref, computed } from "vue";
import { z } from "zod";

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
 * Config Adapter Interface
 */
export interface ConfigAdapter {
  name: string;
  load(): Promise<Partial<ConfigType>>;
  save(config: ConfigType): Promise<void>;
}

/**
 * localStorage Adapter
 */
export const localStorageAdapter: ConfigAdapter = {
  name: "localStorage",

  async load(): Promise<Partial<ConfigType>> {
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

  async save(config: ConfigType): Promise<void> {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      console.log("[Config] Saved config to localStorage");
    } catch (error) {
      console.error("[Config] Failed to save config to localStorage:", error);
    }
  },
};

/**
 * HTTP JSON Adapter
 * Loads config from /api/config endpoint
 */
export const httpJsonAdapter: ConfigAdapter = {
  name: "http",

  async load(): Promise<Partial<ConfigType>> {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        console.log("[Config] Loaded config from HTTP endpoint");
        return data;
      }
      console.warn("[Config] HTTP endpoint returned non-ok status:", res.status);
    } catch (error) {
      console.error("[Config] Failed to load config from HTTP:", error);
    }
    return {};
  },

  async save(config: ConfigType): Promise<void> {
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
  },
};

/**
 * Available adapters
 */
export const adapters: Record<string, ConfigAdapter> = {
  localStorage: localStorageAdapter,
  http: httpJsonAdapter,
};

export type AdapterType = keyof typeof adapters;

/**
 * Get default adapter based on environment
 */
function getDefaultAdapterType(): AdapterType {
  // Check for user preference first
  const savedAdapter = localStorage.getItem(ADAPTER_STORAGE_KEY);
  if (savedAdapter && savedAdapter in adapters) {
    return savedAdapter as AdapterType;
  }

  // Auto-detect: use HTTP for Cloudflare deployment
  if (import.meta.env.VITE_DEPLOY_TO === "CLOUDFLARE") {
    return "http";
  }

  // Default to localStorage
  return "localStorage";
}

/**
 * Get fallback config from environment variables
 */
function getEnvConfig(): Partial<ConfigType> {
  return {
    INKCRE_CORE_URL: import.meta.env.VITE_INKCRE_CORE_URL || "",
    INKCRE_PGREST_URL: import.meta.env.VITE_INKCRE_PGREST_URL || "",
    INKCRE_EXTENSION_REGISTRY_URL:
      import.meta.env.VITE_INKCRE_EXTENSION_REGISTRY_URL || "",
    INKCRE_JWT_SECRET: import.meta.env.VITE_INKCRE_JWT_SECRET || "",
  };
}

// Reactive config object
export const CONFIG = reactive<ConfigType>({
  INKCRE_CORE_URL: "",
  INKCRE_PGREST_URL: "",
  INKCRE_EXTENSION_REGISTRY_URL: "",
  INKCRE_JWT_SECRET: "",
  LOCAL_CLIENT_ID: null,
});

// Current adapter type (reactive)
const _currentAdapterType = ref<AdapterType>(getDefaultAdapterType());

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
    return adapters[_currentAdapterType.value];
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
   * Load config from current adapter
   */
  async load(): Promise<void> {
    const adapter = this.getCurrentAdapter();
    const envConfig = getEnvConfig();

    try {
      const loadedConfig = await adapter.load();

      // Merge: loaded config takes priority over env config
      CONFIG.INKCRE_CORE_URL = loadedConfig.INKCRE_CORE_URL || envConfig.INKCRE_CORE_URL || "";
      CONFIG.INKCRE_PGREST_URL = loadedConfig.INKCRE_PGREST_URL || envConfig.INKCRE_PGREST_URL || "";
      CONFIG.INKCRE_EXTENSION_REGISTRY_URL =
        loadedConfig.INKCRE_EXTENSION_REGISTRY_URL || envConfig.INKCRE_EXTENSION_REGISTRY_URL || "";
      CONFIG.INKCRE_JWT_SECRET = loadedConfig.INKCRE_JWT_SECRET || envConfig.INKCRE_JWT_SECRET || "";
      CONFIG.LOCAL_CLIENT_ID = loadedConfig.LOCAL_CLIENT_ID ?? null;

      console.log("[Config] Config loaded successfully");
    } catch (error) {
      console.error("[Config] Failed to load config:", error);

      // Fallback to env config
      Object.assign(CONFIG, envConfig);
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
  reset() {
    CONFIG.INKCRE_CORE_URL = "";
    CONFIG.INKCRE_PGREST_URL = "";
    CONFIG.INKCRE_EXTENSION_REGISTRY_URL = "";
    CONFIG.INKCRE_JWT_SECRET = "";
    CONFIG.LOCAL_CLIENT_ID = null;
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    console.log("[Config] Config reset to defaults");
  },

  /**
   * Import config from JSON string
   */
  import(configJson: string) {
    try {
      const parsed = JSON.parse(configJson);
      const validated = ConfigSchema.parse(parsed);
      Object.assign(CONFIG, validated);
      console.log("[Config] Config imported successfully");
    } catch (error) {
      console.error("[Config] Failed to import config:", error);
      throw new Error("Invalid config format");
    }
  },
};

// Auto-save on config changes (debounced via watch)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
watch(
  CONFIG,
  () => {
    // Debounce saves
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      configManager.save();
    }, 500);
  },
  { deep: true }
);

// Initial load (async)
configManager.load();
