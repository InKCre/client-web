import { parse as parseSemVer } from 'semver'
import type { Component } from 'vue'
import { z } from 'zod'
import { APIError, DBAPIClient } from '../base'

const EXTENSION_NAME_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

export const ExtensionNameSchema = z
  .string()
  .refine((value) => EXTENSION_NAME_PATTERN.test(value), {
    error: 'Extension name must be one canonical lowercase ASCII namespace/name pair.',
  })

export const ExtensionVersionSchema = z.string().refine(
  (value) => {
    const parsed = parseSemVer(value)
    return parsed !== null && parsed.version === value && parsed.build.length === 0
  },
  { error: 'Extension version must be strict SemVer without build metadata.' }
)

/** One deployment-wide installed Extension row. */
export const InstalledExtensionSchema = z.object({
  name: ExtensionNameSchema,
  version: ExtensionVersionSchema,
  enabled: z.array(z.uuid()).default([]),
  nickname: z.string().nullable(),
  config: z.record(z.string(), z.unknown()).default({}),
  config_schema: z.record(z.string(), z.unknown()).nullable(),
})

export const InstallExtensionInputSchema = InstalledExtensionSchema.pick({
  name: true,
  version: true,
})

export type InstalledExtension = z.infer<typeof InstalledExtensionSchema>
export type InstallExtensionInput = z.infer<typeof InstallExtensionInputSchema>
export interface ExtensionModelInstallInput extends InstallExtensionInput {
  nickname: string
}

const EXTENSION_MANAGEMENT_PROJECTION =
  'name,version,enabled,nickname,config,config_schema' as const

export class ExtensionPersistenceError extends Error {
  constructor(operation: string, cause?: unknown) {
    super(
      `Extension state ${operation} failed${cause instanceof Error ? `: ${cause.message}` : ''}.`
    )
    this.name = 'ExtensionPersistenceError'
  }
}

/** Rich deployment Extension aggregate backed by the canonical PostgREST relation. */
export class ExtensionModel implements InstalledExtension {
  static readonly #dbApi = new DBAPIClient<'extensions'>('extensions')

  readonly name: string
  readonly version: string
  readonly enabled: string[]
  readonly nickname: string | null
  readonly config: Record<string, unknown>
  readonly config_schema: Record<string, unknown> | null

  constructor(row: InstalledExtension) {
    const parsed = InstalledExtensionSchema.parse(row)
    this.name = parsed.name
    this.version = parsed.version
    this.enabled = parsed.enabled
    this.nickname = parsed.nickname
    this.config = parsed.config
    this.config_schema = parsed.config_schema
  }

  static async list(): Promise<ExtensionModel[]> {
    const response = await this.#dbApi
      .from()
      .select(EXTENSION_MANAGEMENT_PROJECTION)
      .order('name', { ascending: true })
    assertSuccess(response, 'list')
    return InstalledExtensionSchema.array()
      .parse(response.data ?? [])
      .map(this.fromRow)
  }

  static async get(name: string): Promise<ExtensionModel | null> {
    const response = await this.#dbApi
      .from()
      .select(EXTENSION_MANAGEMENT_PROJECTION)
      .eq('name', name)
      .maybeSingle()
    assertSuccess(response, 'read')
    return response.data === null ? null : this.fromRow(response.data)
  }

  static async install(input: ExtensionModelInstallInput): Promise<ExtensionModel> {
    const coordinate = InstallExtensionInputSchema.parse(input)
    const exact = InstalledExtensionSchema.parse({
      ...coordinate,
      nickname: input.nickname,
      enabled: [],
      config: {},
      config_schema: null,
    })
    const existing = await this.get(exact.name)
    if (existing) {
      if (existing.version === exact.version) return existing
      throw new ExtensionPersistenceError(
        'install',
        new Error(
          `${exact.name} is already installed at ${existing.version}; disable every Peer before an explicit version change.`
        )
      )
    }

    const response = await this.#dbApi
      .insert({
        name: exact.name,
        version: exact.version,
        nickname: exact.nickname,
        config: exact.config,
        config_schema: exact.config_schema,
      })
      .select(EXTENSION_MANAGEMENT_PROJECTION)
      .single()
    assertSuccess(response, 'install')
    return this.fromRow(response.data)
  }

  async changeVersion(version: string, nickname: string): Promise<ExtensionModel> {
    const exactVersion = ExtensionVersionSchema.parse(version)
    const response = await ExtensionModel.#dbApi
      .update({ version: exactVersion, nickname, config_schema: null })
      .eq('name', this.name)
      .filter('enabled', 'eq', '{}')
      .select(EXTENSION_MANAGEMENT_PROJECTION)
      .maybeSingle()
    assertSuccess(response, 'change version')
    if (response.data === null) {
      throw new ExtensionPersistenceError(
        'change version',
        new Error(`Extension ${this.name} is missing or still enabled on a Peer.`)
      )
    }
    return ExtensionModel.fromRow(response.data)
  }

  async updateConfig(config: Record<string, unknown>): Promise<ExtensionModel> {
    const response = await ExtensionModel.#dbApi
      .update({ config })
      .eq('name', this.name)
      .select(EXTENSION_MANAGEMENT_PROJECTION)
      .single()
    assertSuccess(response, 'update config')
    return ExtensionModel.fromRow(response.data)
  }

  enablePeer(peerId: string): Promise<ExtensionModel> {
    return this.setPeerEnabled(peerId, true)
  }

  disablePeer(peerId: string): Promise<ExtensionModel> {
    return this.setPeerEnabled(peerId, false)
  }

  async uninstall(): Promise<void> {
    const response = await ExtensionModel.#dbApi
      .from()
      .delete()
      .eq('name', this.name)
      .filter('enabled', 'eq', '{}')
      .select('name')
    assertSuccess(response, 'uninstall')
    const deletedRows = InstalledExtensionSchema.pick({ name: true }).array().parse(response.data)
    if (deletedRows.length !== 1) {
      throw new ExtensionPersistenceError(
        'uninstall',
        new Error(`Extension ${this.name} is missing or still enabled on a Peer.`)
      )
    }
  }

  private async setPeerEnabled(peerId: string, enabled: boolean): Promise<ExtensionModel> {
    const response = await ExtensionModel.#dbApi
      .rpc('set_extension_peer_enabled', {
        p_name: this.name,
        p_peer_id: peerId,
        p_enabled: enabled,
      })
      .select(EXTENSION_MANAGEMENT_PROJECTION)
    assertSuccess(response, enabled ? 'enable Peer' : 'disable Peer')
    const updated = InstalledExtensionSchema.array().parse(response.data ?? [])[0]
    if (!updated) {
      throw new ExtensionPersistenceError(
        enabled ? 'enable Peer' : 'disable Peer',
        new Error(`Extension ${this.name} does not exist.`)
      )
    }
    return ExtensionModel.fromRow(updated)
  }

  private static fromRow(row: unknown): ExtensionModel {
    return new ExtensionModel(InstalledExtensionSchema.parse(row))
  }
}

function assertSuccess(response: { error?: { message: string } | null }, operation: string): void {
  if (response.error) {
    throw new ExtensionPersistenceError(
      operation,
      new APIError(response.error.message, 0, response.error)
    )
  }
}

/** Setup UI contributed by one already-running Web Extension. */
export interface ExtensionSetupContribution {
  component: Component
}

/** Default export exposed by a Web Extension's native Module Federation Remote. */
export interface ExtensionModule {
  initialize?(): Promise<void>
  activate?(): Promise<void>
  deactivate?(): Promise<void>
  dispose?(): Promise<void>
  setup?: ExtensionSetupContribution
}
