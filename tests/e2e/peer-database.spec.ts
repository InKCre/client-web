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
    .setIssuer('inkcre-client')
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
          client_id: '00000000-0000-4000-8000-000000000002',
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
    async ({ postgrestUrl, authorization, coreUrl }) => {
      const read = await fetch(
        `${postgrestUrl}clients?select=id,name&id=eq.00000000-0000-4000-8000-000000000002`,
        { headers: { Authorization: authorization } }
      )
      const write = await fetch(`${postgrestUrl}clients`, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id: '11111111-1111-4111-8111-111111111111',
          name: 'client-web-e2e',
          labels: ['e2e'],
          rest_api_url: coreUrl,
          config: {},
          config_schema: {},
        }),
      })
      return {
        readStatus: read.status,
        readBody: await read.json(),
        writeStatus: write.status,
        writeBody: await write.json(),
      }
    },
    { postgrestUrl, authorization, coreUrl }
  )

  expect(result.readStatus).toBe(200)
  expect(result.readBody).toHaveLength(1)
  expect(result.writeStatus).toBe(201)
  expect(result.writeBody[0].id).toBe('11111111-1111-4111-8111-111111111111')
})

test('wrong and absent credentials are rejected', async ({ page }) => {
  const wrongAuthorization = `Bearer ${await token(
    'wrong-client-web-jwt-secret-at-least-32-bytes'
  )}`
  const statuses = await page.evaluate(
    async ({ postgrestUrl, wrongAuthorization }) => {
      const wrong = await fetch(`${postgrestUrl}clients?select=id`, {
        headers: { Authorization: wrongAuthorization },
      })
      const anonymous = await fetch(`${postgrestUrl}clients?select=id`)
      return [wrong.status, anonymous.status]
    },
    { postgrestUrl, wrongAuthorization }
  )

  expect(statuses).toEqual([401, 401])
})
