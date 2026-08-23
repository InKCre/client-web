import { expect, test } from '@playwright/test'
import { SignJWT } from 'jose'

const postgrestUrl = process.env.INKCRE_E2E_POSTGREST_URL!
const jwtSecret = process.env.INKCRE_E2E_JWT_SECRET!
const coreUrl = process.env.INKCRE_E2E_CORE_URL!

async function token(secret = jwtSecret) {
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setIssuer('inkcre-peer')
    .setAudience('inkcre-api')
    .sign(new TextEncoder().encode(secret))
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ postgrestUrl, jwtSecret }) => {
      localStorage.setItem(
        'inkcre_app_config',
        JSON.stringify({
          INKCRE_PGREST_URL: postgrestUrl,
          INKCRE_JWT_SECRET: jwtSecret,
          INKCRE_PEER_ID: '00000000-0000-4000-8000-000000000001',
        })
      )
    },
    { postgrestUrl, jwtSecret }
  )
})

test('built browser artifact reads and writes the peer protocol', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#app')).not.toBeEmpty()

  const authorization = `Bearer ${await token()}`
  const result = await page.evaluate(
    async ({ postgrestUrl, authorization }) => {
      const read = await fetch(
        `${postgrestUrl}peers?select=id,name&id=eq.00000000-0000-4000-8000-000000000001`,
        { headers: { Authorization: authorization } }
      )
      const write = await fetch(`${postgrestUrl}peers?on_conflict=id`, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          id: '11111111-1111-4111-8111-111111111111',
          name: 'peer-e2e',
          labels: ['e2e'],
          config: {},
          config_schema: {},
          capabilities: [],
          lease_expires_at: null,
        }),
      })
      const writeBody = await write.json()
      const cleanup = await fetch(
        `${postgrestUrl}peers?id=eq.11111111-1111-4111-8111-111111111111`,
        { method: 'DELETE', headers: { Authorization: authorization } }
      )
      return {
        readStatus: read.status,
        readBody: await read.json(),
        writeStatus: write.status,
        writeBody,
        cleanupStatus: cleanup.status,
      }
    },
    { postgrestUrl, authorization }
  )

  expect(result.readStatus).toBe(200)
  expect(result.readBody).toHaveLength(1)
  expect(result.writeStatus).toBe(201)
  expect(result.writeBody[0].id).toBe('11111111-1111-4111-8111-111111111111')
  expect(result.cleanupStatus).toBe(204)
})

test('wrong and absent credentials are rejected', async ({ page }) => {
  const wrongAuthorization = `Bearer ${await token(
    'wrong-client-web-jwt-secret-at-least-32-bytes'
  )}`
  const statuses = await page.evaluate(
    async ({ postgrestUrl, wrongAuthorization }) => {
      const wrong = await fetch(`${postgrestUrl}peers?select=id`, {
        headers: { Authorization: wrongAuthorization },
      })
      const anonymous = await fetch(`${postgrestUrl}peers?select=id`)
      return [wrong.status, anonymous.status]
    },
    { postgrestUrl, wrongAuthorization }
  )

  expect(statuses).toEqual([401, 401])
})

test('core Peer publishes and serves its exact capability inbounds', async ({ page }) => {
  await page.goto('/')
  const authorization = `Bearer ${await token()}`
  const result = await page.evaluate(
    async ({ postgrestUrl, authorization }) => {
      const peersResponse = await fetch(
        `${postgrestUrl}peers?select=capabilities,lease_expires_at&id=eq.00000000-0000-4000-8000-000000000002`,
        { headers: { Authorization: authorization } }
      )
      const peers = await peersResponse.json()
      const management = peers[0]?.capabilities?.find(
        (capability: { id: string }) => capability.id === 'core.extension.management.v1'
      )
      const execution = await fetch(management.inbound.parameters.url, {
        method: management.inbound.parameters.method,
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', extension: 'e2e/not-installed' }),
      })
      return {
        peersStatus: peersResponse.status,
        capabilities: peers[0]?.capabilities,
        leaseExpiresAt: peers[0]?.lease_expires_at,
        executionStatus: execution.status,
      }
    },
    { postgrestUrl, authorization }
  )

  expect(result.peersStatus).toBe(200)
  expect(Date.parse(result.leaseExpiresAt)).toBeGreaterThan(Date.now())
  expect(result.capabilities).toEqual([
    {
      id: 'core.extension.management.v1',
      inbound: {
        protocol: 'core.peer.protocol.http.v1',
        parameters: { method: 'POST', url: `${coreUrl}extension-management` },
      },
    },
    {
      id: 'core.feature_retrieval.lexical.v1',
      inbound: {
        protocol: 'core.peer.protocol.http.v1',
        parameters: { method: 'POST', url: `${coreUrl}lexical-retrieval` },
      },
    },
    {
      id: 'core.organization.rumination.v1',
      inbound: {
        protocol: 'core.peer.protocol.http.v1',
        parameters: { method: 'POST', url: `${coreUrl}organization/ruminate` },
      },
    },
    {
      id: 'core.semantic_retrieval.v1',
      inbound: {
        protocol: 'core.peer.protocol.http.v1',
        parameters: { method: 'POST', url: `${coreUrl}semantic-retrieval` },
      },
    },
  ])
  expect(result.executionStatus).toBe(404)
})

test('Block Inspector delegates rumination through the discovered Peer', async ({ page }) => {
  const authorization = `Bearer ${await token()}`
  const content = `E2E rumination focal block ${Date.now()}`
  const created = await fetch(`${postgrestUrl}blocks`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ content, resolver: 'core.text.v1', storage: null }),
  })
  expect(created.status).toBe(201)
  const [block] = await created.json()

  try {
    await page.goto(`/info-base/graph/blocks/${block.id}`)
    await expect(page.getByRole('button', { name: 'Ruminate' })).toBeVisible()

    const requestPromise = page.waitForRequest(
      (request) =>
        request.url() === `${coreUrl}organization/ruminate` && request.method() === 'POST'
    )
    await page.getByRole('button', { name: 'Ruminate' }).click()
    const request = await requestPromise

    expect(request.postDataJSON()).toEqual({ block: block.id })
    await expect(
      page.getByText(
        'The provider may have completed the request. Refresh and inspect the graph before trying again.'
      )
    ).toBeVisible()
  } finally {
    const cleanup = await fetch(`${postgrestUrl}blocks?id=eq.${block.id}`, {
      method: 'DELETE',
      headers: { Authorization: authorization },
    })
    expect(cleanup.status).toBe(204)
  }
})
