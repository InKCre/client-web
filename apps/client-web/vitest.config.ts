import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineProject } from 'vitest/config'
import { searchForWorkspaceRoot } from 'vite'
import {
  createUiSourceAliases,
  isPathInside,
  resolveUiSourceFromEnvironment,
  uiSourceDedupe,
} from '../../scripts/ui-source.mjs'

const appRoot = fileURLToPath(new URL('.', import.meta.url))
const clientScssRoots = ['components', 'views'].map((directory) =>
  fileURLToPath(new URL(`./src/${directory}`, import.meta.url))
)
const uiSource = await resolveUiSourceFromEnvironment()
const uiSourceComponents = uiSource ? resolve(uiSource.root, 'src/components') : null

export default defineProject({
  root: appRoot,
  plugins: [vue()],
  resolve: {
    alias: [
      ...(uiSource ? createUiSourceAliases(uiSource) : []),
      {
        find: '@inkcre/core',
        replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
    ...(uiSource ? { dedupe: uiSourceDedupe } : {}),
  },
  ...(uiSource
    ? {
        optimizeDeps: {
          exclude: ['@inkcre/ui-web'],
        },
        server: {
          fs: {
            allow: [searchForWorkspaceRoot(appRoot), uiSource.root],
          },
        },
      }
    : {}),
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (source, file) => {
          if (clientScssRoots.some((root) => isPathInside(root, file))) {
            return `@use "@inkcre/ui-web/styles/mixins" as *;@use "@inkcre/ui-web/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`
          }
          if (uiSourceComponents && isPathInside(uiSourceComponents, file)) {
            return `@use "@inkcre/ui-web/styles/mixins" as *;@use "@inkcre/ui-web/styles/functions" as *;${source}`
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
