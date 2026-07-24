import { execFileSync } from 'node:child_process'

import {
  compose,
  fetchStatus,
  readiness,
  repoRoot,
  runtimeDirectory,
  runtimeState,
  waitForRuntime,
} from './database-runtime-lib.mjs'

const command = process.argv[2]
const explicitInstance = process.argv[3] && !process.argv[3].startsWith('--')
let instance = explicitInstance ? process.argv[3] : undefined
const confirmed = process.argv.includes('--yes')

if (!instance) {
  try {
    const identity = JSON.parse(
      execFileSync('svc', ['dev', 'identity', '--repo', repoRoot, '--json'], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10_000,
      })
    )
    instance = identity.workspace.instance
  } catch {
    // The usage error below explains the explicit fallback.
  }
}

if (!['ensure', 'ready', 'reset', 'status', 'stop'].includes(command) || !instance) {
  console.error(
    'Usage: node scripts/database-runtime.mjs <ensure|ready|reset|status|stop> <identity>'
  )
  process.exit(2)
}

if (command === 'ensure') {
  const state = await runtimeState(instance, { create: true })
  compose(
    instance,
    ['up', '--detach', '--remove-orphans', 'postgres', 'init', 'core', 'postgrest'],
    {
      stdio: 'inherit',
    }
  )
  await waitForRuntime(state)
  const result = readiness(instance)
  if (!result.ready) throw new Error(result.reason)
  console.log(
    JSON.stringify({
      ready: true,
      identity: state.identity,
      contract_revision: state.contract_revision,
      core_image: state.core_image,
      profile: `${runtimeDirectory(instance)}/profile.json`,
      credential: `${runtimeDirectory(instance)}/credential.json`,
      urls: state.urls,
    })
  )
} else if (command === 'ready') {
  console.log(JSON.stringify(readiness(instance)))
} else if (command === 'reset') {
  if (!confirmed) {
    throw new Error('refusing reset without explicit --yes confirmation')
  }
  const state = await runtimeState(instance)
  if (state.profile !== 'development') {
    throw new Error(`refusing reset for non-development runtime ${state.identity}`)
  }
  const current = readiness(instance)
  if (!current.ready) {
    throw new Error(`refusing reset for unready runtime ${state.identity}`)
  }
  compose(instance, [
    'run',
    '--rm',
    '--no-deps',
    'init',
    'db',
    'reset-dev',
    '--confirm',
    'reset-development-data',
  ])
  console.log(JSON.stringify(readiness(instance)))
} else if (command === 'status') {
  const state = await runtimeState(instance)
  const coreReady = await fetchStatus(`${state.urls.core}readyz`, [200])
  const postgrestReady = await fetchStatus(state.urls.postgrest, [401])
  console.log(
    JSON.stringify({
      ready: coreReady && postgrestReady,
      identity: state.identity,
      contract_revision: state.contract_revision,
      core_image: state.core_image,
      profile: state.profile,
      urls: state.urls,
    })
  )
  process.exitCode = coreReady && postgrestReady ? 0 : 1
} else {
  compose(instance, ['down', '--volumes', '--remove-orphans'], {
    stdio: 'inherit',
  })
  console.log(`[database] removed runtime ${instance}`)
}
