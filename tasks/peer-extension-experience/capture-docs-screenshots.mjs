import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const local = JSON.parse(await readFile(new URL('svc.local.json', root), 'utf8'))
Object.assign(process.env, local.dev.targets.database.provision.env)

const { runtimeCredentials, runtimeState } = await import('../../scripts/database-runtime-lib.mjs')
const state = await runtimeState('docs-capture')
const credentials = await runtimeCredentials('docs-capture')
const webUrl = 'http://127.0.0.1:4174'
const peerId = '00000000-0000-4000-8000-000000000001'
const output = new URL('./assets/', import.meta.url)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })
await page.addInitScript(
  ({ postgrestUrl, jwtSecret, peerId }) => {
    localStorage.setItem(
      'inkcre_app_config',
      JSON.stringify({
        INKCRE_PGREST_URL: postgrestUrl,
        INKCRE_JWT_SECRET: jwtSecret,
        INKCRE_PEER_ID: peerId,
      })
    )
    localStorage.setItem('inkcre-locale', 'en')
  },
  { postgrestUrl: state.urls.postgrest, jwtSecret: credentials.JWT_SECRET, peerId }
)

await page.goto(`${webUrl}/settings`)
await page.getByLabel('PostgreSQL REST URL').fill('https://YOUR-POSTGREST-HOST/')
await page.screenshot({ path: new URL('settings-desktop-light.png', output).pathname })

await page.goto(`${webUrl}/peers`)
await page.getByRole('heading', { name: 'Peers' }).waitFor()
await page.getByText('Online', { exact: true }).first().waitFor()
await page.screenshot({ path: new URL('peers-desktop-light.png', output).pathname })

await browser.close()
