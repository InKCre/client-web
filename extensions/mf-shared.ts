// Shared dependencies for Module Federation remote (extensions).

import packageJson from '../apps/client-web/package.json'

export default {
  vue: { singleton: true, requiredVersion: packageJson.dependencies.vue },
  pinia: { singleton: true, requiredVersion: packageJson.dependencies.pinia },
  'vue-router': {
    singleton: true,
    requiredVersion: packageJson.dependencies['vue-router'],
  },
  '@vueuse/core': {
    singleton: true,
    requiredVersion: packageJson.dependencies['@vueuse/core'],
  },
  zod: { singleton: true, requiredVersion: packageJson.dependencies.zod },
  '@inkcre/core': {
    singleton: true,
    requiredVersion: '0.0.0',
    import: false,
  },
} as const
