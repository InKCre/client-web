import { access, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const jsonOutput = process.argv.includes('--json')
const errors = []

async function exists(relativePath) {
  try {
    await access(`${repoRoot}/${relativePath}`)
    return true
  } catch {
    return false
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(`${repoRoot}/${relativePath}`, 'utf8'))
}

async function sourceFiles(relativeDirectory) {
  const directory = `${repoRoot}/${relativeDirectory}`
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = `${relativeDirectory}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(relativePath)))
    } else if (/\.(?:js|mjs|ts|tsx|vue)$/.test(entry.name)) {
      files.push(relativePath)
    }
  }

  return files
}

const rootPackage = await readJson('package.json')
const webPackage = await readJson('apps/client-web/package.json')
const svcConfig = await readJson('svc.json')

if (rootPackage.devDependencies?.portless !== '0.12.0') {
  errors.push('root devDependency "portless" must be exactly "0.12.0" for the Node 22 contract')
}
if (rootPackage.scripts?.dev !== 'node scripts/dev.mjs web') {
  errors.push('root "dev" script must enter the declared SVC web capability')
}
if (rootPackage.scripts?.['dev:webext'] !== 'node scripts/dev.mjs webext') {
  errors.push('root "dev:webext" script must enter the declared SVC webext capability')
}
if (rootPackage.scripts?.['dev:stop'] !== 'node scripts/dev-stop.mjs') {
  errors.push('root "dev:stop" script must clean up only the current worktree routes')
}

for (const dependency of ['@cloudflare/workers-types', 'hono', 'wrangler']) {
  if (webPackage.dependencies?.[dependency] || webPackage.devDependencies?.[dependency]) {
    errors.push(`static client must not depend on legacy runtime tool "${dependency}"`)
  }
}

for (const path of [
  'apps/client-web/.env.cloudflare',
  'apps/client-web/.env.example',
  'apps/client-web/server/index.ts',
  'apps/client-web/wrangler.jsonc',
]) {
  if (await exists(path)) {
    errors.push(`legacy Worker/config surface must remain absent: ${path}`)
  }
}

const forbiddenSourceTerms = ['/api/config', 'VITE_INKCRE_JWT_SECRET']
const runtimeSources = [
  ...(await sourceFiles('apps/client-web/src')),
  ...(await sourceFiles('packages/core/src/config')),
]
for (const path of runtimeSources) {
  const source = await readFile(`${repoRoot}/${path}`, 'utf8')
  for (const term of forbiddenSourceTerms) {
    if (source.includes(term)) {
      errors.push(`${path} contains forbidden runtime-config channel "${term}"`)
    }
  }
}

const coreIndex = await readFile(`${repoRoot}/packages/core/src/index.ts`, 'utf8')
for (const legacyExport of ['httpAdapter', 'envAdapter', 'createEnvAdapter']) {
  if (coreIndex.includes(legacyExport)) {
    errors.push(`@inkcre/core public API must not export legacy adapter "${legacyExport}"`)
  }
}

const localTargets = svcConfig.dev?.profiles?.local?.targets
if (svcConfig.dev?.profile !== 'local' || !localTargets) {
  errors.push('svc.json must declare the local development profile')
} else {
  const expectedTargets = {
    database: {
      probe: ['node', 'scripts/probe-database.mjs', '${dev.instance}'],
      command: ['node', 'scripts/database-runtime.mjs', 'ensure', '${dev.instance}'],
      environment: {
        INKCRE_DATABASE_PROVIDER: 'local',
      },
    },
    web: {
      probe: ['node', 'scripts/probe-dev.mjs', 'web', '${dev.instance}'],
      command: ['node', 'scripts/dev.mjs', 'web'],
    },
    webext: {
      probe: ['node', 'scripts/probe-dev.mjs', 'webext', '${dev.instance}'],
      command: ['node', 'scripts/dev.mjs', 'webext'],
    },
  }

  for (const [name, expected] of Object.entries(expectedTargets)) {
    const target = localTargets[name]
    if (!target) {
      errors.push(`svc.json is missing local target "${name}"`)
      continue
    }
    if (target.scope !== 'worktree') {
      errors.push(`SVC target "${name}" must be worktree-scoped`)
    }
    if (
      target.probe?.kind !== 'exec' ||
      JSON.stringify(target.probe.argv) !== JSON.stringify(expected.probe)
    ) {
      errors.push(`SVC target "${name}" must use the identity probe that proves dev.instance`)
    }
    if (JSON.stringify(target.provision?.argv) !== JSON.stringify(expected.command)) {
      errors.push(`SVC target "${name}" must provision through scripts/dev.mjs`)
    }
    if (
      expected.environment &&
      JSON.stringify(target.provision?.env) !== JSON.stringify(expected.environment)
    ) {
      errors.push(`SVC target "${name}" must commit only the portable local provider default`)
    }
  }
}

const databaseCompose = await readFile(`${repoRoot}/runtime/database.compose.yml`, 'utf8')
for (const required of [
  "command: ['db', 'init', '--profile', 'development']",
  '${INKCRE_CORE_IMAGE:?INKCRE_CORE_IMAGE is required}',
  '${POSTGRES_PORT:-0}',
  '${POSTGREST_PORT:-0}',
  '${CORE_PUBLIC_URL:?CORE_PUBLIC_URL is required}',
]) {
  if (!databaseCompose.includes(required)) {
    errors.push(`database Compose is missing runtime contract fragment "${required}"`)
  }
}
for (const forbidden of ['5432:5432', '3000:3000', 'sleep ']) {
  if (databaseCompose.includes(forbidden)) {
    errors.push(`database Compose contains forbidden fixed-order fragment "${forbidden}"`)
  }
}

const databaseProvider = await readFile(`${repoRoot}/scripts/database-provider.mjs`, 'utf8')
const remoteCompose = await readFile(`${repoRoot}/scripts/remote-compose.sh`, 'utf8')
for (const required of [
  "kind === 'local'",
  "kind === 'external'",
  "kind !== 'ssh'",
  'INKCRE_DATABASE_RUNTIME_DESCRIPTOR',
  "'BatchMode=yes'",
  'ExitOnForwardFailure=yes',
  'svc.local.json',
]) {
  if (!databaseProvider.includes(required)) {
    errors.push(`database provider is missing safety contract "${required}"`)
  }
}
if (remoteCompose.includes('eval ') || !remoteCompose.includes('"$docker_bin" compose')) {
  errors.push('remote Compose runner must preserve argv without eval or shell command construction')
}
const databaseRuntime = await readFile(`${repoRoot}/scripts/database-runtime-lib.mjs`, 'utf8')
for (const required of [
  "owner_repository !== 'InKCre/core-py'",
  'runtime_instance: descriptor.identity',
  'external database runtime contract differs from the client pin',
  'external database readiness and runtime descriptor differ',
  'client-web cannot stop it',
]) {
  if (!databaseRuntime.includes(required)) {
    errors.push(`external database attachment is missing safety contract "${required}"`)
  }
}
const committedDatabaseEnvironment = svcConfig.dev.profiles.local.targets.database.provision.env
if (
  committedDatabaseEnvironment?.INKCRE_DATABASE_SSH_TARGET ||
  committedDatabaseEnvironment?.INKCRE_DATABASE_SSH_DOCKER_BIN ||
  committedDatabaseEnvironment?.INKCRE_DATABASE_RUNTIME_DESCRIPTOR
) {
  errors.push('committed SVC config must not contain machine-specific database provider values')
}

const devScript = await readFile(`${repoRoot}/scripts/dev.mjs`, 'utf8')
if (!devScript.includes("'database'")) {
  errors.push('pnpm dev must ensure the worktree-scoped database capability')
}

const wxtConfig = await readFile(`${repoRoot}/apps/client-webext/wxt.config.ts`, 'utf8')
if (wxtConfig.includes('--remote-debugging-port=9222')) {
  errors.push('WXT development must not reuse the fixed Chromium debugging port 9222')
}
if (!wxtConfig.includes('INKCRE_WXT_PROFILE_DIR')) {
  errors.push('WXT development must use a worktree-owned Chromium profile directory')
}
if (!wxtConfig.includes('INKCRE_CHROMIUM_BINARY') || !wxtConfig.includes('disabled: true')) {
  errors.push('WXT development must make automatic browser launch explicit and optional')
}

const result = {
  ok: errors.length === 0,
  targets: localTargets ? Object.keys(localTargets).sort() : [],
  configAuthority: 'browser-local',
  errors,
}

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2))
} else if (result.ok) {
  console.log('[OK] static/browser-local runtime and worktree development contracts are explicit')
} else {
  for (const error of errors) {
    console.error(`[ERROR] ${error}`)
  }
}

process.exitCode = result.ok ? 0 : 1
