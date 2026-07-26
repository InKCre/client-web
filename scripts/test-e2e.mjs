import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'

import {
  availablePort,
  compose,
  ensureDatabaseRuntime,
  exists,
  repoRoot,
  runtimeCredentials,
  runtimeDirectory,
  stopDatabaseRuntime,
  waitForRuntime,
} from './database-runtime-lib.mjs'

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: options.env ?? process.env,
    stdio: options.stdio ?? 'inherit',
    timeout: options.timeout ?? 300_000,
  })
}

function fingerprint(instance) {
  return compose(instance, [
    'run',
    '--rm',
    '--no-deps',
    '--entrypoint',
    'python',
    'init',
    '-c',
    'from app.database_contract.catalog import development_baseline_fingerprint as f; print(f())',
  ]).trim()
}

async function waitForWeb(url) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return
    } catch {
      // Vite preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`built web artifact did not become ready at ${url}`)
}

const identityHash = createHash('sha256')
  .update(`${repoRoot}/${process.pid}/${Date.now()}`)
  .digest('hex')
  .slice(0, 16)
const instance = `e2e-${identityHash}`
let preview

try {
  const state = await ensureDatabaseRuntime(instance)
  await waitForRuntime(state)
  const baseline = fingerprint(instance)

  run('pnpm', ['--filter', '@inkcre/client-web', 'build-only'])
  const webPort = await availablePort()
  const webUrl = `http://127.0.0.1:${webPort}/`
  preview = spawn(
    'pnpm',
    [
      '--filter',
      '@inkcre/client-web',
      'exec',
      'vite',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(webPort),
      '--strictPort',
    ],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    }
  )
  await waitForWeb(webUrl)

  const credentials = await runtimeCredentials(instance)
  run('pnpm', ['exec', 'playwright', 'test'], {
    env: {
      ...process.env,
      INKCRE_E2E_CORE_URL: state.urls.core,
      INKCRE_E2E_POSTGREST_URL: state.urls.postgrest,
      INKCRE_E2E_WEB_URL: webUrl,
      INKCRE_E2E_JWT_SECRET: credentials.JWT_SECRET,
    },
  })

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
  const resetBaseline = fingerprint(instance)
  if (resetBaseline !== baseline) {
    throw new Error('reset-dev did not restore the deterministic E2E baseline')
  }
} finally {
  preview?.kill('SIGTERM')
  try {
    if (await exists(`${runtimeDirectory(instance)}/runtime.json`)) {
      await stopDatabaseRuntime(instance)
    }
  } finally {
    await rm(runtimeDirectory(instance), { recursive: true, force: true })
  }
}
