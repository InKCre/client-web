import { z } from 'zod'
import { Block, Relation } from '../info-base'
import { type JsonValue, PeerManager, PeerProtocolResponseSchema, type PeerRef } from '../peer'
import { zinstance } from '../utils'

export const SEMANTIC_RETRIEVAL_CAPABILITY = 'core.semantic_retrieval.v1'

export const VectorRetrievalOptionsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  min_score: z.number().min(-1).max(1).nullable().default(null),
  entity_types: z
    .array(z.enum(['block', 'relation']))
    .min(1)
    .default(['block', 'relation']),
})

export const SemanticRetrievalRequestSchema = z.object({
  query: z.string().trim().min(1),
  profile: z.number().int().nullable().default(null),
  options: VectorRetrievalOptionsSchema.default({
    limit: 20,
    min_score: null,
    entity_types: ['block', 'relation'],
  }),
})

export const SemanticRetrievalResultSchema = z.object({
  profile: z.number().int(),
  metric: z.literal('cosine'),
  matches: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('block'),
        entity: zinstance<Block>(Block),
        score: z.number().min(-1).max(1),
      }),
      z.object({
        type: z.literal('relation'),
        entity: zinstance<Relation>(Relation),
        score: z.number().min(-1).max(1),
      }),
    ])
  ),
})

export type SemanticRetrievalRequest = z.input<typeof SemanticRetrievalRequestSchema>
export type SemanticRetrievalResult = z.output<typeof SemanticRetrievalResultSchema>

export class SemanticRetrievalDelegationError extends Error {}

export class SemanticRetrievalManager {
  static async retrieve(
    request: SemanticRetrievalRequest,
    routeToPeer: PeerRef | null = null
  ): Promise<SemanticRetrievalResult> {
    const normalized = SemanticRetrievalRequestSchema.parse(request)
    const delegated = await PeerManager.delegate(
      SEMANTIC_RETRIEVAL_CAPABILITY,
      { body: normalized } as JsonValue,
      routeToPeer
    )
    const response = PeerProtocolResponseSchema.safeParse(delegated)
    if (
      !response.success ||
      response.data.status !== 200 ||
      !Object.prototype.hasOwnProperty.call(response.data, 'body')
    ) {
      throw new SemanticRetrievalDelegationError(
        response.success
          ? `Semantic retrieval Peer returned HTTP ${response.data.status}`
          : 'Semantic retrieval Peer returned an invalid response'
      )
    }
    const result = SemanticRetrievalResultSchema.safeParse(response.data.body)
    if (!result.success) {
      throw new SemanticRetrievalDelegationError(
        'Semantic retrieval Peer returned an invalid result'
      )
    }
    return result.data
  }
}
