import { APIError, DBAPIClient } from '../base'
import { InstalledExtensionSchema, type InstalledExtension } from './model'
import type { ExtensionStatePort } from './state'

export class ExtensionStatePersistenceError extends Error {
  constructor(operation: string, cause?: unknown) {
    super(
      `Extension state ${operation} failed${cause instanceof Error ? `: ${cause.message}` : ''}.`
    )
    this.name = 'ExtensionStatePersistenceError'
  }
}

/** PostgREST transport adapter for the canonical deployment Extension relation. */
export class PostgrestExtensionStatePort implements ExtensionStatePort {
  private readonly dbApi = new DBAPIClient<'extensions'>('extensions')

  async list(): Promise<InstalledExtension[]> {
    const response = await this.dbApi.from().select().order('name', { ascending: true })
    assertSuccess(response, 'list')
    return InstalledExtensionSchema.array().parse(response.data ?? [])
  }

  async get(name: string): Promise<InstalledExtension | null> {
    const response = await this.dbApi.from().select().eq('name', name).maybeSingle()
    assertSuccess(response, 'read')
    return response.data === null ? null : InstalledExtensionSchema.parse(response.data)
  }

  async install(extension: InstalledExtension): Promise<InstalledExtension> {
    const exact = InstalledExtensionSchema.parse(extension)
    const existing = await this.get(exact.name)
    if (existing) {
      if (existing.version === exact.version) return existing
      throw new ExtensionStatePersistenceError(
        'install',
        new Error(
          `${exact.name} is already installed at ${existing.version}; disable every Peer before an explicit version change.`
        )
      )
    }

    const response = await this.dbApi
      .insert({
        name: exact.name,
        version: exact.version,
        nickname: exact.nickname,
        config: exact.config,
        config_schema: exact.config_schema,
      })
      .select()
      .single()
    assertSuccess(response, 'install')
    return InstalledExtensionSchema.parse(response.data)
  }

  async updateConfig(name: string, config: Record<string, unknown>): Promise<InstalledExtension> {
    const response = await this.dbApi.update({ config }).eq('name', name).select().single()
    assertSuccess(response, 'update config')
    return InstalledExtensionSchema.parse(response.data)
  }

  async changeVersion(
    name: string,
    version: string,
    nickname: string
  ): Promise<InstalledExtension> {
    const response = await this.dbApi
      .update({ version, nickname, config_schema: null })
      .eq('name', name)
      .filter('enabled', 'eq', '{}')
      .select()
      .maybeSingle()
    assertSuccess(response, 'change version')
    if (response.data === null) {
      throw new ExtensionStatePersistenceError(
        'change version',
        new Error(`Extension ${name} is missing or still enabled on a Peer.`)
      )
    }
    return InstalledExtensionSchema.parse(response.data)
  }

  async setPeerEnabled(
    name: string,
    peerId: string,
    enabled: boolean
  ): Promise<InstalledExtension> {
    const response = await this.dbApi.rpc('set_extension_peer_enabled', {
      p_name: name,
      p_peer_id: peerId,
      p_enabled: enabled,
    })
    assertSuccess(response, enabled ? 'enable Peer' : 'disable Peer')
    const rows = InstalledExtensionSchema.array().parse(response.data ?? [])
    const updated = rows[0]
    if (!updated) {
      throw new ExtensionStatePersistenceError(
        enabled ? 'enable Peer' : 'disable Peer',
        new Error(`Extension ${name} does not exist.`)
      )
    }
    return updated
  }

  async uninstall(name: string): Promise<void> {
    const response = await this.dbApi
      .from()
      .delete()
      .eq('name', name)
      .filter('enabled', 'eq', '{}')
      .select('name')
    assertSuccess(response, 'uninstall')
    const deletedRows = InstalledExtensionSchema.pick({ name: true }).array().parse(response.data)
    if (deletedRows.length !== 1) {
      throw new ExtensionStatePersistenceError(
        'uninstall',
        new Error(`Extension ${name} is missing or still enabled on a Peer.`)
      )
    }
  }
}

function assertSuccess(response: { error?: { message: string } | null }, operation: string): void {
  if (response.error) {
    throw new ExtensionStatePersistenceError(
      operation,
      new APIError(response.error.message, 0, response.error)
    )
  }
}
