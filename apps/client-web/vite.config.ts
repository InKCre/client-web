import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { useExtensionDevServer } from './vite-plugins/joint-dev-extension'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const toDebugExtensions = env.DEBUG_EXTENSIONS
    ? env.DEBUG_EXTENSIONS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return (async () => {
    const { plugin: extensionDevPlugin } = await useExtensionDevServer({
      active: toDebugExtensions,
      dir: '../../extensions',
    })

    return {
      plugins: [extensionDevPlugin, vue(), vueJsx(), vueDevTools(), UnoCSS()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          '@inkcre/core': fileURLToPath(
            new URL('../../packages/core/src/index.ts', import.meta.url)
          ),
        },
      },
      server: {
        host: true,
      },
      build: {
        target: 'esnext',
        sourcemap: true,
      },
      css: {
        devSourcemap: true,
        preprocessorOptions: {
          scss: {
            additionalData: (source, file) => {
              if (
                file.includes('src/components/') ||
                file.includes('src/views/') ||
                file.includes('src/extensions/')
              ) {
                return `@use "@inkcre/web-design/styles/mixins" as *;@use "@inkcre/web-design/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`
              }
              return source
            },
          },
        },
      },
    }
  })()
})
