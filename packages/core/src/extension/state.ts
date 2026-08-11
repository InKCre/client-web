import type { InstalledExtension } from './model'

/**
 * Deployment Extension state as operations, independent of SQL, PostgREST,
 * generated table types, and transport routes.
 */
export interface ExtensionStatePort {
  list(): Promise<InstalledExtension[]>
  get(name: string): Promise<InstalledExtension | null>
  install(extension: InstalledExtension): Promise<InstalledExtension>
  changeVersion(name: string, version: string, nickname: string): Promise<InstalledExtension>
  updateConfig(name: string, config: Record<string, unknown>): Promise<InstalledExtension>
  setPeerEnabled(name: string, peerId: string, enabled: boolean): Promise<InstalledExtension>
  uninstall(name: string): Promise<void>
}
