import { describe, expect, it } from 'vitest'

import { ClientConfigSchema, MetaConfigSchema } from './schema'

describe('MetaConfigSchema', () => {
  it('generates a stable-shape browser Client identity without an environment value', () => {
    expect(MetaConfigSchema.parse({})).toEqual({
      INKCRE_PGREST_URL: '',
      INKCRE_JWT_SECRET: '',
      client_id: expect.any(String),
    })
    expect(MetaConfigSchema.parse({}).client_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('accepts explicit runtime coordinates and rejects malformed non-empty values', () => {
    expect(
      MetaConfigSchema.parse({
        INKCRE_PGREST_URL: 'https://database.example.test/',
        client_id: '00000000-0000-4000-8000-000000000002',
      })
    ).toMatchObject({
      INKCRE_PGREST_URL: 'https://database.example.test/',
      client_id: '00000000-0000-4000-8000-000000000002',
    })

    expect(
      MetaConfigSchema.safeParse({
        INKCRE_PGREST_URL: 'not-a-url',
        client_id: 'not-a-uuid',
      }).success
    ).toBe(false)
  })

  it('migrates the former environment-style Client identity', () => {
    expect(
      MetaConfigSchema.parse({
        INKCRE_CLIENT_ID: '00000000-0000-4000-8000-000000000002',
      }).client_id
    ).toBe('00000000-0000-4000-8000-000000000002')
  })
})

describe('ClientConfigSchema', () => {
  it('keeps Registry configuration unconfigured until deployment provides it', () => {
    expect(ClientConfigSchema.parse({})).toMatchObject({
      extension_registry_url: '',
    })
    expect(
      ClientConfigSchema.parse({
        extension_registry_url: 'https://registry.operator.example/',
      }).extension_registry_url
    ).toBe('https://registry.operator.example/')
  })
})
