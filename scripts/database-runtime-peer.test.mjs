import assert from 'node:assert/strict'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { afterEach, test, vi } from 'vitest'
import { jwtVerify } from 'jose'

import { CORE_PEER_ID, configureCorePeer, runtimeDirectory } from './database-runtime-lib.mjs'

const instance = 'peer-runtime-test'
const secret = 'peer-runtime-test-secret-at-least-32-bytes'
const originalProvider = process.env.INKCRE_DATABASE_PROVIDER

afterEach(async () => {
  vi.unstubAllGlobals()
  if (originalProvider === undefined) delete process.env.INKCRE_DATABASE_PROVIDER
  else process.env.INKCRE_DATABASE_PROVIDER = originalProvider
  await rm(runtimeDirectory(instance), { recursive: true, force: true })
})

test('local deployment configures and observes the core Peer advertisement', async () => {
  process.env.INKCRE_DATABASE_PROVIDER = 'local'
  const directory = runtimeDirectory(instance)
  await mkdir(directory, { recursive: true })
  await writeFile(`${directory}/credential.json`, JSON.stringify({ format: 1, JWT_SECRET: secret }))

  const coreUrl = 'http://127.0.0.1:51002/'
  const postgrestUrl = 'http://127.0.0.1:51003/'
  let patchBody
  let authorization
  const fetcher = vi.fn(async (input, init = {}) => {
    const url = new URL(input)
    const headers = new Headers(init.headers)
    authorization = headers.get('Authorization')
    if (init.method === 'PATCH') {
      patchBody = JSON.parse(String(init.body))
      return Response.json([{ id: CORE_PEER_ID }], { status: 200 })
    }
    assert.equal(url.searchParams.get('id'), `eq.${CORE_PEER_ID}`)
    return Response.json([
      {
        lease_expires_at: new Date(Date.now() + 60_000).toISOString(),
        capabilities: [
          ['core.extension.management.v1', '/extension-management'],
          ['core.organization.rumination.v1', '/organization/ruminate'],
          ['core.semantic_retrieval.v1', '/semantic-retrieval'],
        ].map(([id, path]) => ({
          id,
          inbound: {
            protocol: 'core.peer.protocol.http.v1',
            parameters: { method: 'POST', url: new URL(path.slice(1), coreUrl).href },
          },
        })),
      },
    ])
  })
  vi.stubGlobal('fetch', fetcher)

  await configureCorePeer({
    identity: instance,
    provider: { kind: 'local' },
    urls: { core: coreUrl, postgrest: postgrestUrl },
  })

  assert.deepEqual(patchBody, {
    config: { http_public_base_url: 'http://127.0.0.1:51002' },
  })
  assert.match(authorization, /^Bearer /)
  const token = authorization.slice('Bearer '.length)
  const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ['HS256'],
    audience: 'inkcre-api',
    issuer: 'inkcre-peer',
  })
  assert.equal(verified.payload.role, 'authenticated')
  assert.equal(fetcher.mock.calls.length, 2)
})
