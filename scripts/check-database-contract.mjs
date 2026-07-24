import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import {
  generateDatabaseTypes,
  generateProductionProfile,
  readJson,
  validateContractDocument,
} from './database-contract-lib.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const pin = await readJson(`${repoRoot}/contracts/core-py.json`)
const contract = validateContractDocument(
  await readJson(`${repoRoot}/contracts/core-py-contract.json`)
)
const profile = await readJson(`${repoRoot}/deploy/profiles/production.json`)
const legacyEndpoints = await readJson(`${repoRoot}/deploy/profiles/legacy-endpoints.json`)
const errors = []

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, comparable(item)])
  )
}

if (!/^[a-f0-9]{40}$/.test(pin.source_revision)) {
  errors.push('core source revision must be a full commit SHA')
}
if (!/^ghcr\.io\/inkcre\/core-py@sha256:[a-f0-9]{64}$/.test(pin.image)) {
  errors.push('core runtime image must use the canonical digest-pinned GHCR reference')
}
if (pin.contract_revision !== contract.revision) {
  errors.push('core pin and contract snapshot revisions differ')
}
if (contract.source_revision !== pin.source_revision) {
  errors.push('core contract snapshot was not emitted by the pinned source revision')
}
if (pin.migration_head !== profile.database_contract?.migration_head) {
  errors.push('core pin and production migration head differ')
}
if (
  profile.database_contract?.revision !== contract.revision ||
  profile.database_contract?.protocol_schema !== contract.protocol.schema
) {
  errors.push('production profile and executable database contract differ')
}
if (JSON.stringify(comparable(profile.jwt)) !== JSON.stringify(comparable(contract.jwt))) {
  errors.push('production profile and executable JWT contract differ')
}
if (profile.postgrest?.anonymous_access !== 'deny') {
  errors.push('canonical production profile must deny anonymous access')
}
if (legacyEndpoints.postgrest_hosts?.length === 0) {
  errors.push('legacy PostgREST migration detector must retain at least one retired host')
}

const generatedTypes = await readFile(`${repoRoot}/packages/core/src/database/generated.ts`, 'utf8')
if (generatedTypes !== generateDatabaseTypes(contract)) {
  errors.push('generated PostgREST relation types are stale')
}
const generatedProfile = await readFile(
  `${repoRoot}/packages/core/src/database/production-profile.ts`,
  'utf8'
)
if (generatedProfile !== generateProductionProfile(profile)) {
  errors.push('generated canonical production profile is stale')
}

const compose = await readFile(`${repoRoot}/runtime/database.compose.yml`, 'utf8')
for (const image of Object.values(pin.runtime_images)) {
  if (!compose.includes(image)) {
    errors.push(`database Compose does not use pinned runtime image ${image}`)
  }
}
if (!compose.includes('${INKCRE_CORE_IMAGE:?INKCRE_CORE_IMAGE is required}')) {
  errors.push('database Compose must receive the digest-pinned core image explicitly')
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[ERROR] ${error}`)
  process.exit(1)
}

console.log(
  `[OK] ${contract.revision} (${contract.protocol.schema}, ${Object.keys(contract.protocol.relations).length} relations) is pinned to ${pin.source_revision}`
)
