import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/core/vitest.config.ts',
      'apps/client-web/vitest.config.ts',
      'apps/client-webext/vitest.config.ts',
      'scripts/vitest.config.ts',
    ],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI
      ? {
          junit: 'test-results/vitest/junit.xml',
        }
      : undefined,
  },
})
