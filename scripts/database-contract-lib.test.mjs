import { describe, expect, it } from 'vitest'

import {
  generateDatabaseTypes,
  generateRuntimeContract,
  projectRuntimeContract,
} from './database-contract-lib.mjs'

const ownerContract = {
  format: 1,
  revision: 'test-runtime-v1',
  migration_heads: ['f0e1d2c3b4a5'],
  source_revision: 'a'.repeat(40),
  commands: ['ready'],
  profiles: ['runtime', 'development'],
  environment: 'production',
  peer: {
    id: '00000000-0000-4000-8000-000000000001',
  },
  postgrest: {
    url: 'https://database.example.test/',
  },
  jwt: {
    algorithm: 'HS256',
    role: 'authenticated',
    issuer: 'inkcre-peer',
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

  it('generates typed JSON RPCs and excludes raw upload arguments', () => {
    const contract = structuredClone(ownerContract)
    contract.protocol.functions = {
      create_storage_blob: {
        arguments: [{ name: null, type: { kind: 'string', format: 'bytea' } }],
        returns: { kind: 'string', format: 'uuid' },
        returns_set: false,
        volatility: 'volatile',
        request_media_type: 'application/octet-stream',
      },
      read_storage_blob: {
        arguments: [{ name: 'blob_id', type: { kind: 'string', format: 'uuid' } }],
        returns: { kind: 'string', format: 'bytea' },
        returns_set: false,
        volatility: 'stable',
        response_media_type: 'application/octet-stream',
      },
    }

    const generated = generateDatabaseTypes(contract)

    expect(generated).toContain('create_storage_blob: {')
    expect(generated).toContain('Args: never')
    expect(generated).toContain('read_storage_blob: {')
    expect(generated).toContain('blob_id: string')
  })
})
