import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage'],
  },
  vite: () => ({
    resolve: {
      alias: {
        '@inkcre/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
    },
    plugins: [
      UnoCSS({
        configFile: './uno.config.ts',
      }),
    ],
    build: {
      sourcemap: 'inline',
    },
  }),
  webExt: {
    chromiumArgs: ['--remote-debugging-port=9222'],
  },
})
