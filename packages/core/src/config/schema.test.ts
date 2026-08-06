import { describe, expect, it } from 'vitest'

import { MetaConfigSchema } from './schema'

describe('MetaConfigSchema', () => {
  it('represents an unconfigured persisted state without environment defaults', () => {
    expect(MetaConfigSchema.parse({})).toEqual({
      INKCRE_PGREST_URL: '',
      INKCRE_JWT_SECRET: '',
      INKCRE_PEER_ID: '',
    })
  })

  it('accepts explicit runtime coordinates and rejects malformed non-empty values', () => {
    expect(
      MetaConfigSchema.parse({
        INKCRE_PGREST_URL: 'https://database.example.test/',
        INKCRE_PEER_ID: '00000000-0000-4000-8000-000000000002',
      })
    ).toMatchObject({
      INKCRE_PGREST_URL: 'https://database.example.test/',
      INKCRE_PEER_ID: '00000000-0000-4000-8000-000000000002',
    })

    expect(
      MetaConfigSchema.safeParse({
        INKCRE_PGREST_URL: 'not-a-url',
        INKCRE_PEER_ID: 'not-a-uuid',
      }).success
    ).toBe(false)
  })
})
