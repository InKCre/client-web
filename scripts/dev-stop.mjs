import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const portlessBin = `${repoRoot}/node_modules/.bin/portless`

function output(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 10_000,
  })
}

let instance
try {
  const identity = JSON.parse(output('svc', ['dev', 'identity', '--repo', repoRoot, '--json']))
  instance = identity.workspace.instance
} catch {
  console.error('[dev:stop] SVC 14.0.0 must be available on PATH.')
  process.exit(1)
}

if (!/^[a-f0-9]{16}$/.test(instance)) {
  console.error('[dev:stop] SVC returned an invalid worktree instance.')
  process.exit(1)
}

const routeNames = new Set([
  `client-web-${instance}`,
  `client-web-ui-${instance}`,
  `webext-${instance}`,
])
const routes = output(portlessBin, ['list'])
const processes = []

for (const line of routes.split('\n')) {
  const match = line.match(/https:\/\/([a-z0-9-]+)\.localhost.*\(pid ([0-9]+)\)/)
  if (!match || !routeNames.has(match[1])) continue

  const pid = Number.parseInt(match[2], 10)
  const command = output('ps', ['-p', String(pid), '-o', 'command=']).trim()
  if (!command.includes('portless') || !command.includes(match[1])) {
    console.error(`[dev:stop] Refusing to stop PID ${pid}; its command no longer owns ${match[1]}.`)
    process.exit(1)
  }

  processes.push({ name: match[1], pid })
}

if (processes.length === 0) {
  console.log(`[dev:stop] No Portless routes are running for worktree ${instance}.`)
} else {
  for (const processInfo of processes) {
    process.kill(processInfo.pid, 'SIGTERM')
    console.log(`[dev:stop] Stopped ${processInfo.name} (PID ${processInfo.pid}).`)
  }
}

const runtimeState = `${repoRoot}/.runtime/database/${instance}/runtime.json`
if (existsSync(runtimeState)) {
  execFileSync(process.execPath, ['scripts/database-runtime.mjs', 'stop', instance], {
    cwd: repoRoot,
    stdio: 'inherit',
    timeout: 120_000,
  })
} else {
  console.log(`[dev:stop] No database runtime exists for worktree ${instance}.`)
}
