import { ref, computed, reactive } from "vue";
import { z } from "zod";
import {
  loadConfig as ZodConfigLoadConfig,
  type Adapter as ConfigAdapter,
} from "zod-config";
import { envAdapter } from "zod-config/env-adapter";

/**
 * Config Schema
 */
export const ConfigSchema = z.object({
  INKCRE_CORE_URL: z.url().default(""),
  INKCRE_PGREST_URL: z.url().default(""),
  INKCRE_EXTENSION_REGISTRY_URL: z.url().default(""),
  INKCRE_JWT_SECRET: z.string().default(""),
  INKCRE_CLIENT_ID: z.uuid().default(() => crypto.randomUUID()),
});

export type Config = z.infer<typeof ConfigSchema>;

// Storage keys
const CONFIG_STORAGE_KEY = "inkcre_app_config";
const ADAPTER_STORAGE_KEY = "inkcre_config_adapter";

/**
 * Adapter types
 */
export type AdapterType = "localStorage" | "http" | "dev";
export interface ConfigAdapterWithWrite
  extends ConfigAdapter<typeof ConfigSchema> {
  write: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * localStorage config adapter, compatible with zod-config.
 */
const localStorageAdapter: ConfigAdapterWithWrite = {
  name: "localStorage",
  read: async () => {
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
  write: async (config) => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      console.log("[Config] Saved config to localStorage");
    } catch (error) {
      console.error("[Config] Failed to save config to localStorage:", error);
      throw error;
    }
  },
};

/**
 * HTTP config adapter, fetches config from a predefined endpoint
 */
const httpAdapter: ConfigAdapterWithWrite = {
  name: "http",
  read: async () => {
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
  write: async (config) => {
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
};

/**
 * Dev adapter: reads from env vars (like envAdapter), overlays with localStorage, writes to localStorage
 */
const devAdapter: ConfigAdapterWithWrite = {
  name: "dev",
  read: async () => {
    // First, read from env vars using envAdapter logic
    const envData = envAdapter({
      regex: /^VITE_/,
      customEnv: import.meta.env,
    }).read();

    // Strip VITE_ prefix from keys to match ConfigSchema
    const noViteEnvData = Object.fromEntries(
      Object.entries(envData).map(([key, value]) => [
        key.startsWith("VITE_") ? key.slice(5) : key,
        value,
      ])
    );

    // Then, overlay with localStorage data
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const localData = JSON.parse(stored);
        console.log("[Config] Loaded config from env and localStorage");
        return { ...localData, ...noViteEnvData };
      }
    } catch (error) {
      console.error("[Config] Failed to load config from localStorage:", error);
    }

    console.log("[Config] Loaded config from env");
    return noViteEnvData;
  },
  write: localStorageAdapter.write,
};

/**
 * Adapter map
 */
export const ADAPTERS: Record<AdapterType, ConfigAdapterWithWrite> = {
  localStorage: localStorageAdapter,
  http: httpAdapter,
  dev: devAdapter,
};

/**
 * Current adapter type (reactive)
 */
const _currentAdapterType = ref<AdapterType>("localStorage");
// Check if in dev mode
if (import.meta.env.VITE_DEV_MODE === "true") {
  _currentAdapterType.value = "dev";
} else {
  // Check if adapter type is stored
  const stored_adapter_type = localStorage.getItem(ADAPTER_STORAGE_KEY);
  if (stored_adapter_type && stored_adapter_type in ADAPTERS) {
    _currentAdapterType.value = stored_adapter_type as AdapterType;
  } else {
    // Auto-detect: use HTTP for Cloudflare deployment
    if (import.meta.env.VITE_DEPLOY_TO === "CLOUDFLARE") {
      _currentAdapterType.value = "http";
    }
  }
}

/**
 * Current adapter type (readonly computed)
 */
export const currentAdapterType = computed({
  get: () => _currentAdapterType.value,
  set: (value: AdapterType) => {
    if (!(value in ADAPTERS)) {
      console.error("[Config] Invalid adapter type:", value);
      return;
    }

    _currentAdapterType.value = value;
    localStorage.setItem(ADAPTER_STORAGE_KEY, value);
    console.log("[Config] Switched adapter to:", value);

    // Reload config from new adapter
    loadConfig();
  },
});

/**
 * Global config
 */
export const CONFIG = ref<Config>(ConfigSchema.parse({}));

/**
 * Load config using zod-config with current adapter
 */
export async function loadConfig(): Promise<void> {
  try {
    const loaded = await ZodConfigLoadConfig({
      schema: ConfigSchema,
      adapters: [ADAPTERS[_currentAdapterType.value]],
    });

    CONFIG.value = loaded;
    console.log("[Config] Config loaded successfully");
  } catch (error) {
    console.error("[Config] Failed to load config:", error);
    // Fallback to defaults
    Object.assign(CONFIG.value, ConfigSchema.parse({}));
  }
}

/**
 * Save config using current adapter's save function
 */
export async function saveConfig(newConfig?: Config): Promise<void> {
  const writeFunction = ADAPTERS[_currentAdapterType.value].write;
  await writeFunction(newConfig ?? structuredClone(CONFIG.value));
}

/**
 * Reset config to defaults
 */
export function resetConfig() {
  Object.assign(CONFIG, ConfigSchema.parse({}));
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  console.log("[Config] Config reset to defaults");
}

/**
 * Check if config is valid
 */
export function isConfigValid(config?: Config): boolean {
  try {
    ConfigSchema.parse(config ?? CONFIG);
    return true;
  } catch {
    return false;
  }
}
