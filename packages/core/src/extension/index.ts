// Extension protocol
export { ExtensionState, type IExtension, type ExtensionRuntimeState } from './extension'

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

// Extension Model
export {
  Extension,
  InstallExtensionForm,
  type ExtensionRef,
  ExtensionRefZ,
  makeExtensionProp,
  makeExtensionRefProp,
} from './model'
