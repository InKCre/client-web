import { afterEach, describe, expect, it, vi } from 'vitest'

import { PeerManager } from '../peer'
import {
  LEXICAL_RETRIEVAL_CAPABILITY,
  LexicalRetrievalDelegationError,
  LexicalRetrievalManager,
} from './main'

describe('LexicalRetrievalManager', () => {
  afterEach(() => vi.restoreAllMocks())

  it('delegates the normalized request and validates the result', async () => {
    const delegate = vi.spyOn(PeerManager, 'delegate').mockResolvedValue({
      status: 200,
      body: {
        matches: [
          {
            block: {
              id: 7,
              storage: null,
              resolver: 'core.text.v1',
              content: 'continuous Chinese phrase',
            },
            label: 'text continuous Chinese phrase',
            excerpt: 'continuous Chinese phrase',
            evidence: 'text_substring',
            rank: 2,
          },
        ],
      },
    })

    const result = await LexicalRetrievalManager.retrieve({ query: '  Chinese phrase  ' })

    expect(delegate).toHaveBeenCalledWith(
      LEXICAL_RETRIEVAL_CAPABILITY,
      { body: { query: 'Chinese phrase', limit: 20 } },
      null
    )
    expect(result.matches[0]?.block).toMatchObject({ id: 7, resolver: 'core.text.v1' })
  })

  it('rejects a response that does not satisfy the capability contract', async () => {
    vi.spyOn(PeerManager, 'delegate').mockResolvedValue({ status: 200, body: { matches: [{}] } })

    await expect(LexicalRetrievalManager.retrieve({ query: 'mail' })).rejects.toBeInstanceOf(
      LexicalRetrievalDelegationError
    )
  })
})
