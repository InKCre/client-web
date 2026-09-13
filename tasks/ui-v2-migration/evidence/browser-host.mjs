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
page.on('pageerror', (e) => errors.push(e.message))
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
const blocks = [
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
    content: JSON.stringify({ media_type: 'text/plain', filename: 'notes.txt' }),
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
  nickname: 'UI migration bookmarks',
  config: {},
  state: {},
  storage: null,
  block: null,
  ...dates,
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
  if (url.pathname === '/status')
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
  console.log('errors', errors)
} finally {
  await browser.close()
}
