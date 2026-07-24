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
  }
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
