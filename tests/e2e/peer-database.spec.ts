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

test('Registry install and multi-Peer enablement require explicit confirmation', async ({
  page,
}) => {
  const extensionName = 'e2e/handoff'
  const endpoint = `${postgrestUrl}extensions?name=eq.${encodeURIComponent(extensionName)}`
  const authorization = `Bearer ${await token()}`
  const peerIds = [crypto.randomUUID(), crypto.randomUUID()]
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

    const createdPeers = await fetch(`${postgrestUrl}peers`, {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(
        peerIds.map((id, index) => ({
          id,
          name: `E2E Peer ${index + 1}`,
          labels: ['e2e'],
          config: {},
          config_schema: {},
          capabilities: [],
          lease_expires_at: null,
        }))
      ),
    })
    expect(createdPeers.status).toBe(201)
    await page.reload()

    await page.getByRole('button', { name: 'Enable…' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('checkbox', { name: /E2E Peer 1/ }).check()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    const readEnabled = async () => {
      const response = await fetch(`${endpoint}&select=enabled`, {
        headers: { Authorization: authorization },
      })
      return response.ok ? (await response.json())[0]?.enabled : null
    }
    expect(await readEnabled()).toEqual([])

    await page.getByRole('button', { name: 'Enable…' }).click()
    await dialog.getByRole('checkbox', { name: /E2E Peer 1/ }).check()
    await dialog.getByRole('checkbox', { name: /E2E Peer 2/ }).check()
    await dialog.getByRole('button', { name: 'Enable selected' }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(readEnabled).toEqual(expect.arrayContaining(peerIds))

    await page.goto('/peers')
    await expect(
      page.locator('.peer-card', { hasText: 'This browser' }).getByRole('button', {
        name: 'Delete Peer',
      })
    ).toHaveCount(0)
    const peerToDelete = page.locator('.peer-card', { hasText: peerIds[0] })
    await peerToDelete.getByRole('button', { name: 'Delete Peer' }).click()
    const deleteDialog = page.getByRole('dialog', { name: 'Delete Peer' })
    await deleteDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(peerToDelete).toBeVisible()
    await expect.poll(readEnabled).toEqual(expect.arrayContaining(peerIds))
    await peerToDelete.getByRole('button', { name: 'Delete Peer' }).click()
    const deleteEndpoint = `${postgrestUrl}peers?id=eq.${peerIds[0]}`
    let releaseDelete!: () => void
    const pendingDelete = new Promise<void>((resolve) => {
      releaseDelete = resolve
    })
    await page.route(deleteEndpoint, async (route) => {
      if (route.request().method() === 'DELETE') await pendingDelete
      await route.continue()
    })
    await deleteDialog.getByRole('button', { name: 'Delete Peer' }).click()
    try {
      await expect(deleteDialog.getByRole('button', { name: 'Delete Peer' })).toHaveAttribute(
        'aria-busy',
        'true'
      )
      const cancel = deleteDialog.getByRole('button', { name: 'Cancel' })
      await expect(cancel).toBeDisabled()
      await expect(cancel).not.toHaveAttribute('aria-busy', 'true')
      await expect(cancel.locator('.ink-button__loading')).toHaveCount(0)
    } finally {
      releaseDelete()
    }
    await expect(peerToDelete).toBeHidden()
    await page.unroute(deleteEndpoint)
    await expect.poll(readEnabled).toEqual([peerIds[1]])

    await page.goto('/extensions')
    await page.getByRole('button', { name: 'Disable…' }).click()
    await dialog.getByRole('checkbox', { name: /E2E Peer 2/ }).check()
    await dialog.getByRole('button', { name: 'Disable selected' }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(readEnabled).toEqual([])
  } finally {
    await fetch(endpoint, { method: 'DELETE', headers: { Authorization: authorization } })
    await fetch(`${postgrestUrl}peers?id=in.(${peerIds.join(',')})`, {
      method: 'DELETE',
      headers: { Authorization: authorization },
    })
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
    await page.goto('/')
    await expect(page).toHaveTitle('My browser Peer - InKCre')
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
  const wrongAuthorization = `Bearer ${await token('ui-migration-wrong-secret-at-least-32-bytes')}`
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
    await expect(peer.getByRole('button', { name: 'Delete Peer' })).toBeDisabled()
    await peer.getByText('Details', { exact: true }).click()
    await expect(peer.getByText(id, { exact: true })).toBeVisible()
    await page.route('**/peers?**', (route) =>
      route.continue({
        headers: { ...route.request().headers(), authorization: wrongAuthorization },
      })
    )
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Unable to load Peers')
    await expect(peer).toBeVisible()
    await expect(peer.getByText(id, { exact: true })).toBeVisible()
    await page.unroute('**/peers?**')
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(peer.getByText(id, { exact: true })).toBeVisible()
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
      await expect(save).toHaveAttribute('aria-busy', 'true')
      const cancel = dialog.getByRole('button', { name: 'Cancel' })
      await expect(cancel).toBeDisabled()
      await expect(cancel).not.toHaveAttribute('aria-busy', 'true')
      await expect(cancel.locator('.ink-button__loading')).toHaveCount(0)
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
    await page.unroute('**/peers?**')
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

test('Recall delegates one read to its destination and discards stale path searches', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('searchbox')).toBeVisible()
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Recall information' })
  const input = dialog.getByRole('searchbox')
  await expect(input).toBeFocused()
  const query = `recall-e2e-${Date.now()}`
  let requests = 0
  let release!: () => void
  let pending = new Promise<void>((resolve) => {
    release = resolve
  })
  let fail = false
  await page.route(`${coreUrl}lexical-retrieval`, async (route) => {
    requests++
    await pending
    if (fail) await route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    else await route.continue()
  })
  await input.fill(query)
  await input.press('Enter')
  try {
    // The destination owns the pending request; Recall must already be closed.
    await expect(page).toHaveURL(new RegExp(`q=${query}`))
    await expect(dialog).toBeHidden()
    await expect.poll(() => requests).toBe(1)
  } finally {
    release()
  }
  await expect(page.getByText(`No indexed blocks matched “${query}”.`)).toBeVisible()
  expect(requests).toBe(1)

  await page.keyboard.press('Control+k')
  await dialog.getByRole('tab', { name: 'Find path' }).click()
  await input.fill('stale path')
  pending = new Promise<void>((resolve) => {
    release = resolve
  })
  fail = true
  const staleResponse = page.waitForResponse(
    (response) => response.url() === `${coreUrl}lexical-retrieval` && response.status() === 503
  )
  await input.press('Enter')
  try {
    await expect.poll(() => requests).toBe(2)
    await expect(dialog.getByRole('button', { name: 'Search', exact: true })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    await dialog.getByRole('tab', { name: 'Recall', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await page.keyboard.press('Control+k')
    await dialog.getByRole('tab', { name: 'Find path' }).click()
  } finally {
    release()
  }
  await (await staleResponse).finished()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Search', exact: true })).toBeEnabled()
  await input.fill('retry path')
  await input.press('Enter')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(input).toHaveValue('retry path')
  fail = false
  await dialog.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(dialog.getByText('No indexed blocks matched “retry path”.')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`q=${query}`))
})

test('an empty browser saves its connection across refresh and reads Peers', async ({
  browser,
}) => {
  const context = await browser.newContext({ baseURL: process.env.INKCRE_E2E_WEB_URL })
  const page = await context.newPage()
  const authorization = `Bearer ${await token()}`
  let id: string | undefined
  try {
    await page.goto('/settings')
    await expect(page).toHaveTitle('Settings - InKCre')
    await page.getByLabel('PostgreSQL REST URL').fill(postgrestUrl)
    await page.getByLabel('JWT Secret').fill(jwtSecret)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Configuration saved successfully')
    id = await page.evaluate(
      () => JSON.parse(localStorage.getItem('inkcre_app_config')!).INKCRE_PEER_ID
    )
    await page.reload()
    await expect(page.getByLabel('PostgreSQL REST URL')).toHaveValue(postgrestUrl)
    await page.goto('/peers')
    await expect(page).toHaveTitle('Peers - InKCre')
    await expect(page.locator('.peer-card', { hasText: id })).toContainText('This browser')
    await expect(page.getByRole('main', { name: 'Peers' })).toBeVisible()
  } finally {
    await context.close()
    if (id)
      await fetch(`${postgrestUrl}peers?id=eq.${id}`, {
        method: 'DELETE',
        headers: { Authorization: authorization },
      })
  }
})

test('Job distinguishes failed and missing reads and preserves logs after a polling failure', async ({
  page,
}) => {
  const authorization = `Bearer ${await token()}`
  const headers = { Authorization: authorization, 'Content-Type': 'application/json' }
  const type = `e2e.feedback.${crypto.randomUUID()}`
  const createdType = await fetch(`${postgrestUrl}job_types`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: type,
      description: 'Feedback regression',
      default_timeout_seconds: 3600,
    }),
  })
  expect(createdType.status).toBe(201)
  let jobId: number | undefined
  let releaseLogs: (() => void) | undefined
  try {
    const createdJob = await fetch(`${postgrestUrl}jobs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({
        type,
        status: 'running',
        started_at: new Date().toISOString(),
        timeout_seconds: 3600,
      }),
    })
    expect(createdJob.status).toBe(201)
    const [job] = await createdJob.json()
    jobId = job.id
    const initialLog = await fetch(`${postgrestUrl}logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trace_id: `job.${jobId}`,
        severity_number: 9,
        severity_text: 'INFO',
        body: 'Existing log survives failure',
      }),
    })
    expect(initialLog.status).toBe(201)
    const wrongAuthorization = `Bearer ${await token('feedback-wrong-secret-at-least-32-bytes')}`
    await page.route('**/jobs?**', (route) =>
      route.continue({
        headers: { ...route.request().headers(), authorization: wrongAuthorization },
      })
    )
    await page.goto(`/jobs/${jobId}`)
    await expect(page.getByText('Unable to load this job.', { exact: true })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Loading...' })).toHaveCount(0)
    await page.unroute('**/jobs?**')

    const pendingLogs = new Promise<void>((resolve) => {
      releaseLogs = resolve
    })
    let logReads = 0
    let rejectLogs = true
    await page.route('**/logs?**', async (route) => {
      logReads++
      if (logReads > 1 && rejectLogs) {
        await pendingLogs
        await route.continue({
          headers: { ...route.request().headers(), authorization: wrongAuthorization },
        })
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    const logs = page.locator('.logs-viewer')
    await expect(logs.getByText('Existing log survives failure')).toBeVisible()
    await expect(logs.getByText('Updating automatically')).toBeVisible()
    await expect(logs.getByRole('status')).toHaveCount(0)
    await expect.poll(() => logReads).toBe(2)
    await expect(logs.getByRole('status', { name: 'Loading logs…' })).toBeVisible()
    releaseLogs()
    await expect(logs.getByText('Unable to load logs.')).toBeVisible()
    await expect(logs.getByText('Existing log survives failure')).toBeVisible()
    await expect(logs.getByRole('status')).toHaveCount(0)
    rejectLogs = false
    await logs.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(logs.getByText('Updating automatically')).toBeVisible()
    await expect(logs.getByText('Existing log survives failure')).toHaveCount(1)
    await page.goto('/jobs/-1')
    await expect(page.getByText('Job not found', { exact: true })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Loading...' })).toHaveCount(0)
  } finally {
    releaseLogs?.()
    if (jobId !== undefined) {
      await fetch(`${postgrestUrl}logs?trace_id=eq.job.${jobId}`, { method: 'DELETE', headers })
      await fetch(`${postgrestUrl}jobs?id=eq.${jobId}`, { method: 'DELETE', headers })
    }
    await fetch(`${postgrestUrl}job_types?id=eq.${type}`, { method: 'DELETE', headers })
  }
})

test('Source titles follow saved names across navigation and refresh', async ({ page }) => {
  const authorization = `Bearer ${await token()}`
  const headers = { Authorization: authorization, 'Content-Type': 'application/json' }
  const type = `e2e.title.${crypto.randomUUID()}`
  const initialName = 'Title history source'
  const savedName = 'Renamed title history source'
  const createdType = await fetch(`${postgrestUrl}sources_types`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: type,
      description: 'Source title regression',
      config_schema: { type: 'object', properties: {} },
      collect_config_schema: { type: 'object', properties: {} },
    }),
  })
  expect(createdType.status).toBe(201)
  let sourceId: number | undefined
  try {
    const created = await fetch(`${postgrestUrl}sources`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ type, nickname: initialName, config: {} }),
    })
    expect(created.status).toBe(201)
    const [source] = await created.json()
    sourceId = source.id
    await page.goto('/sources')
    await expect(page).toHaveTitle('Sources - InKCre')
    await page.getByRole('link', { name: initialName, exact: true }).click()
    await expect(page).toHaveTitle(`${initialName} - Sources - InKCre`)
    await page.getByLabel('Nickname', { exact: true }).fill(savedName)
    const save = page.getByRole('button', { name: 'Save', exact: true })
    await expect(save).toBeEnabled()
    await expect(page).toHaveTitle(`${initialName} - Sources - InKCre`)
    await save.click()
    await expect(
      page.getByRole('region', { name: 'Edit Config', exact: true }).getByRole('status')
    ).toHaveText('Changes saved.')
    await expect(page).toHaveTitle(`${savedName} - Sources - InKCre`)
    await page.getByRole('link', { name: 'Sources', exact: true }).click()
    await expect(page).toHaveTitle('Sources - InKCre')
    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`/sources/${sourceId}$`))
    await expect(page).toHaveTitle(`${savedName} - Sources - InKCre`)
    await page.reload()
    await expect(page).toHaveTitle(`${savedName} - Sources - InKCre`)
    await expect(page.getByLabel('Nickname', { exact: true })).toHaveValue(savedName)
  } finally {
    if (sourceId !== undefined) {
      const removedSource = await fetch(`${postgrestUrl}sources?id=eq.${sourceId}`, {
        method: 'DELETE',
        headers,
      })
      expect(removedSource.status).toBe(204)
    }
    const removedType = await fetch(`${postgrestUrl}sources_types?id=eq.${type}`, {
      method: 'DELETE',
      headers,
    })
    expect(removedType.status).toBe(204)
  }
})
