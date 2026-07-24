import { fetchStatus, runtimeState } from './database-runtime-lib.mjs'

const instance = process.argv[2]
if (!instance) process.exit(2)

try {
  const state = await runtimeState(instance)
  const [coreReady, postgrestReady] = await Promise.all([
    fetchStatus(`${state.urls.core}readyz`, [200], 1500),
    fetchStatus(state.urls.postgrest, [401], 1500),
  ])
  if (!coreReady || !postgrestReady) process.exit(1)
  console.log(
    JSON.stringify({
      ready: true,
      identity: state.identity,
      contract_revision: state.contract_revision,
      profile: state.profile,
    })
  )
} catch {
  process.exit(1)
}
