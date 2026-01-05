import packageJson from "../apps/client-web/package.json";

/**
 * Shared dependencies for Module Federation.
 * These are singletons shared between the host and remote modules.
 */
export default {
  vue: { singleton: true, requiredVersion: packageJson.dependencies.vue },
  pinia: { singleton: true, requiredVersion: packageJson.dependencies.pinia },
  "vue-router": {
    singleton: true,
    requiredVersion: packageJson.dependencies["vue-router"],
  },
  "@vueuse/core": {
    singleton: true,
    requiredVersion: packageJson.dependencies["@vueuse/core"],
  },
  zod: { singleton: true, requiredVersion: packageJson.dependencies.zod },
  "@inkcre/core": {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
} as const;
