import { z } from 'zod'
import { signDatabaseToken } from '../auth'
import { APIError, DBAPIClient } from '../base'
import {
  MetaConfigSchema,
  PeerConfigSchema,
  type MetaConfig,
  type PeerConfig,
} from '../config/schema'
import { Peer } from './peer'

export const WEB_PEER_LEASE_TTL_SECONDS = 90
export const WEB_PEER_LEASE_RENEW_INTERVAL_MS = 30_000

type PeerDatabase = DBAPIClient<'peers', Peer>

/** Browser ownership for one durable Peer identity and its database-time lease. */
export class WebPeerRuntime {
  private timer: ReturnType<typeof setInterval> | null = null
  private registered = false

  constructor(
    readonly peerId: string,
    private readonly database: PeerDatabase = Peer.dbApi,
    private readonly warn: (message: string) => void = console.warn
  ) {}

  async register(): Promise<Peer> {
    const response = await this.database
      .upsert({
        id: this.peerId,
        name: 'Client Web',
        config_schema: z.toJSONSchema(PeerConfigSchema),
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

  async saveConfig(config: PeerConfig): Promise<Peer> {
    const response = await this.database
      .update({ config: PeerConfigSchema.parse(config) })
      .eq('id', this.peerId)
      .select()
      .single()
    assertSuccess(response, 'save config')
    return Peer.parse(response.data)
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
    config: PeerConfig
  ): Promise<{ peer: Peer; runtime: WebPeerRuntime }> {
    const exactMeta = MetaConfigSchema.parse(meta)
    const exactConfig = PeerConfigSchema.parse(config)
    const database = new DBAPIClient<'peers', Peer>(
      'peers',
      Peer,
      'inkcre',
      exactMeta.INKCRE_PGREST_URL,
      () => signDatabaseToken(exactMeta.INKCRE_JWT_SECRET)
    )
    const runtime = new WebPeerRuntime(exactMeta.INKCRE_PEER_ID, database)
    await runtime.register()
    const peer = await runtime.saveConfig(exactConfig)
    await runtime.start()
    return { peer, runtime }
  }
}

function assertSuccess(response: { error?: { message: string } | null }, operation: string): void {
  if (response.error) {
    throw new APIError(`Web Peer ${operation} failed: ${response.error.message}`, 0, response.error)
  }
}
