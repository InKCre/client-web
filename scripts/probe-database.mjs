import { runtimeIsReady, runtimeState } from './database-runtime-lib.mjs'

const instance = process.argv[2]
if (!instance) process.exit(2)

try {
  const state = await runtimeState(instance)
  if (state.identity !== instance || !(await runtimeIsReady(state, 1500))) {
    process.exit(1)
  }
  console.log(
    JSON.stringify({
      ready: true,
      identity: state.identity,
      contract_revision: state.contract_revision,
      provider: state.provider.kind,
      profile: state.profile,
    })
  )
} catch {
  process.exit(1)
}
