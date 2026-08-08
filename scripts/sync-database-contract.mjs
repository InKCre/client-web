import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  generateDatabaseTypes,
  generateRuntimeContract,
  readJson,
  stableJson,
  validateContractDocument,
} from './database-contract-lib.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const arguments_ = process.argv.slice(2)
const localCoreIndex = arguments_.indexOf('--local-core')
const imageIndex = arguments_.indexOf('--image')
const localCore = localCoreIndex >= 0 ? resolve(repoRoot, arguments_[localCoreIndex + 1]) : null
const requestedImage = imageIndex >= 0 ? arguments_[imageIndex + 1] : null

function output(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: options.env ?? process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  }).trim()
}

const existingPin = await readJson(`${repoRoot}/contracts/core-py.json`)
const image = requestedImage ?? existingPin.image
let contract
let sourceRevision

if (localCore) {
  sourceRevision = output('git', ['rev-parse', 'HEAD'], { cwd: localCore })
  contract = JSON.parse(
    output('pdm', ['run', 'db:contract'], {
      cwd: localCore,
      env: {
        ...process.env,
        INKCRE_SOURCE_REVISION: sourceRevision,
      },
    })
  )
} else {
  output('docker', ['pull', image])
  contract = JSON.parse(output('docker', ['run', '--rm', image, 'db', 'contract', '--json']))
  sourceRevision = contract.source_revision
}

validateContractDocument(contract)
if (!/^[a-f0-9]{40}$/.test(sourceRevision)) {
  throw new Error(`core source revision must be a full commit SHA, got ${sourceRevision}`)
}
if (!image.includes('@sha256:')) {
  throw new Error('core image must be pinned by digest')
}

const pin = {
  ...existingPin,
  source_revision: sourceRevision,
  image,
  contract_revision: contract.revision,
}

await mkdir(`${repoRoot}/packages/core/src/database`, { recursive: true })
await writeFile(`${repoRoot}/contracts/core-py.json`, stableJson(pin))
await writeFile(`${repoRoot}/contracts/core-py-contract.json`, stableJson(contract))
await writeFile(
  `${repoRoot}/packages/core/src/database/generated.ts`,
  generateDatabaseTypes(contract)
)
await writeFile(
  `${repoRoot}/packages/core/src/database/runtime-contract.ts`,
  generateRuntimeContract(contract)
)

console.log(`[contract] synced ${contract.revision} from ${sourceRevision} using ${image}`)
