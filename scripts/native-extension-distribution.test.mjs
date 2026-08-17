import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

import mfShared, { coreSharedVersion } from '../extensions/mf-shared.ts'
import {
  mailArtifactBase,
  mailBuildOptions,
  mailBuildTarget,
  mailFederationOptions,
} from '../extensions/mail/vite.config.ts'
import {
  twitterArtifactBase,
  twitterBuildOptions,
  twitterBuildTarget,
  twitterFederationOptions,
} from '../extensions/twitter/vite.config.ts'
import {
  inspectNativeModuleFederation,
  prepareBody,
  previewRelease,
  verifyPublicModuleFederation,
} from './verify-native-extension-distribution.mjs'
import { assembleTwitterPreview } from './assemble-twitter-preview.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'))
}

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'inkcre-twitter-mf-'))
  const artifactDirectory = path.join(root, 'dist')
  const packagePath = path.join(root, 'extension-package.json')
  const corePackagePath = path.join(root, 'core-package.json')
  const files = new Map([
    ['remoteEntry.js', Buffer.from("import './assets/shared.js'\n")],
    ['assets/shared.js', Buffer.from('export const shared = true\n')],
    ['assets/expose.css', Buffer.from('.twitter { color: black; }\n')],
  ])
  const manifest = {
    id: 'extension.twitter',
    name: 'extension.twitter',
    metaData: {
      name: 'extension.twitter',
      publicPath: './',
      remoteEntry: { name: 'remoteEntry.js', path: '', type: 'module' },
    },
    shared: [
      {
        name: '@inkcre/core',
        requiredVersion: '^0.1.0',
        assets: {
          js: { sync: ['assets/shared.js'], async: [] },
          css: { sync: [], async: [] },
        },
      },
    ],
    exposes: [
      {
        name: '.',
        assets: {
          js: { sync: [], async: [] },
          css: { sync: ['assets/expose.css'], async: [] },
        },
      },
    ],
  }
  const extensionPackage = {
    name: '@inkcre/ext-twitter',
    version: '0.1.1',
    inkcre: {
      name: 'inkcre/twitter',
      nickname: 'Twitter',
      module_federation: {
        host_sdk: '@inkcre/core',
        host_sdk_version: '>=0.1.0 <0.2.0',
      },
    },
  }

  await mkdir(path.join(artifactDirectory, 'assets'), { recursive: true })
  await Promise.all([
    ...[...files].map(([relativePath, content]) =>
      writeFile(path.join(artifactDirectory, relativePath), content)
    ),
    writeFile(path.join(artifactDirectory, 'mf-manifest.json'), `${JSON.stringify(manifest)}\n`),
    writeFile(packagePath, `${JSON.stringify(extensionPackage)}\n`),
    writeFile(corePackagePath, `${JSON.stringify({ name: '@inkcre/core', version: '0.1.0' })}\n`),
  ])

  return {
    root,
    artifactDirectory,
    packagePath,
    corePackagePath,
    files,
    manifest,
    extensionPackage,
  }
}

test('Twitter produces a native manifest with a Registry-relocatable base and typed association', async () => {
  const [extensionPackage, corePackage] = await Promise.all([
    readJson('extensions/twitter/package.json'),
    readJson('packages/core/package.json'),
  ])

  assert.equal(extensionPackage.inkcre.name, 'inkcre/twitter')
  assert.equal(extensionPackage.inkcre.nickname, 'Twitter')
  assert.deepEqual(extensionPackage.inkcre.module_federation, {
    host_sdk: '@inkcre/core',
    host_sdk_version: '>=0.1.2 <0.2.0',
  })
  assert.equal(twitterFederationOptions.manifest, true)
  assert.equal(twitterArtifactBase, './')
  assert.equal(twitterBuildTarget, 'es2022')
  assert.equal(twitterBuildOptions.outDir, 'dist/client-web')
  assert.equal(coreSharedVersion, `^${corePackage.version}`)
  assert.equal(mfShared['@inkcre/core'].requiredVersion, coreSharedVersion)
})

test('Mail declares the same relocatable native Extension distribution contract', async () => {
  const [extensionPackage, corePackage] = await Promise.all([
    readJson('extensions/mail/package.json'),
    readJson('packages/core/package.json'),
  ])

  assert.equal(extensionPackage.inkcre.name, 'inkcre/mail')
  assert.equal(extensionPackage.inkcre.nickname, 'Mail')
  assert.deepEqual(extensionPackage.inkcre.module_federation, {
    host_sdk: '@inkcre/core',
    host_sdk_version: '>=0.1.0 <0.2.0',
  })
  assert.equal(mailFederationOptions.manifest, true)
  assert.equal(mailArtifactBase, './')
  assert.equal(mailBuildTarget, 'es2022')
  assert.equal(mailBuildOptions.outDir, 'dist/client-web')
  assert.equal(coreSharedVersion, `^${corePackage.version}`)
})

test('validates native Remote entry and shared/exposed asset closure', async () => {
  const fixture = await createFixture()
  try {
    const result = await inspectNativeModuleFederation(fixture)
    assert.equal(result.name, 'inkcre/twitter')
    assert.equal(result.remote_entry, 'remoteEntry.js')
    assert.deepEqual(result.referenced_assets, [
      'assets/expose.css',
      'assets/shared.js',
      'remoteEntry.js',
    ])
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('builds the frozen native prepare payload with distribution-owned provenance', async () => {
  const fixture = await createFixture()
  try {
    const local = await inspectNativeModuleFederation(fixture)
    assert.deepEqual(
      prepareBody(local, {
        source_repository: 'https://github.com/inkcre/client-web',
        source_revision: 'a'.repeat(40),
        build_id: 'client-web-mf-build-123',
      }),
      {
        nickname: 'Twitter',
        version: '0.1.1',
        module_federation: {
          host_sdk: '@inkcre/core',
          host_sdk_version: '>=0.1.0 <0.2.0',
          source_repository: 'https://github.com/inkcre/client-web',
          source_revision: 'a'.repeat(40),
          build_id: 'client-web-mf-build-123',
        },
      }
    )
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('builds and assembles a read-only native Twitter preview projection', async () => {
  const fixture = await createFixture()
  const pagesDirectory = path.join(fixture.root, 'pages')
  const releasePath = path.join(fixture.root, 'release.json')
  try {
    await mkdir(pagesDirectory)
    await writeFile(path.join(pagesDirectory, 'index.html'), '<!doctype html>\n')
    const release = previewRelease(await inspectNativeModuleFederation(fixture))
    await writeFile(releasePath, `${JSON.stringify(release)}\n`)
    await assembleTwitterPreview({
      pagesDirectory,
      snapshotDirectory: fixture.artifactDirectory,
      releasePath,
      publicOrigin: 'https://preview.example/',
    })

    const publicRelease = JSON.parse(
      await readFile(
        path.join(pagesDirectory, 'v1/extensions/inkcre/twitter/releases/0.1.1'),
        'utf8'
      )
    )
    assert.deepEqual(publicRelease, release)
    assert.equal(
      await readFile(
        path.join(
          pagesDirectory,
          'extensions/inkcre/twitter/0.1.1/module-federation/remoteEntry.js'
        ),
        'utf8'
      ),
      fixture.files.get('remoteEntry.js').toString()
    )
    const publicManifest = JSON.parse(
      await readFile(
        path.join(
          pagesDirectory,
          'extensions/inkcre/twitter/0.1.1/module-federation/mf-manifest.json'
        ),
        'utf8'
      )
    )
    assert.equal(
      publicManifest.metaData.publicPath,
      'https://preview.example/extensions/inkcre/twitter/0.1.1/module-federation/'
    )
    assert.match(await readFile(path.join(pagesDirectory, '_headers'), 'utf8'), /no-store/)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a native manifest whose referenced closure is missing', async () => {
  const fixture = await createFixture()
  try {
    await rm(path.join(fixture.artifactDirectory, 'assets/shared.js'))
    await assert.rejects(() => inspectNativeModuleFederation(fixture), /missing asset/)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('verifies Registry publicPath materialization and exact native public bytes', async () => {
  const fixture = await createFixture()
  try {
    const publicPrefix =
      'https://registry.example/extensions/inkcre/twitter/0.1.1/module-federation/'
    const publicManifest = structuredClone(fixture.manifest)
    publicManifest.metaData.publicPath = publicPrefix
    const fetchImplementation = async (input) => {
      const url = new URL(input)
      const headers = {
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=31536000, immutable',
        etag: '"snapshot"',
      }
      if (url.pathname.endsWith('/v1/extensions/inkcre/twitter/releases/0.1.1')) {
        return Response.json(
          {
            name: 'inkcre/twitter',
            nickname: 'Twitter',
            version: '0.1.1',
            state: 'published',
            module_federation: {
              manifest_url: '/extensions/inkcre/twitter/0.1.1/module-federation/mf-manifest.json',
              host_sdk: '@inkcre/core',
              host_sdk_version: '>=0.1.0 <0.2.0',
            },
          },
          { headers }
        )
      }
      if (url.pathname.endsWith('/mf-manifest.json')) {
        return Response.json(publicManifest, { headers })
      }
      const relativePath = decodeURIComponent(url.href.slice(publicPrefix.length))
      const content = fixture.files.get(relativePath)
      return content ? new Response(content, { headers }) : new Response('missing', { status: 404 })
    }

    const result = await verifyPublicModuleFederation({
      ...fixture,
      registryUrl: 'https://registry.example',
      fetchImplementation,
    })

    assert.equal(result.manifest_url, `${publicPrefix}mf-manifest.json`)
    assert.equal(result.verified_assets, 3)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test('separates exact-main app delivery from the Changesets Extension release lifecycle', async () => {
  const [ci, delivery, preview, release] = await Promise.all([
    readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8'),
    readFile(path.join(repoRoot, '.github/workflows/pages-deploy.yml'), 'utf8'),
    readFile(path.join(repoRoot, '.github/workflows/pages-preview.yml'), 'utf8'),
    readFile(path.join(repoRoot, '.github/workflows/extension-release.yml'), 'utf8'),
  ])

  assert.match(ci, /push:\n\s+branches:\n\s+- main/)
  assert.match(ci, /database-contract:\n\s+name: Database contract\n\s+needs: core-release/)
  assert.match(ci, /workspace:\n\s+name: Workspace contract\n\s+runs-on:/)
  assert.match(ci, /name: twitter-mf-dist/)
  assert.match(ci, /name: twitter-mf-preview-release/)
  assert.match(ci, /verify-native-extension-distribution\.mjs preview-release/)
  assert.match(ci, /verify-native-extension-distribution\.mjs inspect-local/)
  assert.doesNotMatch(ci, /INKCRE_EXTENSION_REGISTRY_TOKEN/)

  assert.match(delivery, /workflow_run:\n\s+workflows:\n\s+- Client checks/)
  assert.doesNotMatch(delivery, /\n\s+push:/)
  assert.match(delivery, /run\.event !== 'push'/)
  assert.match(delivery, /run\.head_branch !== 'main'/)
  assert.match(delivery, /currentMain\.data\.object\.sha !== run\.head_sha/)
  assert.doesNotMatch(delivery, /name: twitter-mf-dist/)
  assert.match(delivery, /run-id: \$\{\{ needs\.identity\.outputs\.run_id \}\}/)
  assert.doesNotMatch(delivery, /INKCRE_EXTENSION_REGISTRY_TOKEN/)
  assert.doesNotMatch(delivery, /verify-native-extension-distribution\.mjs prepare-body/)
  assert.doesNotMatch(delivery, /module-federation/)

  assert.match(release, /push:\n\s+branches:\n\s+- main/)
  assert.doesNotMatch(release, /workflow_run:/)
  assert.doesNotMatch(release, /download-artifact/)
  assert.match(release, /changesets\/action@198f833dd7d863100ea6e28967bc9a9fdefadb0a/)
  assert.match(release, /github-token: \$\{\{ secrets\.GITHUB_TOKEN \}\}/)
  assert.match(release, /version-script: pnpm release:version/)
  assert.match(release, /pr-title: 'chore\(extensions\): version pending releases'/)
  assert.match(release, /create-github-releases: false/)
  assert.match(release, /push-git-tags: false/)
  assert.match(release, /needs\.reconcile\.outputs\.has_changesets == 'false'/)
  assert.match(release, /pnpm --filter '\.\/extensions\/\*' build/)
  assert.match(release, /pnpm --filter @inkcre\/core build/)
  assert.match(release, /for package_path in extensions\/\*\/package\.json/)
  assert.match(release, /manifest\.inkcre\?\.module_federation/)
  assert.match(release, /verify-native-extension-distribution\.mjs prepare-body/)
  assert.match(release, /SOURCE_REPOSITORY: https:\/\/github\.com\/\$\{\{ github\.repository \}\}/)
  assert.match(release, /SOURCE_REVISION: \$\{\{ github\.sha \}\}/)
  assert.match(release, /--build-id "client-web-extension-release-\$\{GITHUB_RUN_ID\}"/)
  assert.match(release, /--form "content=@\$delivery_directory\/snapshot\.zip/)
  assert.match(release, /\/module-federation"/)
  assert.match(release, /\/publish"/)
  assert.match(release, /verify-native-extension-distribution\.mjs verify-public/)
  assert.match(release, /INKCRE_EXTENSION_REGISTRY_TOKEN/)
  assert.doesNotMatch(preview, /workflow_run\.conclusion == 'success'/)
  assert.match(preview, /job\.name === 'Workspace contract'/)
  assert.match(preview, /workspace\.conclusion !== 'success'/)
  assert.match(preview, /candidate\.name === artifactName && !candidate\.expired/)
  assert.match(preview, /'twitter-mf-dist'/)
  assert.match(preview, /'twitter-mf-preview-release'/)
  assert.match(preview, /assemble-twitter-preview\.mjs/)
  assert.match(preview, /--public-origin https:\/\/preview-client-web-pr-/)
  assert.doesNotMatch(preview, /INKCRE_EXTENSION_REGISTRY_TOKEN/)

  assert.doesNotMatch(release, /pages deploy/)
})
