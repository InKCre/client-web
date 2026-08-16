import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
  projectDatabaseCompatibilityContract,
  selectImmutableDigest,
  validateDatabaseCompatibilityContract,
  validateCoreReleaseConfig,
  validateRuntimeContract,
  validateSchemaManifest,
  verifyArtifact,
} from './core-release-lib.mjs'

const sourceRevision = '1'.repeat(40)
const digest = 'a'.repeat(64)
const manifest = {
  format: 1,
  contract_revision: 'peer-database-runtime-v3',
  source_revision: sourceRevision,
  schema: {
    path: '/app/database-contract/database-schema.sql',
    sha256: digest,
    size: 42,
  },
  roles: {
    path: '/app/database-contract/database-roles.sql',
    sha256: digest,
    size: 42,
  },
  runtime_contract: {
    path: '/app/database-contract/runtime-contract.json',
    sha256: digest,
    size: 42,
  },
}

test('accepts only the production-admitted core release channel', () => {
  assert.equal(
    validateCoreReleaseConfig({
      format: 1,
      repository: 'InKCre/core-py',
      stable_image: 'ghcr.io/inkcre/core-py:stable',
      runtime_images: {
        pgvector: `example/postgres@sha256:${digest}`,
        postgrest: `example/postgrest@sha256:${digest}`,
      },
    }).stable_image,
    'ghcr.io/inkcre/core-py:stable'
  )
})

test('selects the canonical immutable digest', () => {
  assert.equal(
    selectImmutableDigest([
      `ghcr.io/inkcre/core-py@sha256:${digest}`,
      `example.invalid/core@sha256:${'b'.repeat(64)}`,
    ]),
    `ghcr.io/inkcre/core-py@sha256:${digest}`
  )
})

test('rejects an ambiguous stable resolution', () => {
  assert.throws(
    () =>
      selectImmutableDigest([
        `ghcr.io/inkcre/core-py@sha256:${digest}`,
        `ghcr.io/inkcre/core-py@sha256:${'b'.repeat(64)}`,
      ]),
    /one canonical digest/
  )
})

test('binds runtime identity to the schema manifest', () => {
  const validated = validateSchemaManifest(manifest)
  assert.equal(
    validateRuntimeContract(
      {
        format: 1,
        revision: manifest.contract_revision,
        source_revision: sourceRevision,
        protocol: { schema: 'inkcre' },
        jwt: { algorithm: 'HS256', role: 'authenticated' },
      },
      validated
    ).revision,
    manifest.contract_revision
  )
})

test('projects image provenance out of the checked client contract', () => {
  const runtimeContract = {
    format: 1,
    revision: manifest.contract_revision,
    migration_heads: ['3f7a9c2d5e1b'],
    source_revision: sourceRevision,
    protocol: { format: 1, schema: 'inkcre' },
    jwt: {
      algorithm: 'HS256',
      audience: 'inkcre-api',
      issuer: 'inkcre-peer',
      role: 'authenticated',
    },
  }
  const laterRelease = { ...runtimeContract, source_revision: '2'.repeat(40) }
  const compatibility = projectDatabaseCompatibilityContract(runtimeContract)

  assert.deepEqual(projectDatabaseCompatibilityContract(laterRelease), compatibility)
  assert.deepEqual(validateDatabaseCompatibilityContract(compatibility), compatibility)
  assert.throws(() => validateDatabaseCompatibilityContract(runtimeContract), /non-client fields/)
})

test('rejects artifact content that differs from the manifest', () => {
  assert.throws(() => verifyArtifact(Buffer.from('wrong'), manifest.schema, 'schema'), /manifest/)
})
