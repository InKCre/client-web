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
  private preparedPeer: Peer | null = null
  private stopped = false

  constructor(
    readonly peerId: string,
    private readonly identity: WebPeerIdentity,
    private readonly database: PeerDatabase = Peer.dbApi,
    private readonly warn: (message: string) => void = console.warn
  ) {}

  /** Read canonical configuration before the browser's lease runtime is ready. */
  async prepare(): Promise<Peer> {
    this.assertActive()
    if (this.preparedPeer) return this.preparedPeer
    const existing = await this.database.from().select().eq('id', this.peerId).maybeSingle()
    assertSuccess(existing, 'find registration')
    this.assertActive()
    if (existing.data) {
      this.preparedPeer = Peer.parse(existing.data)
      return this.preparedPeer
    }
    const response = await this.database
      .insert({
        id: this.peerId,
        name: this.identity.defaultName,
        application_version: this.identity.applicationVersion,
        config_schema: PeerConfigSchema.toJSONSchema(),
        capabilities: [],
      })
      .select()
      .single()
    assertSuccess(response, 'register')
    this.assertActive()
    this.preparedPeer = Peer.parse(response.data)
    this.registered = true
    return this.preparedPeer
  }

  async register(): Promise<Peer> {
    const peer = await this.prepare()
    this.assertActive()
    if (this.registered) return peer
    const response = await this.database
      .update({
        application_version: this.identity.applicationVersion,
        config_schema: PeerConfigSchema.toJSONSchema(),
      })
      .eq('id', this.peerId)
      .select()
      .single()
    assertSuccess(response, 'register')
    this.assertActive()
    this.registered = true
    return Peer.parse(response.data)
  }

  async renew(): Promise<Date> {
    this.assertActive()
    const response = await this.database.rpc('renew_peer_lease', {
      peer: this.peerId,
      ttl_seconds: WEB_PEER_LEASE_TTL_SECONDS,
    })
    assertSuccess(response, 'renew lease')
    this.assertActive()
    return z.coerce.date().parse(response.data)
  }

  async start(): Promise<void> {
    this.assertActive()
    if (this.timer !== null) return
    if (!this.registered) await this.register()
    await this.renew()
    this.assertActive()
    this.timer = setInterval(() => {
      void this.renew().catch((error: unknown) => {
        this.warn(
          `Web Peer lease renewal failed: ${error instanceof Error ? error.message : String(error)}`
        )
      })
    }, WEB_PEER_LEASE_RENEW_INTERVAL_MS)
  }

  stop(): void {
    this.stopped = true
    if (this.timer === null) return
    clearInterval(this.timer)
    this.timer = null
  }

  private assertActive(): void {
    if (this.stopped) throw new Error('Web Peer runtime has stopped.')
  }

  static forConnection(meta: MetaConfig, identity: WebPeerIdentity): WebPeerRuntime {
    const exactMeta = MetaConfigSchema.parse(meta)
    const database = new DBAPIClient<'peers', Peer>(
      'peers',
      Peer,
      'inkcre',
      exactMeta.INKCRE_PGREST_URL,
      () => signDatabaseToken(exactMeta.INKCRE_JWT_SECRET)
    )
    return new WebPeerRuntime(exactMeta.INKCRE_PEER_ID, identity, database)
  }

  static async connect(
    meta: MetaConfig,
    identity: WebPeerIdentity
  ): Promise<{ peer: Peer; runtime: WebPeerRuntime }> {
    const runtime = WebPeerRuntime.forConnection(meta, identity)
    try {
      const peer = await runtime.register()
      await runtime.start()
      return { peer, runtime }
    } catch (error) {
      runtime.stop()
      throw error
    }
  }
}

function assertSuccess(response: { error?: { message: string } | null }, operation: string): void {
  if (response.error) {
    throw new APIError(`Web Peer ${operation} failed: ${response.error.message}`, 0, response.error)
  }
}
