import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineProject } from 'vitest/config'

const appRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineProject({
  root: appRoot,
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@inkcre/core',
        replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (source, file) => {
          if (file.includes('/src/components/') || file.includes('/src/views/')) {
            return `@use "@inkcre/ui-web/styles/mixins" as *;@use "@inkcre/ui-web/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`
          }
          return source
        },
      },
    },
  },
  test: {
    name: 'client-web',
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
})
