import { z } from 'zod'

import { Block } from '../info-base'
import { type JsonValue, PeerManager, PeerProtocolResponseSchema, type PeerRef } from '../peer'
import { zinstance } from '../utils'

export const LEXICAL_RETRIEVAL_CAPABILITY = 'core.feature_retrieval.lexical.v1'

export const LexicalRetrievalRequestSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().int().min(1).max(20).default(20),
})

export const LexicalEvidenceSchema = z.enum([
  'label_exact',
  'label_substring',
  'text_substring',
  'terms',
])

export const LexicalRetrievalMatchSchema = z.object({
  block: zinstance<Block>(Block),
  label: z.string(),
  excerpt: z.string(),
  evidence: LexicalEvidenceSchema,
  rank: z.number().nonnegative().finite(),
})

export const LexicalRetrievalResultSchema = z.object({
  matches: z.array(LexicalRetrievalMatchSchema),
})

export type LexicalRetrievalRequest = z.input<typeof LexicalRetrievalRequestSchema>
export type LexicalEvidence = z.output<typeof LexicalEvidenceSchema>
export type LexicalRetrievalMatch = z.output<typeof LexicalRetrievalMatchSchema>
export type LexicalRetrievalResult = z.output<typeof LexicalRetrievalResultSchema>

export class LexicalRetrievalDelegationError extends Error {}

export class LexicalRetrievalManager {
  static async retrieve(
    request: LexicalRetrievalRequest,
    routeToPeer: PeerRef | null = null
  ): Promise<LexicalRetrievalResult> {
    const normalized = LexicalRetrievalRequestSchema.parse(request)
    const delegated = await PeerManager.delegate(
      LEXICAL_RETRIEVAL_CAPABILITY,
      { body: normalized } as JsonValue,
      routeToPeer
    )
    const response = PeerProtocolResponseSchema.safeParse(delegated)
    if (
      !response.success ||
      response.data.status !== 200 ||
      !Object.prototype.hasOwnProperty.call(response.data, 'body')
    ) {
      throw new LexicalRetrievalDelegationError(
        response.success
          ? `Lexical retrieval Peer returned HTTP ${response.data.status}`
          : 'Lexical retrieval Peer returned an invalid response'
      )
    }
    const result = LexicalRetrievalResultSchema.safeParse(response.data.body)
    if (!result.success) {
      throw new LexicalRetrievalDelegationError('Lexical retrieval Peer returned an invalid result')
    }
    return result.data
  }
}
