import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'

import { readJson, stableJson } from './database-contract-lib.mjs'

export const repoRoot = fileURLToPath(new URL('..', import.meta.url))
export const composeFile = `${repoRoot}/runtime/database.compose.yml`

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

export async function runtimeState(instance, { create = false } = {}) {
  const directory = runtimeDirectory(instance)
  const statePath = `${directory}/runtime.json`
  try {
    return await readJson(statePath)
  } catch (error) {
    if (!create) throw error
  }

  const pin = await readJson(`${repoRoot}/contracts/core-py.json`)
  const ports = {
    postgres: await availablePort(),
    core: await availablePort(),
    postgrest: await availablePort(),
  }
  const state = {
    format: 1,
    identity: validateInstance(instance),
    project: projectName(instance),
    contract_revision: pin.contract_revision,
    core_source_revision: pin.source_revision,
    core_image: pin.image,
    profile: 'development',
    ports,
    urls: {
      core: `http://127.0.0.1:${ports.core}/`,
      postgrest: `http://127.0.0.1:${ports.postgrest}/`,
    },
  }
  const credentials = {
    format: 1,
    JWT_SECRET: localSecret(instance, 'jwt'),
    POSTGRES_PASSWORD: localSecret(instance, 'postgres'),
    CORE_DATABASE_PASSWORD: localSecret(instance, 'core-role'),
    POSTGREST_DATABASE_PASSWORD: localSecret(instance, 'postgrest-role'),
  }
  const profile = {
    format: 1,
    environment: 'development',
    database_contract: {
      revision: pin.contract_revision,
      migration_head: pin.migration_head,
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
  }

  await mkdir(directory, { recursive: true })
  await writeFile(statePath, stableJson(state), { mode: 0o600 })
  await writeFile(`${directory}/profile.json`, stableJson(profile), { mode: 0o600 })
  await writeFile(`${directory}/credential.json`, stableJson(credentials), {
    mode: 0o600,
  })
  await writeFile(
    `${directory}/compose.env`,
    [
      `INKCRE_COMPOSE_PROJECT_NAME=${state.project}`,
      `INKCRE_CORE_IMAGE=${state.core_image}`,
      `POSTGRES_PORT=${state.ports.postgres}`,
      `CORE_PORT=${state.ports.core}`,
      `POSTGREST_PORT=${state.ports.postgrest}`,
      ...Object.entries(credentials).flatMap(([name, value]) =>
        name === 'format' ? [] : `${name}=${value}`
      ),
      '',
    ].join('\n'),
    { mode: 0o600 }
  )
  return state
}

export async function runtimeCredentials(instance) {
  return readJson(`${runtimeDirectory(instance)}/credential.json`)
}

export function compose(instance, args, options = {}) {
  const directory = runtimeDirectory(instance)
  return execFileSync(
    'docker',
    [
      'compose',
      '--file',
      composeFile,
      '--env-file',
      `${directory}/compose.env`,
      '--project-name',
      projectName(instance),
      ...args,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout ?? 180_000,
    }
  )
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

export async function waitForRuntime(state, timeout = 120_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const coreReady = await fetchStatus(`${state.urls.core}readyz`, [200])
    const postgrestReady = await fetchStatus(state.urls.postgrest, [401])
    if (coreReady && postgrestReady) return
    await new Promise((resolve) => setTimeout(resolve, 750))
  }
  throw new Error(`database runtime ${state.identity} did not become ready`)
}

export function readiness(instance) {
  return JSON.parse(
    compose(
      instance,
      ['run', '--rm', '--no-deps', 'init', 'db', 'ready', '--profile', 'development', '--json'],
      { timeout: 30_000 }
    )
  )
}
