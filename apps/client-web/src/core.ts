/**
 * Core Package Integration for client-web
 *
 * This file initializes @inkcre/core with client-web specific configuration.
 * Initialize from App.vue before mounting business views.
 */

import {
  configStore,
  ExtensionRegistryOriginResolver,
  DEFAULT_EXTENSION_REGISTRY_ORIGIN,
  localStorageAdapter,
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
  Peer,
  type ExtensionModule,
  type ExtensionSetupContribution,
} from '@inkcre/core'
import { createInstance } from '@module-federation/runtime'
import {
  ExtensionManager,
  RegistryReleaseReader,
  type WebExtensionModule,
} from '@inkcre/extension-runtime-client-web'
import * as InKCreCore from '@inkcre/core'
import * as InKCreUi from '@inkcre/ui-web'
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

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform?: string }
}

export function defaultWebPeerName(browser: NavigatorWithUserAgentData = navigator): string {
  const agent = browser.userAgent
  const browsers: Array<[string, RegExp]> = [
    ['Edge', /Edg\/(\d+)/],
    ['Firefox', /Firefox\/(\d+)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['Safari', /Version\/(\d+).*Safari/],
  ]
  const matchedBrowser = browsers.find(([, pattern]) => pattern.test(agent)) ?? null
  const browserLabel = matchedBrowser
    ? `${matchedBrowser[0]} ${agent.match(matchedBrowser[1])?.[1]}`
    : 'Web Peer'
  const platform = browser.userAgentData?.platform || browser.platform || agent
  const systems: Array<[string, RegExp]> = [
    ['Windows', /Win/],
    ['macOS', /Mac/],
    ['Android', /Android/],
    ['iOS', /iOS|iPhone|iPad|iPod/],
    ['Linux', /Linux/],
  ]
  const system = systems.find(([, pattern]) => pattern.test(platform))?.[0]
  return system ? `${browserLabel} · ${system}` : browserLabel
}

export const WEB_PEER_IDENTITY = {
  applicationVersion: packageJson.version,
  defaultName: defaultWebPeerName(),
}

// Runtime identity for this browser; never persisted as a second copy of the Peer name.
export const currentWebPeer = Vue.shallowRef<Pick<Peer, 'id' | 'name'> | null>(null)

export async function refreshCurrentWebPeer(): Promise<void> {
  const peerId = configStore.metaConfig.INKCRE_PEER_ID
  const origin = configStore.metaConfig.INKCRE_PGREST_URL
  currentWebPeer.value = null
  try {
    const peer = await Peer.getSelf()
    if (
      peerId === configStore.metaConfig.INKCRE_PEER_ID &&
      origin === configStore.metaConfig.INKCRE_PGREST_URL
    ) {
      currentWebPeer.value = { id: peer.id, name: peer.name }
    }
  } catch {
    // A display name is best-effort; connection failure remains owned by the connection UI.
  }
}

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

type ClientExtensionModule = WebExtensionModule & ExtensionModule
type ClientExtensionManager = ExtensionManager<ClientExtensionModule>

let extensionHost: ClientExtensionManager | null = null
let extensionHostStartup: Promise<void> | null = null
let extensionRegistry: RegistryReleaseReader | null = null
let extensionRegistryOrigin: ExtensionRegistryOriginResolver | null = null
let moduleFederation: ReturnType<typeof createInstance> | null = null
let webPeerRuntime: WebPeerRuntime | null = null

export function initializeExtensionHost(): ClientExtensionManager {
  extensionHostStartup = null
  extensionRegistryOrigin = new ExtensionRegistryOriginResolver(
    () => configStore.peerConfig.extension_registry_url
  )
  if (!moduleFederation) throw new Error('Module Federation has not been initialized.')
  extensionRegistry = new RegistryReleaseReader({
    registryOrigin: getExtensionRegistryOrigin,
    hostSdk: { name: '@inkcre/core', version: corePackageJson.version },
  })
  extensionHost = new ExtensionManager<ClientExtensionModule>({
    releases: extensionRegistry,
    moduleFederation,
  })
  return extensionHost
}

/** Share one initial runtime restore across the app shell and management view. */
export function startExtensionHost(): Promise<void> {
  if (extensionHostStartup) return extensionHostStartup
  const startup = getExtensionHost().startup(configStore.metaConfig.INKCRE_PEER_ID)
  extensionHostStartup = startup.catch((error: unknown) => {
    extensionHostStartup = null
    throw error
  })
  return extensionHostStartup
}

export function getExtensionHost(): ClientExtensionManager {
  if (!extensionHost) {
    throw new Error('Web Extension Host state port has not been initialized.')
  }
  return extensionHost
}

export function getExtensionRegistry(): RegistryReleaseReader {
  if (!extensionRegistry) {
    throw new Error('Extension Registry reader has not been initialized.')
  }
  return extensionRegistry
}

export function getExtensionRegistryOrigin(): Promise<string> {
  if (!configStore.metaConfig.INKCRE_PGREST_URL) {
    return Promise.resolve(DEFAULT_EXTENSION_REGISTRY_ORIGIN)
  }
  if (!extensionRegistryOrigin) {
    throw new Error('Extension Registry origin has not been initialized.')
  }
  return extensionRegistryOrigin.resolve()
}

/** Project the running native module into the Client-owned setup popup contract. */
export function getExtensionSetupContribution(name: string): ExtensionSetupContribution | null {
  return getExtensionHost().getModule(name)?.setup ?? null
}

/** Replace the browser-owned lease runtime after a validated Settings cutover. */
export function adoptWebPeerRuntime(runtime: WebPeerRuntime): void {
  webPeerRuntime?.stop()
  webPeerRuntime = runtime
  JobManager.startWorker()
}

export async function stopWebPeerRuntime(): Promise<void> {
  webPeerRuntime?.stop()
  webPeerRuntime = null
  currentWebPeer.value = null
  await JobManager.stopWorker()
}

/** Start the lease after Settings has mounted and loaded recovery configuration. */
export async function startConfiguredWebPeerRuntime(): Promise<void> {
  if (!configStore.metaConfig.INKCRE_PGREST_URL || !configStore.metaConfig.INKCRE_JWT_SECRET) return
  const candidate = new WebPeerRuntime(configStore.metaConfig.INKCRE_PEER_ID, WEB_PEER_IDENTITY)
  try {
    const peer = await candidate.register()
    await configStore.loadPeerConfig()
    await candidate.start()
    adoptWebPeerRuntime(candidate)
    currentWebPeer.value = { id: peer.id, name: peer.name }
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
 * Creates the MF instance consumed by the application-owned Extension manager.
 */
export function initializeModuleFederation(): void {
  moduleFederation = createInstance({
    name: 'host',
    remotes: [],
    shared: {
      '@inkcre/ui-web': {
        version: packageJson.dependencies['@inkcre/ui-web'],
        lib: () => InKCreUi,
        shareConfig: {
          singleton: true,
          requiredVersion: packageJson.dependencies['@inkcre/ui-web'],
        },
      },
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

  console.log('[Core] Module Federation initialized')
}

// ============================================================================
// Full Initialization
// ============================================================================

/**
 * Initialize all core systems.
 * Call this from App.vue before mounting business views.
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
    const candidate = new WebPeerRuntime(configStore.metaConfig.INKCRE_PEER_ID, WEB_PEER_IDENTITY)
    try {
      const peer = await candidate.register()
      await configStore.loadPeerConfig()
      await candidate.start()
      adoptWebPeerRuntime(candidate)
      currentWebPeer.value = { id: peer.id, name: peer.name }
    } catch (error) {
      candidate.stop()
      throw error
    }
  }
  PeerManager.setupBuiltinOutbounds()
  setupResolvers()
  initializeModuleFederation()
  initializeExtensionHost()
  if (webPeerRuntime) await webPeerRuntime.start()
  console.log('[Core] Initialization complete')
}

export async function shutdownCore(): Promise<void> {
  await stopWebPeerRuntime()
}
