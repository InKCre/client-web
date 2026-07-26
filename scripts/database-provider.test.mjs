import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, test } from 'vitest'

import { diagnoseDatabaseProvider, resolveDatabaseProviderConfig } from './database-provider.mjs'

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

async function executable(directory, name, source) {
  const path = join(directory, name)
  await writeFile(path, source, { mode: 0o700 })
  await chmod(path, 0o700)
  return path
}

test('local provider is the portable committed default', () => {
  process.env.INKCRE_DATABASE_PROVIDER = 'local'
  assert.deepEqual(resolveDatabaseProviderConfig(), { kind: 'local' })
})

test('SSH provider requires one SSH config alias', () => {
  process.env.INKCRE_DATABASE_PROVIDER = 'ssh'
  process.env.INKCRE_DATABASE_SSH_TARGET = '-oProxyCommand=unsafe'
  assert.throws(resolveDatabaseProviderConfig, /one host alias/)
})

test('external provider requires one absolute machine-local descriptor', () => {
  process.env.INKCRE_DATABASE_PROVIDER = 'external'
  process.env.INKCRE_DATABASE_RUNTIME_DESCRIPTOR = 'relative/runtime.json'
  assert.throws(resolveDatabaseProviderConfig, /one absolute/)

  process.env.INKCRE_DATABASE_RUNTIME_DESCRIPTOR = '/tmp/core-runtime/runtime.json'
  assert.deepEqual(resolveDatabaseProviderConfig(), {
    kind: 'external',
    descriptor: '/tmp/core-runtime/runtime.json',
  })
})

test('external diagnostics prove core owner, runtime instance, and daemon', async () => {
  const directory = await mkdtemp(`${tmpdir()}/inkcre-provider-test-`)
  temporaryDirectories.push(directory)
  const descriptor = join(directory, 'runtime.json')
  await writeFile(
    descriptor,
    JSON.stringify({
      format: 1,
      identity: '0123456789abcdef',
      owner_repository: 'InKCre/core-py',
      contract_revision: 'peer-database-runtime-v1',
      docker: {
        daemon_id: 'daemon-id',
        engine: '28.5.2',
        compose: '2.40.3',
      },
    })
  )

  assert.deepEqual(
    diagnoseDatabaseProvider({
      kind: 'external',
      descriptor,
    }),
    {
      kind: 'external',
      owner_repository: 'InKCre/core-py',
      runtime_instance: '0123456789abcdef',
      daemon_id: 'daemon-id',
      engine: '28.5.2',
      compose: '2.40.3',
    }
  )
})

test('local diagnostics use the local Docker CLI', async () => {
  const directory = await mkdtemp(`${tmpdir()}/inkcre-provider-test-`)
  temporaryDirectories.push(directory)

  await executable(
    directory,
    'docker',
    [
      '#!/bin/sh',
      'if [ "$1" = "info" ]; then',
      "  printf '27.0.0\\n'",
      'elif [ "$1" = "compose" ] && [ "$2" = "version" ]; then',
      "  printf '2.29.0\\n'",
      'else',
      '  exit 96',
      'fi',
      '',
    ].join('\n')
  )

  process.env.PATH = `${directory}:${originalEnvironment.PATH}`
  assert.deepEqual(diagnoseDatabaseProvider({ kind: 'local' }), {
    kind: 'local',
    engine: '27.0.0',
    compose: '2.29.0',
  })
})

test('SSH diagnostics never invoke the local Docker CLI', async () => {
  const directory = await mkdtemp(`${tmpdir()}/inkcre-provider-test-`)
  temporaryDirectories.push(directory)
  const marker = join(directory, 'local-docker-called')

  await executable(directory, 'docker', `#!/bin/sh\nprintf called > "${marker}"\nexit 97\n`)
  await executable(
    directory,
    'ssh',
    [
      '#!/bin/sh',
      'if [ "$1" = "-G" ]; then exit 0; fi',
      'cat >/dev/null',
      "printf '28.5.2\\n2.40.3\\n'",
      '',
    ].join('\n')
  )

  process.env.PATH = `${directory}:${originalEnvironment.PATH}`
  process.env.INKCRE_DATABASE_PROVIDER = 'ssh'
  process.env.INKCRE_DATABASE_SSH_TARGET = 'test-docker-host'
  process.env.INKCRE_DATABASE_SSH_DOCKER_BIN = '/remote/docker'

  const provider = resolveDatabaseProviderConfig()
  assert.deepEqual(diagnoseDatabaseProvider(provider), {
    kind: 'ssh',
    target: 'test-docker-host',
    engine: '28.5.2',
    compose: '2.40.3',
  })
  await assert.rejects(readFile(marker), { code: 'ENOENT' })
})
