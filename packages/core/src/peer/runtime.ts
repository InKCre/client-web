import { z } from 'zod'
import { signDatabaseToken } from '../auth'
import { APIError, DBAPIClient } from '../base'
import { MetaConfigSchema, PeerConfigSchema, type MetaConfig } from '../config/schema'
import { Peer } from './peer'

export const WEB_PEER_LEASE_TTL_SECONDS = 90
export const WEB_PEER_LEASE_RENEW_INTERVAL_MS = 30_000

type PeerDatabase = DBAPIClient<'peers', Peer>

export interface WebPeerIdentity {
  applicationVersion: string
  defaultName: string
}

/** Browser ownership for one durable Peer identity and its database-time lease. */
export class WebPeerRuntime {
  private timer: ReturnType<typeof setInterval> | null = null
  private registered = false

  constructor(
    readonly peerId: string,
    private readonly identity: WebPeerIdentity,
    private readonly database: PeerDatabase = Peer.dbApi,
    private readonly warn: (message: string) => void = console.warn
  ) {}

  async register(): Promise<Peer> {
    const existing = await this.database.from().select('id').eq('id', this.peerId).maybeSingle()
    assertSuccess(existing, 'find registration')

    const runtimeFields = {
      application_version: this.identity.applicationVersion,
      config_schema: PeerConfigSchema.toJSONSchema(),
    }
    const response = existing.data
      ? await this.database.update(runtimeFields).eq('id', this.peerId).select().single()
      : await this.database
          .insert({
            id: this.peerId,
            name: this.identity.defaultName,
            ...runtimeFields,
            capabilities: [],
          })
          .select()
          .single()
    assertSuccess(response, 'register')
    const peer = Peer.parse(response.data)
    this.registered = true
    return peer
  }

  async renew(): Promise<Date> {
    const response = await this.database.rpc('renew_peer_lease', {
      peer: this.peerId,
      ttl_seconds: WEB_PEER_LEASE_TTL_SECONDS,
    })
    assertSuccess(response, 'renew lease')
    return z.coerce.date().parse(response.data)
  }

  async start(): Promise<void> {
    if (this.timer !== null) return
    if (!this.registered) await this.register()
    await this.renew()
    this.timer = setInterval(() => {
      void this.renew().catch((error: unknown) => {
        this.warn(
          `Web Peer lease renewal failed: ${error instanceof Error ? error.message : String(error)}`
        )
      })
    }, WEB_PEER_LEASE_RENEW_INTERVAL_MS)
  }

  stop(): void {
    if (this.timer === null) return
    clearInterval(this.timer)
    this.timer = null
  }

  static async connect(
    meta: MetaConfig,
    identity: WebPeerIdentity
  ): Promise<{ peer: Peer; runtime: WebPeerRuntime }> {
    const exactMeta = MetaConfigSchema.parse(meta)
    const database = new DBAPIClient<'peers', Peer>(
      'peers',
      Peer,
      'inkcre',
      exactMeta.INKCRE_PGREST_URL,
      () => signDatabaseToken(exactMeta.INKCRE_JWT_SECRET)
    )
    const runtime = new WebPeerRuntime(exactMeta.INKCRE_PEER_ID, identity, database)
    const peer = await runtime.register()
    await runtime.start()
    return { peer, runtime }
  }
}

function assertSuccess(response: { error?: { message: string } | null }, operation: string): void {
  if (response.error) {
    throw new APIError(`Web Peer ${operation} failed: ${response.error.message}`, 0, response.error)
  }
}
