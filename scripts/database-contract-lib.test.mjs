import { describe, expect, it } from 'vitest'

import { generateRuntimeContract, projectRuntimeContract } from './database-contract-lib.mjs'

const ownerContract = {
  format: 1,
  revision: 'test-runtime-v1',
  source_revision: 'a'.repeat(40),
  commands: ['ready'],
  profiles: ['runtime', 'development'],
  environment: 'production',
  client: {
    id: '00000000-0000-4000-8000-000000000001',
  },
  postgrest: {
    url: 'https://database.example.test/',
  },
  jwt: {
    algorithm: 'HS256',
    role: 'authenticated',
    issuer: 'inkcre-client',
    audience: 'inkcre-api',
    required_claims: ['role', 'iss', 'aud', 'iat', 'exp'],
    maximum_lifetime_seconds: 86400,
  },
  protocol: {
    format: 1,
    schema: 'inkcre',
    functions: {},
    relations: {
      blocks: {
        columns: {},
        relationships: [],
      },
    },
  },
}

describe('database runtime contract generation', () => {
  it('projects only browser-relevant protocol and JWT metadata', () => {
    const projected = projectRuntimeContract(ownerContract)

    expect(projected).toEqual({
      format: 1,
      revision: 'test-runtime-v1',
      protocol: {
        format: 1,
        schema: 'inkcre',
      },
      jwt: ownerContract.jwt,
    })
    expect(JSON.stringify(projected)).not.toMatch(
      /database\.example|client_id|environment|postgrest|source_revision/i
    )
  })

  it('generates a tree-shakeable JWT export without owner environment data', () => {
    const generated = generateRuntimeContract(ownerContract)

    expect(generated).toContain('export const peerJwtContract')
    expect(generated).toContain('export const databaseRuntimeContract')
    expect(generated).not.toMatch(
      /database\.example|00000000-0000-4000-8000-000000000001|environment|postgrest/i
    )
  })
})
