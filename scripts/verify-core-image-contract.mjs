import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
  generateDatabaseTypes,
  generateRuntimeContract,
  readJson,
  stableJson,
  validateContractDocument,
} from './database-contract-lib.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const pin = await readJson(`${repoRoot}/contracts/core-py.json`)
const expected = validateContractDocument(
  await readJson(`${repoRoot}/contracts/core-py-contract.json`)
)

execFileSync('docker', ['pull', pin.image], {
  cwd: repoRoot,
  stdio: 'inherit',
  timeout: 180_000,
})
const actual = validateContractDocument(
  JSON.parse(
    execFileSync('docker', ['run', '--rm', pin.image, 'db', 'contract', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
      timeout: 60_000,
    })
  )
)

if (actual.source_revision !== pin.source_revision) {
  throw new Error(
    `core image revision ${actual.source_revision} does not match pin ${pin.source_revision}`
  )
}
if (stableJson(actual) !== stableJson(expected)) {
  throw new Error('core image contract does not match the checked-in snapshot')
}
const generated = await import('node:fs/promises').then(({ readFile }) =>
  readFile(`${repoRoot}/packages/core/src/database/generated.ts`, 'utf8')
)
if (generated !== generateDatabaseTypes(actual)) {
  throw new Error('generated database types do not match the core image contract')
}
const generatedRuntimeContract = await import('node:fs/promises').then(({ readFile }) =>
  readFile(`${repoRoot}/packages/core/src/database/runtime-contract.ts`, 'utf8')
)
if (generatedRuntimeContract !== generateRuntimeContract(actual)) {
  throw new Error('generated runtime contract does not match the core image contract')
}

console.log(`[OK] ${pin.image} publishes ${actual.revision} from ${actual.source_revision}`)
