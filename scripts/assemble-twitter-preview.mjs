import assert from 'node:assert/strict'
import { cp, lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EXTENSION_NAME = 'inkcre/twitter'
const VERSION_PATTERN =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

function parseArguments(argumentList) {
  const options = {}
  for (let index = 0; index < argumentList.length; index += 2) {
    const option = argumentList[index]
    const value = argumentList[index + 1]
    assert.ok(option?.startsWith('--') && value, `expected option/value near ${option ?? ''}`)
    options[option.slice(2)] = value
  }
  return options
}

function requireOption(options, name) {
  assert.ok(options[name], `--${name} is required`)
  return options[name]
}

export async function assembleTwitterPreview({
  pagesDirectory,
  snapshotDirectory,
  releasePath,
  publicOrigin,
}) {
  const [release, manifest, pagesIndex, snapshotStats] = await Promise.all([
    readJson(releasePath),
    readJson(path.join(snapshotDirectory, 'mf-manifest.json')),
    lstat(path.join(pagesDirectory, 'index.html')),
    lstat(snapshotDirectory),
  ])

  assert.ok(pagesIndex.isFile(), 'Pages preview artifact must contain index.html')
  assert.ok(snapshotStats.isDirectory(), 'Twitter snapshot must be a directory')
  assert.equal(release.name, EXTENSION_NAME, 'preview Release must be inkcre/twitter')
  assert.equal(typeof release.nickname, 'string', 'preview Release nickname is required')
  assert.match(release.version, VERSION_PATTERN, 'preview Release version must be strict SemVer')
  assert.equal(release.state, 'published', 'preview Release must be published')
  assert.deepEqual(release.python, undefined, 'Web preview must not claim a Python Distribution')
  assert.deepEqual(
    release.module_federation,
    {
      manifest_url: `/extensions/${EXTENSION_NAME}/${release.version}/module-federation/mf-manifest.json`,
      host_sdk: '@inkcre/core',
      host_sdk_version: release.module_federation?.host_sdk_version,
    },
    'preview Release must contain exactly one native Web association'
  )
  assert.equal(
    typeof release.module_federation.host_sdk_version,
    'string',
    'preview Web Host SDK range is required'
  )
  assert.equal(manifest.name, 'extension.twitter', 'unexpected Module Federation Remote name')
  assert.equal(manifest.metaData?.publicPath, './', "preview manifest publicPath must be './'")
  assert.equal(
    manifest.metaData?.remoteEntry?.name,
    'remoteEntry.js',
    'preview manifest remote entry must be remoteEntry.js'
  )
  const canonicalOrigin = new URL(publicOrigin)
  assert.equal(canonicalOrigin.protocol, 'https:', 'preview public origin must use HTTPS')
  assert.equal(canonicalOrigin.pathname, '/', 'preview public origin must not contain a path')
  assert.equal(canonicalOrigin.search, '', 'preview public origin must not contain a query')
  assert.equal(canonicalOrigin.hash, '', 'preview public origin must not contain a fragment')

  const releaseFile = path.join(
    pagesDirectory,
    'v1',
    'extensions',
    'inkcre',
    'twitter',
    'releases',
    release.version
  )
  const distributionDirectory = path.join(
    pagesDirectory,
    'extensions',
    'inkcre',
    'twitter',
    release.version,
    'module-federation'
  )
  await Promise.all([
    mkdir(path.dirname(releaseFile), { recursive: true }),
    mkdir(distributionDirectory, { recursive: true }),
  ])
  await cp(snapshotDirectory, distributionDirectory, { recursive: true, force: false })
  manifest.metaData.publicPath = new URL(
    `/extensions/${EXTENSION_NAME}/${release.version}/module-federation/`,
    canonicalOrigin
  ).href
  await writeFile(
    path.join(distributionDirectory, 'mf-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  await writeFile(releaseFile, `${JSON.stringify(release, null, 2)}\n`)

  const headersPath = path.join(pagesDirectory, '_headers')
  const existingHeaders = await readFile(headersPath, 'utf8').catch(() => '')
  const previewHeaders = [
    '/v1/extensions/*',
    '  Access-Control-Allow-Origin: *',
    '  Cache-Control: no-store',
    '  Content-Type: application/json; charset=utf-8',
    '/extensions/*',
    '  Access-Control-Allow-Origin: *',
    '  Cache-Control: no-store',
    '',
  ].join('\n')
  await writeFile(
    headersPath,
    `${existingHeaders.trim()}${existingHeaders.trim() ? '\n' : ''}${previewHeaders}`
  )

  return { name: release.name, version: release.version, releaseFile, distributionDirectory }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  await assembleTwitterPreview({
    pagesDirectory: requireOption(options, 'pages-directory'),
    snapshotDirectory: requireOption(options, 'snapshot-directory'),
    releasePath: requireOption(options, 'release'),
    publicOrigin: requireOption(options, 'public-origin'),
  })
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(`[ERROR] ${error.message}`)
    process.exitCode = 1
  })
}
