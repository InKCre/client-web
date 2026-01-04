import type { Adapter as ConfigAdapter } from "zod-config";
import type { ConfigSchema } from "./schema";

/**
 * Adapter type identifiers
 */
export type AdapterType = "localStorage" | "http" | "dev" | "webext";

/**
 * Config adapter with write capability
 */
export interface ConfigAdapterWithWrite extends ConfigAdapter<typeof ConfigSchema> {
  write: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * Storage keys for config persistence
 */
export const CONFIG_STORAGE_KEY = "inkcre_app_config";
export const ADAPTER_STORAGE_KEY = "inkcre_config_adapter";
