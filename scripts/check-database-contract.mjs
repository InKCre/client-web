import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import {
  readJson,
  validateCoreReleaseConfig,
  validateRuntimeContract,
} from './core-release-lib.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const config = validateCoreReleaseConfig(await readJson(`${repoRoot}/contracts/core-release.json`))
const generatedTypes = await readFile(
  `${repoRoot}/packages/core/src/database/database.generated.ts`,
  'utf8'
)
const adapter = await readFile(`${repoRoot}/packages/core/src/database/generated.ts`, 'utf8')
const runtimeContract = await readJson(
  `${repoRoot}/packages/core/src/database/runtime-contract.generated.json`
)
const compose = await readFile(`${repoRoot}/runtime/database.compose.yml`, 'utf8')
const errors = []

if (!generatedTypes.includes('export type Database = {') || !generatedTypes.includes('inkcre: {')) {
  errors.push('Supabase-generated database types must expose the inkcre schema')
}
for (const alias of ['Database', 'Json', 'InkcreSchema', 'RelationName', 'RelationRow']) {
  if (!adapter.includes(alias)) errors.push(`database type adapter must expose ${alias}`)
}
try {
  validateRuntimeContract(runtimeContract, {
    contract_revision: runtimeContract.revision,
    source_revision: runtimeContract.source_revision,
  })
} catch (error) {
  errors.push(error.message)
}
for (const image of Object.values(config.runtime_images)) {
  if (!compose.includes(image)) errors.push(`database Compose does not use ${image}`)
}
for (const expected of [
  '${INKCRE_CORE_IMAGE:?INKCRE_CORE_IMAGE is required}',
  'database-contract:/database-contract',
  "user: '0:0'",
  'psql -v ON_ERROR_STOP=1 -h postgres -U postgres -d inkcre',
  "['python', 'scripts/container.py', 'db', 'init'",
  "['python', 'scripts/container.py', 'web']",
]) {
  if (!compose.includes(expected)) errors.push(`database Compose is missing ${expected}`)
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[ERROR] ${error}`)
  process.exit(1)
}

console.log('[OK] stable core release, Supabase types, and real-service Compose are declared')
