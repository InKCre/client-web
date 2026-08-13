import { describe, expect, it } from 'vitest'

import { databaseRuntimeContract, peerJwtContract } from './runtime-contract'

describe('database runtime contract', () => {
  it('contains only environment-neutral protocol and JWT metadata', () => {
    expect(databaseRuntimeContract).toEqual({
      format: 1,
      revision: 'extension-registry-feature-retrieval-v1',
      protocol: {
        format: 1,
        schema: 'inkcre',
      },
      jwt: peerJwtContract,
    })
    expect(Object.keys(databaseRuntimeContract)).toEqual(['format', 'revision', 'protocol', 'jwt'])
    expect(JSON.stringify(databaseRuntimeContract)).not.toMatch(
      /https?:|client_id|environment|postgrest|herokuapp/i
    )
  })
})
