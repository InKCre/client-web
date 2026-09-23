import { expect, test } from '@playwright/test'
import { SignJWT } from 'jose'
import { readFileSync } from 'node:fs'

const postgrestUrl = process.env.INKCRE_E2E_POSTGREST_URL!
const jwtSecret = process.env.INKCRE_E2E_JWT_SECRET!
const coreUrl = process.env.INKCRE_E2E_CORE_URL!
const clientVersion = JSON.parse(
  readFileSync(new URL('../../apps/client-web/package.json', import.meta.url), 'utf8')
).version

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
      if (localStorage.getItem('inkcre_app_config')) return
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

test('Registry link confirms an exact Release before installing it', async ({ page }) => {
  const extensionName = 'e2e/handoff'
  const endpoint = `${postgrestUrl}extensions?name=eq.${encodeURIComponent(extensionName)}`
  const authorization = `Bearer ${await token()}`
  await page.route('**/v1/extensions/e2e/handoff/releases/1.0.0', (route) =>
    route.fulfill({
      headers: { 'Access-Control-Allow-Origin': '*' },
      json: {
        name: extensionName,
        nickname: 'Handoff check',
        version: '1.0.0',
        state: 'published',
      },
    })
  )

  try {
    await page.goto('/extensions?install=e2e%2Fhandoff&version=1.0.0')
    await expect(page.getByRole('heading', { name: 'Handoff check' })).toBeVisible()
    const before = await fetch(`${endpoint}&select=name`, {
      headers: { Authorization: authorization },
    })
    expect(before.ok ? await before.json() : null).toEqual([])

    await page.getByRole('button', { name: 'Install', exact: true }).click()
    await expect(page).toHaveURL(/\/extensions$/)
    await expect
      .poll(async () => {
        const response = await fetch(`${endpoint}&select=name,version,enabled`, {
          headers: { Authorization: authorization },
        })
        return response.ok ? await response.json() : null
      })
      .toEqual([{ name: extensionName, version: '1.0.0', enabled: [] }])
  } finally {
    await fetch(endpoint, { method: 'DELETE', headers: { Authorization: authorization } })
  }
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

test('Web Peer publishes its app identity and preserves a user name', async ({ page }) => {
  const id = crypto.randomUUID()
  const authorization = `Bearer ${await token()}`
  const endpoint = `${postgrestUrl}peers?id=eq.${id}`

  await page.goto('/settings')
  await page.evaluate(
    ({ postgrestUrl, jwtSecret, id }) => {
      localStorage.setItem(
        'inkcre_app_config',
        JSON.stringify({
          INKCRE_PGREST_URL: postgrestUrl,
          INKCRE_JWT_SECRET: jwtSecret,
          INKCRE_PEER_ID: id,
        })
      )
    },
    { postgrestUrl, jwtSecret, id }
  )

  try {
    await page.reload()
    await expect
      .poll(async () => {
        const response = await fetch(`${endpoint}&select=name,application_version`, {
          headers: { Authorization: authorization },
        })
        return response.ok ? (await response.json())[0] : null
      })
      .toEqual({
        name: expect.stringMatching(/^Chrome \d+ · (Linux|macOS|Windows)$/),
        application_version: clientVersion,
      })

    const renamed = await fetch(endpoint, {
      method: 'PATCH',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My browser Peer' }),
    })
    expect(renamed.status).toBe(204)
    await page.reload()
    await expect
      .poll(async () => {
        const response = await fetch(`${endpoint}&select=name,application_version`, {
          headers: { Authorization: authorization },
        })
        return response.ok ? (await response.json())[0] : null
      })
      .toEqual({ name: 'My browser Peer', application_version: clientVersion })
  } finally {
    const cleanup = await fetch(endpoint, {
      method: 'DELETE',
      headers: { Authorization: authorization },
    })
    expect(cleanup.status).toBe(204)
  }
})

test('Settings export restores the complete browser experience', async ({ page }) => {
  const alternateId = crypto.randomUUID()
  const authorization = `Bearer ${await token()}`
  const endpoint = `${postgrestUrl}peers?id=eq.${alternateId}`
  try {
    await page.goto('/settings')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export', exact: true }).click()
    const download = await downloadPromise
    const path = await download.path()
    expect(path).not.toBeNull()
    const exported = JSON.parse(readFileSync(path!, 'utf8'))
    expect(exported).toEqual({
      version: 2,
      metaConfig: {
        INKCRE_PGREST_URL: postgrestUrl,
        INKCRE_JWT_SECRET: jwtSecret,
        INKCRE_PEER_ID: '00000000-0000-4000-8000-000000000001',
      },
      locale: 'en',
    })

    await page.evaluate(
      ({ postgrestUrl, jwtSecret, alternateId }) => {
        localStorage.setItem(
          'inkcre_app_config',
          JSON.stringify({
            INKCRE_PGREST_URL: postgrestUrl,
            INKCRE_JWT_SECRET: jwtSecret,
            INKCRE_PEER_ID: alternateId,
          })
        )
        localStorage.setItem('inkcre-locale', 'zh-CN')
      },
      { postgrestUrl, jwtSecret, alternateId }
    )
    await page.reload()
    page.once('dialog', (dialog) => dialog.accept())
    await page.locator('input[type="file"]').setInputFiles(path!)
    await expect
      .poll(() =>
        page.evaluate(() => ({
          metaConfig: JSON.parse(localStorage.getItem('inkcre_app_config') || 'null'),
          locale: localStorage.getItem('inkcre-locale'),
        }))
      )
      .toEqual({ metaConfig: exported.metaConfig, locale: 'en' })
  } finally {
    const cleanup = await fetch(endpoint, {
      method: 'DELETE',
      headers: { Authorization: authorization },
    })
    expect(cleanup.status).toBe(204)
  }
})

test('Peer config keeps invalid and failed drafts and saves only once while pending', async ({
  page,
}) => {
  const id = crypto.randomUUID()
  const authorization = `Bearer ${await token()}`
  const endpoint = `${postgrestUrl}peers?id=eq.${id}`
  const created = await fetch(`${postgrestUrl}peers`, {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      name: 'UI migration config',
      config: { limit: 1 },
      config_schema: {
        type: 'object',
        required: ['limit'],
        properties: { limit: { type: 'integer', minimum: 1 } },
      },
    }),
  })
  expect(created.status).toBe(201)

  try {
    await page.goto('/peers')
    const peer = page.locator('.peer-card', { hasText: id })
    await expect(peer.getByText('Unknown', { exact: true })).toBeVisible()
    const renewed = await fetch(endpoint, {
      method: 'PATCH',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lease_expires_at: new Date(Date.now() + 60_000).toISOString() }),
    })
    expect(renewed.status).toBe(204)
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(peer.getByText('Online', { exact: true })).toBeVisible()
    await peer.getByRole('button', { name: 'Edit Config' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit Config' })
    await dialog.getByRole('tab', { name: 'JSON' }).click()
    const editor = dialog.locator('.cm-content')
    const save = dialog.getByRole('button', { name: 'Save', exact: true })
    await expect(save).toBeEnabled()
    await editor.fill('{')
    await expect(save).toBeDisabled()
    await expect(editor).toHaveAttribute('aria-invalid', 'true')
    await editor.fill('{"limit":"invalid"}')
    await expect(save).toBeDisabled()
    await expect(editor).toHaveAttribute('aria-invalid', 'true')
    await editor.fill('{"limit":2}')
    await expect(save).toBeEnabled()

    let releaseRequest!: () => void
    const pending = new Promise<void>((resolve) => {
      releaseRequest = resolve
    })
    let writes = 0
    const wrongAuthorization = `Bearer ${await token('ui-migration-wrong-secret-at-least-32-bytes')}`
    await page.route(endpoint, async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue()
      writes += 1
      await pending
      // Exercise the real database rejection without changing the user's draft or auth store.
      await route.continue({
        headers: { ...route.request().headers(), authorization: wrongAuthorization },
      })
    })
    await save.click()
    try {
      await expect(save).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      await expect(editor).toHaveAttribute('contenteditable', 'false')
      expect(writes).toBe(1)
    } finally {
      releaseRequest()
    }
    await expect(dialog.getByRole('alert')).toBeVisible()
    await expect(editor).toHaveText('{"limit":2}')
    await expect(save).toBeEnabled()
    await page.unroute(endpoint)
    await save.click()
    await expect(dialog).not.toBeVisible()

    const stored = await fetch(`${endpoint}&select=config`, {
      headers: { Authorization: authorization },
    })
    expect(stored.status).toBe(200)
    expect((await stored.json())[0].config).toEqual({ limit: 2 })
    await peer.getByRole('button', { name: 'Edit Config' }).click()
    await dialog.getByRole('tab', { name: 'JSON' }).click()
    await expect(editor).toContainText('2')
  } finally {
    await page.unroute(endpoint)
    const cleanup = await fetch(endpoint, {
      method: 'DELETE',
      headers: { Authorization: authorization },
    })
    expect(cleanup.status).toBe(204)
  }
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
