import { createApp, type Component } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { ExtensionModule } from '@inkcre/core'

/**
 * Options for bootstrapping an extension in development mode.
 */
export interface BootstrapOptions {
  /** The root Vue component to mount */
  rootComponent: Component
  /** The extension module (default export from Extension.ts) */
  extensionModule: ExtensionModule | { default: ExtensionModule }
  /** Optional routes for the dev playground */
  routes?: RouteRecordRaw[]
}

/**
 * Bootstrap an extension for development.
 *
 * This function:
 * 1. Creates a Vue app with Pinia and Router
 * 2. Initializes and activates the extension
 * 3. Mounts the app to #app
 * 4. Registers cleanup handlers
 *
 * @param options - Bootstrap options
 * @returns The Vue app, router, and pinia instances
 */
export async function bootstrapExtension(options: BootstrapOptions) {
  const { rootComponent, extensionModule, routes = [] } = options

  // Create Vue app
  const app = createApp(rootComponent)

  // Create stores
  const pinia = createPinia()
  app.use(pinia)

  // Create router with dev routes
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        children: routes,
      },
    ],
  })
  app.use(router)

  // Load extension module
  const extension: ExtensionModule =
    'default' in extensionModule ? extensionModule.default : extensionModule

  // Initialize extension
  if (extension.initialize) {
    console.log('[Extension Dev] Initializing extension...')
    await extension.initialize()
  }

  // Activate extension
  if (extension.activate) {
    console.log('[Extension Dev] Activating extension...')
    await extension.activate()
  }

  // Mount app
  app.mount('#app')
  console.log('[Extension Dev] App mounted')

  // Cleanup on unload
  window.addEventListener('beforeunload', async () => {
    console.log('[Extension Dev] Cleaning up...')
    if (extension.deactivate) {
      await extension.deactivate()
    }
    if (extension.dispose) {
      await extension.dispose()
    }
  })

  return { app, router, pinia }
}
