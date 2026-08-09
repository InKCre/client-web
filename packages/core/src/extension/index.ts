// Extension lifecycle and model
export {
  ExtensionState,
  type ExtensionModule,
  type ExtensionRuntimeState,
  Extension,
  InstallExtensionForm,
  type ExtensionRef,
  ExtensionRefZ,
  makeExtensionProp,
  makeExtensionRefProp,
} from './base'

// Module Federation
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

// Registry-backed deployment installations and current-peer Web bindings.
export {
  RegistryExtensionError,
  RegistryTargetNotCompatibleError,
  RegistryBindingConflictError,
  RegistryBindingPersistenceError,
  RegistryInstallationSchema,
  RegistryPeerBindingSchema,
  CoreRegistryInstallationApi,
  RegistryExtensionManager,
  registryExtensions,
  registryRemoteName,
  type RegistryCoordinate,
  type RegistryInstallation,
  type RegistryInstallationInput,
  type RegistryPeerBinding,
  type RegistryInstallationApi,
  type RegistryBindingStore,
  type RegistryExtensionManagerOptions,
  type RuntimeExtensionModule,
} from './registry'
