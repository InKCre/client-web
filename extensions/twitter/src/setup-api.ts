import { Client, InstalledExtensionSchema, type InstalledExtension } from '@inkcre/core'
import { z } from 'zod'

const CollectAtSchema = z.object({
  day_of_week: z.number().int().min(0).max(6).nullable(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
})

const BookmarkSourceSchema = z.object({
  source_id: z.number().int().positive().nullable(),
  nickname: z.string(),
  collect_at: CollectAtSchema,
})

export const TwitterSetupStatusSchema = z.object({
  backend: z.string(),
  callback_url: z.url(),
  oauth_app_configured: z.boolean(),
  client_id: z.string().nullable(),
  connected: z.boolean(),
  user_id: z.string().nullable(),
  handle: z.string().nullable(),
  scopes: z.array(z.string()),
  reconnect_required: z.boolean(),
  bookmark_source_id: z.number().int().positive().nullable(),
  bookmark_sources: z.array(BookmarkSourceSchema),
  bookmark_source_ready: z.boolean(),
  ready: z.boolean(),
})

export const OAuthTransactionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'exchanging', 'succeeded', 'failed', 'expired']),
  authorize_url: z.url().nullable(),
  expires_at: z.coerce.date(),
  error: z.string().nullable(),
})

export type TwitterSetupStatus = z.infer<typeof TwitterSetupStatusSchema>
export type OAuthTransaction = z.infer<typeof OAuthTransactionSchema>

export interface CoreCandidate {
  client: Client
  extension: InstalledExtension
  enabled: boolean
}

type SetupClient = Pick<Client, 'request'>

export async function discoverCoreCandidates(signal?: AbortSignal): Promise<CoreCandidate[]> {
  const clients = (await Client.list()).filter((client) => client.rest_api_url)
  const candidates = await Promise.all(
    clients.map(async (client): Promise<CoreCandidate | null> => {
      try {
        const extension = await client.request({
          method: 'GET',
          path: '/extensions/inkcre/twitter',
          resBodySchema: InstalledExtensionSchema,
          signal,
        })
        return {
          client,
          extension,
          enabled: extension.enabled.includes(client.id),
        }
      } catch {
        return null
      }
    })
  )
  return candidates.filter((candidate): candidate is CoreCandidate => candidate !== null)
}

export class TwitterSetupAPI {
  constructor(readonly client: SetupClient) {}

  async enableCore(signal?: AbortSignal): Promise<InstalledExtension> {
    return this.client.request({
      method: 'POST',
      path: '/extensions/inkcre/twitter/enable',
      resBodySchema: InstalledExtensionSchema,
      signal,
    })
  }

  status(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return this.client.request({
      method: 'GET',
      path: '/twitter/setup',
      resBodySchema: TwitterSetupStatusSchema,
      signal,
    })
  }

  saveOAuthApp(
    clientId: string,
    clientSecret: string,
    confirmAccountReset: boolean,
    signal?: AbortSignal
  ): Promise<TwitterSetupStatus> {
    return this.client.request({
      method: 'PUT',
      path: '/twitter/setup/oauth-app',
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        confirm_account_reset: confirmAccountReset,
      },
      resBodySchema: TwitterSetupStatusSchema,
      signal,
    })
  }

  beginOAuth(signal?: AbortSignal): Promise<OAuthTransaction> {
    return this.client.request({
      method: 'POST',
      path: '/twitter/setup/oauth-transactions',
      resBodySchema: OAuthTransactionSchema,
      signal,
    })
  }

  oauthTransaction(id: string, signal?: AbortSignal): Promise<OAuthTransaction> {
    return this.client.request({
      method: 'GET',
      path: `/twitter/setup/oauth-transactions/${encodeURIComponent(id)}`,
      resBodySchema: OAuthTransactionSchema,
      signal,
    })
  }

  disconnect(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return this.client.request({
      method: 'DELETE',
      path: '/twitter/setup/account',
      resBodySchema: TwitterSetupStatusSchema,
      signal,
    })
  }

  ensureBookmarkSource(
    input: {
      source_id?: number
      nickname: string
      collect_at: { day_of_week: number | null; hour: number; minute: number }
    },
    signal?: AbortSignal
  ): Promise<TwitterSetupStatus> {
    return this.client.request({
      method: 'POST',
      path: '/twitter/setup/bookmark-source',
      body: input,
      resBodySchema: TwitterSetupStatusSchema,
      signal,
    })
  }

  finish(signal?: AbortSignal): Promise<TwitterSetupStatus> {
    return this.client.request({
      method: 'POST',
      path: '/twitter/setup/finish',
      resBodySchema: TwitterSetupStatusSchema,
      signal,
    })
  }
}
