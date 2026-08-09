import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

import mfShared, { coreSharedVersion } from '../extensions/mf-shared.ts'
import {
  twitterArtifactBase,
  twitterBuildOptions,
  twitterBuildTarget,
} from '../extensions/twitter/vite.config.ts'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

async function readJson(path) {
  return JSON.parse(await readFile(`${repoRoot}/${path}`, 'utf8'))
}

test('Twitter target metadata matches its current Module Federation host contract', async () => {
  const [target, clientPackage, corePackage] = await Promise.all([
    readJson('extensions/twitter/target-publish.json'),
    readJson('apps/client-web/package.json'),
    readJson('packages/core/package.json'),
  ])
  const conditions = Object.fromEntries(
    target.conditions.map((condition) => [
      condition.key,
      { operator: condition.operator, value: condition.value },
    ])
  )
  assert.equal(target.schema_version, 1)
  assert.equal(target.coordinate, 'inkcre/twitter')
  assert.equal(target.version, '0.1.0')
  assert.equal(target.target_key, 'web-module-federation-v1')
  assert.equal(target.artifact_format, 'module-federation-esm-v1')
  assert.equal(target.entrypoint, 'remoteEntry.js')
  assert.deepEqual(conditions, {
    'inkcre.integration': { operator: 'equals', value: target.artifact_format },
    'inkcre.extension-api': { operator: 'semver', value: '^1.0.0' },
    'module-federation.runtime': {
      operator: 'semver',
      value: clientPackage.dependencies['@module-federation/runtime'],
    },
    'module-federation.share-scope': { operator: 'equals', value: 'default' },
    'shared.vue': { operator: 'semver', value: clientPackage.dependencies.vue },
    'shared.@inkcre/core': { operator: 'semver', value: `^${corePackage.version}` },
    'web.ecmascript': { operator: 'equals', value: twitterBuildTarget },
  })
  assert.equal(coreSharedVersion, `^${corePackage.version}`)
  assert.equal(mfShared['@inkcre/core'].requiredVersion, coreSharedVersion)
  assert.equal(twitterArtifactBase, './')
  assert.equal(twitterBuildOptions.target, twitterBuildTarget)
  assert.equal(twitterBuildOptions.outDir, 'dist/client-web')
})
