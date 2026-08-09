import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

import {
  canonicalManifestBytes,
  captureExistingTarget,
  inspectLocalTarget,
  verifyPublicTarget,
} from './verify-twitter-target-delivery.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

function descriptor(content, mediaType) {
  return {
    sha256: createHash('sha256').update(content).digest('hex'),
    size: content.byteLength,
    media_type: mediaType,
  }
}

async function createTargetFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'inkcre-twitter-target-'))
  const artifactDirectory = path.join(root, 'artifact')
  const configPath = path.join(root, 'target-publish.json')
  const manifestPath = path.join(root, 'manifest.json')
  const remoteEntry = Buffer.from("export { load } from './assets/twitter.js'\n")
  const asset = Buffer.from('export const load = () => true\n')
  const stylesheet = Buffer.from('.twitter { color: black; }\n')

  await mkdir(path.join(artifactDirectory, 'assets'), { recursive: true })
  await Promise.all([
    writeFile(path.join(artifactDirectory, 'remoteEntry.js'), remoteEntry),
    writeFile(path.join(artifactDirectory, 'assets/twitter.js'), asset),
    writeFile(path.join(artifactDirectory, 'assets/twitter.css'), stylesheet),
  ])

  const config = {
    schema_version: 1,
    coordinate: 'inkcre/twitter',
    version: '0.1.0',
    target_key: 'web-module-federation-v1',
    artifact_format: 'module-federation-esm-v1',
    entrypoint: 'remoteEntry.js',
    conditions: [
      { key: 'web.ecmascript', operator: 'equals', value: 'es2022' },
      { key: 'inkcre.integration', operator: 'equals', value: 'module-federation-esm-v1' },
    ],
  }
  const manifest = {
    schema_version: 1,
    artifact_format: config.artifact_format,
    entrypoint: config.entrypoint,
    conditions: [...config.conditions].reverse(),
    files: {
      'remoteEntry.js': descriptor(remoteEntry, 'text/javascript'),
      'assets/twitter.js': descriptor(asset, 'text/javascript'),
      'assets/twitter.css': descriptor(stylesheet, 'text/css'),
    },
  }

  await Promise.all([
    writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`),
    writeFile(manifestPath, Buffer.concat([canonicalManifestBytes(manifest), Buffer.from('\n')])),
  ])

  return { root, artifactDirectory, configPath, manifestPath, config, manifest }
}

test('uses the Registry canonical key ordering instead of locale-dependent ordering', () => {
  const canonical = canonicalManifestBytes({
    schema_version: 1,
    artifact_format: 'module-federation-esm-v1',
    entrypoint: 'remoteEntry.js',
    conditions: [],
    files: {
      'assets/content.js': { media_type: 'text/javascript', sha256: 'b'.repeat(64), size: 1 },
      'assets/Dev.js': { media_type: 'text/javascript', sha256: 'a'.repeat(64), size: 1 },
      'remoteEntry.js': { media_type: 'text/javascript', sha256: 'c'.repeat(64), size: 1 },
    },
  }).toString('utf8')

  assert.ok(canonical.indexOf('assets/Dev.js') < canonical.indexOf('assets/content.js'))
})

test('validates the complete atomic Twitter remote directory against its canonical manifest', async () => {
  const fixture = await createTargetFixture()
  try {
    const result = await inspectLocalTarget(fixture)
    assert.equal(result.coordinate, 'inkcre/twitter')
    assert.equal(result.entrypoint, 'remoteEntry.js')
    assert.equal(result.asset_file_count, 2)
    assert.equal(result.file_count, 3)
    assert.match(result.target_digest, /^sha256:[0-9a-f]{64}$/)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a target directory with an asset omitted from its canonical manifest', async () => {
  const fixture = await createTargetFixture()
  try {
    await writeFile(path.join(fixture.artifactDirectory, 'assets/untracked.js'), 'export {}\n')
    await assert.rejects(() => inspectLocalTarget(fixture), /file set differ/)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('proves an idempotent same-digest rerun retains first target provenance', async () => {
  const fixture = await createTargetFixture()
  try {
    const local = await inspectLocalTarget(fixture)
    const originalTarget = {
      target_key: fixture.config.target_key,
      target_digest: local.target_digest,
      artifact_format: fixture.manifest.artifact_format,
      entrypoint: fixture.manifest.entrypoint,
      conditions: fixture.manifest.conditions,
      source_repository: 'https://github.com/InKCre/client-web',
      source_revision: '1'.repeat(40),
      build_id: 'client-web-target-delivery-100',
    }
    const release = {
      namespace: 'inkcre',
      name: 'twitter',
      version: '0.1.0',
      state: 'published',
      targets: [originalTarget],
    }
    const canonicalManifest = await readFile(fixture.manifestPath)
    const contents = new Map(
      await Promise.all(
        Object.keys(fixture.manifest.files).map(async (relativePath) => [
          relativePath,
          await readFile(path.join(fixture.artifactDirectory, relativePath)),
        ])
      )
    )
    const requests = []
    const fetchImplementation = async (input, init = {}) => {
      const requestPath = new URL(input).pathname
      requests.push({
        path: requestPath,
        origin: new Headers(init.headers).get('origin'),
      })
      if (requestPath.endsWith('/versions/0.1.0')) {
        return new Response(JSON.stringify(release), {
          status: 200,
          headers: { 'access-control-allow-origin': '*' },
        })
      }
      if (requestPath.endsWith('/manifest')) {
        return new Response(canonicalManifest, {
          status: 200,
          headers: {
            'access-control-allow-origin': '*',
            'cache-control': 'public, max-age=31536000, immutable',
          },
        })
      }
      const relativePath = decodeURIComponent(requestPath.split('/files/')[1] ?? '')
      const content = contents.get(relativePath)
      if (content) {
        return new Response(content, {
          status: 200,
          headers: {
            'access-control-allow-origin': '*',
            'cache-control': 'public, max-age=31536000, immutable',
          },
        })
      }
      return new Response('not found', { status: 404 })
    }

    const beforePublication = await captureExistingTarget({
      registryUrl: 'https://registry.example',
      configPath: fixture.configPath,
      targetDigest: local.target_digest,
      fetchImplementation,
    })
    const beforePublicationPath = path.join(fixture.root, 'before-publication.json')
    await writeFile(beforePublicationPath, `${JSON.stringify(beforePublication)}\n`)

    const result = await verifyPublicTarget({
      registryUrl: 'https://registry.example',
      configPath: fixture.configPath,
      manifestPath: fixture.manifestPath,
      beforePublicationPath,
      sourceRepository: 'https://github.com/InKCre/client-web',
      sourceRevision: '2'.repeat(40),
      buildId: 'client-web-target-delivery-101',
      deliveryRevision: '3'.repeat(40),
      deliveryRunId: '101',
      fetchImplementation,
    })

    assert.deepEqual(result.source_provenance, {
      source_repository: originalTarget.source_repository,
      source_revision: originalTarget.source_revision,
      build_id: originalTarget.build_id,
    })
    assert.deepEqual(result.delivery, {
      source_revision: '2'.repeat(40),
      controller_revision: '3'.repeat(40),
      workflow_run_id: '101',
    })
    const productionBrowserRequests = requests
      .filter((request) => request.origin === 'https://app.inkcre.dev')
      .map((request) => request.path)
    assert.ok(
      productionBrowserRequests.some((requestPath) => requestPath.endsWith('/versions/0.1.0'))
    )
    assert.ok(productionBrowserRequests.some((requestPath) => requestPath.endsWith('/manifest')))
    assert.ok(productionBrowserRequests.some((requestPath) => requestPath.includes('/files/')))
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('locks target delivery to checked main artifacts and the immutable publisher toolchain', async () => {
  const [ci, delivery, preview, publisherProject, publisherLock] = await Promise.all([
    readFile(`${repoRoot}/.github/workflows/ci.yml`, 'utf8'),
    readFile(`${repoRoot}/.github/workflows/pages-deploy.yml`, 'utf8'),
    readFile(`${repoRoot}/.github/workflows/pages-preview.yml`, 'utf8'),
    readFile(`${repoRoot}/tooling/extension-publisher/pyproject.toml`, 'utf8'),
    readFile(`${repoRoot}/tooling/extension-publisher/uv.lock`, 'utf8'),
  ])

  assert.match(ci, /push:\n\s+branches:\n\s+- main/)
  assert.match(ci, /actions\/setup-go@b7ad1dad31e06c5925ef5d2fc7ad053ef454303e/)
  assert.match(ci, /github\.com\/rhysd\/actionlint\/cmd\/actionlint@v1\.7\.12/)
  assert.match(ci, /name: twitter-target-dist/)
  assert.match(ci, /path: extensions\/twitter\/dist\/client-web/)
  assert.doesNotMatch(ci, /INKCRE_EXTENSION_REGISTRY_TOKEN/)

  assert.match(delivery, /workflow_run:\n\s+workflows:\n\s+- Client checks/)
  assert.doesNotMatch(delivery, /\n\s+push:/)
  assert.match(delivery, /run\.event !== 'push'/)
  assert.match(delivery, /run\.head_branch !== 'main'/)
  assert.match(delivery, /currentMain\.data\.object\.sha !== run\.head_sha/)
  assert.match(delivery, /name: client-web-dist/)
  assert.match(delivery, /name: twitter-target-dist/)
  assert.match(delivery, /run-id: \$\{\{ needs\.identity\.outputs\.run_id \}\}/)
  assert.match(delivery, /astral-sh\/setup-uv@c771a70e6277c0a99b617c7a806ffedaca235ff9/)
  assert.match(
    delivery,
    /uv run --project controller\/tooling\/extension-publisher --frozen inkcre-ext/
  )
  assert.match(
    delivery,
    /INKCRE_EXTENSION_REGISTRY_TOKEN: \$\{\{ secrets\.INKCRE_EXTENSION_REGISTRY_TOKEN \}\}/
  )
  assert.match(delivery, /--source-revision "\$\{\{ needs\.identity\.outputs\.source_sha \}\}"/)
  assert.match(delivery, /--delivery-revision "\$\{\{ github\.workflow_sha \}\}"/)

  const downloadTarget = delivery.indexOf('Download checked Twitter target artifact')
  const buildManifest = delivery.indexOf('Build and validate the canonical Twitter target manifest')
  const captureProvenance = delivery.indexOf('Capture existing target provenance')
  const publishTarget = delivery.indexOf('Publish the immutable Twitter target')
  const verifyPublic = delivery.indexOf('Verify the public target digest and provenance')
  const deployPages = delivery.indexOf('Deploy to Cloudflare Pages')
  assert.ok(downloadTarget < buildManifest)
  assert.ok(buildManifest < captureProvenance)
  assert.ok(captureProvenance < publishTarget)
  assert.ok(publishTarget < verifyPublic)
  assert.ok(verifyPublic < deployPages)
  assert.doesNotMatch(preview, /INKCRE_EXTENSION_REGISTRY_TOKEN/)

  assert.match(
    publisherProject,
    /inkcre-extension-registry\[cli\] @ https:\/\/github\.com\/InKCre\/ext-reg\/releases\/download\/v0\.1\.2\/inkcre_extension_registry-0\.1\.2-py3-none-any\.whl#sha256=ac8771ba3a92b5e50deee1ea6f5a81511b3e0f4d716c60e24d873c99b9641e56/
  )
  assert.match(publisherProject, /requires-python = ">=3\.12,<3\.13"/)
  assert.match(publisherLock, /name = "inkcre-extension-registry"\nversion = "0\.1\.2"/)
  assert.match(
    publisherLock,
    /hash = "sha256:ac8771ba3a92b5e50deee1ea6f5a81511b3e0f4d716c60e24d873c99b9641e56"/
  )
})
