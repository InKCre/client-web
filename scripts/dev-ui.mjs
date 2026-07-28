import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
  readUiSourceInput,
  resolveUiSourcePackage,
  uiSourceEnvironmentVariable,
} from './ui-source.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const withRemotesIndex = process.argv.indexOf('--with-remotes')
const withRemotes = withRemotesIndex >= 0
const sourceArguments = process.argv.slice(2).filter((argument) => argument !== '--with-remotes')

let sourceInput
let uiSource
try {
  sourceInput = readUiSourceInput(sourceArguments)
  uiSource = await resolveUiSourcePackage(sourceInput, { cwd: repoRoot })
} catch (error) {
  console.error(`[ui-source] ${error.message}`)
  process.exit(2)
}

const environment = {
  ...process.env,
  [uiSourceEnvironmentVariable]: uiSource.root,
}

console.warn(
  `[ui-source] NON-RELEASE source overlay: @inkcre/ui-web@${uiSource.version} from ${uiSource.root}`
)

function run(command, args) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: environment,
    stdio: 'inherit',
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => child.kill(signal))
  }

  return new Promise((resolve) => {
    child.once('error', (error) => {
      console.error(`[ui-source] Failed to start ${command}: ${error.message}`)
      resolve(1)
    })
    child.once('close', (code, signal) => {
      resolve(signal ? 1 : (code ?? 1))
    })
  })
}

const webExit = await run(process.execPath, ['scripts/dev.mjs', 'web-ui'])
if (webExit !== 0 || !withRemotes) {
  process.exitCode = webExit
} else {
  process.exitCode = await run('pnpm', ['-r', '--filter', './extensions/*', 'dev'])
}
