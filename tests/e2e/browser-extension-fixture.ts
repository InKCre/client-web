import { chromium, test as base, type BrowserContext } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const extensionPath = fileURLToPath(
  new URL('../../apps/client-webext/.output/chrome-mv3', import.meta.url)
)

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({ browserName: _browserName }, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    })

    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    serviceWorker ??= await context.waitForEvent('serviceworker')

    const extensionId = new URL(serviceWorker.url()).hostname
    await use(extensionId)
  },
})

export const expect = test.expect
