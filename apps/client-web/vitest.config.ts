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
        find: '@inkcre/web-design/styles/mixins',
        replacement: fileURLToPath(
          new URL('./node_modules/@inkcre/web-design/styles/_mixins.scss', import.meta.url)
        ),
      },
      {
        find: '@inkcre/web-design/styles/functions',
        replacement: fileURLToPath(
          new URL('./node_modules/@inkcre/web-design/styles/_functions.scss', import.meta.url)
        ),
      },
      {
        find: '@inkcre/web-design/tokens/ref',
        replacement: fileURLToPath(
          new URL('./node_modules/@inkcre/web-design/styles/tokens/_ref.scss', import.meta.url)
        ),
      },
      {
        find: /^@inkcre\/web-design$/,
        replacement: fileURLToPath(
          new URL('./node_modules/@inkcre/web-design/dist/index.js', import.meta.url)
        ),
      },
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
            return `@use "@inkcre/web-design/styles/mixins" as *;@use "@inkcre/web-design/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`
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
