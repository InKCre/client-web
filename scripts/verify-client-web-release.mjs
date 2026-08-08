import { access, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const distRoot = `${repoRoot}/apps/client-web/dist`
const errors = []

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

for (const relativePath of ['index.html']) {
  try {
    await access(`${distRoot}/${relativePath}`)
  } catch {
    errors.push(`missing web release output: apps/client-web/dist/${relativePath}`)
  }
}

for (const relativePath of ['_worker.js']) {
  try {
    await access(`${distRoot}/${relativePath}`)
    errors.push(`unexpected runtime output: apps/client-web/dist/${relativePath}`)
  } catch {
    // The client release is a static Pages artifact.
  }
}

const forbiddenTerms = new Map([
  ['/api/config', 'legacy runtime-config channel'],
  ['VITE_INKCRE_JWT_SECRET', 'build-supplied JWT credential channel'],
  ['herokuapp.com', 'environment-specific Heroku service origin'],
  ['http://127.0.0.1:8000', 'loopback API default'],
  ['raw.githubusercontent.com/stopwords-iso', 'mutable third-party runtime bootstrap fallback'],
  ['063cd1df-c495-5006-a119-67aa633b26be', 'environment-specific client identity'],
  ['1eaaadc6-2c1d-4515-ad06-22905dc890a9', 'legacy environment client identity'],
])

try {
  const files = await builtFiles(distRoot)
  for (const file of files) {
    if (!/\.(?:css|html|js|json|map)$/.test(file)) {
      continue
    }

    const content = await readFile(file, 'utf8')
    for (const [term, reason] of forbiddenTerms) {
      if (content.includes(term)) {
        errors.push(`web release contains ${reason} "${term}": ${file.slice(repoRoot.length + 1)}`)
      }
    }
  }
} catch (error) {
  errors.push(`web release inspection failed: ${error.message}`)
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[ERROR] ${error}`)
  }
  process.exitCode = 1
} else {
  console.log('[OK] client-web release is a static, environment-neutral Pages artifact')
}
