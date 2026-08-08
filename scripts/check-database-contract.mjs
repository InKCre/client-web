import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import {
  generateDatabaseTypes,
  generateRuntimeContract,
  readJson,
  validateContractDocument,
} from './database-contract-lib.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const pin = await readJson(`${repoRoot}/contracts/core-py.json`)
const contract = validateContractDocument(
  await readJson(`${repoRoot}/contracts/core-py-contract.json`)
)
const errors = []

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

const generatedTypes = await readFile(`${repoRoot}/packages/core/src/database/generated.ts`, 'utf8')
if (generatedTypes !== generateDatabaseTypes(contract)) {
  errors.push('generated PostgREST relation types are stale')
}
const generatedRuntimeContract = await readFile(
  `${repoRoot}/packages/core/src/database/runtime-contract.ts`,
  'utf8'
)
if (generatedRuntimeContract !== generateRuntimeContract(contract)) {
  errors.push('generated environment-neutral runtime contract is stale')
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
