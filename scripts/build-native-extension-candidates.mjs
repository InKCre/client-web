import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { valid as validSemVer } from 'semver'
import {
  inspectNativeModuleFederation,
  listSnapshotFiles,
  prepareBody,
} from './verify-native-extension-distribution.mjs'

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))
const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`)

export async function consumePlan({ workspace, planPath, outputDirectory, run = execFileSync }) {
  const plan = await readJson(planPath)
  assert.ok(Array.isArray(plan.candidates), 'plan candidates must be an array')
  assert.match(plan.web_revision, /^[a-f0-9]{40}$/, 'fixed Web source revision is required')
  assert.equal(typeof plan.build_id, 'string', 'build ID is required')
  assert.equal(
    run('git', ['rev-parse', 'HEAD'], { cwd: workspace, encoding: 'utf8' }).trim(),
    plan.web_revision,
    'Web checkout differs from the fixed release plan'
  )
  const producers = new Map()
  for (const entry of await readdir(path.join(workspace, 'extensions'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const packagePath = path.join(workspace, 'extensions', entry.name, 'package.json')
    const manifest = await readJson(packagePath)
    assert.ok(manifest.inkcre?.module_federation, `${entry.name}: native MF metadata is required`)
    assert.ok(!producers.has(manifest.inkcre.name), 'duplicate native producer identity')
    producers.set(manifest.inkcre.name, { directory: entry.name, packagePath, manifest })
  }
  const selected = []
  const directories = new Set()
  for (const candidate of plan.candidates) {
    assert.match(candidate.directory, /^[a-zA-Z0-9_-]+$/, 'unsafe candidate directory')
    assert.ok(!directories.has(candidate.directory), 'duplicate candidate directory')
    directories.add(candidate.directory)
    assert.equal(validSemVer(candidate.version), candidate.version, 'invalid Release version')
    assert.equal(candidate.prepare?.version, candidate.version, 'prepare Release version differs')
    const producer = producers.get(candidate.name)
    const directoryProducer = [...producers.values()].find(
      (value) => value.directory === candidate.directory
    )
    assert.ok(
      !directoryProducer || directoryProducer === producer,
      `${candidate.name}: Web producer directory declares a different identity`
    )
    if (producer) selected.push({ candidate, producer })
  }
  // Generate all selected versions before any build can read another workspace package.
  for (const { candidate, producer } of selected) {
    producer.manifest.version = candidate.version
    await writeJson(producer.packagePath, producer.manifest)
  }
  if (selected.length)
    run('pnpm', ['--filter', '@inkcre/core', 'build'], { cwd: workspace, stdio: 'inherit' })
  await mkdir(outputDirectory, { recursive: true })
  for (const { candidate, producer } of selected) {
    run('pnpm', ['--filter', `./extensions/${producer.directory}`, 'build'], {
      cwd: workspace,
      stdio: 'inherit',
    })
    const artifactDirectory = path.join(path.dirname(producer.packagePath), 'dist/client-web')
    const local = await inspectNativeModuleFederation({
      packagePath: producer.packagePath,
      corePackagePath: path.join(workspace, 'packages/core/package.json'),
      artifactDirectory,
    })
    assert.equal(local.name, candidate.name)
    assert.equal(local.version, candidate.version)
    await listSnapshotFiles(artifactDirectory)
    const destination = path.join(outputDirectory, candidate.directory)
    await mkdir(destination, { recursive: true })
    const archive = path.join(destination, 'snapshot.zip')
    // Never replace saved bytes on a rerun; publication restores the whole Core-owned candidate.
    await writeFile(path.join(destination, 'candidate.lock'), '', { flag: 'wx' })
    run('zip', ['-q', '-r', archive, '.'], { cwd: artifactDirectory })
    const prepare = prepareBody(local, {
      source_repository: 'https://github.com/InKCre/client-web',
      source_revision: plan.web_revision,
      build_id: plan.build_id,
    })
    candidate.prepare.module_federation = prepare.module_federation
    candidate.module_federation = {
      file: `${candidate.directory}/snapshot.zip`,
      sha256: createHash('sha256')
        .update(await readFile(archive))
        .digest('hex'),
    }
  }
  await writeJson(path.join(outputDirectory, 'plan.json'), plan)
  return plan
}

async function main() {
  assert.equal(process.argv[2], 'consume-plan', 'expected consume-plan')
  const options = new Map()
  for (let i = 3; i < process.argv.length; i += 2) {
    assert.ok(
      process.argv[i]?.startsWith('--') && process.argv[i + 1],
      'expected option/value pair'
    )
    options.set(process.argv[i], process.argv[i + 1])
  }
  assert.ok(options.get('--plan') && options.get('--output'), '--plan and --output are required')
  await consumePlan({
    workspace: process.cwd(),
    planPath: path.resolve(options.get('--plan')),
    outputDirectory: path.resolve(options.get('--output')),
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[ERROR] ${error.message}`)
    process.exitCode = 1
  })
}
