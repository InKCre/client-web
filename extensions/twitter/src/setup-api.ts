import {
  InstalledExtensionSchema,
  Cron,
  CronForm,
  ExtensionModel,
  Peer,
  PeerManager,
  PeerProtocolRequestSchema,
  PeerProtocolResponseSchema,
  Source,
  SourceForm,
  type InstalledExtension,
  type JsonValue,
} from '@inkcre/core'
import { z } from 'zod'

const EXTENSION_NAME = 'inkcre/twitter'
const EXTENSION_MANAGEMENT_CAPABILITY = 'core.extension.management.v1'
const TWITTER_SETUP_STATUS_CAPABILITY = 'inkcre.twitter.setup.status.v1'
const TWITTER_OAUTH_APP_CONFIGURE_CAPABILITY = 'inkcre.twitter.oauth-app.configure.v1'
const TWITTER_OAUTH_BEGIN_CAPABILITY = 'inkcre.twitter.oauth.begin.v1'
const TWITTER_OAUTH_TRANSACTION_READ_CAPABILITY = 'inkcre.twitter.oauth.transaction.read.v1'
const TWITTER_OAUTH_DISCONNECT_CAPABILITY = 'inkcre.twitter.oauth.disconnect.v1'
const BOOKMARK_SOURCE_TYPE = 'extensions.twitter.bookmark.Source'
const SOURCE_COLLECT_JOB_TYPE = 'core.source.collect.v1'
type TwitterPeerRequest = z.input<typeof PeerProtocolRequestSchema>

function hasAuthorityUserInfo(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*@/i.test(value)
}

const HttpUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol
  return (protocol === 'http:' || protocol === 'https:') && !hasAuthorityUserInfo(value)
}, 'URL must use HTTP or HTTPS.')

const HttpsUrlSchema = z
  .url()
  .refine(
    (value) => new URL(value).protocol === 'https:' && !hasAuthorityUserInfo(value),
    'Authorization URL must use HTTPS without embedded credentials.'
  )

export const TwitterSetupStatusSchema = z.object({
  backend: z.string(),
  callback_url: HttpUrlSchema,
  oauth_app_configured: z.boolean(),
  client_id: z.string().nullable(),
  connected: z.boolean(),
  user_id: z.string().nullable(),
  handle: z.string().nullable(),
  scopes: z.array(z.string()),
  reconnect_required: z.boolean(),
})

export const OAuthTransactionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'exchanging', 'succeeded', 'failed', 'expired']),
  authorize_url: HttpsUrlSchema.nullable(),
  expires_at: z.coerce.date(),
  error: z.string().nullable(),
})

export type TwitterSetupStatus = z.infer<typeof TwitterSetupStatusSchema>
export type OAuthTransaction = z.infer<typeof OAuthTransactionSchema>

export interface CorePeerCandidate {
  peer: Peer
  extension: InstalledExtension
  enabled: boolean
  setupAvailable: boolean
}

function advertises(peer: Peer, capability: string): boolean {
  try {
    return peer.capabilitySnapshot().some((candidate) => candidate.id === capability)
  } catch {
    return false
  }
}

export async function discoverCoreCandidates(signal?: AbortSignal): Promise<CorePeerCandidate[]> {
  signal?.throwIfAborted()
  const [extension, peers] = await Promise.all([
    ExtensionModel.get(EXTENSION_NAME),
    PeerManager.listLive(),
  ])
  signal?.throwIfAborted()
  if (!extension) return []
  return peers
    .filter((peer) => advertises(peer, EXTENSION_MANAGEMENT_CAPABILITY))
    .map((peer) => ({
      peer,
      extension,
      enabled: extension.enabled.includes(peer.id),
      setupAvailable: advertises(peer, TWITTER_SETUP_STATUS_CAPABILITY),
    }))
}

export class TwitterSetupAPI {
  constructor(readonly peer: Peer) {}

  enableCore(signal?: AbortSignal): Promise<InstalledExtension> {
    return delegateTwitterRequest(
      this.peer,
      EXTENSION_MANAGEMENT_CAPABILITY,
      { body: { action: 'enable', extension: EXTENSION_NAME } },
      InstalledExtensionSchema,
      signal
    )
  }

  status(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return delegateTwitterRequest(
      this.peer,
      TWITTER_SETUP_STATUS_CAPABILITY,
      {},
      TwitterSetupStatusSchema,
      signal
    )
  }

  saveOAuthApp(
    clientId: string,
    clientSecret: string,
    confirmAccountReset: boolean,
    signal?: AbortSignal
  ): Promise<TwitterSetupStatus> {
    return delegateTwitterRequest(
      this.peer,
      TWITTER_OAUTH_APP_CONFIGURE_CAPABILITY,
      {
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          confirm_account_reset: confirmAccountReset,
        },
      },
      TwitterSetupStatusSchema,
      signal
    )
  }

  beginOAuth(signal?: AbortSignal): Promise<OAuthTransaction> {
    return delegateTwitterRequest(
      this.peer,
      TWITTER_OAUTH_BEGIN_CAPABILITY,
      {},
      OAuthTransactionSchema,
      signal
    )
  }

  oauthTransaction(transactionId: string, signal?: AbortSignal): Promise<OAuthTransaction> {
    return delegateTwitterRequest(
      this.peer,
      TWITTER_OAUTH_TRANSACTION_READ_CAPABILITY,
      { body: { transaction_id: transactionId } },
      OAuthTransactionSchema,
      signal
    )
  }

  disconnect(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return delegateTwitterRequest(
      this.peer,
      TWITTER_OAUTH_DISCONNECT_CAPABILITY,
      {},
      TwitterSetupStatusSchema,
      signal
    )
  }
}

export interface BookmarkCollectionSetup {
  sources: Source[]
  source: Source | null
  cron: Cron | null
}

export class TwitterBookmarkSetup {
  static async read(sourceId?: number | null): Promise<BookmarkCollectionSetup> {
    const sources = (await Source.getAll()).filter((source) => source.type === BOOKMARK_SOURCE_TYPE)
    const source =
      sources.find((candidate) => candidate.id === sourceId) ??
      (sourceId == null && sources.length === 1 ? sources[0]! : null)
    const crons = source ? await Cron.getBySource(source.id) : []
    const cron =
      crons.find(
        (candidate) =>
          candidate.job_type === SOURCE_COLLECT_JOB_TYPE &&
          candidate.job_parameters.source === source?.id
      ) ?? null
    return { sources, source, cron }
  }

  static async createSource(nickname: string): Promise<Source> {
    return new SourceForm({
      type: BOOKMARK_SOURCE_TYPE,
      nickname,
      config: {},
      state: {},
      storage: null,
    }).create()
  }

  static async saveSchedule(source: Source, hour: number, minute: number): Promise<Cron> {
    const current = await this.read(source.id)
    const form = new CronForm({
      schedule: `${minute} ${hour} * * *`,
      enabled: current.cron?.enabled ?? false,
      job_type: SOURCE_COLLECT_JOB_TYPE,
      job_parameters: { source: source.id, config: { full: false, result_limit: 40 } },
      job_timeout_seconds: current.cron?.job_timeout_seconds ?? null,
    })
    return current.cron ? current.cron.update(form) : form.create()
  }

  static async finish(source: Source, cron: Cron): Promise<Cron> {
    const enabled = await cron.update(
      new CronForm({
        schedule: cron.schedule,
        enabled: true,
        job_type: SOURCE_COLLECT_JOB_TYPE,
        job_parameters: { source: source.id, config: { full: false, result_limit: 40 } },
        job_timeout_seconds: cron.job_timeout_seconds,
      })
    )
    await enabled.runNow()
    return enabled
  }
}

async function delegateTwitterRequest<Result>(
  peer: Peer,
  capability: string,
  request: TwitterPeerRequest,
  schema: z.ZodType<Result>,
  signal?: AbortSignal
): Promise<Result> {
  signal?.throwIfAborted()
  const delegated = await PeerManager.delegate(capability, request as JsonValue, peer.id)
  signal?.throwIfAborted()
  const response = PeerProtocolResponseSchema.parse(delegated)
  if (response.status < 200 || response.status >= 300 || response.body === undefined) {
    const detail =
      typeof response.body === 'object' &&
      response.body !== null &&
      !Array.isArray(response.body) &&
      typeof response.body.detail === 'string'
        ? response.body.detail
        : `Peer capability ${capability} returned HTTP ${response.status}.`
    throw new Error(detail)
  }
  return schema.parse(response.body)
}
