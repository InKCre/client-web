import { z } from 'zod'
import type { Peer } from './peer'

const DatabaseComponentSchema = z.object({
  status: z.string(),
  problems: z.array(z.string()).optional(),
})

/** Public diagnostics only; lease and capability advertisements remain routing authority. */
export const PeerReadinessSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  runtime: z.object({
    phase: z.string(),
    reason: z.string(),
    step: z.string().nullable().optional(),
  }),
  database: z.object({
    status: z.string(),
    database: DatabaseComponentSchema.optional(),
    migration: DatabaseComponentSchema.extend({
      current: z.array(z.string()).optional(),
      expected: z.array(z.string()).optional(),
    }).optional(),
    roles: DatabaseComponentSchema.optional(),
    privileges: DatabaseComponentSchema.optional(),
    catalog: DatabaseComponentSchema.optional(),
    seed: DatabaseComponentSchema.optional(),
  }),
})

export type PeerReadiness = z.infer<typeof PeerReadinessSchema>
export type PeerReadinessObservation =
  | { status: 'ready' | 'not_ready'; diagnostics: PeerReadiness }
  | {
      status: 'unavailable'
      reason:
        | 'no_endpoint'
        | 'invalid_endpoint'
        | 'transport_error'
        | 'http_error'
        | 'invalid_response'
    }

/** Observe an explicit public HTTP base without authentication or runtime mutation. */
export async function probePeerReadiness(peer: Peer): Promise<PeerReadinessObservation> {
  const base = peer.config.http_public_base_url
  if (base === null || base === undefined || base === '') {
    return { status: 'unavailable', reason: 'no_endpoint' }
  }
  let url: URL
  try {
    if (typeof base !== 'string') throw new Error('Invalid endpoint')
    url = new URL(base)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error('Invalid endpoint')
    }
    url.pathname = `${url.pathname.replace(/\/$/, '')}/readyz`
  } catch {
    return { status: 'unavailable', reason: 'invalid_endpoint' }
  }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), credentials: 'omit' })
    if (!response.ok && response.status !== 503)
      return { status: 'unavailable', reason: 'http_error' }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      return { status: 'unavailable', reason: 'invalid_response' }
    }
    const result = PeerReadinessSchema.safeParse(body)
    if (!result.success) return { status: 'unavailable', reason: 'invalid_response' }
    return { status: result.data.status, diagnostics: result.data }
  } catch {
    return { status: 'unavailable', reason: 'transport_error' }
  }
}
