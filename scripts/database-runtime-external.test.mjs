import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, test } from 'vitest'

import {
  readiness,
  runtimeCredentials,
  runtimeState,
  stopDatabaseRuntime,
} from './database-runtime-lib.mjs'

const originalEnvironment = { ...process.env }
const temporaryDirectories = []

afterEach(async () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key]
  }
  Object.assign(process.env, originalEnvironment)
  await Promise.all(
    temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true }))
  )
})

async function externalRuntime() {
  const directory = await mkdtemp(`${tmpdir()}/inkcre-external-runtime-`)
  temporaryDirectories.push(directory)
  const descriptor = join(directory, 'runtime.json')
  const runtimeInstance = '0123456789abcdef'
  const project = `inkcre-core-py-${runtimeInstance}`
  const daemonId = 'daemon-id'
  const runtime = {
    format: 1,
    identity: runtimeInstance,
    owner_repository: 'InKCre/core-py',
    project,
    provider: { kind: 'ssh' },
    docker: {
      daemon_id: daemonId,
      engine: '28.5.2',
      compose: '2.40.3',
    },
    contract_revision: 'peer-database-runtime-v1',
    migration_head: 'd9f4e2a1b7c3',
    source_revision: 'a'.repeat(40),
    source_fingerprint: 'b'.repeat(64),
    converging: false,
    core_image: 'inkcre-core-py-development:aaaaaaaaaaaa',
    profile: 'development',
    local_ports: { postgres: 51001, core: 51002, postgrest: 51003 },
    remote_ports: { postgres: 61001, core: 61002, postgrest: 61003 },
    urls: {
      core: 'http://127.0.0.1:51002/',
      postgrest: 'http://127.0.0.1:51003/',
    },
  }
  await writeFile(descriptor, JSON.stringify(runtime))
  await writeFile(
    join(directory, 'credential.json'),
    JSON.stringify({ format: 1, JWT_SECRET: 'external-secret' })
  )
  await writeFile(
    join(directory, 'readiness.json'),
    JSON.stringify({
      format: 1,
      status: 'ok',
      profile: 'development',
      contract: { revision: runtime.contract_revision },
      migration: {
        status: 'ok',
        current: [runtime.migration_head],
        expected: [runtime.migration_head],
      },
      runtime: {
        instance: runtimeInstance,
        owner_repository: 'InKCre/core-py',
        compose_project: project,
        docker_daemon_id: daemonId,
        source_revision: runtime.source_revision,
        source_fingerprint: runtime.source_fingerprint,
      },
    })
  )
  process.env.INKCRE_DATABASE_PROVIDER = 'external'
  process.env.INKCRE_DATABASE_RUNTIME_DESCRIPTOR = descriptor
  return { descriptor, runtime, directory }
}

test('external attachment preserves client and database instance identities', async () => {
  const { descriptor, runtime, directory } = await externalRuntime()

  const state = await runtimeState('fedcba9876543210', { create: true })

  assert.equal(state.identity, 'fedcba9876543210')
  assert.equal(state.runtime_instance, runtime.identity)
  assert.equal(state.owner_repository, 'InKCre/core-py')
  assert.equal(state.project, runtime.project)
  assert.equal(state.docker.daemon_id, runtime.docker.daemon_id)
  assert.equal(state.binding.descriptor, descriptor)
  assert.equal(state.binding.profile, join(directory, 'profile.json'))
  assert.deepEqual(await runtimeCredentials('fedcba9876543210'), {
    format: 1,
    JWT_SECRET: 'external-secret',
  })
})

test('external readiness must agree with the selected runtime descriptor', async () => {
  const { directory } = await externalRuntime()

  assert.equal(readiness('fedcba9876543210').status, 'ok')

  const mismatched = JSON.parse(await readFile(join(directory, 'readiness.json'), 'utf8'))
  mismatched.runtime.instance = '1111111111111111'
  await writeFile(join(directory, 'readiness.json'), JSON.stringify(mismatched))

  assert.throws(() => readiness('fedcba9876543210'), /readiness and runtime descriptor differ/)
})

test('client-web cannot stop a core-py owned external runtime', async () => {
  const { runtime } = await externalRuntime()

  await assert.rejects(
    stopDatabaseRuntime('fedcba9876543210'),
    new RegExp(`runtime ${runtime.identity} is owned by core-py`)
  )
})
