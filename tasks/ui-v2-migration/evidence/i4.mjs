import { expect } from '@playwright/test'

// Extends the task's real Host/MF replay at its existing network boundary.
export async function verifyI4({
  page,
  navigate,
  evidence,
  expectContained,
  dates,
  blocks,
  relations,
  core,
  extensions,
  source,
  webUrl,
}) {
  const headers = { 'access-control-allow-origin': '*' }
  const fulfill = (route, json, status = 200) =>
    route.fulfill({
      json:
        Array.isArray(json) && route.request().headers().accept?.includes('vnd.pgrst.object')
          ? (json[0] ?? null)
          : json,
      status,
      headers,
    })
  const extension = extensions.find((item) => item.name === 'inkcre/twitter')
  let connected = false
  let oauthState = 'pending'
  let rejectConfig = true
  let rejectSchedule = true
  let configured = false
  let cron = null
  let selectedSources = []
  let startCount = 0
  let releaseSchedule
  const heldSchedule = new Promise((resolve) => {
    releaseSchedule = resolve
  })
  const twitterStatus = () => ({
    callback_url: 'https://api-migration.invalid/callback',
    connected,
    user_id: connected ? 'reader' : null,
    handle: connected ? 'reader' : null,
    scopes: [],
    reconnect_required: false,
  })
  const caps = [
    'inkcre.twitter.setup.status.v1',
    'inkcre.twitter.oauth-app.configure.v1',
    'inkcre.twitter.oauth.begin.v1',
    'inkcre.twitter.oauth.transaction.read.v1',
    'inkcre.twitter.oauth.disconnect.v1',
  ]
  const priorCapabilities = core.capabilities
  core.capabilities = [
    ...core.capabilities.filter((item) => !caps.includes(item.id)),
    ...caps.map((id) => ({
      id,
      inbound: {
        protocol: 'core.peer.protocol.http.v1',
        parameters: { method: 'POST', url: `https://api-migration.invalid/i4/${id}` },
      },
    })),
  ]
  extension.config = {}
  await page.route('https://api-migration.invalid/i4/**', async (route) => {
    const id = new URL(route.request().url()).pathname.split('/').at(-1)
    if (id === caps[1]) {
      if (rejectConfig)
        return fulfill(route, { detail: 'Application save rejected. Try again.' }, 403)
      configured = true
      extension.config = { client_id: 'test-client', client_secret: 'test-secret' }
    }
    if (id === caps[2] || id === caps[3]) {
      if (id === caps[2]) oauthState = 'pending'
      if (oauthState === 'succeeded') connected = true
      return fulfill(route, {
        id: '33333333-3333-4333-8333-333333333333',
        status: oauthState,
        authorize_url: 'https://x.com/i/oauth2/authorize?fixture=true',
        expires_at: '2099-01-01T00:00:00Z',
        error: oauthState === 'failed' ? 'Authorization was declined.' : null,
      })
    }
    if (id === caps[4]) connected = false
    return fulfill(route, twitterStatus())
  })
  const collectionRoute = async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname
    if (path.endsWith('/job_types'))
      return fulfill(route, [
        {
          id: 'core.source.collect.v1',
          description: 'Collect bookmarks',
          parameters_schema: {},
          default_timeout_seconds: 60,
        },
      ])
    if (path.endsWith('/sources')) {
      if (request.method() === 'POST')
        selectedSources = [{ ...source, nickname: 'My saved bookmarks' }]
      return fulfill(route, selectedSources)
    }
    if (path.endsWith('/crons')) {
      if (request.method() === 'POST') {
        await heldSchedule
        if (rejectSchedule) return fulfill(route, { message: 'Schedule save rejected.' }, 403)
        cron = {
          ...request.postDataJSON(),
          id: 90,
          last_job: null,
          last_scheduled_for: null,
          ...dates,
        }
      }
      if (request.method() === 'PATCH') cron = { ...cron, ...request.postDataJSON() }
      return fulfill(route, cron ? [cron] : [])
    }
    if (path.endsWith('/jobs') && request.method() === 'POST') {
      startCount += 1
      return fulfill(route, [
        {
          id: 95,
          ...request.postDataJSON(),
          status: 'pending',
          state: {},
          started_at: null,
          closed_at: null,
          ...dates,
        },
      ])
    }
    return route.fallback()
  }
  await page.route(
    'https://api-migration.invalid/rest/{sources,crons,jobs,job_types}*',
    collectionRoute
  )
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto(new URL('/extensions', webUrl).href)
  const card = page.locator('.extension-card', { hasText: 'inkcre/twitter' })
  await card.getByRole('button', { name: /^(Setup|设置)$/ }).click()
  const setup = page.locator('.twitter-setup')
  await expect(setup.getByRole('heading', { name: 'Connect an X account' })).toBeVisible()
  await expect(setup.getByRole('button', { name: 'Create authorization link' })).toHaveCount(0)
  await setup.getByRole('textbox', { name: 'Client ID', exact: true }).fill('test-client')
  await setup.locator('input[type=password]').fill('test-secret')
  await setup.getByRole('button', { name: 'Save application' }).click()
  await expect(setup.getByRole('alert')).toContainText('Application save rejected')
  await expect(setup.getByRole('textbox', { name: 'Client ID', exact: true })).toHaveValue(
    'test-client'
  )
  await expect(setup.locator('input[type=password]')).toHaveValue('test-secret')
  await page.screenshot({
    animations: 'disabled',
    path: `${evidence}/i4-twitter-application-failed.png`,
  })
  rejectConfig = false
  await setup.getByRole('button', { name: 'Save application' }).click()
  await expect(setup.getByRole('button', { name: 'Create authorization link' })).toBeEnabled()
  expect(configured).toBe(true)
  await expect(setup.locator('input[type=password]')).toBeHidden()
  await setup.getByRole('button', { name: 'Create authorization link' }).click()
  await expect(setup.getByRole('link', { name: 'Open X authorization' })).toBeVisible()
  await expect(setup.getByRole('button', { name: 'Create authorization link' })).toHaveCount(0)
  await page.screenshot({
    animations: 'disabled',
    path: `${evidence}/i4-twitter-authorization.png`,
  })
  oauthState = 'failed'
  await expect(setup.getByRole('alert')).toContainText('Authorization was declined', {
    timeout: 10000,
  })
  await setup.getByRole('button', { name: 'Create authorization link' }).click()
  await expect(setup.getByRole('link', { name: 'Open X authorization' })).toBeVisible()
  oauthState = 'succeeded'
  await expect(setup.getByRole('heading', { name: 'Set up bookmark collection' })).toBeVisible({
    timeout: 10000,
  })
  await setup.getByRole('textbox', { name: 'Source nickname' }).fill('My saved bookmarks')
  await setup.getByRole('button', { name: 'Create Bookmark Source' }).click()
  await expect(setup.locator('.ink-picker')).toBeVisible()
  await setup.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(setup.getByRole('button', { name: 'Close', exact: true })).toBeDisabled()
  releaseSchedule()
  await expect(setup.getByRole('alert')).toContainText('Schedule save rejected')
  await expect(setup.locator('.ink-picker')).toBeVisible()
  rejectSchedule = false
  await setup.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(setup.getByRole('heading', { name: 'Review and start' })).toBeVisible()
  await setup.getByRole('button', { name: 'Start collecting bookmarks' }).click()
  await expect(setup.getByRole('heading', { name: 'Twitter is ready' })).toBeVisible()
  expect(startCount).toBe(1)
  for (const [width, theme] of [
    [1280, 'light'],
    [375, 'dark'],
  ]) {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await expectContained('.twitter-setup, .twitter-setup__steps, dialog[open]')
    await page.screenshot({
      animations: 'disabled',
      path: `${evidence}/i4-twitter-ready-${width}.png`,
    })
  }
  await setup.getByRole('button', { name: 'Edit collection' }).click()
  await expect(setup.getByRole('combobox', { name: 'Bookmark Source', exact: true })).toHaveText(
    'My saved bookmarks'
  )
  await page.screenshot({
    animations: 'disabled',
    path: `${evidence}/i4-twitter-collection-375.png`,
  })
  await setup.getByRole('button', { name: 'Close', exact: true }).click()
  await page.unroute(
    'https://api-migration.invalid/rest/{sources,crons,jobs,job_types}*',
    collectionRoute
  )
  core.capabilities = priorCapabilities
  console.log(
    'I4 Twitter: fresh app, failed save retains masked draft, authorization pending/failure/retry, source creation, schedule rejection and explicit start passed'
  )

  // Mail fixtures include each registered presentation and graph relations. No real mailbox data.
  const add = (id, resolver, content) =>
    blocks.push({
      id,
      resolver,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      storage: null,
      ...dates,
    })
  add(201, 'extensions.mail.email_address.v1', {
    address: 'reader.with.a.long.address@example.test',
  })
  add(202, 'extensions.mail.mailbox.v1', {
    name: 'Design correspondence',
    special_uses: ['archive'],
    mailbox_id: 'mailbox-archive-2026',
  })
  add(203, 'extensions.mail.flag.v1', {
    name: 'Follow up',
    description: 'Review the attached design notes before replying.',
  })
  add(204, 'extensions.mail.mime_part.v1', {
    media_type: 'image/png',
    filename: 'inline-design.png',
    charset: null,
    encoded_size: 2400,
    content_id: 'design-image',
    transfer_encoding: 'base64',
  })
  add(205, 'extensions.mail.email.v1', { subject: 'Text-only correspondence — 保留完整正文' })
  add(206, 'extensions.mail.email.v1', { subject: 'An empty message' })
  add(
    207,
    'core.text.v1',
    'A text-only message.\n\n' + '保留段落与完整内容。'.repeat(30) + ' END-MAIL-TEXT'
  )
  add(208, 'core.text.v1', 'Design notes and a sketch of the mail relationships.')
  const relation = (id, from_, to_, content) =>
    relations.push({
      id,
      from_,
      to_,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      ...dates,
    })
  relation(201, 101, 201, { role: 'from', order: 0, display_name: 'Design team' })
  relation(202, 202, 101, { type: 'contains', uid_validity: 1, uid: 1 })
  relation(203, 203, 101, 'tags')
  relation(204, 101, 204, { role: 'inline', part_id: '3' })
  relation(205, 101, 205, 'parent:reply')
  relation(206, 205, 207, { role: 'body', part_id: '1' })
  relation(207, 101, 208, 'illustrates')
  for (let id = 301; id <= 306; id += 1) {
    add(id, 'core.text.v1', `Path fixture ${id}`)
    if (id < 306) relation(id, id, id + 1, 'next')
  }
  blocks.find((b) => b.id === 102).content +=
    '<img src="https://tracker.invalid/pixel"><style>body{display:none}</style><script>window.bad=true</script><p style="display:none">Visible safe text</p>'
  const trackers = []
  const track = (req) => {
    if (req.url().includes('tracker.invalid')) trackers.push(req.url())
  }
  page.on('request', track)
  let rejectGraph = false
  let graphRequests = 0
  const matches = (value, filter) => {
    if (!filter) return true
    if (filter.startsWith('eq.')) return String(value) === filter.slice(3)
    if (filter.startsWith('in.(')) return filter.slice(4, -1).split(',').includes(String(value))
    return true
  }
  const graphRoute = async (route) => {
    const url = new URL(route.request().url())
    const isBlocks = url.pathname.endsWith('/blocks')
    graphRequests += 1
    if (rejectGraph) return fulfill(route, { message: 'Graph read unavailable' }, 403)
    let data = (isBlocks ? blocks : relations).filter((row) =>
      ['id', 'from_', 'to_'].every((field) => matches(row[field], url.searchParams.get(field)))
    )
    const or = url.searchParams.get('or')
    if (or)
      data = data.filter((row) => or.includes(`eq.${row.from_}`) || or.includes(`eq.${row.to_}`))
    if (route.request().headers().accept?.includes('vnd.pgrst.object')) data = data[0] ?? null
    return fulfill(route, data)
  }
  await page.route('https://api-migration.invalid/rest/{blocks,relations}*', graphRoute)
  await navigate('/info-base/list/blocks/101/content')
  const email = page.locator('.content-email')
  await expect(email.getByRole('heading', { name: 'UI 2.0 Mail acceptance' })).toBeVisible()
  await expect(email.locator('.content-email__sender')).toContainText('Design team')
  await expect(email.getByText('Design correspondence', { exact: true })).toBeHidden()
  await email.getByText('Message details', { exact: true }).click()
  await expect(email.getByText('Design correspondence', { exact: true })).toBeVisible()
  await email.getByText('Message details', { exact: true }).click()
  const frame = page.frameLocator('iframe[title="Email HTML body"]')
  await expect(frame.getByText('Visible safe text')).toBeVisible()
  expect(await frame.locator('script').count()).toBe(0)
  await expect(frame.locator('body')).toHaveCSS('font-family', /system-ui/)
  await expect(page.locator('iframe[title="Email HTML body"]')).not.toHaveAttribute(
    'sandbox',
    /allow-scripts|allow-same-origin/
  )
  expect(trackers).toEqual([])
  await expect(email.getByText('inline-design.png', { exact: true })).toBeHidden()
  await email.getByText('Inline content · 1', { exact: true }).click()
  await expect(email.getByText('inline-design.png', { exact: true })).toBeVisible()
  await email.getByText('Related messages · 1', { exact: true }).click()
  await expect(email.getByRole('button', { name: 'Text-only correspondence' })).toBeVisible()
  for (const [width, theme] of [
    [1280, 'light'],
    [375, 'dark'],
  ]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await expectContained('.solved-content-popup, .content-email, .mime-part-item')
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i4-mail-${width}.png` })
  }
  const materialized = {
    id: 209,
    resolver: 'core.file.v1',
    storage: 1,
    content: 'https://api-migration.invalid/i4-file',
    ...dates,
  }
  await page.route('https://api-migration.invalid/rest/storages*', (route) =>
    fulfill(route, [{ id: 1, type: 'http', nickname: 'Fixture storage', config: {} }])
  )
  await page.route('https://api-migration.invalid/i4-file', (route) =>
    route.fulfill({ body: 'Safe file bytes', headers, contentType: 'application/octet-stream' })
  )
  await page.route('https://api-migration.invalid/materialize', (route) =>
    fulfill(route, materialized)
  )
  for (const [id, text] of [
    [201, 'reader.with.a.long.address'],
    [202, 'Design correspondence'],
    [203, 'Follow up'],
    [204, 'inline-design.png'],
    [205, 'END-MAIL-TEXT'],
    [206, 'No body content'],
  ]) {
    await navigate(`/info-base/list/blocks/${id}/content`)
    await expect(page.locator('.solved-content-popup__content')).toContainText(text)
    await expectContained('.solved-content-popup, .solved-content-popup__content')
    if (id === 204) {
      await page.getByText('File details', { exact: true }).click()
      await expect(page.getByText('base64', { exact: true })).toBeVisible()
      await page
        .locator('.content-mime-part')
        .getByRole('button', { name: 'Download', exact: true })
        .click()
      await expect(
        page.locator('.content-mime-part').getByRole('link', { name: 'Open', exact: true })
      ).toHaveAttribute('href', /^blob:/)
      await expect(
        page.locator('.content-mime-part').getByRole('button', { name: 'Download', exact: true })
      ).toHaveCount(0)
    }
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i4-mail-record-${id}.png` })
  }
  console.log(
    'I4 Mail: message details, attachment/inline grouping, sanitizer and resource isolation, text/empty bodies, MIME and all three fact renderers passed'
  )

  await navigate('/info-base/graph?focal_block=101')
  await expect(page.getByRole('heading', { name: 'Around Block #101' })).toBeVisible()
  await expect(page.locator('.block-node')).toHaveCount(9)
  await expect(page.getByRole('button', { name: 'Inspect Block #101', exact: true })).toBeVisible()
  await expect(
    page.locator('.mail-fact-preview').filter({ hasText: 'Design correspondence' })
  ).toBeVisible()
  await expect(
    page.locator('.mail-fact-preview').filter({ hasText: 'Design correspondence' })
  ).not.toContainText('mailbox-archive')
  const graphNode = page.locator('.vue-flow__node[data-id="101"]')
  const beforeDrag = await graphNode.getAttribute('style')
  const dragArea = await graphNode.locator('.block-node__identity').boundingBox()
  await page.mouse.move(dragArea.x + 3, dragArea.y + 3)
  await page.mouse.down()
  await page.mouse.move(dragArea.x + 43, dragArea.y + 33, { steps: 5 })
  await page.mouse.up()
  await expect(graphNode).not.toHaveAttribute('style', beforeDrag)
  const draggedPosition = await graphNode.getAttribute('style')
  await page.getByText('View options', { exact: true }).click()
  const requestCount = graphRequests
  await page.getByRole('combobox', { name: 'Emphasize relations' }).click()
  await page.getByRole('option', { name: 'Incoming', exact: true }).click()
  await expect(page.locator('.block-node--muted')).not.toHaveCount(0)
  expect(graphRequests).toBe(requestCount)
  await expect(graphNode).toHaveAttribute('style', draggedPosition)
  await page.getByRole('combobox', { name: 'Neighborhood size' }).click()
  await page.getByRole('option', { name: 'Small · 8 relations', exact: true }).click()
  await expect(page.locator('.block-node')).toHaveCount(9)
  await expect(graphNode).toHaveAttribute('style', draggedPosition)
  await page.getByText('View options', { exact: true }).click()
  for (const [width, theme] of [
    [1280, 'light'],
    [375, 'dark'],
  ]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Focus current', exact: true }).click()
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    )
    const focal = page.locator('.block-node--focal')
    await expect
      .poll(() =>
        focal.evaluate((item) => {
          const box = item.getBoundingClientRect()
          const flow = document.querySelector('.graph-view__flow').getBoundingClientRect()
          return (
            (flow.width >= 640 ||
              (Math.abs((box.left + box.right - flow.left - flow.right) / 2) < 2 &&
                Math.abs((box.top + box.bottom - flow.top - flow.bottom) / 2) < 2)) &&
            box.width >= item.clientWidth * 0.74 &&
            box.left >= flow.left - 1 &&
            box.right <= flow.right + 1 &&
            box.top >= flow.top - 1 &&
            box.bottom <= flow.bottom + 1
          )
        })
      )
      .toBe(true)
    await expectContained('.graph-view, .graph-view__toolbar, .graph-view__viewport-controls')
    await page.screenshot({ animations: 'disabled', path: `${evidence}/i4-graph-${width}.png` })
  }
  await page.getByRole('button', { name: 'Explore Block #205', exact: true }).press('Enter')
  await expect(page).toHaveURL(/focal_block=205/)
  await page.getByRole('button', { name: 'Inspect Block #205', exact: true }).click()
  await expect(page.locator('.block-inspector-popup')).toContainText('#205')
  await expectContained('.block-inspector-popup, dialog[open]')
  await page
    .locator('.block-inspector-popup')
    .getByRole('button', { name: /关闭|Close/ })
    .click()
  await expect(page.locator('.block-inspector-popup')).toHaveCount(0)
  for (let attempt = 0; attempt < 4; attempt += 1)
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
  await page.getByRole('button', { name: 'Explore Relation #205', exact: true }).click()
  await page.getByRole('button', { name: 'Inspect Relation #205', exact: true }).click()
  await expect(page.locator('.relation-inspector-popup')).toContainText('parent:reply')
  await page.screenshot({ animations: 'disabled', path: `${evidence}/i4-graph-relation-375.png` })
  await page
    .locator('.relation-inspector-popup')
    .getByRole('button', { name: /关闭|Close/ })
    .click()
  rejectGraph = true
  await navigate('/info-base/graph?focal_block=206')
  await expect(page.getByRole('alert')).toHaveText('Unable to load the graph')
  rejectGraph = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.locator('.block-node')).toHaveCount(1)
  await navigate('/info-base/graph?focal_block=999')
  await expect(
    page.getByRole('heading', { name: 'This item is no longer available' })
  ).toBeVisible()
  await navigate('/info-base/graph?path_from=101&path_to=206')
  await expect(page.getByRole('heading', { name: 'No connecting path found' })).toBeVisible()
  await page.screenshot({ animations: 'disabled', path: `${evidence}/i4-graph-no-path-375.png` })
  await navigate('/info-base/graph?path_from=301&path_to=306')
  await expect(
    page.getByRole('heading', { name: 'The path exceeds the exploration limit' })
  ).toBeVisible()
  await navigate('/info-base/graph?path_from=101&path_to=205')
  await expect(page.locator('.block-node')).toHaveCount(2)
  await page.route('https://api-migration.invalid/search', (route) =>
    fulfill(route, { matches: [] })
  )
  await navigate('/info-base/graph?q=no-results')
  await expect(page.getByRole('heading', { name: 'No information here yet' })).toBeVisible()
  await page.unroute('https://api-migration.invalid/search')
  console.log(
    'I4 Graph: real retrieval, six preview types, direction without new reads, scale, keyboard focal navigation, both inspectors/back, retry, empty/missing and found/no-path/limit states passed'
  )
  await page.unroute('https://api-migration.invalid/rest/{blocks,relations}*', graphRoute)
  page.off('request', track)
}
