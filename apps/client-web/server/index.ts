import { Hono } from 'hono'

type Bindings = {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  INKCRE_CORE_URL?: string
  INKCRE_PGREST_URL?: string
  INKCRE_EXTENSION_REGISTRY_URL?: string
  INKCRE_JWT_SECRET?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// API endpoint for frontend to get config
app.get('/api/config', (c) => {
  return c.json({
    INKCRE_CORE_URL: c.env.INKCRE_CORE_URL || '',
    INKCRE_PGREST_URL: c.env.INKCRE_PGREST_URL || '',
    INKCRE_EXTENSION_REGISTRY_URL: c.env.INKCRE_EXTENSION_REGISTRY_URL || '',
    INKCRE_JWT_SECRET: c.env.INKCRE_JWT_SECRET || '',
  })
})

// POST endpoint for saving config (returns success, but config is read-only on server)
app.post('/api/config', async (c) => {
  // In Cloudflare Workers, env vars are read-only
  // This endpoint exists for API consistency but doesn't persist
  console.log('[Config] Received config save request (read-only on server)')
  return c.json({ success: true, message: 'Config received (server config is read-only)' })
})

// Serve static assets (Vue app)
app.get('/*', async (c) => {
  return await c.env.ASSETS.fetch(c.req.raw)
})

export default app
