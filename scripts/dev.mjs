import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const target = process.argv[2]
const supportedTargets = new Set(['web', 'webext'])

if (!supportedTargets.has(target)) {
  console.error(`Usage: node scripts/dev.mjs <${[...supportedTargets].join('|')}>`)
  process.exit(2)
}

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: options.env ?? process.env,
    stdio: 'inherit',
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => child.kill(signal))
  }

  child.once('error', (error) => {
    console.error(`[dev] Failed to start ${command}: ${error.message}`)
  })

  return new Promise((resolve) => {
    child.once('close', (code, signal) => {
      if (signal) {
        resolve(1)
        return
      }
      resolve(code ?? 1)
    })
  })
}

async function runDeclaredTarget() {
  const instance = process.env.SVC_DEV_INSTANCE
  const declaredTarget = process.env.SVC_DEV_TARGET

  if (!instance || declaredTarget !== target) {
    console.error('[dev] SVC did not provide the expected worktree target identity.')
    return 1
  }

  const name = target === 'web' ? `client-web-${instance}` : `webext-${instance}`
  const cwd = `${repoRoot}/${target === 'web' ? 'apps/client-web' : 'apps/client-webext'}`
  const command =
    target === 'web' ? ['pnpm', 'exec', 'vite'] : ['node', '../../scripts/dev-wxt.mjs']

  return run('pnpm', ['exec', 'portless', name, ...command], {
    cwd,
    env: {
      ...process.env,
      INKCRE_DEV_INSTANCE: instance,
    },
  })
}

const exitCode = process.env.SVC_DEV_TARGET
  ? await runDeclaredTarget()
  : await run('svc', ['dev', 'ensure', target, '--repo', repoRoot, '--json'])

process.exitCode = exitCode
