import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { appendFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PRODUCTION_BROWSER_ORIGIN = 'https://app.inkcre.dev'

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

function canonicalCompare(left, right) {
  if (left === right) {
    return 0
  }
  return left < right ? -1 : 1
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => canonicalCompare(left, right))
      .map(([key, child]) => [key, sortObject(child)])
  )
}

export function sortedConditions(conditions) {
  assert.ok(Array.isArray(conditions), 'target conditions must be an array')
  return [...conditions].sort((left, right) => {
    const leftKey = `${left.key}\u0000${left.operator}\u0000${left.value}`
    const rightKey = `${right.key}\u0000${right.operator}\u0000${right.value}`
    return canonicalCompare(leftKey, rightKey)
  })
}

export function canonicalManifestBytes(manifest) {
  const normalized = {
    ...manifest,
    conditions: sortedConditions(manifest.conditions),
  }
  return Buffer.from(JSON.stringify(sortObject(normalized)), 'utf8')
}

function canonicalJson(value) {
  return JSON.stringify(sortObject(value))
}

function assertSafeRelativePath(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`)
  assert.ok(value.length > 0, `${label} must not be empty`)
  assert.ok(!value.startsWith('/'), `${label} must be relative`)
  assert.ok(!value.includes('\\'), `${label} must use POSIX separators`)
  assert.ok(!value.includes('?') && !value.includes('#'), `${label} must be URL-safe`)
  assert.ok(
    !value.split('/').some((part) => part === '' || part === '.' || part === '..'),
    `${label} must be normalized and traversal-free`
  )
}

function assertManifestShape(manifest) {
  assert.equal(manifest?.schema_version, 1, 'target manifest must use schema version 1')
  assert.equal(
    typeof manifest.artifact_format,
    'string',
    'target manifest artifact format is missing'
  )
  assertSafeRelativePath(manifest.entrypoint, 'target manifest entrypoint')
  assert.ok(
    manifest.files && typeof manifest.files === 'object',
    'target manifest files are missing'
  )
  assert.ok(Object.keys(manifest.files).length > 0, 'target manifest must declare files')

  const conditions = sortedConditions(manifest.conditions)
  const conditionKeys = new Set()
  for (const condition of conditions) {
    assert.equal(typeof condition.key, 'string', 'target condition key is missing')
    assert.equal(typeof condition.operator, 'string', 'target condition operator is missing')
    assert.equal(typeof condition.value, 'string', 'target condition value is missing')
    assert.ok(!conditionKeys.has(condition.key), `target condition is duplicated: ${condition.key}`)
    conditionKeys.add(condition.key)
  }

  for (const [relativePath, descriptor] of Object.entries(manifest.files)) {
    assertSafeRelativePath(relativePath, 'target manifest file path')
    assert.match(descriptor.sha256, /^[0-9a-f]{64}$/, `invalid SHA-256 for ${relativePath}`)
    assert.ok(
      Number.isInteger(descriptor.size) && descriptor.size >= 0,
      `invalid size for ${relativePath}`
    )
    assert.equal(typeof descriptor.media_type, 'string', `missing media type for ${relativePath}`)
  }

  assert.ok(manifest.files[manifest.entrypoint], 'target manifest does not declare its entrypoint')
}

function assertConfigMatchesManifest(config, manifest) {
  assert.equal(config?.schema_version, 1, 'target publish config must use schema version 1')
  assert.equal(typeof config.coordinate, 'string', 'target publish config coordinate is missing')
  assert.equal(typeof config.version, 'string', 'target publish config version is missing')
  assert.equal(typeof config.target_key, 'string', 'target publish config target key is missing')
  assert.equal(
    config.artifact_format,
    manifest.artifact_format,
    'artifact format changed after the build'
  )
  assert.equal(config.entrypoint, manifest.entrypoint, 'entrypoint changed after the build')
  assert.equal(
    canonicalJson(sortedConditions(config.conditions)),
    canonicalJson(sortedConditions(manifest.conditions)),
    'compatibility conditions changed after the build'
  )
}

async function listArtifactFiles(root, relativeDirectory = '') {
  const directory = path.join(root, relativeDirectory)
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries.sort((left, right) => canonicalCompare(left.name, right.name))) {
    const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
    const absolutePath = path.join(root, relativePath)
    const status = await lstat(absolutePath)
    assert.ok(
      !status.isSymbolicLink(),
      `target artifact must not contain symbolic links: ${relativePath}`
    )

    if (status.isDirectory()) {
      files.push(...(await listArtifactFiles(root, relativePath)))
      continue
    }
    assert.ok(status.isFile(), `target artifact must contain only regular files: ${relativePath}`)
    files.push(relativePath)
  }

  return files
}

async function readJson(jsonPath) {
  return JSON.parse(await readFile(jsonPath, 'utf8'))
}

async function readCanonicalManifest(manifestPath) {
  const emitted = await readFile(manifestPath)
  const manifest = JSON.parse(emitted)
  assertManifestShape(manifest)

  const expected = Buffer.concat([canonicalManifestBytes(manifest), Buffer.from('\n')])
  assert.ok(
    emitted.equals(expected),
    'target manifest is not the canonical bytes emitted by the pinned Registry CLI'
  )
  return manifest
}

export async function inspectLocalTarget({ configPath, artifactDirectory, manifestPath }) {
  const [config, manifest, artifactFiles] = await Promise.all([
    readJson(configPath),
    readCanonicalManifest(manifestPath),
    listArtifactFiles(artifactDirectory),
  ])
  assertConfigMatchesManifest(config, manifest)

  const expectedFiles = Object.keys(manifest.files).sort()
  assert.deepEqual(
    artifactFiles.sort(),
    expectedFiles,
    'target directory and manifest file set differ'
  )
  assert.ok(
    artifactFiles.includes(config.entrypoint),
    'target directory does not contain remoteEntry.js'
  )

  const assetFiles = artifactFiles.filter((relativePath) => relativePath.startsWith('assets/'))
  assert.ok(
    assetFiles.length > 0,
    'target directory must atomically include remoteEntry.js and assets/'
  )

  for (const relativePath of artifactFiles) {
    const content = await readFile(path.join(artifactDirectory, relativePath))
    const descriptor = manifest.files[relativePath]
    assert.equal(
      sha256(content),
      descriptor.sha256,
      `target file SHA-256 differs from manifest: ${relativePath}`
    )
    assert.equal(
      content.byteLength,
      descriptor.size,
      `target file size differs from manifest: ${relativePath}`
    )
  }

  const remoteEntry = await readFile(path.join(artifactDirectory, config.entrypoint), 'utf8')
  assert.ok(
    remoteEntry.includes('./assets/'),
    'remoteEntry.js must load its chunks from the relative assets/ directory'
  )

  return {
    coordinate: config.coordinate,
    version: config.version,
    target_key: config.target_key,
    target_digest: `sha256:${sha256(canonicalManifestBytes(manifest))}`,
    artifact_format: manifest.artifact_format,
    entrypoint: manifest.entrypoint,
    file_count: artifactFiles.length,
    asset_file_count: assetFiles.length,
  }
}

function registryRoot(registryUrl) {
  const origin = new URL(registryUrl)
  assert.equal(origin.protocol, 'https:', 'Registry URL must use HTTPS')
  return origin.href.replace(/\/$/, '')
}

function releaseLocation(registryUrl, config) {
  const [namespace, name] = config.coordinate.split('/', 2)
  return `${registryRoot(registryUrl)}/v1/extensions/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/versions/${encodeURIComponent(config.version)}`
}

function manifestLocation(registryUrl, targetDigest) {
  return `${registryRoot(registryUrl)}/v1/artifacts/${targetDigest}/manifest`
}

function artifactFileLocation(registryUrl, targetDigest, relativePath) {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/')
  return `${registryRoot(registryUrl)}/v1/artifacts/${targetDigest}/files/${encodedPath}`
}

function targetForKey(release, targetKey) {
  assert.ok(Array.isArray(release.targets), 'Registry release targets are missing')
  const targets = release.targets.filter((target) => target.target_key === targetKey)
  assert.equal(targets.length, 1, `Registry release must contain exactly one ${targetKey} target`)
  return targets[0]
}

async function responseJson(response, label) {
  assert.ok(response.ok, `${label} returned HTTP ${response.status}`)
  return response.json()
}

async function fetchPublicRelease({ registryUrl, config, fetchImplementation }) {
  const response = await fetchImplementation(releaseLocation(registryUrl, config), {
    headers: { Origin: PRODUCTION_BROWSER_ORIGIN },
  })
  const release = await responseJson(response, 'public Registry release')
  assertBrowserReadable(response, 'public Registry release')
  const [namespace, name] = config.coordinate.split('/', 2)
  assert.equal(release.namespace, namespace, 'public Registry namespace differs')
  assert.equal(release.name, name, 'public Registry name differs')
  assert.equal(release.version, config.version, 'public Registry version differs')
  return release
}

export async function captureExistingTarget({
  registryUrl,
  configPath,
  targetDigest,
  fetchImplementation = fetch,
}) {
  const config = await readJson(configPath)
  const response = await fetchImplementation(releaseLocation(registryUrl, config))
  if (response.status === 404) {
    return { existing_target: null, expected_target_digest: targetDigest }
  }

  const release = await responseJson(response, 'existing public Registry release')
  const targets = Array.isArray(release.targets) ? release.targets : []
  const existingTarget = targets.find((target) => target.target_key === config.target_key) ?? null
  if (existingTarget) {
    assert.equal(
      existingTarget.target_digest,
      targetDigest,
      'Registry target key is already bound to a different immutable digest'
    )
  }

  return {
    existing_target: existingTarget,
    expected_target_digest: targetDigest,
  }
}

function expectedProvenance(beforePublication, requestedProvenance) {
  const existing = beforePublication.existing_target
  if (!existing) {
    return requestedProvenance
  }

  return {
    source_repository: existing.source_repository,
    source_revision: existing.source_revision,
    build_id: existing.build_id,
  }
}

function assertBrowserReadable(response, label) {
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    '*',
    `${label} must allow browser reads`
  )
}

function assertImmutableCacheHeaders(response, label) {
  assert.match(
    response.headers.get('cache-control') ?? '',
    /\bimmutable\b/,
    `${label} must be immutable`
  )
  assertBrowserReadable(response, label)
}

export async function verifyPublicTarget({
  registryUrl,
  configPath,
  manifestPath,
  beforePublicationPath,
  sourceRepository,
  sourceRevision,
  buildId,
  deliveryRevision,
  deliveryRunId,
  fetchImplementation = fetch,
}) {
  assert.match(sourceRevision, /^[0-9a-f]{40}$/, 'source revision must be a full Git SHA')
  assert.match(deliveryRevision, /^[0-9a-f]{40}$/, 'delivery revision must be a full Git SHA')
  assert.ok(deliveryRunId, 'delivery run ID is required')

  const [config, localManifest, beforePublication] = await Promise.all([
    readJson(configPath),
    readCanonicalManifest(manifestPath),
    readJson(beforePublicationPath),
  ])
  assertConfigMatchesManifest(config, localManifest)

  const localCanonical = canonicalManifestBytes(localManifest)
  const targetDigest = `sha256:${sha256(localCanonical)}`
  assert.equal(
    beforePublication.expected_target_digest,
    targetDigest,
    'pre-publication digest differs'
  )

  const release = await fetchPublicRelease({ registryUrl, config, fetchImplementation })
  assert.equal(release.state, 'published', 'public Registry release is not published')
  const target = targetForKey(release, config.target_key)
  assert.equal(target.target_digest, targetDigest, 'public Registry target digest differs')
  assert.equal(
    target.artifact_format,
    localManifest.artifact_format,
    'public target format differs'
  )
  assert.equal(target.entrypoint, localManifest.entrypoint, 'public target entrypoint differs')
  assert.equal(
    canonicalJson(sortedConditions(target.conditions)),
    canonicalJson(sortedConditions(localManifest.conditions)),
    'public target compatibility conditions differ'
  )

  const requestedProvenance = {
    source_repository: sourceRepository,
    source_revision: sourceRevision,
    build_id: buildId,
  }
  const provenance = expectedProvenance(beforePublication, requestedProvenance)
  assert.deepEqual(
    {
      source_repository: target.source_repository,
      source_revision: target.source_revision,
      build_id: target.build_id,
    },
    provenance,
    'public target provenance changed during an idempotent delivery'
  )

  const manifestResponse = await fetchImplementation(manifestLocation(registryUrl, targetDigest), {
    headers: { Origin: PRODUCTION_BROWSER_ORIGIN },
  })
  assert.ok(manifestResponse.ok, `public target manifest returned HTTP ${manifestResponse.status}`)
  assertImmutableCacheHeaders(manifestResponse, 'public target manifest')
  const publicManifest = JSON.parse(await manifestResponse.text())
  assertManifestShape(publicManifest)
  const publicCanonical = canonicalManifestBytes(publicManifest)
  assert.equal(`sha256:${sha256(publicCanonical)}`, targetDigest, 'public manifest digest differs')
  assert.ok(
    publicCanonical.equals(localCanonical),
    'public manifest does not match the local canonical manifest'
  )

  for (const [relativePath, descriptor] of Object.entries(localManifest.files).sort(
    ([left], [right]) => canonicalCompare(left, right)
  )) {
    const fileResponse = await fetchImplementation(
      artifactFileLocation(registryUrl, targetDigest, relativePath),
      { headers: { Origin: PRODUCTION_BROWSER_ORIGIN } }
    )
    assert.ok(
      fileResponse.ok,
      `public target file returned HTTP ${fileResponse.status}: ${relativePath}`
    )
    assertImmutableCacheHeaders(fileResponse, `public target file ${relativePath}`)
    const content = Buffer.from(await fileResponse.arrayBuffer())
    assert.equal(
      sha256(content),
      descriptor.sha256,
      `public target file digest differs: ${relativePath}`
    )
    assert.equal(
      content.byteLength,
      descriptor.size,
      `public target file size differs: ${relativePath}`
    )
  }

  return {
    coordinate: config.coordinate,
    version: config.version,
    target_key: config.target_key,
    target_digest: targetDigest,
    files_verified: Object.keys(localManifest.files).length,
    source_provenance: provenance,
    delivery: {
      source_revision: sourceRevision,
      controller_revision: deliveryRevision,
      workflow_run_id: deliveryRunId,
    },
  }
}

function parseArguments(argumentsList) {
  const [command, ...remaining] = argumentsList
  assert.ok(command, 'a command is required')
  const options = {}

  for (let index = 0; index < remaining.length; index += 2) {
    const option = remaining[index]
    const value = remaining[index + 1]
    assert.ok(
      option?.startsWith('--') && value,
      `expected an option/value pair near ${option ?? ''}`
    )
    options[option.slice(2)] = value
  }

  return { command, options }
}

function requireOption(options, name) {
  assert.ok(options[name], `--${name} is required`)
  return options[name]
}

async function writeResult(outputPath, result) {
  const encoded = `${JSON.stringify(result, null, 2)}\n`
  if (!outputPath) {
    process.stdout.write(encoded)
    return
  }
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, encoded)
}

async function appendWorkflowSummary(result) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) {
    return
  }

  const source = result.source_provenance
  const delivery = result.delivery
  const lines = [
    '## Twitter Registry target delivery',
    '',
    `- Coordinate: \`${result.coordinate}@${result.version}\``,
    `- Target key: \`${result.target_key}\``,
    `- Target digest: \`${result.target_digest}\``,
    `- Verified files: \`${result.files_verified}\``,
    `- Target source repository: \`${source.source_repository}\``,
    `- Target source revision: \`${source.source_revision}\``,
    `- Target first build ID: \`${source.build_id}\``,
    `- This delivery source revision: \`${delivery.source_revision}\``,
    `- Delivery controller revision: \`${delivery.controller_revision}\``,
    `- Delivery workflow run: \`${delivery.workflow_run_id}\``,
    '',
  ]
  await appendFile(summaryPath, lines.join('\n'))
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2))

  if (command === 'inspect-local') {
    const result = await inspectLocalTarget({
      configPath: requireOption(options, 'config'),
      artifactDirectory: requireOption(options, 'artifact-directory'),
      manifestPath: requireOption(options, 'manifest'),
    })
    await writeResult(options.output, result)
    return
  }

  if (command === 'capture-public') {
    const result = await captureExistingTarget({
      registryUrl: requireOption(options, 'registry-url'),
      configPath: requireOption(options, 'config'),
      targetDigest: requireOption(options, 'target-digest'),
    })
    await writeResult(options.output, result)
    return
  }

  if (command === 'verify-public') {
    const result = await verifyPublicTarget({
      registryUrl: requireOption(options, 'registry-url'),
      configPath: requireOption(options, 'config'),
      manifestPath: requireOption(options, 'manifest'),
      beforePublicationPath: requireOption(options, 'before-publication'),
      sourceRepository: requireOption(options, 'source-repository'),
      sourceRevision: requireOption(options, 'source-revision'),
      buildId: requireOption(options, 'build-id'),
      deliveryRevision: requireOption(options, 'delivery-revision'),
      deliveryRunId: requireOption(options, 'delivery-run-id'),
    })
    await writeResult(options.output, result)
    await appendWorkflowSummary(result)
    return
  }

  throw new Error(`unsupported command: ${command}`)
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(`[ERROR] ${error.message}`)
    process.exitCode = 1
  })
}
