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
  const devInstance = process.env.INKCRE_DEV_INSTANCE
  const devPort = Number.parseInt(process.env.PORT ?? '', 10)
  const portlessUrl = process.env.PORTLESS_URL

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
      plugins: [
        {
          name: 'inkcre-dev-identity',
          configureServer(server) {
            server.middlewares.use((request, response, next) => {
              if (!devInstance || request.url !== `/__inkcre/dev/${devInstance}`) {
                next()
                return
              }

              response.statusCode = 200
              response.setHeader('Content-Type', 'application/json')
              response.setHeader('Cache-Control', 'no-store')
              response.end(JSON.stringify({ instance: devInstance, target: 'web' }))
            })
          },
        },
        extensionDevPlugin,
        vue(),
        vueJsx(),
        vueDevTools(),
        UnoCSS(),
      ],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          '@inkcre/core': fileURLToPath(
            new URL('../../packages/core/src/index.ts', import.meta.url)
          ),
        },
      },
      server: {
        host: '127.0.0.1',
        ...(Number.isInteger(devPort)
          ? {
              port: devPort,
              strictPort: true,
            }
          : {}),
        ...(portlessUrl ? { origin: portlessUrl } : {}),
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
                return `@use "@inkcre/ui-web/styles/mixins" as *;@use "@inkcre/ui-web/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`
              }
              return source
            },
          },
        },
      },
    }
  })()
})
