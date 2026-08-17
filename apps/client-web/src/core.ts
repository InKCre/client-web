/**
 * Core Package Integration for client-web
 *
 * This file initializes @inkcre/core with client-web specific configuration.
 * Import this file in main.ts before mounting the Vue app.
 */

import {
  configStore,
  ExtensionRegistryOriginResolver,
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
  WebPeerRuntime,
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

// ============================================================================
// Resolver Component Registration
// ============================================================================

/**
 * Register content display components with resolver classes.
 * Each resolver needs a Vue component to render content.
 */
export function setupResolvers(): void {
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
let extensionHostStartup: Promise<void> | null = null
let extensionState: ExtensionStatePort | null = null
let webPeerRuntime: WebPeerRuntime | null = null

export function initializeExtensionHost(state: ExtensionStatePort): WebExtensionHost {
  extensionHostStartup = null
  extensionState = state
  const registryOrigin = new ExtensionRegistryOriginResolver(
    () => configStore.peerConfig.extension_registry_url
  )
  extensionHost = new WebExtensionHost({
    state,
    releases: new RegistryExtensionReleaseReader(() => registryOrigin.resolve()),
    moduleFederation: getMFImplementation,
    currentPeerId: () => configStore.metaConfig.INKCRE_PEER_ID,
    hostSdkVersion: corePackageJson.version,
  })
  return extensionHost
}

export function getExtensionState(): ExtensionStatePort {
  if (!extensionState) throw new Error('Web Extension state port has not been initialized.')
  return extensionState
}

/** Share one initial runtime restore across the app shell and management view. */
export function startExtensionHost(): Promise<void> {
  if (extensionHostStartup) return extensionHostStartup
  const startup = getExtensionHost().startup()
  extensionHostStartup = startup.catch((error: unknown) => {
    extensionHostStartup = null
    throw error
  })
  return extensionHostStartup
}

export function getExtensionHost(): WebExtensionHost {
  if (!extensionHost) {
    throw new Error('Web Extension Host state port has not been initialized.')
  }
  return extensionHost
}

/** Replace the browser-owned lease runtime after a validated Settings cutover. */
export function adoptWebPeerRuntime(runtime: WebPeerRuntime): void {
  webPeerRuntime?.stop()
  webPeerRuntime = runtime
}

export function stopWebPeerRuntime(): void {
  webPeerRuntime?.stop()
  webPeerRuntime = null
}

/** Start the lease after Settings has mounted and loaded recovery configuration. */
export async function startConfiguredWebPeerRuntime(): Promise<void> {
  if (!configStore.metaConfig.INKCRE_PGREST_URL || !configStore.metaConfig.INKCRE_JWT_SECRET) return
  const candidate = new WebPeerRuntime(configStore.metaConfig.INKCRE_PEER_ID)
  try {
    await candidate.start()
    adoptWebPeerRuntime(candidate)
  } catch (error) {
    candidate.stop()
    throw error
  }
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
  await configStore.saveMeta()
  const requirePeerConnection = options.loadPeerConfig ?? true
  if (
    requirePeerConnection &&
    configStore.metaConfig.INKCRE_PGREST_URL &&
    configStore.metaConfig.INKCRE_JWT_SECRET
  ) {
    const candidate = new WebPeerRuntime(configStore.metaConfig.INKCRE_PEER_ID)
    try {
      await candidate.register()
      await configStore.loadPeerConfig()
      await candidate.start()
      adoptWebPeerRuntime(candidate)
    } catch (error) {
      candidate.stop()
      throw error
    }
  }
  PeerManager.setupBuiltinOutbounds()
  JobManager.startWorker()
  setupResolvers()
  initializeModuleFederation()
  initializeExtensionHost(new PostgrestExtensionStatePort())
  if (webPeerRuntime) await webPeerRuntime.start()
  console.log('[Core] Initialization complete')
}

export function shutdownCore(): void {
  stopWebPeerRuntime()
  JobManager.stopWorker()
}
