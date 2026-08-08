import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  inspectCoreRelease,
  readJson,
  resolveCoreRelease,
  stableJson,
  validateCoreReleaseConfig,
} from './core-release-lib.mjs'
import {
  closeDatabaseAccess,
  databaseAccessReady,
  openDatabaseAccess,
  resolveDatabaseProviderConfig,
  runDatabaseDocker,
  runDatabaseCompose,
  sameDatabaseProvider,
} from './database-provider.mjs'

export const repoRoot = fileURLToPath(new URL('..', import.meta.url))

export function validateInstance(instance) {
  if (!/^[a-z0-9][a-z0-9-]{2,48}$/.test(instance)) {
    throw new Error(`invalid runtime identity: ${instance}`)
  }
  return instance
}

export function runtimeDirectory(instance) {
  return `${repoRoot}/.runtime/database/${validateInstance(instance)}`
}

export function projectName(instance) {
  return `inkcre-client-web-${validateInstance(instance)}`
}

function localSecret(instance, purpose) {
  return createHash('sha256').update(`inkcre-client-web/${instance}/${purpose}`).digest('hex')
}

export async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('failed to allocate a local runtime port'))
        return
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)))
    })
  })
}

function quotedEnvironmentValue(value) {
  if (value.includes('\0') || /[\r\n]/.test(value)) {
    throw new Error('Compose environment values must be newline-free')
  }
  return `'${value.replaceAll("'", "'\\''")}'`
}

async function writeRuntimeFiles(state, credentials) {
  const directory = runtimeDirectory(state.identity)
  const profile = {
    format: 1,
    environment: 'development',
    database_contract: {
      revision: state.contract_revision,
      schema_digest: state.schema_digest ?? null,
      protocol_schema: 'inkcre',
    },
    core: {
      client_id: '00000000-0000-4000-8000-000000000002',
      url: state.urls.core,
    },
    postgrest: {
      anonymous_access: 'deny',
      database_role: 'authenticator',
      url: state.urls.postgrest,
    },
    runtime: {
      instance: state.runtime_instance ?? state.identity,
      owner_repository: state.owner_repository ?? 'InKCre/client-web',
      compose_project: state.project,
      docker_daemon_id: state.docker?.daemon_id ?? null,
    },
  }
  const publishedPorts =
    state.provider.kind === 'local' ? state.local_ports : { postgres: 0, core: 0, postgrest: 0 }
  const environment = {
    INKCRE_COMPOSE_PROJECT_NAME: state.project,
    INKCRE_CORE_IMAGE: state.core_image,
    POSTGRES_PORT: String(publishedPorts.postgres),
    CORE_PORT: String(publishedPorts.core),
    POSTGREST_PORT: String(publishedPorts.postgrest),
    CORE_PUBLIC_URL: state.urls.core,
    INKCRE_REMOTE_DOCKER_BIN: state.provider.docker_bin ?? 'docker',
    ...Object.fromEntries(Object.entries(credentials).filter(([name]) => name !== 'format')),
  }

  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(`${directory}/runtime.json`, stableJson(state), { mode: 0o600 })
  await writeFile(`${directory}/profile.json`, stableJson(profile), { mode: 0o600 })
  await writeFile(`${directory}/credential.json`, stableJson(credentials), {
    mode: 0o600,
  })
  await writeFile(
    `${directory}/compose.env`,
    `${Object.entries(environment)
      .map(([name, value]) => `${name}=${quotedEnvironmentValue(value)}`)
      .join('\n')}\n`,
    { mode: 0o600 }
  )
}

function validateRuntimeState(state, instance) {
  if (state.format !== 3 || state.identity !== validateInstance(instance)) {
    throw new Error(
      `database runtime ${instance} uses an obsolete or invalid state; stop it before continuing`
    )
  }
  return state
}

function validateLoopbackUrl(value, label) {
  const url = new URL(value)
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
    throw new Error(`external database ${label} must use an HTTP loopback URL`)
  }
  return url.href
}

async function externalRuntimeState(instance, provider) {
  const descriptor = await readJson(provider.descriptor)
  if (
    descriptor.format !== 1 ||
    descriptor.owner_repository !== 'InKCre/core-py' ||
    !/^[a-f0-9]{16}$/.test(descriptor.identity) ||
    descriptor.profile !== 'development'
  ) {
    throw new Error('external database runtime descriptor has invalid owner or identity')
  }
  if (
    descriptor.project !== `inkcre-core-py-${descriptor.identity}` ||
    !descriptor.docker?.daemon_id ||
    !/^[a-f0-9]{64}$/.test(descriptor.source_fingerprint) ||
    descriptor.converging
  ) {
    throw new Error('external database runtime provenance is incomplete')
  }

  const directory = dirname(provider.descriptor)
  return {
    format: 3,
    identity: validateInstance(instance),
    runtime_instance: descriptor.identity,
    owner_repository: descriptor.owner_repository,
    project: descriptor.project,
    provider,
    docker: descriptor.docker,
    contract_revision: descriptor.contract_revision,
    migration_head: descriptor.migration_head,
    core_source_revision: descriptor.source_revision,
    core_image: descriptor.core_image,
    source_fingerprint: descriptor.source_fingerprint,
    profile: descriptor.profile,
    local_ports: descriptor.local_ports,
    remote_ports: descriptor.remote_ports,
    urls: {
      core: validateLoopbackUrl(descriptor.urls?.core, 'core endpoint'),
      postgrest: validateLoopbackUrl(descriptor.urls?.postgrest, 'PostgREST endpoint'),
    },
    tunnel: null,
    binding: {
      descriptor: provider.descriptor,
      profile: `${directory}/profile.json`,
      credential: `${directory}/credential.json`,
      readiness: `${directory}/readiness.json`,
    },
  }
}

export async function runtimeState(instance, { create = false } = {}) {
  const configuredProvider = resolveDatabaseProviderConfig()
  if (configuredProvider.kind === 'external') {
    return externalRuntimeState(instance, configuredProvider)
  }

  const directory = runtimeDirectory(instance)
  const statePath = `${directory}/runtime.json`
  try {
    const state = validateRuntimeState(await readJson(statePath), instance)
    if (create) {
      if (!sameDatabaseProvider(state.provider, configuredProvider)) {
        throw new Error(
          `database runtime ${instance} belongs to a different provider; stop it explicitly first`
        )
      }
    }
    return state
  } catch (error) {
    if (!create || error.code !== 'ENOENT') throw error
  }

  const provider = configuredProvider
  const releaseConfig = validateCoreReleaseConfig(
    await readJson(`${repoRoot}/contracts/core-release.json`)
  )
  const runDocker = (args, options) => runDatabaseDocker(provider, args, options)
  const release = process.env.INKCRE_CORE_IMAGE
    ? inspectCoreRelease(runDocker, process.env.INKCRE_CORE_IMAGE)
    : resolveCoreRelease(runDocker, releaseConfig.stable_image)
  const localPorts = {
    postgres: await availablePort(),
    core: await availablePort(),
    postgrest: await availablePort(),
  }
  const state = {
    format: 3,
    identity: validateInstance(instance),
    runtime_instance: validateInstance(instance),
    owner_repository: 'InKCre/client-web',
    project: projectName(instance),
    provider,
    contract_revision: release.manifest.contract_revision,
    migration_head: release.runtime_contract.migration_heads?.[0] ?? null,
    schema_digest: release.manifest.schema.sha256,
    core_source_revision: release.manifest.source_revision,
    core_image: release.image,
    profile: 'development',
    local_ports: localPorts,
    remote_ports: null,
    urls: {
      core: `http://127.0.0.1:${localPorts.core}/`,
      postgrest: `http://127.0.0.1:${localPorts.postgrest}/`,
    },
    tunnel: null,
  }
  const credentials = {
    format: 1,
    JWT_SECRET: localSecret(instance, 'jwt'),
    POSTGRES_PASSWORD: localSecret(instance, 'postgres'),
    CORE_DATABASE_PASSWORD: localSecret(instance, 'core-role'),
    POSTGREST_DATABASE_PASSWORD: localSecret(instance, 'postgrest-role'),
  }
  await writeRuntimeFiles(state, credentials)
  return state
}

export async function runtimeCredentials(instance) {
  const provider = resolveDatabaseProviderConfig()
  if (provider.kind === 'external') {
    const state = await externalRuntimeState(instance, provider)
    return readJson(state.binding.credential)
  }
  return readJson(`${runtimeDirectory(instance)}/credential.json`)
}

export function compose(instance, args, options = {}) {
  const directory = runtimeDirectory(instance)
  const state = validateRuntimeState(
    JSON.parse(readFileSync(`${directory}/runtime.json`, 'utf8')),
    instance
  )
  return runDatabaseCompose(state, `${directory}/compose.env`, args, options)
}

function publishedPort(instance, service, target) {
  const output = compose(instance, ['port', service, String(target)], {
    timeout: 15_000,
  }).trim()
  const match = output.match(/:([0-9]+)$/)
  if (!match) throw new Error(`could not resolve published port for ${service}:${target}`)
  return Number.parseInt(match[1], 10)
}

async function exposeRuntime(state) {
  const remotePorts = {
    postgres: publishedPort(state.identity, 'postgres', 5432),
    core: publishedPort(state.identity, 'core', 8000),
    postgrest: publishedPort(state.identity, 'postgrest', 3000),
  }
  const localPorts = state.provider.kind === 'local' ? remotePorts : state.local_ports
  const exposed = {
    ...state,
    local_ports: localPorts,
    remote_ports: remotePorts,
    urls: {
      core: `http://127.0.0.1:${localPorts.core}/`,
      postgrest: `http://127.0.0.1:${localPorts.postgrest}/`,
    },
  }
  const connected = openDatabaseAccess(exposed)
  await writeRuntimeFiles(connected, await runtimeCredentials(state.identity))
  return connected
}

export async function ensureDatabaseRuntime(instance, options = {}) {
  const state = await runtimeState(instance, { create: true })
  if (state.provider.kind === 'external') return state
  compose(
    instance,
    [
      'up',
      '--detach',
      '--remove-orphans',
      'postgres',
      'contract',
      'restore',
      'init',
      'core',
      'postgrest',
    ],
    {
      stdio: options.stdio ?? 'inherit',
    }
  )
  return exposeRuntime(state)
}

export async function stopDatabaseRuntime(instance, options = {}) {
  const state = await runtimeState(instance)
  if (state.provider.kind === 'external') {
    throw new Error(
      `runtime ${state.runtime_instance} is owned by core-py; client-web cannot stop it`
    )
  }
  try {
    compose(instance, ['down', '--volumes', '--remove-orphans'], {
      stdio: options.stdio ?? 'inherit',
      timeout: options.timeout ?? 120_000,
    })
  } finally {
    closeDatabaseAccess(state)
  }
  await rm(runtimeDirectory(instance), { recursive: true, force: true })
}

export async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function fetchStatus(url, expectedStatuses, timeout = 3000) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeout),
    })
    return expectedStatuses.includes(response.status)
  } catch {
    return false
  }
}

export async function runtimeIsReady(state, timeout = 3000) {
  if (!databaseAccessReady(state)) return false
  const [coreReady, postgrestReady] = await Promise.all([
    fetchStatus(`${state.urls.core}readyz`, [200], timeout),
    fetchStatus(state.urls.postgrest, [401], timeout),
  ])
  return coreReady && postgrestReady
}

export async function waitForRuntime(state, timeout = 120_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await runtimeIsReady(state)) return
    await new Promise((resolve) => setTimeout(resolve, 750))
  }
  throw new Error(`database runtime ${state.identity} did not become ready`)
}

export function readiness(instance) {
  const provider = resolveDatabaseProviderConfig()
  if (provider.kind === 'external') {
    const directory = dirname(provider.descriptor)
    const result = JSON.parse(readFileSync(`${directory}/readiness.json`, 'utf8'))
    const descriptor = JSON.parse(readFileSync(provider.descriptor, 'utf8'))
    if (
      result.status !== 'ok' ||
      result.runtime?.instance !== descriptor.identity ||
      result.runtime?.owner_repository !== 'InKCre/core-py' ||
      result.runtime?.compose_project !== descriptor.project ||
      result.runtime?.docker_daemon_id !== descriptor.docker?.daemon_id ||
      result.runtime?.source_revision !== descriptor.source_revision ||
      result.runtime?.source_fingerprint !== descriptor.source_fingerprint ||
      result.contract?.revision !== descriptor.contract_revision ||
      !result.migration?.current?.includes(descriptor.migration_head)
    ) {
      throw new Error('external database readiness and runtime descriptor differ')
    }
    return result
  }
  return JSON.parse(
    compose(
      instance,
      [
        'run',
        '--rm',
        '--no-deps',
        'init',
        'python',
        'scripts/container.py',
        'db',
        'ready',
        '--profile',
        'development',
        '--json',
      ],
      { timeout: 30_000 }
    )
  )
}

export function databaseContractIsReady(result) {
  return result?.status === 'ok'
}
