import { describe, expect, it } from 'vitest'

import { canonicalProductionProfile, classifyPostgrestEndpoint } from './profile'

describe('database deployment profile', () => {
  it('classifies canonical and retired endpoints deterministically', () => {
    expect(classifyPostgrestEndpoint(canonicalProductionProfile.postgrest.url)).toEqual({
      status: 'canonical',
      replacement: null,
    })
    expect(classifyPostgrestEndpoint('https://inkcre-pgrst-dea0f3778176.herokuapp.com/')).toEqual({
      status: 'legacy',
      replacement: canonicalProductionProfile.postgrest.url,
    })
  })

  it('keeps the checked-in profile non-secret', () => {
    expect(canonicalProductionProfile.jwt.audience).toBe('inkcre-api')
    expect(canonicalProductionProfile.jwt.algorithm).toBe('HS256')
    expect(JSON.stringify(canonicalProductionProfile)).not.toMatch(
      /jwt_secret|password|database_url|api_key/i
    )
  })
})
