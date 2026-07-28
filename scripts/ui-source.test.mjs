import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, test } from 'vitest'

import {
  createUiSourceAliases,
  createUiSourceTsconfig,
  isPathInside,
  readUiSourceInput,
  resolveUiSourceForVite,
  resolveUiSourcePackage,
} from './ui-source.mjs'

const temporaryDirectories = []
const requiredEntries = [
  'src/index.ts',
  'src/components.d.ts',
  'src/utils/index.ts',
  'src/locales/index.ts',
  'styles/index.scss',
  'styles/_functions.scss',
  'styles/_mixins.scss',
  'styles/tokens/_ref.scss',
  'styles/tokens/_sys.scss',
  'styles/tokens/_comp.scss',
  'styles/uno/preset-ink.ts',
]

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true }))
  )
})

async function fakeUiPackage(name = '@inkcre/ui-web') {
  const root = await mkdtemp(join(tmpdir(), 'inkcre-ui-source-'))
  temporaryDirectories.push(root)
  await writeFile(join(root, 'package.json'), JSON.stringify({ name, version: '9.8.7' }))
  for (const path of requiredEntries) {
    await mkdir(resolve(root, path, '..'), { recursive: true })
    await writeFile(resolve(root, path), '')
  }
  return root
}

test('source mode is absent unless the current process opts in', async () => {
  assert.equal(await resolveUiSourceForVite('serve', {}), null)
  assert.throws(() => readUiSourceInput([], {}), /Pass --ui-source/)
})

test('the package root is validated before exact public aliases are returned', async () => {
  const root = await fakeUiPackage()
  const uiSource = await resolveUiSourcePackage(root)
  const aliases = createUiSourceAliases(uiSource)

  assert.equal(uiSource.version, '9.8.7')
  assert.match(uiSource.identity, /^[a-f0-9]{16}$/)
  assert.equal(aliases.length, 10)
  assert.equal(
    aliases.find(({ find }) => find.test('@inkcre/ui-web')).replacement,
    join(uiSource.root, 'src/index.ts')
  )
  assert.equal(
    aliases.some(({ find }) => find.test('@inkcre/ui-web/private')),
    false
  )
})

test('wrong package identity and build-mode opt-in fail directly', async () => {
  const root = await fakeUiPackage('@inkcre/not-ui')
  await assert.rejects(resolveUiSourcePackage(root), /must be @inkcre\/ui-web/)

  const validRoot = await fakeUiPackage()
  await assert.rejects(
    resolveUiSourceForVite('build', { INKCRE_UI_SOURCE_ROOT: validRoot }),
    /development-only/
  )
})

test('client Sass ownership does not match sibling source by substring', () => {
  const appRoot = '/work/client-web/apps/client-web'
  assert.equal(
    isPathInside(`${appRoot}/src/components`, `${appRoot}/src/components/card/card.scss`),
    true
  )
  assert.equal(
    isPathInside(
      `${appRoot}/src/components`,
      '/work/ui/packages/web/src/components/inkButton/inkButton.scss'
    ),
    false
  )
})

test('temporary TypeScript config maps source entries and global components', async () => {
  const root = await fakeUiPackage()
  const uiSource = await resolveUiSourcePackage(root)
  const appRoot = '/work/client-web/apps/client-web'
  const config = createUiSourceTsconfig(uiSource, appRoot, '/work/client-web/.runtime/ui-source')

  assert.deepEqual(config.compilerOptions.paths['@inkcre/ui-web'], [
    join(uiSource.root, 'src/index.ts'),
  ])
  assert.ok(config.include.includes(join(uiSource.root, 'src/components.d.ts')))
  assert.deepEqual(config.compilerOptions.types, [])
})
