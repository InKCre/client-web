export {
  ExtensionNameSchema,
  ExtensionVersionSchema,
  InstalledExtensionSchema,
  InstallExtensionInputSchema,
  type ExtensionModule,
  type InstalledExtension,
  type InstallExtensionInput,
} from './model'

export {
  setMFImplementation,
  getMFImplementation,
  registerRemotes,
  loadRemote,
  isMFInitialized,
  type RemoteConfig,
  type RegisterRemotesOptions,
  type MFImplementation,
} from './module-federation'

export {
  ExtensionReleaseSchema,
  RegistryExtensionReleaseReader,
  type ExtensionRelease,
  type ModuleFederationDistribution,
  type ExtensionReleaseReader,
} from './registry'

export type { ExtensionStatePort } from './state'

export { PostgrestExtensionStatePort, ExtensionStatePersistenceError } from './postgrest-state'

export {
  WebExtensionHost,
  WebExtensionHostError,
  WebExtensionIncompatibleError,
  WebExtensionEnabledError,
  webExtensionRemoteName,
  type WebExtensionHostOptions,
} from './host'
