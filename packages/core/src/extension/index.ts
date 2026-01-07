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
  type MFImplementation,
} from './module-federation'
