import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { consumePlan } from './build-native-extension-candidates.mjs'

const writeJson = (file, data) => writeFile(file, JSON.stringify(data))

test('one plan generates MF version and provenance while preserving Python-only candidates', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'inkcre-assembly-'))
  try {
    await mkdir(path.join(workspace, 'extensions/mail/dist/client-web'), { recursive: true })
    await mkdir(path.join(workspace, 'packages/core'), { recursive: true })
    await writeJson(path.join(workspace, 'packages/core/package.json'), { version: '0.3.0' })
    const packagePath = path.join(workspace, 'extensions/mail/package.json')
    await writeJson(packagePath, {
      version: '0.1.0',
      inkcre: {
        name: 'inkcre/mail',
        nickname: 'Mail',
        module_federation: { host_sdk: '@inkcre/core', host_sdk_version: '>=0.2.0 <0.4.0' },
      },
    })
    const dist = path.join(workspace, 'extensions/mail/dist/client-web')
    await writeFile(path.join(dist, 'remoteEntry.js'), 'export default {}')
    await writeJson(path.join(dist, 'mf-manifest.json'), {
      metaData: { publicPath: './', remoteEntry: { name: 'remoteEntry.js' } },
      shared: [{ name: '@inkcre/core', requiredVersion: '>=0.2.0 <0.4.0' }],
      exposes: [],
    })
    const plan = {
      web_revision: 'a'.repeat(40),
      build_id: 'core-release-123',
      candidates: ['mail', 'github'].map((directory) => ({
        directory,
        name: `inkcre/${directory}`,
        version: '0.3.99',
        prepare: { version: '0.3.99', python: { package: directory } },
      })),
    }
    const planPath = path.join(workspace, 'input.json')
    await writeJson(planPath, plan)
    const options = {
      workspace,
      planPath,
      outputDirectory: path.join(workspace, 'output'),
      run(command, args, settings) {
        if (command === 'git') return plan.web_revision
        if (command === 'zip') execFileSync(command, args, settings)
      },
    }
    const result = await consumePlan(options)
    assert.equal(JSON.parse(await readFile(packagePath)).version, '0.3.99')
    assert.deepEqual(result.candidates[1], plan.candidates[1])
    assert.equal(result.candidates[0].prepare.python.package, 'mail')
    assert.equal(result.candidates[0].prepare.module_federation.source_revision, plan.web_revision)
    assert.match(result.candidates[0].module_federation.sha256, /^[a-f0-9]{64}$/)
    assert.equal(result.candidates[0].module_federation.file, 'mail/snapshot.zip')
    await assert.rejects(consumePlan(options), { code: 'EEXIST' })
    plan.candidates[0].name = 'inkcre/typo'
    await writeJson(planPath, plan)
    await assert.rejects(consumePlan(options), /different identity/)
    plan.candidates[0].name = 'inkcre/mail'
    plan.candidates[0].directory = '../escape'
    await writeJson(planPath, plan)
    await assert.rejects(consumePlan(options), /unsafe candidate directory/)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})
