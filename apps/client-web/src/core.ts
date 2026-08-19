/**
 * Core Package Integration for client-web
 *
 * This file initializes @inkcre/core with client-web specific configuration.
 * Import this file in main.ts before mounting the Vue app.
 */

import {
  configStore,
  getMFImplementation,
  localStorageAdapter,
  PostgrestExtensionStatePort,
  RegistryExtensionReleaseReader,
  setMFImplementation,
  registerCoreResolvers,
  TextResolver,
  AudioResolver,
  EpubResolver,
  FileResolver,
  ImageResolver,
  PdfResolver,
  VideoResolver,
  HtmlResolver,
  ZipResolver,
  PeerManager,
  JobManager,
  WebExtensionHost,
  type ExtensionStatePort,
} from '@inkcre/core'
import { createInstance } from '@module-federation/enhanced/runtime'
import * as InKCreCore from '@inkcre/core'
import * as Zod from 'zod'
import * as Vue from 'vue'
import * as Pinia from 'pinia'
import * as VueRouter from 'vue-router'
import * as VueUse from '@vueuse/core'
import packageJson from '../package.json'
import corePackageJson from '../../../packages/core/package.json'
import ContentText from '@/components/info-base/resolvers/ContentText.vue'
import ContentImage from '@/components/info-base/resolvers/ContentImage.vue'
import ContentVideo from '@/components/info-base/resolvers/ContentVideo.vue'
import ContentHtml from '@/components/info-base/resolvers/ContentHtml.vue'
import ContentAudio from '@/components/info-base/resolvers/ContentAudio.vue'
import ContentFile from '@/components/info-base/resolvers/ContentFile.vue'
import ContentPreview from '@/components/info-base/resolvers/ContentPreview.vue'

// ============================================================================
// Resolver Component Registration
// ============================================================================

/**
 * Register content display components with resolver classes.
 * Each resolver needs a Vue component to render content.
 */
export function setupResolvers(): void {
  TextResolver.previewRenderer = ContentPreview
  AudioResolver.previewRenderer = ContentPreview
  EpubResolver.previewRenderer = ContentPreview
  FileResolver.previewRenderer = ContentPreview
  ImageResolver.previewRenderer = ContentPreview
  PdfResolver.previewRenderer = ContentPreview
  VideoResolver.previewRenderer = ContentPreview
  HtmlResolver.previewRenderer = ContentPreview
  ZipResolver.previewRenderer = ContentPreview
  TextResolver.solvedContentRenderer = ContentText
  AudioResolver.solvedContentRenderer = ContentAudio
  EpubResolver.solvedContentRenderer = ContentFile
  FileResolver.solvedContentRenderer = ContentFile
  ImageResolver.solvedContentRenderer = ContentImage
  PdfResolver.solvedContentRenderer = ContentFile
  VideoResolver.solvedContentRenderer = ContentVideo
  HtmlResolver.solvedContentRenderer = ContentHtml
  ZipResolver.solvedContentRenderer = ContentFile
  registerCoreResolvers()

  console.log('[Core] Resolver components registered')
}
// Configuration
// ============================================================================

let extensionHost: WebExtensionHost | null = null

export function initializeExtensionHost(state: ExtensionStatePort): WebExtensionHost {
  extensionHost = new WebExtensionHost({
    state,
    releases: new RegistryExtensionReleaseReader(
      () => configStore.peerConfig.extension_registry_url
    ),
    moduleFederation: getMFImplementation,
    currentPeerId: () => configStore.metaConfig.INKCRE_PEER_ID,
    hostSdkVersion: corePackageJson.version,
  })
  return extensionHost
}

export function getExtensionHost(): WebExtensionHost {
  if (!extensionHost) {
    throw new Error('Web Extension Host state port has not been initialized.')
  }
  return extensionHost
}

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
      remotes: Array<{ name: string; entry: string; type?: 'module' | 'script' }>,
      options?: { force?: boolean }
    ) => {
      mfInstance.registerRemotes(remotes, options)
    },
    loadRemote: async <T>(remoteName: string): Promise<T | null> => {
      return mfInstance.loadRemote<T>(remoteName)
    },
  }

  setMFImplementation(mfImpl)

  console.log('[Core] Module Federation initialized')
}

// ============================================================================
// Full Initialization
// ============================================================================

/**
 * Initialize all core systems.
 * Call this in main.ts before creating the Vue app.
 */
export function shouldLoadPeerConfigAtBootstrap(pathname: string): boolean {
  return !/^\/settings(?:\/|$)/.test(pathname)
}

export async function initializeCore(options: { loadPeerConfig?: boolean } = {}): Promise<void> {
  await configStore.initializeMeta(localStorageAdapter)
  if (options.loadPeerConfig ?? true) {
    await configStore.loadPeerConfig()
  }
  PeerManager.setupBuiltinOutbounds()
  JobManager.startWorker()
  setupResolvers()
  initializeModuleFederation()
  initializeExtensionHost(new PostgrestExtensionStatePort())
  console.log('[Core] Initialization complete')
}

export function shutdownCore(): void {
  JobManager.stopWorker()
}
