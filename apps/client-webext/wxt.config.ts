import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'wxt'

const devInstance = process.env.INKCRE_DEV_INSTANCE
const devPort = Number.parseInt(process.env.PORT ?? '', 10)
const portlessUrl = process.env.PORTLESS_URL
const chromiumProfile = process.env.INKCRE_WXT_PROFILE_DIR
const chromiumBinary = process.env.INKCRE_CHROMIUM_BINARY

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage'],
  },
  dev: Number.isInteger(devPort)
    ? {
        server: {
          host: '127.0.0.1',
          port: devPort,
          origin: portlessUrl,
          strictPort: true,
        },
      }
    : undefined,
  vite: () => ({
    resolve: {
      alias: {
        '@inkcre/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
    },
    plugins: [
      {
        name: 'inkcre-webext-dev-identity',
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            if (!devInstance || request.url !== `/__inkcre/dev/${devInstance}`) {
              next()
              return
            }

            response.statusCode = 200
            response.setHeader('Content-Type', 'application/json')
            response.setHeader('Cache-Control', 'no-store')
            response.end(JSON.stringify({ instance: devInstance, target: 'webext' }))
          })
        },
      },
      UnoCSS({
        configFile: './uno.config.ts',
      }),
    ],
    build: {
      sourcemap: 'inline',
    },
  }),
  webExt:
    chromiumBinary && chromiumProfile
      ? {
          binaries: {
            chrome: chromiumBinary,
          },
          chromiumProfile,
          keepProfileChanges: true,
        }
      : {
          disabled: true,
        },
})
