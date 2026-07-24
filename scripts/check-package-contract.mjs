import { execFileSync } from 'node:child_process'
import { access, readFile, readdir, realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const jsonOutput = process.argv.includes('--json')
const coreRoot = `${repoRoot}/packages/core`
const errors = []

async function requireFile(path) {
  try {
    await access(path)
  } catch {
    errors.push(`missing build output: ${path.slice(repoRoot.length + 1)}`)
  }
}

await Promise.all(
  [
    'packages/core/dist/index.js',
    'packages/core/dist/index.js.map',
    'packages/core/dist/index.d.ts',
    'packages/core/dist/index.d.ts.map',
    'apps/client-web/dist/index.html',
    'apps/client-webext/.output/chrome-mv3/manifest.json',
    'apps/client-webext/.output/chrome-mv3/content-scripts/content.js',
    'apps/client-webext/.output/chrome-mv3/content-scripts/content.css',
    'extensions/twitter/dist/client-web/remoteEntry.js',
  ].map((path) => requireFile(`${repoRoot}/${path}`))
)

try {
  await access(`${coreRoot}/dist/index.cjs`)
  errors.push('unexpected CommonJS output: packages/core/dist/index.cjs')
} catch {
  // ESM-only is the intended package contract.
}

async function builtFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...(await builtFiles(path)))
    } else {
      files.push(path)
    }
  }

  return files
}

const webDist = `${repoRoot}/apps/client-web/dist`
try {
  await access(`${webDist}/_worker.js`)
  errors.push('unexpected Worker output: apps/client-web/dist/_worker.js')
} catch {
  // The web application is a static Pages artifact.
}

try {
  const files = await builtFiles(webDist)
  for (const file of files) {
    const output = await readFile(file)
    const content = output.toString('utf8')
    for (const forbiddenTerm of ['/api/config', 'VITE_INKCRE_JWT_SECRET']) {
      if (content.includes(forbiddenTerm)) {
        errors.push(
          `static web output contains forbidden runtime-config channel "${forbiddenTerm}": ${file.slice(repoRoot.length + 1)}`
        )
      }
    }
  }
} catch (error) {
  errors.push(`static web artifact inspection failed: ${error.message}`)
}

const packageJson = JSON.parse(await readFile(`${coreRoot}/package.json`, 'utf8'))
const expectedImport = './dist/index.js'
const expectedTypes = './dist/index.d.ts'
if (
  packageJson.main !== expectedImport ||
  packageJson.module !== expectedImport ||
  packageJson.types !== expectedTypes ||
  packageJson.exports?.['.']?.import !== expectedImport ||
  packageJson.exports?.['.']?.types !== expectedTypes ||
  packageJson.exports?.['.']?.require
) {
  errors.push('packages/core/package.json does not match the ESM-only dist contract')
}

const consumerPackage = `${repoRoot}/apps/client-web/node_modules/@inkcre/core`
try {
  const resolvedPackage = await realpath(consumerPackage)
  const expectedPackage = await realpath(coreRoot)
  if (resolvedPackage !== expectedPackage) {
    errors.push(`@inkcre/core workspace link resolves to unexpected path: ${resolvedPackage}`)
  }
} catch (error) {
  errors.push(`@inkcre/core workspace resolution failed: ${error.message}`)
}

try {
  execFileSync(
    process.execPath,
    ['--input-type=module', '--eval', "await import('@inkcre/core')"],
    {
      cwd: `${repoRoot}/apps/client-web`,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }
  )
} catch (error) {
  errors.push(`@inkcre/core ESM consumer smoke failed: ${error.message}`)
}

const result = {
  ok: errors.length === 0,
  package: '@inkcre/core',
  format: 'esm',
  entry: 'packages/core/dist/index.js',
  types: 'packages/core/dist/index.d.ts',
  errors,
}

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2))
} else if (result.ok) {
  console.log(
    '[OK] static web outputs exist and @inkcre/core resolves through its ESM dist contract'
  )
} else {
  for (const error of errors) {
    console.error(`[ERROR] ${error}`)
  }
}

process.exitCode = result.ok ? 0 : 1
