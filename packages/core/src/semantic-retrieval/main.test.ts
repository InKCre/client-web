import { afterEach, describe, expect, it, vi } from 'vitest'

import { Block, Relation } from '../info-base'
import { PeerManager } from '../peer'
import { SemanticRetrievalDelegationError, SemanticRetrievalManager } from './main'

describe('SemanticRetrievalManager', () => {
  afterEach(() => vi.restoreAllMocks())

  it('turns wire entities into active Block and Relation models', async () => {
    vi.spyOn(PeerManager, 'delegate').mockResolvedValue({
      status: 200,
      body: {
        profile: 3,
        metric: 'cosine',
        matches: [
          {
            type: 'block',
            entity: { id: 1, storage: null, resolver: 'core.text.v1', content: 'alpha' },
            score: 0.9,
          },
          { type: 'relation', entity: { id: 2, from_: 1, to_: 3, content: 'cites' }, score: 0.8 },
        ],
      },
    })

    const result = await SemanticRetrievalManager.retrieve({ query: 'alpha' })

    expect(result.matches[0]?.entity).toBeInstanceOf(Block)
    expect(result.matches[1]?.entity).toBeInstanceOf(Relation)
  })

  it('rejects malformed wire entities as a delegation contract failure', async () => {
    vi.spyOn(PeerManager, 'delegate').mockResolvedValue({
      status: 200,
      body: { profile: 3, metric: 'cosine', matches: [{ type: 'block', entity: {}, score: 0.9 }] },
    })

    await expect(SemanticRetrievalManager.retrieve({ query: 'alpha' })).rejects.toBeInstanceOf(
      SemanticRetrievalDelegationError
    )
  })
})
