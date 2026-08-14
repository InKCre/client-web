import { expect, test } from './browser-extension-fixture'

test('built Chromium extension loads its real popup', async ({ context, page, extensionId }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.route(/^https?:\/\//, (route) =>
    route.fulfill({
      body: JSON.stringify({ code: 'PGRST116', message: 'Client not found in E2E fixture' }),
      contentType: 'application/json',
      status: 406,
    })
  )

  const [serviceWorker] = context.serviceWorkers()
  await serviceWorker.evaluate(
    async (metaConfig) => {
      await (
        globalThis as typeof globalThis & {
          chrome: {
            storage: {
              local: {
                set(value: Record<string, string>): Promise<void>
              }
            }
          }
        }
      ).chrome.storage.local.set({
        inkcre_app_config: JSON.stringify(metaConfig),
      })
    },
    {
      client_id: '063cd1df-c495-5006-a119-67aa633b26be',
      INKCRE_JWT_SECRET: 'client-webext-e2e-secret-at-least-32-bytes',
      INKCRE_PGREST_URL: 'http://127.0.0.1:9/',
    }
  )

  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  expect(pageErrors).toEqual([])
  await expect(page.getByText('Popup', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Options' })).toBeVisible()
})
