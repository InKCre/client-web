import { describe, expect, it } from 'vitest'

import { MetaConfigSchema, PeerConfigSchema } from './schema'

describe('MetaConfigSchema', () => {
  it('represents an unconfigured persisted state without environment defaults', () => {
    expect(MetaConfigSchema.parse({})).toMatchObject({
      INKCRE_PGREST_URL: '',
      INKCRE_JWT_SECRET: '',
    })
    expect(MetaConfigSchema.parse({}).INKCRE_PEER_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('migrates one browser origin from the legacy Client identity', () => {
    expect(
      MetaConfigSchema.parse({
        INKCRE_CLIENT_ID: '00000000-0000-4000-8000-000000000003',
      }).INKCRE_PEER_ID
    ).toBe('00000000-0000-4000-8000-000000000003')
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

describe('PeerConfigSchema', () => {
  it('keeps Registry configuration unconfigured until deployment provides it', () => {
    expect(PeerConfigSchema.parse({})).toMatchObject({
      extension_registry_url: '',
    })
    expect(
      PeerConfigSchema.parse({
        extension_registry_url: 'https://registry.operator.example/',
      }).extension_registry_url
    ).toBe('https://registry.operator.example/')
  })

  it('preserves future owner-managed fields across an older Settings client', () => {
    expect(
      PeerConfigSchema.parse({ future_owner_setting: { enabled: true } }).future_owner_setting
    ).toEqual({ enabled: true })
  })
})
