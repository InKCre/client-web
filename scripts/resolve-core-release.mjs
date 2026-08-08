import { appendFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { readJson, resolveCoreRelease, validateCoreReleaseConfig } from './core-release-lib.mjs'
import { resolveDatabaseProviderConfig, runDatabaseDocker } from './database-provider.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const config = validateCoreReleaseConfig(await readJson(`${repoRoot}/contracts/core-release.json`))
const expectedIndex = process.argv.indexOf('--expect')
const expected = expectedIndex >= 0 ? process.argv[expectedIndex + 1] : null
const provider = resolveDatabaseProviderConfig()
const runDocker = (args, options) => runDatabaseDocker(provider, args, options)
const release = resolveCoreRelease(runDocker, config.stable_image)

if (expected && release.image !== expected) {
  throw new Error(`core stable moved during validation: ${expected} -> ${release.image}`)
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `image=${release.image}`,
      `source_revision=${release.manifest.source_revision}`,
      `schema_digest=${release.manifest.schema.sha256}`,
      `contract_revision=${release.manifest.contract_revision}`,
      '',
    ].join('\n')
  )
}

console.log(
  JSON.stringify({
    image: release.image,
    source_revision: release.manifest.source_revision,
    schema_digest: release.manifest.schema.sha256,
    contract_revision: release.manifest.contract_revision,
  })
)
