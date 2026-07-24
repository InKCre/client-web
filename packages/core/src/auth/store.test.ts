import { jwtVerify } from 'jose'
import { afterEach, describe, expect, it } from 'vitest'

import { configStore } from '../config'
import { canonicalProductionProfile } from '../database'
import { createAuthStore } from './store'

const originalMetaConfig = { ...configStore.metaConfig }

afterEach(() => {
  Object.assign(configStore.metaConfig, originalMetaConfig)
})

describe('peer JWT contract', () => {
  it('issues the canonical claims for at most 24 hours', async () => {
    const secret = 'client-web-test-jwt-secret-at-least-32-bytes'
    Object.assign(configStore.metaConfig, {
      INKCRE_JWT_SECRET: secret,
    })
    const auth = createAuthStore()
    const token = await auth.newToken()
    const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: [canonicalProductionProfile.jwt.algorithm],
      issuer: canonicalProductionProfile.jwt.issuer,
      audience: canonicalProductionProfile.jwt.audience,
    })

    expect(verified.payload.role).toBe(canonicalProductionProfile.jwt.role)
    expect(verified.payload.exp! - verified.payload.iat!).toBe(
      canonicalProductionProfile.jwt.maximum_lifetime_seconds
    )
  })
})
