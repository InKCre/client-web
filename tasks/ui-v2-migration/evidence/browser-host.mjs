// 一次性消费验收：加载真实构建的 Host 和两个 MF remote，网络边界使用隔离数据。
import { chromium, expect } from '@playwright/test'
import { readFile, mkdir } from 'node:fs/promises'
const root = process.cwd()
const webUrl = process.argv[2] ?? 'http://127.0.0.1:47931'
const evidence = `${root}/.runtime/ui-migration-evidence`
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []
page.on('pageerror', (e) => {
  errors.push(e.message)
  console.log('pageerror', e.message)
})
page.on('console', (m) => {
  if (m.type() === 'error') console.log('console', m.text().slice(0, 600))
})
const selfId = '11111111-1111-4111-8111-111111111111',
  coreId = '22222222-2222-4222-8222-222222222222'
const dates = { created_at: '2026-09-13T00:00:00Z', updated_at: '2026-09-13T00:00:00Z' }
const self = {
  id: selfId,
  name: 'UI migration',
  labels: [],
  config: { extension_registry_url: 'https://registry-migration.invalid' },
  config_schema: {},
  capabilities: [],
  lease_expires_at: '2099-01-01T00:00:00Z',
  ...dates,
}
const core = {
  ...self,
  id: coreId,
  name: 'Core fixture',
  capabilities: [
    'core.extension.management.v1',
    'core.feature_retrieval.lexical.v1',
    'inkcre.twitter.setup.status.v1',
    'extensions.mail.mime_part.materialize.v1',
  ].map((id) => ({
    id,
    inbound: {
      protocol: 'core.peer.protocol.http.v1',
      parameters: {
        method: 'POST',
        url:
          id === 'extensions.mail.mime_part.materialize.v1'
            ? 'https://api-migration.invalid/materialize'
            : id === 'core.feature_retrieval.lexical.v1'
              ? 'https://api-migration.invalid/search'
              : 'https://api-migration.invalid/status',
      },
    },
  })),
}
const extensions = ['twitter', 'mail'].map((name) => ({
  name: `inkcre/${name}`,
  nickname: name,
  version: name === 'twitter' ? '0.3.0' : '0.2.0',
  enabled: [selfId, coreId],
  config:
    name === 'twitter' ? { client_id: 'fixture-client', client_secret: 'fixture-secret' } : {},
  config_schema: { type: 'object' },
}))
let releaseDownload
const downloadPending = new Promise((resolve) => {
  releaseDownload = resolve
})
const fullText = `${'这是完整正文的阅读验收。A paragraph should remain readable after opening. '.repeat(5)}
正文末尾 END-OF-CONTENT`
const mediaImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#b7c8bd"/><path d="M0 320L200 80L400 320L530 160L640 320" fill="#4e665b"/></svg>')}`
const blocks = [
  { id: 104, resolver: 'core.text.v1', content: fullText, storage: null, ...dates },
  { id: 105, resolver: 'core.html.v1', content: `<p>${fullText}</p>`, storage: null, ...dates },
  {
    id: 106,
    resolver: 'extensions.twitter.tweet.v1',
    content: JSON.stringify({
      id: 106,
      user_id: 'migration_fixture',
      text: fullText,
      attachments: [mediaImage],
    }),
    storage: null,
    ...dates,
  },
  {
    id: 101,
    resolver: 'extensions.mail.email.v1',
    content: JSON.stringify({ subject: 'UI 2.0 Mail acceptance' }),
    storage: null,
    ...dates,
  },
  {
    id: 102,
    resolver: 'core.html.v1',
    content: '<h1>Mail renderer with UI 2.0</h1><p>Isolated acceptance content.</p>',
    storage: null,
    ...dates,
  },
  {
    id: 103,
    resolver: 'extensions.mail.mime_part.v1',
    content: JSON.stringify({
      media_type: 'text/plain',
      filename: '下游迁移附件-long-attachment-name-without-breaks.txt',
    }),
    storage: null,
    ...dates,
  },
]
const relations = [
  {
    id: 1,
    from_: 101,
    to_: 102,
    content: JSON.stringify({ role: 'body', part_id: '1' }),
    ...dates,
  },
  {
    id: 2,
    from_: 101,
    to_: 103,
    content: JSON.stringify({ role: 'attachment', part_id: '2' }),
    ...dates,
  },
]
const source = {
  id: 7,
  type: 'extensions.twitter.bookmark.Source',
  nickname: 'UI migration bookmarks — 用于确认窄屏下长名称与操作按钮的布局',
  config: {},
  state: {},
  storage: null,
  block: null,
  ...dates,
}
const job = {
  id: 9,
  type: 'core.source.collect.v1',
  parameters: { source: 7 },
  state: { message: 'Fixture collection finished' },
  timeout_seconds: 60,
  status: 'finished',
  started_at: dates.created_at,
  closed_at: dates.created_at,
  ...dates,
}
const log = {
  id: 1,
  timestamp: dates.created_at,
  severity_number: 9,
  severity_text: 'INFO',
  body: 'Collection finished. 较长日志正文需要完整换行，日志属性保留可检查的代码格式。',
  trace_id: 'job.9',
  span_id: 'fixture',
  attributes: { source: 7, details: 'long-value-for-layout-verification'.repeat(5) },
}
await page.addInitScript(() => {
  if (window.top !== window) return
  localStorage.setItem('inkcre-locale', 'zh-CN')
  localStorage.setItem(
    'inkcre_app_config',
    JSON.stringify({
      INKCRE_PGREST_URL: 'https://api-migration.invalid/rest/',
      INKCRE_JWT_SECRET: 'ui-migration-isolated-browser-secret',
      INKCRE_PEER_ID: '11111111-1111-4111-8111-111111111111',
    })
  )
})
await page.route('https://api-migration.invalid/**', async (route) => {
  const req = route.request(),
    url = new URL(req.url()),
    kind = url.pathname.split('/').at(-1)
  let data
  if (url.pathname === '/materialize') {
    await downloadPending
    return route.fulfill({
      status: 500,
      json: { detail: 'Controlled materialization failure' },
      headers: { 'access-control-allow-origin': '*' },
    })
  }
  if (url.pathname === '/search')
    data = {
      matches: [
        {
          block: blocks[0],
          label: '完整内容阅读与消费者设计迁移',
          excerpt: fullText.slice(0, 150),
          evidence: 'terms',
          rank: 1,
        },
      ],
    }
  else if (url.pathname === '/status')
    data = {
      callback_url: 'https://api-migration.invalid/callback',
      connected: true,
      user_id: 'fixture',
      handle: 'fixture',
      scopes: [],
      reconnect_required: false,
    }
  else if (kind === 'renew_peer_lease') data = '2099-01-01T00:00:00Z'
  else if (kind === 'peers') {
    data = [self, core]
    if (url.searchParams.has('id'))
      data = data.filter((x) =>
        url.searchParams
          .getAll('id')
          .every((filter) =>
            filter.startsWith('eq.') ? filter === `eq.${x.id}` : filter !== `neq.${x.id}`
          )
      )
    if (req.method() === 'POST') data = [self]
  } else if (kind === 'extensions') {
    data = extensions.filter(
      (x) => !url.searchParams.has('name') || `eq.${x.name}` === url.searchParams.get('name')
    )
  } else if (kind === 'sources') data = [source]
  else if (kind === 'sources_types')
    data = [
      {
        id: source.type,
        description: 'Bookmark fixture',
        config_schema: { type: 'object' },
        collect_config_schema: { type: 'object' },
        backfill_config_schema: null,
      },
    ]
  else if (kind === 'jobs') data = [job]
  else if (kind === 'logs') data = url.searchParams.has('id') ? [] : [log]
  else if (kind === 'crons') data = []
  else if (kind === 'blocks')
    data = blocks.filter(
      (x) => !url.searchParams.has('id') || url.searchParams.get('id') === `eq.${x.id}`
    )
  else if (kind === 'relations') {
    const or = url.searchParams.get('or') ?? ''
    data = relations.filter((x) => or.includes(`eq.${x.from_}`) || or.includes(`eq.${x.to_}`))
  } else {
    console.log('other request', req.method(), url.pathname)
    data = []
  }
  if (req.headers().accept?.includes('vnd.pgrst.object') && Array.isArray(data))
    data = data[0] ?? null
  await route.fulfill({ json: data, headers: { 'access-control-allow-origin': '*' } })
})
await page.route('https://registry-migration.invalid/**', async (route) => {
  const url = new URL(route.request().url()),
    parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'v1') {
    const name = parts[3],
      ext = extensions.find((x) => x.name === `inkcre/${name}`)
    return route.fulfill({
      json: {
        ...ext,
        state: 'published',
        module_federation: {
          host_sdk: '@inkcre/core',
          host_sdk_version: '>=0.2.0 <0.3.0',
          manifest_url: `/extensions/inkcre/${name}/${ext.version}/module-federation/mf-manifest.json`,
        },
      },
      headers: { 'access-control-allow-origin': '*' },
    })
  }
  const name = parts[2],
    asset = parts.slice(5).join('/')
  try {
    let body = await readFile(`${root}/extensions/${name}/dist/client-web/${asset}`)
    if (asset === 'mf-manifest.json') {
      const manifest = JSON.parse(body)
      manifest.metaData.publicPath = `https://registry-migration.invalid/${parts.slice(0, 5).join('/')}/`
      body = Buffer.from(JSON.stringify(manifest))
    }
    return route.fulfill({
      body,
      contentType: asset.endsWith('.js')
        ? 'application/javascript'
        : asset.endsWith('.css')
          ? 'text/css'
          : 'application/json',
      headers: { 'access-control-allow-origin': '*' },
    })
  } catch (e) {
    console.log('asset error', url.pathname, e.message)
    await route.fulfill({ status: 404 })
  }
})
async function navigate(path) {
  await page.evaluate((path) => {
    history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}
async function expectContained(selector) {
  const overflow = await page.locator(selector).evaluateAll((elements) =>
    elements.flatMap((element) => {
      const rect = element.getBoundingClientRect()
      return rect.left < -1 ||
        rect.right > innerWidth + 1 ||
        element.scrollWidth > element.clientWidth + 1
        ? [
            {
              selector: element.className,
              left: rect.left,
              right: rect.right,
              width: element.clientWidth,
              scroll: element.scrollWidth,
            },
          ]
        : []
    })
  )
  expect(overflow, `${selector} stays readable without horizontal clipping`).toEqual([])
}
try {
  await page.goto(new URL('/extensions', webUrl).href)
  const card = page.locator('.extension-card', { hasText: 'inkcre/twitter' })
  await expect(card).toBeVisible()
  console.log('card', await card.innerText())
  await card.getByRole('button', { name: /^(Setup|设置)$/ }).click()
  await expect(page.getByRole('heading', { name: 'Set up bookmark collection' })).toBeVisible()
  await page.screenshot({ path: `${evidence}/twitter-host-setup.png` })
  console.log('picker', await page.locator('.ink-picker').innerText())
  await page.locator('.ink-picker').click()
  console.log('dialogs', await page.getByRole('dialog').allTextContents())
  await page.screenshot({ path: `${evidence}/twitter-time-picker.png` })
  const picker = page.locator('.ink-picker')
  const timeDialog = page.getByRole('dialog').last()
  await expect(timeDialog.getByRole('button', { name: '取消', exact: true })).toBeVisible()
  await timeDialog.getByRole('listbox', { name: /小时/ }).selectOption('7')
  await timeDialog.getByRole('listbox', { name: /分钟/ }).selectOption('30')
  await timeDialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(picker).toHaveText('12:00 AM')
  await picker.click()
  await timeDialog.getByRole('listbox', { name: /小时/ }).selectOption('7')
  await timeDialog.getByRole('listbox', { name: /分钟/ }).selectOption('30')
  await timeDialog.getByRole('button', { name: '确认', exact: true }).click()
  await expect(picker).toHaveText('07:30 AM')
  console.log('Twitter time cancel/confirm and Host locale passed')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.evaluate(() => {
    history.pushState({}, '', '/info-base/list/blocks/101/content')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { name: 'UI 2.0 Mail acceptance' })).toBeVisible()
  await expect(
    page
      .frameLocator('iframe[title="Email HTML body"]')
      .getByRole('heading', { name: 'Mail renderer with UI 2.0' })
  ).toBeVisible()
  const download = page.getByRole('button', { name: 'Download', exact: true })
  await download.click()
  try {
    await expect(download).toBeDisabled()
    await page.screenshot({ path: `${evidence}/mail-host-pending.png` })
  } finally {
    releaseDownload()
  }
  await expect(page.getByText('Mail materialization Peer returned HTTP 500')).toBeVisible()
  await expect(download).toBeEnabled()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.getByText('Mail materialization Peer returned HTTP 500').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${evidence}/mail-host-dark-narrow.png` })
  console.log('Mail renderer, pending and materialization failure passed')
  await expect(page.locator('.content-email__part')).toHaveCSS('border-top-left-radius', '0px')
  await expectContained('.content-email__part, .solved-content-popup')

  for (const [id, selector] of [
    [104, '.content-text__content'],
    [105, '.content-html__text'],
    [106, '.content-tweet__text'],
  ]) {
    await navigate('/')
    await navigate(`/info-base/list/blocks/${id}/content`)
    await expect(page.locator(selector)).toContainText('END-OF-CONTENT')
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--sys-font-body-md-font-size', '21px')
    )
    await expect(page.locator(selector)).toHaveCSS('font-size', '21px')
    await expectContained('.solved-content-popup')
    await page.evaluate(() =>
      document.documentElement.style.removeProperty('--sys-font-body-md-font-size')
    )
  }
  await expect(page.locator('.content-tweet')).toHaveClass(/solved-content-popup__content/)
  await expect(page.locator('.content-tweet')).toHaveCSS('overflow-y', 'auto')
  await expect(page.locator('.content-tweet__media-grid')).toHaveCSS(
    'border-top-left-radius',
    '0px'
  )
  await page.screenshot({ path: `${evidence}/tweet-host-dark-narrow.png` })

  await navigate('/?q=migration')
  await expect(page.locator('.info-base-list-view__match')).toBeVisible()
  await expect(page.locator('.info-base-list-view__match')).toHaveCSS(
    'border-top-left-radius',
    '0px'
  )
  await expectContained('.info-base-list-view, .info-base-list-view__match')
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.querySelector('.info-base-list-view').scrollTop = 0
  })
  await page.screenshot({ path: `${evidence}/search-dark-narrow.png` })
  await page.keyboard.press('Control+k')
  const recall = page.getByRole('dialog', { name: 'Recall information', exact: true })
  await expect(recall).toBeVisible()
  await recall.getByRole('button', { name: 'Find path', exact: true }).click()
  await recall.getByRole('searchbox').fill('migration')
  await recall.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('.recall-search__results > button')).toBeVisible()
  await expectContained('.recall-search, dialog[open]')
  await page.screenshot({ path: `${evidence}/recall-dark-narrow.png` })
  await page.keyboard.press('Escape')
  await expect(recall).not.toBeVisible()

  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme: width === 1280 ? 'light' : 'dark' })
    await navigate('/sources')
    await expect(page.locator('.source-card')).toBeVisible()
    await expectContained('.sources-view, .create-source, .source-card')
    await page.screenshot({ path: `${evidence}/sources-${width}.png` })
    await page.getByRole('button', { name: 'Edit Config', exact: true }).click()
    await expect(page.locator('.config-editor')).toBeVisible()
    await expectContained('.config-editor, dialog[open]')
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await page.getByRole('link', { name: source.type, exact: true }).press('Enter')
    await expect(page).toHaveURL(/\/sources\/7$/)
    await expect(page.locator('.source-view__details')).toBeVisible()
    await expectContained('.source-view, .source-view__details, .source-view__jobs')
    await navigate('/jobs/9')
    await expect(page.locator('.log-body')).toBeVisible()
    await expect(page.locator('pre.metadata__value')).toHaveCSS('font-family', /monospace/)
    await page.locator('.log-entry__main').press('Enter')
    await expect(page.locator('.log-entry__main')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.log-entry__details')).toBeVisible()
    await expectContained('.job-view, .job-view__metadata, .job-view__logs, .log-entry')
    await page.screenshot({ path: `${evidence}/job-${width}.png` })
    await navigate('/extensions')
    await expect(card).toBeVisible()
    await expectContained('.extensions-view, .install-extension, .extension-card')
    await page.screenshot({ path: `${evidence}/extensions-${width}.png` })
  }
  console.log('Full content, semantic font override, square containers and responsive pages passed')
  expect(errors).toEqual([])
  console.log('errors', errors)
} catch (error) {
  await page.screenshot({ path: `${evidence}/failure.png` })
  console.log('failed page', page.url(), await page.locator('body').innerText())
  throw error
} finally {
  await browser.close()
}
