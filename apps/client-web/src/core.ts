/**
 * Core Package Integration for client-web
 *
 * This file initializes @inkcre/core with client-web specific configuration.
 * Import this file in main.ts before mounting the Vue app.
 */

import {
  configStore,
  registryExtensions,
  localStorageAdapter,
  setMFImplementation,
  TextResolver,
  ImageResolver,
  VideoResolver,
  HtmlResolver,
} from '@inkcre/core'
import { createInstance } from '@module-federation/enhanced/runtime'
import * as InKCreCore from '@inkcre/core'
import * as Zod from 'zod'
import * as Vue from 'vue'
import * as Pinia from 'pinia'
import * as VueRouter from 'vue-router'
import * as VueUse from '@vueuse/core'
import packageJson from '../package.json'
import moduleFederationRuntimePackageJson from '@module-federation/runtime/package.json'
import vuePackageJson from 'vue/package.json'
import corePackageJson from '../../../packages/core/package.json'
import ContentText from '@/components/info-base/resolvers/ContentText.vue'
import ContentImage from '@/components/info-base/resolvers/ContentImage.vue'
import ContentVideo from '@/components/info-base/resolvers/ContentVideo.vue'
import ContentHtml from '@/components/info-base/resolvers/ContentHtml.vue'

// ============================================================================
// Resolver Component Registration
// ============================================================================

/**
 * Register content display components with resolver classes.
 * Each resolver needs a Vue component to render content.
 */
export function setupResolvers(): void {
  TextResolver.contentComp = ContentText
  ImageResolver.contentComp = ContentImage
  VideoResolver.contentComp = ContentVideo
  HtmlResolver.contentComp = ContentHtml

  console.log('[Core] Resolver components registered')
}
// Configuration
// ============================================================================

/**
 * Concrete capabilities supplied by this static Web host. Deployment URLs are
 * deliberately absent: Registry origin remains runtime client configuration.
 */
export const clientWebRegistryPlatformProfile = Object.freeze({
  'inkcre.integration': 'module-federation-esm-v1',
  'inkcre.extension-api': '1.0.0',
  'module-federation.runtime': moduleFederationRuntimePackageJson.version,
  'module-federation.share-scope': 'default',
  'shared.vue': vuePackageJson.version,
  'shared.@inkcre/core': corePackageJson.version,
  'web.ecmascript': 'es2022',
})

// ============================================================================
// Module Federation
// ============================================================================

/**
 * Initialize Module Federation runtime.
 * Creates the MF instance and injects it into core.
 */
export function initializeModuleFederation(): void {
  const mfInstance = createInstance({
    name: 'host',
    remotes: [],
    shared: {
      zod: {
        version: packageJson.dependencies.zod,
        lib: () => Zod,
        shareConfig: {
          singleton: true,
          requiredVersion: packageJson.dependencies.zod,
        },
      },
      vue: {
        version: packageJson.dependencies.vue,
        lib: () => Vue,
        shareConfig: {
          singleton: true,
          requiredVersion: false,
        },
      },
      pinia: {
        version: packageJson.dependencies.pinia,
        lib: () => Pinia,
        shareConfig: {
          singleton: true,
          requiredVersion: false,
        },
      },
      'vue-router': {
        version: packageJson.dependencies['vue-router'],
        lib: () => VueRouter,
        shareConfig: {
          singleton: true,
          requiredVersion: false,
        },
      },
      '@vueuse/core': {
        version: packageJson.dependencies['@vueuse/core'],
        lib: () => VueUse,
        shareConfig: {
          singleton: true,
          requiredVersion: false,
        },
      },
      '@inkcre/core': {
        version: corePackageJson.version,
        lib: () => InKCreCore,
        shareConfig: {
          singleton: true,
          requiredVersion: false,
        },
      },
    },
  })

  // Inject MF implementation into core
  const mfImpl = {
    registerRemotes: (
      remotes: Array<{ name: string; entry: string; type: 'module' | 'script' }>,
      options?: { force?: boolean }
    ) => {
      mfInstance.registerRemotes(remotes, options)
    },
    loadRemote: async <T>(remoteName: string): Promise<T | null> => {
      return mfInstance.loadRemote<T>(remoteName)
    },
  }

  setMFImplementation(mfImpl)
  registryExtensions.configurePlatformProfile(clientWebRegistryPlatformProfile)

  console.log('[Core] Module Federation initialized')
}

// ============================================================================
// Full Initialization
// ============================================================================

/**
 * Initialize all core systems.
 * Call this in main.ts before creating the Vue app.
 */
export async function initializeCore(): Promise<void> {
  await configStore.initializeMeta(localStorageAdapter)
  await configStore.loadClientConfig()
  setupResolvers()
  initializeModuleFederation()
  console.log('[Core] Initialization complete')
}
