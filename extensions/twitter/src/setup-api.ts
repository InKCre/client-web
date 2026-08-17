import {
  InstalledExtensionSchema,
  Peer,
  PeerManager,
  PeerProtocolResponseSchema,
  PostgrestExtensionStatePort,
  type ExtensionStatePort,
  type InstalledExtension,
  type JsonValue,
} from '@inkcre/core'
import { z } from 'zod'

const EXTENSION_NAME = 'inkcre/twitter'
const EXTENSION_MANAGEMENT_CAPABILITY = 'core.extension.management.v1'
const TWITTER_SETUP_CAPABILITY = 'inkcre.twitter.setup.v1'

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

const CollectAtSchema = z.object({
  day_of_week: z.number().int().min(0).max(6).nullable(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
})

const BookmarkSourceSchema = z.object({
  source_id: z.number().int().positive(),
  nickname: z.string(),
})

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
  bookmark_source_id: z.number().int().positive().nullable(),
  bookmark_cron_id: z.number().int().positive().nullable(),
  bookmark_sources: z.array(BookmarkSourceSchema),
  collect_at: CollectAtSchema,
  bookmark_source_ready: z.boolean(),
  ready: z.boolean(),
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

export async function discoverCoreCandidates(
  signal?: AbortSignal,
  state: ExtensionStatePort = new PostgrestExtensionStatePort()
): Promise<CorePeerCandidate[]> {
  signal?.throwIfAborted()
  const [extension, peers] = await Promise.all([state.get(EXTENSION_NAME), PeerManager.listLive()])
  signal?.throwIfAborted()
  if (!extension) return []
  return peers
    .filter((peer) => advertises(peer, EXTENSION_MANAGEMENT_CAPABILITY))
    .map((peer) => ({
      peer,
      extension,
      enabled: extension.enabled.includes(peer.id),
      setupAvailable: advertises(peer, TWITTER_SETUP_CAPABILITY),
    }))
}

export class TwitterSetupAPI {
  constructor(readonly peer: Peer) {}

  enableCore(signal?: AbortSignal): Promise<InstalledExtension> {
    return executeCapability(
      this.peer,
      EXTENSION_MANAGEMENT_CAPABILITY,
      { action: 'enable', extension: EXTENSION_NAME },
      InstalledExtensionSchema,
      signal
    )
  }

  status(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return this.setup({ action: 'get_status' }, TwitterSetupStatusSchema, signal)
  }

  saveOAuthApp(
    clientId: string,
    clientSecret: string,
    confirmAccountReset: boolean,
    signal?: AbortSignal
  ): Promise<TwitterSetupStatus> {
    return this.setup(
      {
        action: 'save_oauth_app',
        client_id: clientId,
        client_secret: clientSecret,
        confirm_account_reset: confirmAccountReset,
      },
      TwitterSetupStatusSchema,
      signal
    )
  }

  beginOAuth(signal?: AbortSignal): Promise<OAuthTransaction> {
    return this.setup({ action: 'begin_oauth' }, OAuthTransactionSchema, signal)
  }

  oauthTransaction(transactionId: string, signal?: AbortSignal): Promise<OAuthTransaction> {
    return this.setup(
      { action: 'get_oauth_transaction', transaction_id: transactionId },
      OAuthTransactionSchema,
      signal
    )
  }

  disconnect(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return this.setup({ action: 'disconnect_account' }, TwitterSetupStatusSchema, signal)
  }

  configureBookmarkSource(
    input: {
      source_id?: number
      nickname: string
      collect_at: { day_of_week: number | null; hour: number; minute: number }
    },
    signal?: AbortSignal
  ): Promise<TwitterSetupStatus> {
    return this.setup(
      { action: 'configure_bookmark_source', ...input },
      TwitterSetupStatusSchema,
      signal
    )
  }

  finish(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return this.setup({ action: 'finish' }, TwitterSetupStatusSchema, signal)
  }

  private setup<Result>(
    command: JsonValue,
    schema: z.ZodType<Result>,
    signal?: AbortSignal
  ): Promise<Result> {
    return executeCapability(this.peer, TWITTER_SETUP_CAPABILITY, command, schema, signal)
  }
}

async function executeCapability<Result>(
  peer: Peer,
  capability: string,
  command: JsonValue,
  schema: z.ZodType<Result>,
  signal?: AbortSignal
): Promise<Result> {
  signal?.throwIfAborted()
  const delegated = await PeerManager.delegate(capability, { body: command }, peer.id)
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
